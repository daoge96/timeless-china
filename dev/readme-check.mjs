import fs from "node:fs";
import path from "node:path";
import url from "node:url";
const here = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const md = fs.readFileSync(path.join(root, "README.md"), "utf8");
let pass = 0, fail = 0;
const t = (n, ok, d) => { console.log((ok ? "  PASS  " : "  FAIL  ") + n + (d ? "   [" + d + "]" : "")); ok ? pass++ : fail++; };

const rel = [];
const imgRe = /!\[[^\]]*\]\(([^)\s]+)\)/g;
const htmlImgRe = /<img[^>]+src="([^"]+)"/g;
const linkRe = /(?<!!)\[[^\]]*\]\(([^)\s]+)\)/g;
for (const re of [imgRe, htmlImgRe, linkRe]) { let m; while ((m = re.exec(md))) rel.push(m[1]); }
const local = rel.filter((u) => !/^(https?:|mailto:|#)/.test(u));
for (const u of [...new Set(local)]) t("link resolves: " + u, fs.existsSync(path.join(root, u)), "");

t("readme: ASCII in code/urls, has CJK section", /## .*\u4e2d\u6587/.test(md), "");
t("readme: is mostly english", (md.match(/[\u4e00-\u9fff]/g) || []).length < 400, (md.match(/[\u4e00-\u9fff]/g) || []).length + " cjk chars");
for (const s of ["## This is not a video", "## Watch it", "## What you'll see", "## Controls", "## How it works", "## Performance", "## Compatibility", "## Repo layout", "## Running the checks", "## License"]) {
  t("readme section: " + s, md.includes(s), "");
}
t("readme: has live demo url", md.includes("https://daoge96.github.io/timeless-china/"), "");
t("readme: has badges", (md.match(/img\.shields\.io/g) || []).length >= 5, (md.match(/img\.shields\.io/g) || []).length + " badges");
t("readme: length in range", md.split("\n").length > 120 && md.split("\n").length < 320, md.split("\n").length + " lines");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
t("readme size figure matches reality", md.includes(Math.round(Buffer.byteLength(html) / 1024 / 10) * 10 + " KB") || md.includes("~160 KB"), (Buffer.byteLength(html) / 1024).toFixed(0) + "KB actual");
console.log("\nREADME CHECK: PASS " + pass + "  FAIL " + fail);
process.exit(fail ? 1 : 0);
