(function () {
const TC = window.TC;
const U = TC.U;
const B = TC.Brush;
const S = (TC.Sky = {});

S.paint = function (ctx, W, H, stops, o) {
  o = o || {};
  ctx.save();
  ctx.fillStyle = U.vgrad(ctx, o.x0 || 0, o.y0 || 0, o.x1 === undefined ? 0 : o.x1, o.y1 === undefined ? H : o.y1, stops);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  return S;
};

S.band = function (ctx, W, H, y0, y1, stops) {
  ctx.save();
  ctx.fillStyle = U.vgrad(ctx, 0, y0, 0, y1, stops);
  ctx.fillRect(0, y0 - 2, W, y1 - y0 + 4);
  ctx.restore();
  return S;
};

S.disc = function (ctx, x, y, r, o) {
  o = o || {};
  const core = o.core || "#fff8e6";
  const halo = o.halo || "#ffcf7a";
  const a = o.alpha === undefined ? 1 : o.alpha;
  ctx.save();
  ctx.globalCompositeOperation = o.blend || "screen";
  const h1 = ctx.createRadialGradient(x, y, r * 0.55, x, y, r * (o.haloR || 7));
  h1.addColorStop(0, U.rgba(halo, a * 0.5));
  h1.addColorStop(0.22, U.rgba(halo, a * 0.2));
  h1.addColorStop(0.55, U.rgba(halo, a * 0.07));
  h1.addColorStop(1, U.rgba(halo, 0));
  ctx.fillStyle = h1;
  ctx.beginPath(); ctx.arc(x, y, r * (o.haloR || 7), 0, U.TAU); ctx.fill();
  const h2 = ctx.createRadialGradient(x, y, 0, x, y, r * 1.6);
  h2.addColorStop(0, U.rgba(core, a));
  h2.addColorStop(0.55, U.rgba(core, a * 0.72));
  h2.addColorStop(0.86, U.rgba(halo, a * 0.35));
  h2.addColorStop(1, U.rgba(halo, 0));
  ctx.fillStyle = h2;
  ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, U.TAU); ctx.fill();
  ctx.restore();
  if (o.rays) S.rays(ctx, x, y, r, o.rays, o.raySeed || 7, a * 0.4);
  return S;
};

S.rays = function (ctx, x, y, r, count, seed, alpha) {
  const rnd = U.rng(Math.round(seed * 977) + 13);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < count; i++) {
    const a = (i / count) * U.TAU + rnd() * 0.16;
    const len = r * (3 + rnd() * 3.4);
    const wid = 0.018 + rnd() * 0.06;
    const g = ctx.createLinearGradient(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.addColorStop(0, U.rgba("#ffe9c2", alpha * (0.2 + rnd() * 0.3)));
    g.addColorStop(0.45, U.rgba("#ffe9c2", alpha * 0.1));
    g.addColorStop(1, U.rgba("#ffe9c2", 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a - wid) * len, y + Math.sin(a - wid) * len);
    ctx.lineTo(x + Math.cos(a + wid) * len, y + Math.sin(a + wid) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  return S;
};

S.stars = function (ctx, W, H, o) {
  o = o || {};
  const rnd = U.rng(o.seed || 421);
  const n = o.n === undefined ? 260 : o.n;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const x = rnd() * W, y = Math.pow(rnd(), o.pw || 1.5) * H * (o.cover || 0.7);
    const r = rnd() < 0.9 ? 0.6 + rnd() * 0.85 : 1.3 + rnd() * 1.4;
    const tw = 0.35 + Math.abs(Math.sin(rnd() * 20 + (o.tw || 0) * 0.6)) * (o.alpha === undefined ? 0.65 : o.alpha);
    ctx.globalAlpha = tw;
    ctx.fillStyle = r > 1.3 ? "#ffffff" : "#dce8ff";
    if (r > 1.5) { ctx.shadowColor = "#cfe0ff"; ctx.shadowBlur = 5; } else ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
  }
  ctx.restore();
  return S;
};

S.milky = function (ctx, W, H, o) {
  o = o || {};
  const y = o.y || H * 0.28;
  const rnd = U.rng(o.seed || 88);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 26; i++) {
    const x = rnd() * W;
    const r = 60 + rnd() * 210;
    const g = ctx.createRadialGradient(x, y + (rnd() - 0.5) * H * 0.22, 0, x, y + (rnd() - 0.5) * H * 0.22, r);
    g.addColorStop(0, U.rgba(o.color || "#9db6dd", (o.alpha === undefined ? 0.07 : o.alpha) * (0.4 + rnd() * 0.6)));
    g.addColorStop(1, U.rgba(o.color || "#9db6dd", 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
  }
  ctx.restore();
  return S;
};

S.shafts = function (ctx, W, H, ox, oy, o) {
  o = o || {};
  const n = o.n === undefined ? 7 : o.n;
  const rnd = U.rng(o.seed || 31);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < n; i++) {
    const a = U.lerp(o.a0 === undefined ? 0.9 : o.a0, o.a1 === undefined ? 2.3 : o.a1, i / (n - 1 || 1)) + (rnd() - 0.5) * 0.1;
    const len = H * (0.7 + rnd() * 0.9);
    const wid = 0.012 + rnd() * 0.05;
    const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(a) * len, oy + Math.sin(a) * len);
    g.addColorStop(0, U.rgba(o.color || "#ffdfa6", (o.alpha === undefined ? 0.16 : o.alpha) * (0.35 + rnd() * 0.65)));
    g.addColorStop(0.5, U.rgba(o.color || "#ffdfa6", (o.alpha === undefined ? 0.16 : o.alpha) * 0.3));
    g.addColorStop(1, U.rgba(o.color || "#ffdfa6", 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.cos(a - wid) * len, oy + Math.sin(a - wid) * len);
    ctx.lineTo(ox + Math.cos(a + wid) * len, oy + Math.sin(a + wid) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  return S;
};

S.cloudField = function (ctx, W, H, o) {
  o = o || {};
  const rnd = U.rng(o.seed || 55);
  const n = o.n === undefined ? 34 : o.n;
  for (let i = 0; i < n; i++) {
    const x = rnd() * W;
    const y = U.lerp(o.y0 || 0, o.y1 === undefined ? H : o.y1, Math.pow(rnd(), o.bias || 0.8));
    const r = (o.rmin === undefined ? 70 : o.rmin) + rnd() * (o.rmax === undefined ? 260 : o.rmax);
    B.wash(ctx, x, y, r, {
      color: o.color || "#e9f1f8",
      alpha: (o.alpha === undefined ? 0.2 : o.alpha) * (0.35 + rnd() * 0.65),
      core: 0.9, mid: 0.42, midA: 0.4, sy: o.sy === undefined ? 0.42 : o.sy,
    });
  }
  return S;
};

S.wisp = function (ctx, x, y, len, o) {
  o = o || {};
  const rnd = U.rng(o.seed || 12);
  const pts = [];
  const n = o.n === undefined ? 7 : o.n;
  for (let i = 0; i < n; i++) {
    pts.push({ x: x + (i / (n - 1)) * len * (o.dir || 1), y: y + (rnd() - 0.5) * (o.wav === undefined ? 22 : o.wav) * Math.sin(i * 0.9 + rnd()) });
  }
  B.stroke(ctx, pts, { w0: (o.w === undefined ? 16 : o.w), w1: o.w1 === undefined ? 2 : o.w1, ink: o.color || "#eef4fa", alpha: o.alpha === undefined ? 0.4 : o.alpha, profile: "swell", wobble: 2, step: 6, bristles: 0 });
  return S;
};

S.glare = function (ctx, x, y, r, o) {
  o = o || {};
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.translate(x, y);
  ctx.rotate(o.rot || 0);
  ctx.scale(1, o.sq || 0.14);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, U.rgba(o.color || "#fff3d8", o.alpha === undefined ? 0.5 : o.alpha));
  g.addColorStop(0.35, U.rgba(o.color || "#fff3d8", (o.alpha === undefined ? 0.5 : o.alpha) * 0.3));
  g.addColorStop(1, U.rgba(o.color || "#fff3d8", 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, U.TAU); ctx.fill();
  ctx.restore();
  return S;
};
})();
