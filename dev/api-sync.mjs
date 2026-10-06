import { execFileSync } from "node:child_process";
const ROOT = "D:/OneDrive/Desktop/dsh/timeless-china";
const TOKEN = process.env.GH_TOKEN;
const API = "https://api.github.com/repos/daoge96/timeless-china";
const H = { Authorization: "token " + TOKEN, "User-Agent": "dsh", Accept: "application/vnd.github+json" };
const g = (a, input) => execFileSync("git", ["-C", ROOT].concat(a), input ? { input } : undefined).toString();
const has = (sha) => { try { g(["cat-file", "-t", sha]); return true; } catch { return false; } };
const api = async (u) => { const r = await fetch(API + u, { headers: H }); if (!r.ok) throw new Error(u + " " + r.status); return r.json(); };
const norm = (c) => (c.commit
  ? { sha: c.sha, tree: c.commit.tree.sha, parents: (c.parents || []).map((p) => p.sha), message: c.commit.message, who: c.commit.committer }
  : { sha: c.sha, tree: c.tree.sha, parents: (c.parents || []).map((p) => p.sha), message: c.message, who: c.committer });
const gitsort = (a, b) => Buffer.compare(Buffer.from(a.name + (a.dir ? "/" : "")), Buffer.from(b.name + (b.dir ? "/" : "")));

const buildTree = async (sha) => {
  if (has(sha)) return sha;
  const t = await api("/git/trees/" + sha + "?recursive=1");
  const dirs = new Map([["", []]]);
  const put = (d) => { if (!dirs.has(d)) dirs.set(d, []); return dirs.get(d); };
  for (const e of t.tree) {
    const i = e.path.lastIndexOf("/");
    const parent = i < 0 ? "" : e.path.slice(0, i);
    const name = i < 0 ? e.path : e.path.slice(i + 1);
    if (e.type === "tree") put(e.path);
    else put(parent).push({ name, mode: e.mode, type: "blob", sha: e.sha, dir: false });
  }
  for (const d of [...dirs.keys()].filter((x) => x).sort((a, b) => b.split("/").length - a.split("/").length)) {
    const entries = dirs.get(d).sort(gitsort);
    const built = g(["mktree"], entries.map((e) => e.mode + " " + e.type + " " + e.sha + "\t" + e.name).join("\n") + "\n").trim();
    const i = d.lastIndexOf("/");
    put(i < 0 ? "" : d.slice(0, i)).push({ name: i < 0 ? d : d.slice(i + 1), mode: "40000", type: "tree", sha: built, dir: true });
  }
  const built = g(["mktree"], dirs.get("").sort(gitsort).map((e) => e.mode + " " + e.type + " " + e.sha + "\t" + e.name).join("\n") + "\n").trim();
  if (built !== sha) throw new Error("tree mismatch " + sha + " vs " + built);
  return built;
};

const commitBody = (c, epoch, tz) => ["tree " + c.tree].concat(c.parents.map((p) => "parent " + p)).concat([
  "author " + c.who.name + " <" + c.who.email + "> " + epoch + " " + tz,
  "committer " + c.who.name + " <" + c.who.email + "> " + epoch + " " + tz,
  "", c.message.replace(/\n+$/, ""),
]).join("\n");

const buildCommit = async (sha) => {
  if (has(sha)) return sha;
  const c = norm(await api("/git/commits/" + sha));
  await buildTree(c.tree);
  for (const p of c.parents) await buildCommit(p);
  const base = Math.floor(new Date(c.who.date).getTime() / 1000);
  for (let off = -14; off <= 14; off++) {
    for (const epoch of [base, base - off * 3600]) {
      const tz = (off < 0 ? "-" : "+") + String(Math.abs(off)).padStart(2, "0") + "00";
      const body = commitBody(c, epoch, tz);
      const built = g(["hash-object", "-t", "commit", "-w", "--stdin"], body).trim();
      if (built === sha) { console.log("  commit " + sha.slice(0, 7) + "  tz " + tz + "  ok"); return built; }
    }
  }
  throw new Error("commit mismatch " + sha);
};

const tip = norm(await api("/commits/main"));
const local = g(["rev-parse", "HEAD"]).trim();
if (local === tip.sha) { console.log("already identical " + local); process.exit(0); }
console.log("rebuilding remote history locally...");
const sha = await buildCommit(tip.sha);
g(["update-ref", "refs/heads/main", sha]);
g(["reset", "--mixed", "HEAD"]);
console.log("SYNCED  local main == remote main == " + sha);
console.log("status: " + (g(["status", "--short"]).trim() || "clean"));
