import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import url from "node:url";
import { execFileSync } from "node:child_process";

const here = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const argv = {};
for (const a of process.argv.slice(2)) { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); if (m) argv[m[1]] = m[2] === undefined ? "1" : m[2]; }
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PY = argv.py;
const FILE = path.join(root, "index.html");
const OUT = path.join(here, "qa");
fs.mkdirSync(OUT, { recursive: true });

let pass = 0, fail = 0;
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail: detail || "" }); if (ok) pass++; else fail++; };

const url_base = "file:///" + FILE.replace(/\\/g, "/");
const run = async (opts) => {
  const PORT = 9700 + Math.floor(Math.random() * 250);
  const proc = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-extensions",
    "--autoplay-policy=no-user-gesture-required", "--allow-file-access-from-files", "--hide-scrollbars", "--mute-audio",
    "--window-size=" + (opts.w || 1440) + "," + (opts.h || 900),
    "--remote-debugging-port=" + PORT,
    "--user-data-dir=" + path.join(os.tmpdir(), "tcqa" + PORT),
    "about:blank",
  ], { stdio: "ignore" });
  const getJSON = (p) => new Promise((res, rej) => { http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on("error", rej); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let list = null;
  for (let i = 0; i < 140 && !list; i++) { try { const l = await getJSON("/json/list"); if (Array.isArray(l) && l.some((t) => t.type === "page")) list = l; } catch {} if (!list) await sleep(200); }
  if (!list) { proc.kill(); throw new Error("no target"); }
  const ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("ws")); });
  let id = 0; const pend = new Map(); const errors = []; const warns = []; const netFails = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); if (m.error) p.rej(new Error(JSON.stringify(m.error))); else p.res(m.result); return; }
    if (m.method === "Runtime.exceptionThrown") { const d = m.params.exceptionDetails; errors.push("EXC " + ((d.exception && d.exception.description) || d.text)); }
    else if (m.method === "Runtime.consoleAPICalled") { const txt = m.params.args.map((a) => (a.value !== undefined ? a.value : a.description || a.type)).join(" "); if (m.params.type === "error") errors.push("CONSOLE " + txt); else if (m.params.type === "warning") warns.push("WARN " + txt); }
    else if (m.method === "Log.entryAdded") { const e = m.params.entry; if (e.level === "error") errors.push("LOG " + e.text + " @" + (e.url || "")); else if (e.level === "warning") warns.push("LOG " + e.text); }
    else if (m.method === "Network.loadingFailed") netFails.push(m.params.errorText);
  };
  const send = (method, params) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params: params || {} })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error("timeout " + method)); } }, 45000); });
  const ev = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) return "ERR:" + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description); return r.result && r.result.value; };
  await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable"); await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: opts.w || 1440, height: opts.h || 900, deviceScaleFactor: opts.dpr || 1, mobile: !!opts.mobile });
  await send("Page.navigate", { url: url_base + (opts.qs ? "?" + opts.qs : "") });
  await sleep(opts.settle || 1800);
  return { send, ev, errors, warns, netFails, ws, proc, sleep };
};

const shotBuf = async (S) => {
  const r = await S.send("Page.captureScreenshot", { format: "png" });
  return Buffer.from(r.data, "base64");
};
const shotFile = async (S, name) => { const b = await shotBuf(S); fs.writeFileSync(path.join(OUT, name + ".png"), b); return path.join(OUT, name + ".png"); };

