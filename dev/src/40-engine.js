(function () {
const TC = window.TC;
const U = TC.U;
const B = TC.Brush;
const S = TC.Sky;
const G = TC.Gen;

const E = (TC.Engine = {});
const qs = U.qs();

E.cfg = {
  act: qs.act !== undefined ? parseInt(qs.act, 10) : -1,
  t: qs.t !== undefined ? parseFloat(qs.t) : -1,
  durScale: qs.dur !== undefined ? parseFloat(qs.dur) : 1,
  mute: qs.mute === "1",
  step: qs.step !== undefined ? parseFloat(qs.step) : 0,
  pause: qs.pause === "1",
  q: qs.q || "high",
  dpr: qs.dpr !== undefined ? parseFloat(qs.dpr) : 0,
  scale: qs.scale !== undefined ? parseFloat(qs.scale) : 1,
  nohud: qs.nohud === "1",
};
E.reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
E.low = E.cfg.q === "low" || E.cfg.q === "med";

E.W = 0; E.H = 0; E.dpr = 1;
E.t = 0; E.paused = E.cfg.pause; E.muted = E.cfg.mute; E.userPaused = false;
E.actIndex = -1; E.local = 0;
E.timeScale = E.reduced ? 0.82 : 1;
E.shake = 0; E.flash = 0;
E.trans = 0; E.transDur = 1.15; E.transFrom = null; E.transTo = -1;
E.firstFrame = true;
E.thumbWait = [];

const TRANS = 1.15;

E.acts = [];
E.register = function (a) { E.acts.push(a); return a; };

E.buildTimeline = function () {
  let t = 0;
  for (const a of E.acts) {
    a._start = t;
    a._dur = a.dur * E.cfg.durScale;
    t += a._dur;
    a._end = t;
    t += TRANS;
  }
  E.total = t;
  E.totalScene = E.acts.reduce((s, a) => s + a._dur, 0);
  E.actsEnd = E.acts.length ? E.acts[E.acts.length - 1]._end : 0;
  E.marks = [];
  for (let i = 1; i < E.acts.length; i++) E.marks.push(E.acts[i]._start / E.total);
};

const stage = document.getElementById("stage");
let film = document.getElementById("film");
if (!film) {
  film = document.createElement("div");
  film.id = "film";
  film.style.cssText = "position:absolute;inset:0;pointer-events:none";
  (document.getElementById("app") || document.body).appendChild(film);
}
let ctx = null, scene = null, sctx = null, prev = null, pctx = null;
let hud = null, hctx = null;
let thumbLayer = null;

E.fit = function () {
  const vw = Math.max(320, window.innerWidth);
  const vh = Math.max(240, window.innerHeight);
  E.W = vw; E.H = vh;
  const big = vw * vh > 2400000;
  E.dpr = E.cfg.dpr > 0 ? U.clamp(E.cfg.dpr, 0.5, 3) : U.clamp(window.devicePixelRatio || 1, 1, big ? 1.5 : 2) * (E.low ? 0.8 : 1);
  stage.width = Math.ceil(vw * E.dpr); stage.height = Math.ceil(vh * E.dpr);
  stage.style.width = vw + "px"; stage.style.height = vh + "px";
  ctx = stage.getContext("2d", { alpha: false });
  scene = document.createElement("canvas");
  scene.width = stage.width; scene.height = stage.height;
  window.__scene = [scene.width, scene.height];
  sctx = scene.getContext("2d", { alpha: false });
  prev = document.createElement("canvas");
  prev.width = Math.ceil(vw / 2); prev.height = Math.ceil(vh / 2);
  pctx = prev.getContext("2d", { alpha: false });
  if (E.cfg.nohud) { const h = document.getElementById("hud"); if (h) h.style.display = "none"; return; }
  hud = document.createElement("canvas");
  hud.width = stage.width; hud.height = stage.height;
  hud.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:7";
  film.appendChild(hud);
  hctx = hud.getContext("2d");
};

E.applyAct = function (i, local) {
  E.actIndex = i;
  E.local = local || 0;
};

E.gotoAct = function (i, local) {
  i = U.clamp(i, 0, E.acts.length - 1);
  E.t = E.acts[i]._start + (local || 0);
  E.actIndex = i;
  E.local = (local || 0);
  if (prev && ctx) { pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.clearRect(0, 0, prev.width, prev.height); }
  if (TC.Audio && TC.Audio.onAct) TC.Audio.onAct(i);
};

E.nextAct = function () {
  const cur = E.actIndex;
  const nxt = cur + 1;
  if (nxt >= E.acts.length) { E.transFrom = null; E.gotoAct(0, 0); return; }
  if (ctx) { pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.drawImage(stage, 0, 0, prev.width, prev.height); E.transFrom = prev; }
  E.transTo = nxt;
  E.trans = 1;
  E.t = E.acts[nxt]._start;
  if (TC.Audio && TC.Audio.onAct) TC.Audio.onAct(nxt);
  E.actIndex = nxt; E.local = 0;
};

E.seek = function (t) {
  E.t = U.clamp(t, 0, E.total - 0.001);
  const i = E.actAt(E.t);
  if (i !== E.actIndex) { E.actIndex = i; if (TC.Audio && TC.Audio.onAct) TC.Audio.onAct(i); }
  E.local = E.t - E.acts[i]._start;
};

E.actAt = function (t) {
  for (let i = 0; i < E.acts.length; i++) {
    const a = E.acts[i];
    if (t < a._end + TRANS) return i;
  }
  return E.acts.length - 1;
};

E.setPaused = function (p) { E.paused = p; E.userPaused = p; };

E.togglePause = function () { E.setPaused(!E.paused); };

E.setMuted = function (m) {
  E.muted = m;
  if (TC.Audio) { if (m) TC.Audio.mute(); else { TC.Audio.init(); TC.Audio.unmute(); } }
};

const buildAct = function (a, i) {
  const t0 = U.now();
  a.build(sctx, E.W, E.H, i);
  a._built = { w: E.W, h: E.H, dpr: E.dpr };
  a._buildMs = U.now() - t0;
};

E.rebuild = function () {
  for (let i = 0; i < E.acts.length; i++) {
    const a = E.acts[i];
    if (!a.build) continue;
    buildAct(a, i);
  }
};

const drawTransition = function (k) {
  const W = E.W, H = E.H;
  const from = E.transFrom;
  ctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
  if (from && k < 1) {
    ctx.globalAlpha = 1 - U.st(U.clamp(k / 0.62, 0, 1)) * 0.98;
    ctx.drawImage(from, 0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.drawImage(scene, 0, 0, W, H);
  } else ctx.drawImage(scene, 0, 0, W, H);
  const e = Math.sin(Math.PI * Math.pow(U.clamp(k, 0, 1), 0.72));
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(0,0,0," + (e * 0.92).toFixed(3) + ")");
  g.addColorStop(0.42, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(0,0,0," + (e * 0.92).toFixed(3) + ")");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  if (e > 0.02) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const cx = W * 0.5, cy = H * 0.48;
    const r = Math.max(W, H) * (0.22 + e * 0.5);
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const warm = "255,236,204";
    rg.addColorStop(0, "rgba(" + warm + "," + (e * 0.5).toFixed(3) + ")");
    rg.addColorStop(0.35, "rgba(" + warm + "," + (e * 0.14).toFixed(3) + ")");
    rg.addColorStop(1, "rgba(" + warm + ",0)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = e * 0.85;
    ctx.strokeStyle = "rgba(255,244,224,0.5)";
    ctx.lineWidth = Math.max(1, H * 0.002);
    for (let i = 0; i < 3; i++) {
      const yy = H * (0.18 + i * 0.32) + (1 - e) * H * 0.1 * (i - 1);
      ctx.beginPath();
      ctx.moveTo(-W * 0.1, yy);
      ctx.bezierCurveTo(W * 0.3, yy - H * 0.06 * e, W * 0.6, yy + H * 0.06 * e, W * 1.1, yy);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

const frameHud = function () {
  if (!hctx) return;
  const W = E.W, H = E.H;
  hctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
  hctx.clearRect(0, 0, W, H);
  const show = TC.UI && TC.UI.hudVisible ? TC.UI.hudVisible() : true;
  if (!show) return;
  const barH = Math.max(18, H * 0.074);
  const pad = W * 0.032;
  const bot = H - barH - Math.max(14, H * 0.026);
  hctx.globalAlpha = 0.95;
  hctx.font = "500 " + Math.max(9, W * 0.0072).toFixed(1) + "px Cinzel, Georgia, serif";
  hctx.textBaseline = "alphabetic";
  hctx.fillStyle = "rgba(240,234,222,0.62)";
  const no = String(E.actIndex + 1).padStart(2, "0");
  hctx.fillText(no, pad, bot - 6);
  const noW = hctx.measureText(no).width;
  hctx.fillStyle = "rgba(227,186,106,0.6)";
  hctx.fillText(" / " + String(E.acts.length).padStart(2, "0"), pad + noW, bot - 6);
  const nm = (E.acts[E.actIndex] || {}).label || "";
  hctx.fillStyle = "rgba(240,234,222,0.5)";
  hctx.fillText("\u00b7  " + nm, pad + noW + W * 0.032, bot - 6);
  const bw = W - pad * 2;
  hctx.fillStyle = "rgba(240,234,222,0.16)";
  hctx.fillRect(pad, bot, bw, 1);
  const pr = U.clamp(E.t / E.total, 0, 1);
  const fg = hctx.createLinearGradient(pad, 0, pad + bw, 0);
  fg.addColorStop(0, "rgba(227,186,106,0.45)");
  fg.addColorStop(1, "rgba(242,219,166,0.95)");
  hctx.fillStyle = fg;
  hctx.fillRect(pad, bot, bw * pr, 1.2);
  hctx.fillStyle = "rgba(255,246,226,0.95)";
  hctx.fillRect(pad + bw * pr - 1, bot - 2, 2, 5);
  hctx.fillStyle = "rgba(240,234,222,0.3)";
  for (const m of E.marks) hctx.fillRect(pad + bw * m, bot - 2, 1, 5);
  hctx.textAlign = "right";
  hctx.fillStyle = "rgba(227,186,106,0.6)";
  hctx.font = "500 " + Math.max(8, W * 0.0064).toFixed(1) + "px Cinzel, Georgia, serif";
  hctx.fillText("TIMELESS CHINA", W - pad, bot - 6);
  hctx.textAlign = "left";
};

let last = 0, acc = 0, frames = 0, msSum = 0, msMax = 0, fpsT = 0, fpsN = 0, fps = 0;
let adaptN = 0, adaptT = 0, adaptLock = E.cfg.dpr > 0;
const adapt = function (ms) {
  if (adaptLock || frames < 60) return;
  adaptT += ms; adaptN++;
  if (adaptN < 90) return;
  const avg = adaptT / adaptN;
  adaptT = 0; adaptN = 0;
  const cur = E.dpr;
  if (avg > 21 && cur > 0.9) E.dpr = Math.max(0.85, cur - 0.25);
  else if (avg < 11.5 && cur < 2) E.dpr = Math.min(2, cur + 0.25);
  else return;
  E.onResize();
};
E.stats = { get fps() { return fps; }, get ms() { return frames ? msSum / frames : 0; }, get max() { return msMax; } };
E.perf = { samples: [], fps: 0 };

const loop = function (now) {
  requestAnimationFrame(loop);
  const t0 = U.now();
  let dt = (now - last) / 1000;
  last = now;
  if (!isFinite(dt) || dt < 0) dt = 0;
  if (dt > 0.1) dt = 0.1;
  if (E.paused) {
    if (E.cfg.step > 0) dt = E.cfg.step; else dt = 0;
  }
  E.t += dt * E.timeScale;
  if (E.trans > 0) { E.trans -= dt / E.transDur; if (E.trans <= 0) { E.trans = 0; E.transFrom = null; } }
  if (E.t >= E.total) { E.t -= E.total; E.transFrom = null; E.trans = 0; if (TC.Audio && TC.Audio.onAct) TC.Audio.onAct(E.actAt(E.t)); }
  const want = E.actAt(E.t);
  if (want !== E.actIndex) {
    if (E.trans <= 0 && dt > 0 && want === E.actIndex + 1 && ctx && !E.firstFrame) {
      pctx.setTransform(1, 0, 0, 1, 0, 0);
      pctx.drawImage(stage, 0, 0, prev.width, prev.height);
      E.transFrom = prev;
      E.trans = 1;
    }
    E.actIndex = want;
    if (TC.Audio && TC.Audio.onAct) TC.Audio.onAct(want);
  }
  E.local = E.t - E.acts[want]._start;
  const act = E.acts[want];
  sctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
  act.frame(sctx, E.local, E.local, E.t);
  if (TC.UI && TC.UI.frame) TC.UI.frame(E.t, E.local, want);
  if (E.trans > 0 || E.transFrom) drawTransition(1 - E.trans);
  else { ctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0); ctx.drawImage(scene, 0, 0, E.W, E.H); ctx.setTransform(1, 0, 0, 1, 0, 0); }
  if (E.trans <= 0 && E.transFrom === null) { }
  if (!E.cfg.nohud) frameHud();
  if (E.shake > 0) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const s = E.shake;
    ctx.translate((U.noise2(E.t * 22, 1.1, 3) - 0.5) * s, (U.noise2(1.7, E.t * 22, 9) - 0.5) * s);
    ctx.drawImage(stage, 0, 0, E.W, E.H);
    ctx.restore();
    E.shake *= 0.9;
    if (E.shake < 0.1) E.shake = 0;
  }
  E.firstFrame = false;
  if (TC.Audio && TC.Audio.update) TC.Audio.update(dt, E.t, want);
  E.transTo = -1;
  const ms = U.now() - t0;
  msSum += ms; frames++;
  if (ms > msMax) msMax = ms;
  if (!E.noStats) E.perf.samples.push(ms);
  if (dt > 0) adapt(ms);
  fpsN++;
  if (now - fpsT > 500) { fps = (fpsN * 1000) / (now - fpsT); fpsT = now; fpsN = 0; }
  if (frames === 3) document.documentElement.setAttribute("data-tc-ready", "1");
};

E.setAdaptive = function (on) {
  adaptLock = !on;
  adaptT = 0; adaptN = 0;
  if (on && E.cfg.dpr > 0) E.cfg.dpr = 0;
};

E.thumbFor = function (act, w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  const keepW = E.W, keepH = E.H;
  const tmp = U.Layer(w, h, 1);
  act.build(tmp.ctx, w, h, 0);
  if (act.frame) act.frame(tmp.ctx, act._dur * 0.55, act._dur * 0.55, 0);
  tmp.ctx.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(tmp.canvas, 0, 0, w, h, 0, 0, w, h);
  E.W = keepW; E.H = keepH;
  return c;
};

E.start = function () {
  E.buildTimeline();
  if (E.cfg.act >= 0) {
    const i = U.clamp(E.cfg.act, 0, E.acts.length - 1);
    E.actIndex = i;
    E.t = E.acts[i]._start + (E.cfg.t >= 0 ? E.cfg.t : 0);
    E.local = E.t - E.acts[i]._start;
  } else if (E.cfg.t >= 0) E.seek(E.cfg.t);
  else { E.actIndex = 0; E.t = 0; }
  for (let i = 0; i < E.acts.length; i++) buildAct(E.acts[i], i);
  E.rebuildAll = E.rebuild;
  last = U.now();
  requestAnimationFrame(loop);
};

E.onResize = U.debounce(function () {
  const keepT = E.t, keepAct = E.actIndex;
  E.fit();
  E.transFrom = null; E.trans = 0;
  for (let i = 0; i < E.acts.length; i++) buildAct(E.acts[i], i);
  E.t = keepT; E.actIndex = keepAct;
}, 220);
window.addEventListener("resize", E.onResize);
window.addEventListener("orientationchange", E.onResize);
document.addEventListener("visibilitychange", function () { last = U.now(); });
})();
