import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const ROOT = "D:/OneDrive/Desktop/dsh/timeless-china";
const TOKEN = process.env.GH_TOKEN;
const API = "https://api.github.com/repos/daoge96/timeless-china";
const CACHE = path.join(ROOT, "dev", "_blobcache.json");
const local = execFileSync("git", ["-C", ROOT, "rev-parse", "HEAD"]).toString().trim();
const parent = execFileSync("git", ["-C", ROOT, "rev-parse", "HEAD~1"]).toString().trim();
const message = execFileSync("git", ["-C", ROOT, "log", "-1", "--pretty=%B"]).toString().trim();
const files = execFileSync("git", ["-C", ROOT, "diff", "--name-only", parent, local]).toString().trim().split("\n").filter(Boolean);
const H = { Authorization: "token " + TOKEN, "User-Agent": "dsh", Accept: "application/vnd.github+json" };
const call = async (url, method, body) => {
  const r = await fetch(API + url, { method: method || "GET", headers: Object.assign({}, H, body ? { "Content-Type": "application/json" } : {}), body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(method + " " + url + " -> " + r.status + " " + t.slice(0, 300));
  return t ? JSON.parse(t) : null;
};
let cache = {};
try { cache = JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch {}
const head = await call("/git/refs/heads/main");
const remoteHead = head.object.sha;
console.log("remote head " + remoteHead.slice(0, 7) + "   local " + local.slice(0, 7));
if (remoteHead === local) { console.log("already in sync"); process.exit(0); }
const baseTree = (await call("/git/commits/" + remoteHead)).tree.sha;
const treeEntries = [];
for (const f of files) {
  const buf = fs.readFileSync(path.join(ROOT, f));
  const key = crypto.createHash("sha256").update(buf).digest("hex");
  let sha = cache[key];
  if (!sha) {
    const blob = await call("/git/blobs", "POST", { content: buf.toString("base64"), encoding: "base64" });
    sha = blob.sha; cache[key] = sha;
    fs.writeFileSync(CACHE, JSON.stringify(cache));
    console.log("  uploaded " + f);
  } else console.log("  cached   " + f);
  treeEntries.push({ path: f, mode: "100644", type: "blob", sha });
}
const tree = await call("/git/trees", "POST", { base_tree: baseTree, tree: treeEntries });
const commit = await call("/git/commits", "POST", { message, tree: tree.sha, parents: [remoteHead] });
await call("/git/refs/heads/main", "PATCH", { sha: commit.sha, force: false });
console.log("PUBLISHED " + commit.sha);
console.log("TITLE " + message.split("\n")[0]);