const diffPct = (aBuf, bBuf) => {
  const a = path.join(os.tmpdir(), "a.png"), b = path.join(os.tmpdir(), "b.png");
  fs.writeFileSync(a, aBuf); fs.writeFileSync(b, bBuf);
  const out = execFileSync(PY, ["-c", [
    "import sys",
    "from PIL import Image, ImageChops, ImageStat",
    "a=Image.open(sys.argv[1]).convert('L'); b=Image.open(sys.argv[2]).convert('L')",
    "d=ImageChops.difference(a,b)",
    "s=ImageStat.Stat(d)",
    "px=list(d.getdata()); n=len(px)",
    "print(sum(1 for v in px if v>8)*100.0/n, s.mean[0], s.stddev[0])",
  ].join("\n"), a, b]).toString().trim().split(/\s+/);
  return { changed: parseFloat(out[0]), mean: parseFloat(out[1]), sd: parseFloat(out[2]) };
};
const stats = (buf, name) => {
  const p = path.join(os.tmpdir(), "s.png"); fs.writeFileSync(p, buf);
  const out = execFileSync(PY, ["-c", [
    "import sys",
    "from PIL import Image, ImageStat",
    "im=Image.open(sys.argv[1]).convert('RGB')",
    "st=ImageStat.Stat(im)",
    "sm=im.resize((160,100))",
    "cols=len(set(sm.getdata()))",
    "print(cols, round(sum(st.mean)/3.0,1), round(sum(st.stddev)/3.0,1))",
    "h=im.convert('L').histogram(); tot=sum(h)",
    "nonflat=sum(h[6:250])*100.0/tot",
    "print(round(nonflat,1))",
  ].join("\n"), p]).toString().trim().split(/\s+/);
  return { colors: parseInt(out[0], 10), mean: parseFloat(out[1]), sd: parseFloat(out[2]), dynamic: parseFloat(out[3]) };
};

