(function () {
const TC = window.TC;
const U = TC.U;
const B = TC.Brush;
const G = (TC.Gen = {});

G.profile = function (W, o) {
  o = o || {};
  const n = Math.max(32, Math.ceil(W / (o.step || 14)));
  const seed = o.seed === undefined ? 1 : o.seed;
  const base = o.base === undefined ? 0.55 : o.base;
  const amp = o.amp === undefined ? 0.16 : o.amp;
  const det = o.detail === undefined ? 0.055 : o.detail;
  const raw = new Float64Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const big = U.fbm1(u * (o.scale === undefined ? 1.7 : o.scale) + seed * 3.13, 5, seed);
    const fine = U.fbm1(u * (o.dscale === undefined ? 7.5 : o.dscale) + seed * 9.7, 4, seed + 3);
    const spike = o.spiky ? Math.pow(1 - Math.abs(U.noise2(u * 11 + seed, 3.3, seed)), 2.2) * (o.spikeAmt === undefined ? 0.1 : o.spikeAmt) : 0;
    let v = base - amp - (big - 0.5) * 2 * amp - (fine - 0.5) * 2 * det - spike;
    if (o.arch) {
      const c = Math.abs(u - (o.archAt === undefined ? 0.5 : o.archAt)) / (o.archW === undefined ? 0.5 : o.archW);
      v -= Math.max(0, 1 - c * c) * o.arch;
    }
    if (o.slope) v += (u - 0.5) * o.slope;
    raw[i] = v;
  }
  const hh = o.h === undefined ? 1 : o.h;
  const sm = U.smoothArr(raw, o.smooth === undefined ? 1 : o.smooth);
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push({ x: (i / n) * W, y: sm[i] * hh });
  const at = (x) => {
    const u = U.clamp(x / W, 0, 1) * n;
    const i0 = Math.floor(u), i1 = Math.min(n, i0 + 1), f = u - i0;
    return (sm[i0] + (sm[i1] - sm[i0]) * f) * hh;
  };
  return { pts: pts, at: at, n: n, W: W, o: o };
};

G.fillUnder = function (ctx, W, H, p, o) {
  o = o || {};
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p.pts[0].x, p.pts[0].y);
  for (let i = 1; i < p.pts.length; i++) ctx.lineTo(p.pts[i].x, p.pts[i].y);
  ctx.lineTo(W + 2, H + 2); ctx.lineTo(-2, H + 2);
  ctx.closePath();
  if (o.grad) { ctx.fillStyle = U.vgrad(ctx, 0, (o.g0 === undefined ? 0.25 : o.g0) * H, 0, (o.g1 === undefined ? 1.05 : o.g1) * H, o.grad); ctx.fill(); }
  else { ctx.fillStyle = o.fill || "#101520"; ctx.fill(); }
  if (o.rim) {
    ctx.globalAlpha = o.rimA === undefined ? 0.5 : o.rimA;
    ctx.strokeStyle = o.rim;
    ctx.lineWidth = o.rimW || 1.1;
    ctx.beginPath();
    ctx.moveTo(p.pts[0].x, p.pts[0].y);
    for (let i = 1; i < p.pts.length; i++) ctx.lineTo(p.pts[i].x, p.pts[i].y);
    ctx.stroke();
  }
  ctx.restore();
  return G;
};

G.hatch = function (ctx, W, H, y0, y1, o) {
  o = o || {};
  const rnd = U.rng(o.seed || 9);
  ctx.save();
  ctx.globalAlpha = o.alpha === undefined ? 0.09 : o.alpha;
  ctx.strokeStyle = o.color || "#000";
  ctx.lineWidth = o.w || 1;
  const n = o.n === undefined ? 26 : o.n;
  for (let i = 0; i < n; i++) {
    const y = U.lerp(y0, y1, rnd());
    const x = rnd() * W;
    const len = (o.len === undefined ? 90 : o.len) * (0.4 + rnd());
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + len * 0.5, y - 5 + rnd() * 10, x + len, y + (rnd() - 0.5) * 14);
    ctx.stroke();
  }
  ctx.restore();
  return G;
};

