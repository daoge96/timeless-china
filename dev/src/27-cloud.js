(function () {
const TC = window.TC;
const U = TC.U;
const B = TC.Brush;
const S = TC.Sky;
const C = (TC.Cloud = {});

C.puff = function (ctx, x, y, r, o) {
  o = o || {};
  const a = o.a === undefined ? 0.5 : o.a;
  const col = o.color || "#f2f6fb";
  const g = ctx.createRadialGradient(x, y, r * 0.02, x, y, r);
  g.addColorStop(0, U.rgba(col, a * 0.95));
  g.addColorStop(0.32, U.rgba(col, a * 0.66));
  g.addColorStop(0.62, U.rgba(col, a * 0.3));
  g.addColorStop(0.85, U.rgba(col, a * 0.08));
  g.addColorStop(1, U.rgba(col, 0));
  const prev = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = o.blend || "lighter";
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, r * (o.sx || 1.7), r * (o.sy || 0.5), (o.rot || 0), 0, U.TAU);
  ctx.fill();
  ctx.globalCompositeOperation = prev;
};

C.bank = function (ctx, W, y, o) {
  o = o || {};
  const seed = o.seed || 7;
  const rnd = U.rng(Math.round(seed * 971));
  const thick = o.thick === undefined ? 30 : o.thick;
  const fade = o.fade === undefined ? 46 : o.fade;
  const mainA = o.alpha === undefined ? 0.45 : o.alpha;
  const top = y - thick * 0.5;
  const bot = y + thick * 0.5;
  const col = o.color || "#f1f6fb";

  const slab = function (yy, alpha, t0, t1) {
    const g = ctx.createLinearGradient(0, yy - fade, 0, yy + fade);
    const A = function (v, k) { return U.rgba(col, alpha * v * k); };
    g.addColorStop(0, A(0, 1));
    g.addColorStop(0.24, A(0.5, t0));
    g.addColorStop(0.5, A(1, t1));
    g.addColorStop(0.76, A(0.5, t0));
    g.addColorStop(1, A(0, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, yy - fade, W, fade * 2);
  };
  ctx.save();
  slab(y, mainA * 0.82, 0.7, 0.86);
  slab(y - thick * 0.5, mainA * 0.4, 0.5, 0.62);
  slab(y + thick * 0.52, mainA * 0.32, 0.5, 0.62);
  const n = o.puffs === undefined ? 30 : o.puffs;
  for (let i = 0; i < n; i++) {
    const t = (i + rnd() * 0.85) / n;
    const x = t * W * 1.03 - W * 0.015;
    const yy = y + (rnd() - 0.5) * thick * 0.5 - Math.sin(t * 5.3 + seed) * thick * (o.wave === undefined ? 0.2 : o.wave);
    const r = (o.rmin === undefined ? 18 : o.rmin) + rnd() * (o.rmax === undefined ? 46 : o.rmax);
    C.puff(ctx, x, yy, r, { a: mainA * (0.3 + rnd() * 0.6) * (o.dense === undefined ? 1 : o.dense), color: col, sx: 1.35 + rnd() * 1.1, sy: 0.2 + rnd() * 0.18 });
  }
  if (o.spill) {
    for (let i = 0; i < (o.spillN || 6); i++) {
      const x = rnd() * W;
      const yy = top - rnd() * (o.spillH || thick * 2.4);
      C.puff(ctx, x, yy, (o.rmin || 22) * (0.5 + rnd()), { a: mainA * 0.3 * rnd(), color: col, sx: 1.9 + rnd(), sy: 0.3 });
    }
  }
  ctx.restore();
  return C;
};

C.veil = function (ctx, W, H, y, o) {
  o = o || {};
  const col = o.color || "#e7eef7";
  const a = o.alpha === undefined ? 0.2 : o.alpha;
  const h = o.h === undefined ? H * 0.1 : o.h;
  ctx.save();
  ctx.fillStyle = U.vgrad(ctx, 0, y - h, 0, y + h, [
    [0, U.rgba(col, 0)], [0.4, U.rgba(col, a * 0.55)], [0.55, U.rgba(col, a)], [0.75, U.rgba(col, a * 0.5)], [1, U.rgba(col, 0)],
  ]);
  ctx.fillRect(0, y - h, W, h * 2);
  ctx.restore();
  return C;
};

C.streaks = function (ctx, W, H, y, o) {
  o = o || {};
  const seed = o.seed || 13;
  const rnd = U.rng(seed);
  const col = o.color || "#eef4fb";
  for (let i = 0; i < (o.n || 4); i++) {
    const yy = y + (rnd() - 0.5) * H * (o.spread === undefined ? 0.09 : o.spread);
    const dir = rnd() < 0.5 ? 1 : -1;
    const x = rnd() * W * 0.9 - W * 0.1;
    S.wisp(ctx, x, yy, W * (0.24 + rnd() * 0.42), {
      seed: i * 5 + seed, alpha: (o.alpha === undefined ? 0.2 : o.alpha) * (0.4 + rnd() * 0.6),
      color: col, w: 14 + rnd() * 16, w1: 3, n: 7, dir: dir, wav: 12,
    });
  }
  return C;
};

C.skyClouds = function (ctx, W, H, o) {
  o = o || {};
  const rnd = U.rng(o.seed || 21);
  const n = o.n === undefined ? 8 : o.n;
  const col = o.color || "#cfe0f2";
  for (let i = 0; i < n; i++) {
    const x = rnd() * W;
    const y = U.lerp(o.y0 || 0, o.y1 === undefined ? H * 0.5 : o.y1, Math.pow(rnd(), o.bias || 0.9));
    const r = (o.rmin === undefined ? 90 : o.rmin) + rnd() * (o.rmax === undefined ? 240 : o.rmax);
    const a = (o.alpha === undefined ? 0.13 : o.alpha) * (0.45 + rnd() * 0.55);
    const c2 = ctx;
    for (let k = 0; k < 3; k++) {
      C.puff(c2, x + (rnd() - 0.5) * r * 2.4, y + (rnd() - 0.5) * r * 0.5, r * (0.4 + rnd() * 0.5), { a: a, color: col, sx: 1.5 + rnd() * 1.2, sy: 0.24 + rnd() * 0.2 });
    }
  }
  return C;
};
})();
