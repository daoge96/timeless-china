import fs from "node:fs";
import path from "node:path";
import url from "node:url";
const here = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dir = path.join(here, "src");
const order = ["00-core.js","10-brush.js","20-sky.js","25-gen.js","26-arch.js","27-cloud.js","28-world2.js","30-audio.js","40-engine.js","50-acts.js","52-acts2.js","60-ui.js"];
const banner = () => "\n\n";
const shell = fs.readFileSync(path.join(dir, "shell.html"), "utf8");
let body = "";
const missing = [];
for (const f of order) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) { missing.push(f); continue; }
  body += fs.readFileSync(p, "utf8").trim() + "\n\n";
}
const out = shell.replace("@@BODY@@", body.trimEnd());
fs.writeFileSync(path.join(root, "index.html"), out);
const REQUIRED_IDS = ["app","stage","film","grain","card","cardNo","cardZh","cardEn","cardRule","hud","btnMute","btnPause","btnNext","btnGrid","picker","pkGrid","intro","btnPlay","err"];
const missingIds = REQUIRED_IDS.filter((id) => out.indexOf('id="' + id + '"') < 0);
const openDiv = (out.match(/<div/g) || []).length;
const closeDiv = (out.match(/<\/div>/g) || []).length;
if (missingIds.length) console.log("  WARN missing ids: " + missingIds.join(","));
if (openDiv !== closeDiv) console.log("  WARN div imbalance: " + openDiv + " open vs " + closeDiv + " close");
if (out.indexOf("@@BODY@@") >= 0) console.log("  WARN body placeholder not replaced");
const scriptOpen = (out.match(/<script/g) || []).length, scriptClose = (out.match(/<\/script>/g) || []).length;
if (scriptOpen !== scriptClose) console.log("  WARN script imbalance: " + scriptOpen + " vs " + scriptClose);
const kb = (Buffer.byteLength(out) / 1024).toFixed(1);
console.log("built index.html  " + kb + " KB  " + out.split("\n").length + " lines" + (missing.length ? "  MISSING: " + missing.join(",") : ""));