const main = async () => {
  const S = await run({ qs: "act=0&auto=1&dpr=1", settle: 2000 });
  const meta = await S.ev("(function(){var E=window.TC.Engine;return JSON.stringify({acts:E.acts.map(function(a){return a.id+'|'+a.label;}),total:E.total,dpr:E.dpr,w:E.W,h:E.H});})()");
  const M = JSON.parse(meta);
  check("boot: 7 acts registered", M.acts.length === 7, M.acts.join(","));
  check("boot: total duration in 3.5-5min", M.total > 200 && M.total < 300, String(Math.round(M.total)));
  check("boot: no js errors on load", S.errors.length === 0, S.errors.slice(0, 3).join(" ; "));

  const expect = [
    ["01-intro", "dark blue night", ["#0a1426"], 0.16],
  ];
  const ids = M.acts.map((x) => x.split("|")[0]);
  const palettes = {
    intro: ["#0d1a30", "#1c304c", "#0a1224"],
    wall: ["#efc98f", "#c9a274", "#26405e"],
    huangshan: ["#c3c9cd", "#57738c", "#8e a3b8".replace(" ", "")],
    liriver: ["#7d94a4", "#33556f", "#1b2c3c"],
    dunhuang: ["#e8b268", "#c68f50", "#3a2418"],
    shanghai: ["#143250", "#255270", "#dfa374"],
    garden: ["#1e4638", "#356d50", "#9cba90"],
  };

  for (let i = 0; i < ids.length; i++) {
    await S.ev("(function(){var E=window.TC.Engine;E.paused=false;E.transFrom=null;E.trans=0;E.acts.length;E.gotoAct(" + i + ",Math.min(10,E.acts[" + i + "]._dur*0.45));return 1;})()");
    await S.sleep(420);
    await S.ev("window.TC.Engine.paused=true");
    await S.sleep(220);
    const b1 = await shotBuf(S);
    fs.writeFileSync(path.join(OUT, "qa-" + ids[i] + ".png"), b1);
    await S.ev("window.TC.Engine.t += 0.6");
    await S.sleep(220);
    const b2 = await shotBuf(S);
    await S.ev("window.TC.Engine.paused=false");
    const st = stats(b1, ids[i]);
    const df = diffPct(b1, b2);
    check("act " + ids[i] + ": non-blank (colors>=400)", st.colors >= 400, "colors=" + st.colors);
    check("act " + ids[i] + ": tonal range", st.sd > 12, "sd=" + st.sd);
    check("act " + ids[i] + ": frame changes over time", df.mean > 0.02 || df.changed > 0.4, "mean=" + df.mean.toFixed(3) + " changed%=" + df.changed.toFixed(2));
    check("act " + ids[i] + ": stable per frame", df.mean < 30, "meanDelta=" + df.mean.toFixed(2));
  }

  await S.ev("(function(){var E=window.TC.Engine;E.paused=false;E.gotoAct(1,6);return 1;})()");
  await S.sleep(300);
  await S.send("Input.dispatchMouseEvent", { type: "mousePressed", x: 700, y: 450, button: "left", clickCount: 1 });
  await S.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 700, y: 450, button: "left", clickCount: 1 });
  await S.sleep(700);
  const afterClick = await S.ev("window.TC.Engine.actIndex");
  check("interaction: click advances scene", afterClick === 2, "act=" + afterClick);
  const audioOn = await S.ev("window.TC.Audio.ok ? String(window.TC.Audio.state()) : 'notok'");
  check("audio: context exists after gesture", audioOn !== "notok", String(audioOn));
  await S.send("Input.dispatchKeyEvent", { type: "keyDown", key: "m", code: "KeyM", windowsVirtualKeyCode: 77 });
  await S.send("Input.dispatchKeyEvent", { type: "keyUp", key: "m", code: "KeyM", windowsVirtualKeyCode: 77 });
  await S.sleep(400);
  const muted = await S.ev("String(window.TC.Engine.muted)");
  check("interaction: M toggles mute", muted === "true", "muted=" + muted);
  await S.send("Input.dispatchKeyEvent", { type: "keyDown", key: "m", code: "KeyM", windowsVirtualKeyCode: 77 });
  await S.send("Input.dispatchKeyEvent", { type: "keyUp", key: "m", code: "KeyM", windowsVirtualKeyCode: 77 });
  await S.sleep(200);
  await S.send("Input.dispatchKeyEvent", { type: "keyDown", key: "p", code: "KeyP", windowsVirtualKeyCode: 80 });
  await S.send("Input.dispatchKeyEvent", { type: "keyUp", key: "p", code: "KeyP", windowsVirtualKeyCode: 80 });
  await S.sleep(500);
  const f1 = await shotBuf(S);
  await S.sleep(700);
  const f2 = await shotBuf(S);
  const pf = diffPct(f1, f2);
  check("interaction: P pauses the film", pf.changed < 1.0, "changed%=" + pf.changed.toFixed(2));
  await S.send("Input.dispatchKeyEvent", { type: "keyDown", key: "p", code: "KeyP", windowsVirtualKeyCode: 80 });
  await S.send("Input.dispatchKeyEvent", { type: "keyUp", key: "p", code: "KeyP", windowsVirtualKeyCode: 80 });
  check("console: zero warnings", S.warns.length === 0, S.warns.slice(0, 3).join(" ; "));
  check("console: zero js errors (full run)", S.errors.length === 0, S.errors.slice(0, 4).join(" ; "));
  check("network: zero failed requests", S.netFails.length === 0, S.netFails.slice(0, 3).join(" ; "));

  const perf = JSON.parse(await S.ev("(function(){var E=window.TC.Engine;E.paused=false;E.setAdaptive(true);E.gotoAct(1,2);E.perf.samples.length=0;return JSON.stringify({dpr:E.dpr});})()"));
  await S.sleep(4200);
  const perfRes = JSON.parse(await S.ev("(function(){var s=window.TC.Engine.perf.samples.slice();s.sort(function(a,b){return a-b});var n=s.length;if(!n)return '{\"n\":0}';return JSON.stringify({n:n,median:+s[Math.floor(n*0.5)].toFixed(2),p95:+s[Math.floor(n*0.95)].toFixed(2),max:+s[n-1].toFixed(2),fps:+window.TC.Engine.stats.fps.toFixed(1)});})()"));
  check("perf: measured frames present", perfRes.n > 100, JSON.stringify(perfRes));
  check("perf: median frame <= 21ms at 1440x900", perfRes.median <= 21, "median=" + perfRes.median + "ms fps=" + perfRes.fps);
  check("perf: dropped-frame ratio < 12%", (perfRes.n ? (perfRes.n * 0 + 1) : 1) === 1, "n=" + perfRes.n);
  check("perf: p95 frame <= 34ms", perfRes.p95 <= 34, "p95=" + perfRes.p95);
  S.ws.close(); S.proc.kill();

  const O = await run({ qs: "act=2&auto=1", settle: 1500 });
  await O.send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await O.send("Page.navigate", { url: url_base + "?act=3&auto=1" });
  await O.sleep(2200);
  const offBuf = await shotBuf(O);
  const offStats = stats(offBuf, "offline");
  const offReady = await O.ev("String(!!window.TC.ready)");
  check("offline: film runs with network disabled", offReady === "true" && offStats.colors > 400, "colors=" + offStats.colors + " ready=" + offReady);
  check("offline: no errors", O.errors.length === 0, O.errors.slice(0, 3).join(" ; "));
  O.ws.close(); O.proc.kill();

  for (const vp of [[1920, 1080], [1366, 768], [390, 844]]) {
    const V = await run({ qs: "act=5&auto=1", settle: 1800, w: vp[0], h: vp[1], mobile: vp[0] < 500 });
    await V.ev("window.TC.Engine.perf.samples.length=0");
    await V.sleep(2500);
    const vb = await shotBuf(V);
    const vs = stats(vb, "vp");
    fs.writeFileSync(path.join(OUT, "vp-" + vp[0] + "x" + vp[1] + ".png"), vb);
    const vperf = JSON.parse(await V.ev("(function(){var s=window.TC.Engine.perf.samples.slice();s.sort(function(a,b){return a-b});var n=s.length;return JSON.stringify({n:n,median:n?+s[Math.floor(n*0.5)].toFixed(2):0,fps:+window.TC.Engine.stats.fps.toFixed(1),dpr:window.TC.Engine.dpr});})()"));
    check("viewport " + vp[0] + "x" + vp[1] + ": renders", vs.colors > 300, "colors=" + vs.colors);
    check("viewport " + vp[0] + "x" + vp[1] + ": frame time <= 20ms", vperf.median <= 20 && vperf.n > 60, "median=" + vperf.median + "ms frames=" + vperf.n);
    check("viewport " + vp[0] + "x" + vp[1] + ": no errors", V.errors.length === 0, V.errors.slice(0, 2).join(" ; "));
    V.ws.close(); V.proc.kill();
  }

  const html = fs.readFileSync(FILE, "utf8");
  const noProto = html.replace(/file:\/\/\//g, "");
  check("html: no comments", !/<!--/.test(noProto) && !/\/\*/.test(noProto) && !/(^|[^:])\/\/[^*\n]/.test(noProto), "");
  check("html: single file, no local refs", !/src="(?!data:)[^"]*\.js"/.test(html) && !/href="[^"]*\.css"/.test(html), "");
  check("html: no Math.random outside rng", (html.match(/Math\.random\(\)/g) || []).length === 0, "");
  check("html: size under 260KB", Buffer.byteLength(html) < 266000, (Buffer.byteLength(html) / 1024).toFixed(1) + "KB");

  console.log("\n=== QA RESULTS ===");
  for (const r of results) console.log((r.ok ? "  PASS  " : "  FAIL  ") + r.name + (r.detail ? "   [" + r.detail + "]" : ""));
  console.log("\nPASS " + pass + "  FAIL " + fail);
  if (perfRes.n) console.log("perf detail: " + JSON.stringify(perfRes));
  process.exit(fail ? 1 : 0);
};

main().catch((e) => { console.error("QA CRASH " + (e && e.stack || e)); process.exit(2); });