import { execFileSync } from "node:child_process";
const ROOT = "D:/OneDrive/Desktop/dsh/timeless-china";
const TOKEN = process.env.GH_TOKEN;
const API = "https://api.github.com/repos/daoge96/timeless-china";
const g = (a) => execFileSync("git", ["-C", ROOT].concat(a)).toString();
const H = { Authorization: "token " + TOKEN, "User-Agent": "dsh", Accept: "application/vnd.github+json" };
const c = await (await fetch(API + "/commits/main", { headers: H })).json();
const remoteSha = c.sha, remoteTree = c.commit.tree.sha;
const local = g(["rev-parse", "HEAD"]).trim();
if (local === remoteSha) { console.log("already identical " + local); process.exit(0); }
const localTree = g(["rev-parse", "HEAD^{tree}"]).trim();
console.log("local tree  " + localTree);
console.log("remote tree " + remoteTree);
if (localTree !== remoteTree) { console.log("TREE DIFFERS"); process.exit(1); }
const raw = g(["cat-file", "commit", local]);
const ts = Math.floor(new Date(c.commit.committer.date).getTime() / 1000);
const who = c.commit.committer.name + " <" + c.commit.committer.email + "> " + ts + " +0000";
const out = raw.split("\n").map((l) => l.startsWith("author ") ? "author " + who : l.startsWith("committer ") ? "committer " + who : l).join("\n");
const sha = execFileSync("git", ["-C", ROOT, "hash-object", "-t", "commit", "-w", "--stdin"], { input: out }).toString().trim();
console.log("recreated   " + sha);
if (sha !== remoteSha) { console.log("SHA MISMATCH"); process.exit(1); }
execFileSync("git", ["-C", ROOT, "update-ref", "refs/heads/main", sha]);
execFileSync("git", ["-C", ROOT, "reset", "--mixed", "HEAD"]);
console.log("SYNCED local main -> " + sha);
console.log("status: " + (execFileSync("git", ["-C", ROOT, "status", "--short"]).toString().trim() || "clean"));
