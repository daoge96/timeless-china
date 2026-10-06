import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import url from "node:url";

const here = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const args = process.argv.slice(2);
const argv = {};
for (const a of args) {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  if (m) argv[m[1]] = m[2] === undefined ? "1" : m[2];
}
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9300 + Math.floor(Math.random() * 700);
const OUT = path.join(here, argv.out || "shots");
fs.mkdirSync(OUT, { recursive: true });
const W = parseInt(argv.w || "1440", 10);
const H = parseInt(argv.h || "900", 10);
const DPR = parseFloat(argv.dpr || "1");
const FILE = argv.file ? path.resolve(root, argv.file) : path.join(root, "index.html");
const QS = argv.qs || "";
const STEPS = argv.steps ? JSON.parse(fs.readFileSync(path.resolve(here, argv.steps), "utf8")) : [{ wait: 900 }, { shot: "shot" }];

const errors = [];
const warns = [];
const logs = [];
const netFails = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const proc = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  "--disable-extensions", "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
  "--autoplay-policy=no-user-gesture-required", "--use-fake-ui-for-media-stream",
  "--allow-file-access-from-files", "--hide-scrollbars", "--mute-audio",
  "--window-size=" + W + "," + H,
  "--remote-debugging-port=" + PORT,
  "--user-data-dir=" + path.join(os.tmpdir(), "tccdp" + PORT),
  "about:blank",
], { stdio: "ignore" });

const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } });
  }).on("error", rej);
});

let ws, msgId = 0;
const pending = new Map();
const send = (method, params) => new Promise((res, rej) => {
  const id = ++msgId;
  pending.set(id, { res, rej });
  ws.send(JSON.stringify({ id, method, params: params || {} }));
  setTimeout(() => { if (pending.has(id)) { pending.delete(id); rej(new Error("cdp timeout " + method)); } }, 60000);
});

const attach = async () => {
  let list = null;
  for (let i = 0; i < 120 && !list; i++) {
    try { const l = await getJSON("/json/list"); if (Array.isArray(l) && l.some((t) => t.type === "page")) list = l; } catch {}
    if (!list) await sleep(250);
  }
  if (!list) throw new Error("no chrome page target");
  const page = list.find((t) => t.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = (e) => rej(new Error("ws fail")); });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      if (m.error) p.rej(new Error(JSON.stringify(m.error))); else p.res(m.result);
      return;
    }
    if (m.method === "Runtime.exceptionThrown") {
      const d = m.params.exceptionDetails;
      errors.push("EXC " + ((d.exception && (d.exception.description || d.exception.value)) || d.text) + " @line " + (d.lineNumber + 1));
    } else if (m.method === "Runtime.consoleAPICalled") {
      const txt = m.params.args.map((a) => (a.value !== undefined ? a.value : a.description || a.type)).join(" ");
      if (m.params.type === "error") errors.push("CONSOLE " + txt);
      else if (m.params.type === "warning") warns.push("WARN " + txt);
      else logs.push(m.params.type + ": " + txt);
    } else if (m.method === "Log.entryAdded") {
      const e = m.params.entry;
      const s = e.level + " " + e.text + " @ " + (e.url || "");
      if (e.level === "error") errors.push("LOG " + s); else if (e.level === "warning") warns.push("LOG " + s);
    } else if (m.method === "Network.loadingFailed") {
      netFails.push(m.params.errorText + " " + (m.params.requestId || ""));
    } else if (m.method === "Runtime.executionContextCreated") {
      const n = m.params.context.auxData && m.params.context.auxData.frameId;
    }
  };
};

const shot = async (name, o) => {
  o = o || {};
  const p = { format: "png", captureBeyondViewport: false };
  if (o.clip) p.clip = { x: o.clip[0], y: o.clip[1], width: o.clip[2], height: o.clip[3], scale: o.clip[4] || 1 };
  const r = await send("Page.captureScreenshot", p);
  const f = path.join(OUT, name + ".png");
  fs.writeFileSync(f, Buffer.from(r.data, "base64"));
  console.log("shot " + f + "  " + (fs.statSync(f).size / 1024).toFixed(0) + " KB");
};

const clickAt = async (x, y) => {
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await sleep(30);
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
};

const key = async (name, code, vk) => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: name, code: code || name, windowsVirtualKeyCode: vk || 0, nativeVirtualKeyCode: vk || 0 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: name, code: code || name, windowsVirtualKeyCode: vk || 0, nativeVirtualKeyCode: vk || 0 });
};

const evalJS = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) return "EVALERR " + JSON.stringify(r.exceptionDetails.exception);
  return r.result && r.result.value;
};

const main = async () => {
  await attach();
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
  const u = "file:///" + FILE.replace(/\\/g, "/") + (QS ? (QS.startsWith("?") ? QS : "?" + QS) : "");
  console.log("nav " + u);
  await send("Page.navigate", { url: u });
  await sleep(argv.settle ? parseInt(argv.settle, 10) : 1500);
  for (const s of STEPS) {
    if (s.wait) await sleep(s.wait);
    if (s.eval) { const v = await evalJS(s.eval); console.log("eval " + s.eval + " => " + JSON.stringify(v)); }
    if (s.click) await clickAt(s.click[0], s.click[1]);
    if (s.key) await key(s.key, s.code, s.vk);
    if (s.shot) await shot(s.shot, s);
  }
  const reportExpr = [
    "(function(){",
    "var E=window.TC&&window.TC.Engine;if(!E)return \"no-engine\";",
    "var r={ready:!!window.TC.ready,acts:E.acts.length,act:E.actIndex,t:+E.t.toFixed(2),total:+E.total.toFixed(2),",
    "fps:+E.stats.fps.toFixed(1),ms:+E.stats.ms.toFixed(2),max:+E.stats.max.toFixed(1),dpr:E.dpr,w:E.W,h:E.H,",
    "audio:window.TC.Audio?window.TC.Audio.state():\"none\",lastErr:(window.TC.lastErr||\"\")};",
    "return JSON.stringify(r);})()"
  ].join("");
  const report = await evalJS(reportExpr);
  console.log("REPORT " + report);
  console.log("ERRORS " + errors.length);
  for (const e of errors.slice(0, 40)) console.log("  ! " + e);
  console.log("WARNS " + warns.length);
  for (const w of warns.slice(0, 20)) console.log("  ~ " + w);
  if (netFails.length) { console.log("NETFAILS " + netFails.length); for (const n of netFails.slice(0, 10)) console.log("  x " + n); }
  if (logs.length && argv.verbose) for (const l of logs.slice(0, 30)) console.log("  . " + l);
  ws.close();
  proc.kill();
  process.exit(errors.length ? 1 : 0);
};

main().catch((e) => { console.error("HARNESS FAIL " + (e && e.stack || e)); try { proc.kill(); } catch {} process.exit(2); });