G.pine = function (ctx, x, y, h, o) {
  o = o || {};
  const rnd = U.rng(o.seed || Math.round(x * 13 + y * 7) | 0);
  const ink = o.ink || "#0d1119";
  const spread = o.spread === undefined ? 0.62 : o.spread;
  const limbs = o.limbs === undefined ? 4 : o.limbs;
  ctx.save();
  B.stroke(ctx, [{ x: x, y: y }, { x: x + (rnd() - 0.5) * h * 0.14, y: y - h * 0.42 }, { x: x + (rnd() - 0.5) * h * 0.2, y: y - h * 0.72 }, { x: x + (rnd() - 0.5) * h * 0.24, y: y - h }], {
    w0: h * (o.trunk === undefined ? 0.075 : o.trunk), w1: h * 0.014, ink: ink, profile: "taper", wobble: h * 0.012, step: 5, bristles: o.detail === false ? 0 : 3, dry: 0.3, streakAlpha: 0.4, seed: x * 0.01,
  });
  for (let i = 0; i < limbs; i++) {
    const t = 0.42 + (i / limbs) * 0.58;
    const bx = x + (x - x) + (rnd() - 0.5) * h * 0.1;
    const by = y - h * t;
    const dir = i % 2 === 0 ? 1 : -1;
    const L = h * spread * (0.55 + rnd() * 0.75) * (1 - t * 0.35);
    const ex = bx + dir * L;
    const ey = by - L * (0.12 + rnd() * 0.3);
    B.stroke(ctx, [{ x: bx, y: by }, { x: bx + dir * L * 0.45, y: by - L * 0.1 }, { x: ex, y: ey }], {
      w0: h * 0.03 * (1 - t * 0.4), w1: h * 0.006, ink: ink, profile: "taper", wobble: h * 0.006, step: 4, bristles: 2, streakAlpha: 0.34,
    });
    const pads = o.pads === undefined ? 3 : o.pads;
    for (let k = 0; k < pads; k++) {
      const tt = 0.45 + (k / pads) * 0.55;
      const px = bx + (ex - bx) * tt + (rnd() - 0.5) * h * 0.05;
      const py = by + (ey - by) * tt - h * 0.02 - rnd() * h * 0.02;
      const r = h * 0.055 * (0.6 + rnd() * 0.8);
      const g = ctx.createRadialGradient(px, py, 0, px, py, r * 2.1);
      g.addColorStop(0, U.rgba(ink, o.needleA === undefined ? 0.62 : o.needleA));
      g.addColorStop(0.5, U.rgba(ink, 0.28));
      g.addColorStop(1, U.rgba(ink, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(px, py, r * 2.2, r * 0.85, (rnd() - 0.5) * 0.5, 0, U.TAU);
      ctx.fill();
      if (o.needles) B.tuft(ctx, px, py, r * 2.1, { n: 5, ink: ink, w: 0.9, alpha: 0.5, spread: 2.4, rnd: rnd });
    }
  }
  ctx.restore();
  return G;
};

G.bamboo = function (ctx, x, baseY, h, o) {
  o = o || {};
  const rnd = U.rng(o.seed || Math.round(x * 3.3) | 0);
  const culms = o.culms === undefined ? 4 : o.culms;
  const ink = o.ink || "#1a2a22";
  ctx.save();
  for (let c = 0; c < culms; c++) {
    const bx = x + (rnd() - 0.5) * h * 0.3;
    const H2 = h * (0.55 + rnd() * 0.6);
    const lean = (rnd() - 0.5) * H2 * 0.16;
    const w = h * 0.016 * (0.7 + rnd() * 0.6);
    B.stroke(ctx, [{ x: bx, y: baseY }, { x: bx + lean * 0.4, y: baseY - H2 * 0.55 }, { x: bx + lean, y: baseY - H2 }], {
      w0: w, w1: w * 0.7, ink: ink, profile: "flat", wobble: w * 0.3, step: 6, bristles: 0, alpha: o.alpha === undefined ? 0.92 : o.alpha,
    });
    const seg = 5 + Math.floor(rnd() * 4);
    ctx.globalAlpha = (o.alpha === undefined ? 0.92 : o.alpha) * 0.85;
    ctx.fillStyle = U.rgba(ink, 0.9);
    for (let s = 1; s < seg; s++) {
      const tt = s / seg;
      const nx = bx + lean * tt, ny = baseY - H2 * tt;
      ctx.fillRect(nx - w * 0.75, ny, w * 1.5, Math.max(0.8, w * 0.4));
    }
    const leaves = o.leaves === undefined ? 6 : o.leaves;
    for (let l = 0; l < leaves; l++) {
      const tt = 0.45 + rnd() * 0.55;
      const nx = bx + lean * tt, ny = baseY - H2 * tt;
      const dir = rnd() < 0.5 ? -1 : 1;
      const L = h * (0.06 + rnd() * 0.1);
      ctx.globalAlpha = (o.alpha === undefined ? 0.92 : o.alpha) * (0.35 + rnd() * 0.45);
      ctx.save();
      ctx.translate(nx, ny);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(dir * L * 0.5, -L * 0.2, dir * L, -L * 0.34);
      ctx.quadraticCurveTo(dir * L * 0.5, L * 0.12, 0, 0);
      ctx.fillStyle = ink;
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
  return G;
};

G.spires = function (ctx, W, H, o) {
  o = o || {};
  const rnd = U.rng(o.seed || 5);
  const n = o.n === undefined ? 9 : o.n;
  const baseY = o.baseY === undefined ? H * 0.72 : o.baseY;
  const cols = [];
  for (let i = 0; i < n; i++) {
    const cx = (i + 0.5 + (rnd() - 0.5) * 0.6) * (W / n);
    const hh = H * (o.hmin === undefined ? 0.14 : o.hmin) + rnd() * H * (o.hmax === undefined ? 0.3 : o.hmax);
    const w = hh * (o.ratio === undefined ? 0.3 : o.ratio) * (0.6 + rnd() * 0.9);
    const top = baseY - hh;
    const ink = o.grad ? "#fff" : o.ink || "#151a24";
    const pts = [];
    const sides = 9;
    for (let s = 0; s <= sides; s++) {
      const tt = s / sides;
      const yy = U.lerp(top, baseY + hh * 0.1, tt);
      const ww = w * (0.42 + Math.pow(tt, 0.75) * 0.9) * (1 + (U.fbm1(tt * 5 + i, 3, i) - 0.5) * 0.3);
      pts.push({ x: cx - ww * 0.5, y: yy });
    }
    for (let s = sides; s >= 0; s--) {
      const tt = s / sides;
      const yy = U.lerp(top, baseY + hh * 0.1, tt);
      const ww = w * (0.42 + Math.pow(tt, 0.75) * 0.9) * (1 + (U.fbm1(tt * 5 + i + 40, 3, i + 7) - 0.5) * 0.3);
      pts.push({ x: cx + ww * 0.5, y: yy });
    }
    ctx.save();
    ctx.beginPath();
    U.poly(ctx, pts, true);
    if (o.grad) { ctx.fillStyle = U.vgrad(ctx, 0, top, 0, baseY, o.grad); ctx.fill(); }
    else { ctx.fillStyle = ink; ctx.fill(); }
    ctx.globalAlpha = o.crackA === undefined ? 0.32 : o.crackA;
    ctx.strokeStyle = o.crack || "#000";
    ctx.lineWidth = o.crackW || 1;
    const cracks = o.cracks === undefined ? 6 : o.cracks;
    for (let c = 0; c < cracks; c++) {
      const tt = 0.1 + rnd() * 0.9;
      const yy = U.lerp(top, baseY, tt);
      const ww = w * (0.42 + Math.pow(tt, 0.75) * 0.9);
      ctx.beginPath();
      ctx.moveTo(cx - ww * 0.45 + rnd() * ww * 0.2, yy);
      ctx.lineTo(cx + (rnd() - 0.5) * ww * 0.5, yy + (rnd() - 0.5) * hh * 0.14);
      ctx.lineTo(cx + ww * 0.45 - rnd() * ww * 0.2, yy + (rnd() - 0.5) * hh * 0.16);
      ctx.stroke();
    }
    if (o.rim) {
      ctx.globalAlpha = o.rimA === undefined ? 0.4 : o.rimA;
      ctx.strokeStyle = o.rim;
      ctx.lineWidth = o.rimW || 1.4;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.2, top);
      for (let s = 0; s <= sides; s++) {
        const tt = s / sides;
        const yy = U.lerp(top, baseY, tt);
        const ww = w * (0.42 + Math.pow(tt, 0.75) * 0.9);
        ctx.lineTo(cx + ww * 0.5, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
    cols.push({ x: cx, top: top, w: w, h: hh });
  }
  return cols;
};

G.crags = function (ctx, W, H, at, o) {
  o = o || {};
  const rnd = U.rng(o.seed || 21);
  const n = o.n === undefined ? 26 : o.n;
  const hmax = H * (o.hmin === undefined ? 0.035 : o.hmin);
  ctx.save();
  ctx.fillStyle = o.ink || "#0e121a";
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5 + (rnd() - 0.5) * 0.7) / n;
    const x = u * W;
    const y = typeof at === "function" ? at(x) : at;
    const hh = hmax * (0.35 + rnd() * 1.5);
    const w = hh * (0.9 + rnd() * 2.6);
    ctx.globalAlpha = (o.alpha === undefined ? 0.55 : o.alpha) * (0.45 + rnd() * 0.55);
    ctx.beginPath();
    ctx.moveTo(x - w * 0.5, y + H * 0.004);
    ctx.lineTo(x - w * 0.24, y - hh * 0.52);
    ctx.lineTo(x - w * 0.06, y - hh * 0.86);
    ctx.lineTo(x + w * 0.14, y - hh);
    ctx.lineTo(x + w * 0.3, y - hh * 0.44);
    ctx.lineTo(x + w * 0.5, y + H * 0.004);
    ctx.closePath();
    ctx.fill();
    if (rnd() < 0.5) {
      ctx.beginPath();
      ctx.ellipse(x + (rnd() - 0.5) * w, y + H * 0.002, w * (0.2 + rnd() * 0.4), hh * 0.3, 0, 0, U.TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  return G;
};

G.terraces = function (ctx, W, H, o) {
  o = o || {};
  const rows = o.rows === undefined ? 16 : o.rows;
  const y0 = o.y0 === undefined ? H * 0.45 : o.y0;
  const y1 = o.y1 === undefined ? H * 0.95 : o.y1;
  const rnd = U.rng(o.seed || 6);
  const ink = o.ink || "#12161f";
  for (let i = 0; i < rows; i++) {
    const tt = i / rows;
    const y = U.lerp(y0, y1, Math.pow(tt, o.curve || 0.72));
    const amp = H * 0.03 * (0.4 + tt);
    const bend = (rnd() - 0.5) * H * 0.05;
    const pts = [];
    const seg = 6;
    for (let s = 0; s <= seg; s++) {
      const u = s / seg;
      pts.push({ x: u * W, y: y + Math.sin(u * U.TAU * (0.6 + rnd() * 0.5) + rnd() * 6) * amp + bend * Math.sin(u * Math.PI) });
    }
    B.stroke(ctx, pts, { w0: H * (0.012 + tt * 0.006), w1: H * (0.01 + tt * 0.008), ink: ink, alpha: (o.alpha === undefined ? 0.85 : o.alpha) * (0.35 + tt * 0.65), profile: "flat", wobble: 1.2, step: 8, bristles: 0 });
  }
  return G;
};

G.rock = function (ctx, x, y, w, h, o) {
  o = o || {};
  const rnd = U.rng(o.seed || Math.round(x * 5 + y * 3) | 0);
  const ink = o.ink || "#11151d";
  const pts = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI;
    const rr = 1 + (rnd() - 0.5) * 0.3;
    pts.push({ x: x + Math.cos(a) * w * 0.5 * rr, y: y + Math.sin(a) * h * rr });
  }
  pts.push({ x: x + w * 0.5, y: y + h * 0.12 });
  pts.push({ x: x - w * 0.5, y: y + h * 0.12 });
  ctx.save();
  ctx.beginPath();
  U.poly(ctx, pts, true);
  ctx.fillStyle = o.grad ? U.vgrad(ctx, 0, y - h, 0, y + h * 0.14, o.grad) : ink;
  ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
  ctx.fill();
  ctx.globalAlpha = (o.alpha === undefined ? 1 : o.alpha) * 0.4;
  ctx.strokeStyle = o.rim || "#8fa3b8";
  ctx.lineWidth = o.rimW || 1;
  ctx.beginPath();
  for (let i = 0; i < n; i++) { if (i === 0) ctx.moveTo(pts[i].x, pts[i].y); else ctx.lineTo(pts[i].x, pts[i].y); }
  ctx.stroke();
  ctx.restore();
  return G;
};

G.birds = function (ctx, list, o) {
  o = o || {};
  const ink = o.ink || "rgba(24,30,40,0.9)";
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.lineCap = "round";
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    const s = b.s;
    const flap = b.flap;
    ctx.globalAlpha = b.a === undefined ? 0.85 : b.a;
    ctx.lineWidth = Math.max(0.7, s * 0.16);
    ctx.beginPath();
    ctx.moveTo(b.x - s, b.y + flap * s * 0.55);
    ctx.quadraticCurveTo(b.x - s * 0.4, b.y - s * 0.28, b.x, b.y);
    ctx.quadraticCurveTo(b.x + s * 0.4, b.y - s * 0.28, b.x + s, b.y + flap * s * 0.55);
    ctx.stroke();
  }
  ctx.restore();
  return G;
};
})();
