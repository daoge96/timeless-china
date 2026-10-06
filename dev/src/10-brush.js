(function () {
const TC = window.TC;
const U = TC.U;
const B = (TC.Brush = {});

const wobbleAt = (t, amp, seed) => (U.fbm1(t * 3.1 + seed, 3, seed * 1.7) - 0.5) * 2 * amp;

B.centerline = function (pts, step, closed, wob, seed) {
  const n = pts.length;
  const dense = [];
  if (n === 2) {
    const dx = pts[1].x - pts[0].x, dy = pts[1].y - pts[0].y;
    const len = Math.hypot(dx, dy);
    const c = Math.max(6, Math.ceil(len / step));
    for (let i = 0; i <= c; i++) dense.push({ x: pts[0].x + (dx * i) / c, y: pts[0].y + (dy * i) / c, t: i / c });
  } else {
    const seg = closed ? n : n - 1;
    const c = Math.max(24, Math.ceil((seg * 90) / Math.max(6, step)));
    for (let i = 0; i <= c; i++) {
      const t = i / c;
      const p = U.splineAt(pts, t, closed);
      dense.push({ x: p.x, y: p.y, ang: p.ang, t: t });
    }
  }
  if (wob) {
    const s = seed || 1.31;
    for (let i = 0; i < dense.length; i++) {
      const a = dense[i].ang === undefined ? 0 : dense[i].ang + Math.PI / 2;
      const w = wobbleAt(dense[i].t, wob, s);
      dense[i].x += Math.cos(a) * w;
      dense[i].y += Math.sin(a) * w;
    }
  }
  const out = [];
  for (let i = 0; i < dense.length; i++) {
    const p = dense[i];
    const q = dense[Math.min(dense.length - 1, i + 1)];
    const r = dense[Math.max(0, i - 1)];
    const dx = q.x - r.x, dy = q.y - r.y;
    const len = Math.hypot(dx, dy) || 1;
    out.push({ x: p.x, y: p.y, nx: -dy / len, ny: dx / len, t: p.t });
  }
  return out;
};

B.ribbon = function (ctx, line, wfn, o) {
  const n = line.length;
  if (n < 2) return;
  o = o || {};
  const oa = o.offset || 0;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < n; i++) {
    const w = Math.max(0.05, wfn(line[i].t, i / (n - 1)) * 0.5);
    const x = line[i].x + line[i].nx * (oa + w), y = line[i].y + line[i].ny * (oa + w);
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  }
  for (let i = n - 1; i >= 0; i--) {
    const w = Math.max(0.05, wfn(line[i].t, i / (n - 1)) * 0.5);
    ctx.lineTo(line[i].x + line[i].nx * (oa - w), line[i].y + line[i].ny * (oa - w));
  }
  ctx.closePath();
};

const prof = (p, t) => {
  switch (p) {
    case "flat": return 1;
    case "in": return U.st(t / 0.82);
    case "out": return U.st((1 - t) / 0.82);
    case "press": return U.st(t / 0.16) * U.st((1 - t) / 0.3);
    case "belly": return U.st(t / 0.45) * U.st((1 - t) / 0.5);
    case "swell": return U.st(t / 0.34) * U.st((1 - t) / 0.62);
    case "tail": return U.st(t / 0.06) * U.st((1 - t) / 0.9);
    default: return U.st(t / 0.2) * U.st((1 - t) / 0.26);
  }
};
B.prof = prof;

B.stroke = function (ctx, pts, o) {
  o = o || {};
  if (pts.length < 2) return;
  const w0 = o.w0 === undefined ? 6 : o.w0;
  const w1 = o.w1 === undefined ? w0 : o.w1;
  const ink = o.ink || "#12151c";
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const p = o.profile || "taper";
  const wob = o.wobble === undefined ? w0 * 0.05 : o.wobble;
  const line = o._line || B.centerline(pts, o.step || 5, o.closed, wob, o.seed || (pts[0].x * 0.013 + pts[0].y * 0.007));
  const wfn = (t) => U.lerp(w0, w1, t) * prof(p, t);
  const pass = ctx.globalAlpha;
  ctx.save();
  ctx.globalAlpha = pass * alpha;
  ctx.fillStyle = ink;
  B.ribbon(ctx, line, wfn, {});
  ctx.fill();
  const bristles = o.bristles;
  if (bristles) {
    const cnt = typeof bristles === "number" ? bristles : 4;
    const light = o.bristleInk || U.mixHex(typeof ink === "string" ? ink : "#12151c", "#ffffff", o.dry === undefined ? 0.34 : o.dry);
    const jit = o.jitter === undefined ? w0 * 0.22 : o.jitter;
    ctx.globalAlpha = pass * alpha * (o.streakAlpha === undefined ? 0.5 : o.streakAlpha);
    ctx.fillStyle = light;
    for (let b = 0; b < cnt; b++) {
      const off = U.lerp(-jit, jit, cnt === 1 ? 0.5 : b / (cnt - 1));
      const sc = 0.34 + U.hash2(b * 7 + 1, Math.round(off * 13), 5) * 0.5;
      B.ribbon(ctx, line, (t) => wfn(t) * sc, { offset: off });
      ctx.fill();
    }
    if (o.darkEdge) {
      ctx.globalAlpha = pass * alpha * 0.55;
      ctx.fillStyle = U.shade(ink, 0.62);
      B.ribbon(ctx, line, (t) => wfn(t) * 0.24, { offset: w0 * 0.34 });
      ctx.fill();
      B.ribbon(ctx, line, (t) => wfn(t) * 0.2, { offset: -w0 * 0.34 });
      ctx.fill();
    }
  }
  ctx.restore();
  return line;
};

B.dots = function (ctx, list, o) {
  o = o || {};
  const ink = o.ink || "#12151c";
  ctx.save();
  ctx.fillStyle = ink;
  for (let i = 0; i < list.length; i++) {
    const d = list[i];
    ctx.globalAlpha = (o.alpha === undefined ? 1 : o.alpha) * (d.a === undefined ? 1 : d.a);
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.r, d.r * (d.sq || 1), d.rot || 0, 0, U.TAU);
    ctx.fill();
  }
  ctx.restore();
};

B.splatter = function (ctx, x, y, spread, count, o) {
  o = o || {};
  const r = o.rnd || U.rng(Math.round(x * 3.7 + y * 11.3) | 0);
  const list = [];
  for (let i = 0; i < count; i++) {
    const a = r() * U.TAU, d = Math.pow(r(), o.pow || 1.7) * spread;
    list.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, r: (o.min || 0.7) + r() * (o.size || 2.6), a: 0.35 + r() * 0.65, sq: 0.7 + r() * 0.6, rot: r() * 3 });
  }
  B.dots(ctx, list, { ink: o.ink, alpha: o.alpha });
  return list;
};

B.blob = function (ctx, cx, cy, rad, o) {
  o = o || {};
  const lumps = o.lumps === undefined ? 8 : o.lumps;
  const amp = o.amp === undefined ? 0.26 : o.amp;
  const seed = o.seed || 3.17;
  const pts = [];
  const span = o.span === undefined ? U.TAU : o.span;
  const start = o.start === undefined ? 0 : o.start;
  const cnt = o.pts || lumps * 2;
  for (let i = 0; i < cnt; i++) {
    const a = start + (i / cnt) * span;
    const n = U.fbm2(Math.cos(a) * 1.35 + seed, Math.sin(a) * 1.35 + seed, 4, 2.1, 0.5, seed);
    const rr = rad * (1 + (n - 0.5) * 2 * amp) * (1 + U.lerp(o.biasL || 0, o.biasR || 0, (Math.cos(a) + 1) / 2));
    pts.push({ x: cx + Math.cos(a) * rr * (o.sx || 1), y: cy + Math.sin(a) * rr * (o.sy || 1) });
  }
  ctx.beginPath();
  if (o.span !== undefined && o.span < U.TAU - 0.01) {
    U.polySm(ctx, pts, false);
    ctx.lineTo(cx, cy);
    ctx.closePath();
  } else U.polySm(ctx, pts, true);
  return pts;
};

B.shape = function (ctx, cx, cy, rad, o) {
  o = o || {};
  B.blob(ctx, cx, cy, rad, o);
  if (o.fill) { ctx.fillStyle = o.fill; ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha; ctx.fill(); }
  return B;
};

B.ink = function (ctx, cx, cy, rad, o) {
  o = o || {};
  const ink = o.ink || "#141821";
  const a = o.alpha === undefined ? 0.9 : o.alpha;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = ink;
  B.blob(ctx, cx, cy, rad, o);
  ctx.fill();
  if (o.rim) {
    ctx.globalAlpha = a * 0.5;
    ctx.strokeStyle = o.rim;
    ctx.lineWidth = o.rimW || 1.2;
    B.blob(ctx, cx, cy, rad, o);
    ctx.stroke();
  }
  ctx.restore();
  return B;
};

B.wash = function (ctx, x, y, r, o) {
  o = o || {};
  const inner = o.inner || 0;
  const g = ctx.createRadialGradient(x, y, Math.max(0, r * inner), x, y, Math.max(0.5, r));
  g.addColorStop(0, U.rgba(o.color || "#0d1119", (o.alpha === undefined ? 0.5 : o.alpha) * (o.core === undefined ? 1 : o.core)));
  g.addColorStop(o.mid === undefined ? 0.5 : o.mid, U.rgba(o.color || "#0d1119", (o.alpha === undefined ? 0.5 : o.alpha) * (o.midA === undefined ? 0.42 : o.midA)));
  g.addColorStop(1, U.rgba(o.color || "#0d1119", 0));
  ctx.save();
  ctx.globalCompositeOperation = o.blend || "source-over";
  ctx.fillStyle = g;
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale(o.sx || 1, o.sy || 1);
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(0.5, r), 0, U.TAU);
  ctx.fill();
  ctx.restore();
  return B;
};

B.mistBand = function (ctx, W, y, h, o) {
  o = o || {};
  const col = o.color || "#dfe9f2";
  const g = U.vgrad(ctx, 0, y - h, 0, y + h, [
    [0, U.rgba(col, 0)],
    [0.36, U.rgba(col, (o.alpha === undefined ? 0.3 : o.alpha) * 0.55)],
    [0.55, U.rgba(col, o.alpha === undefined ? 0.3 : o.alpha)],
    [1, U.rgba(col, 0)],
  ]);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, y - h, W, h * 2);
  ctx.restore();
  return B;
};

B.cloudSea = function (ctx, W, y, o) {
  o = o || {};
  const rnd = U.rng(o.seed || 91);
  const col = o.color || "#eef4f9";
  const amt = o.puffs === undefined ? 46 : o.puffs;
  const a0 = o.alpha === undefined ? 0.5 : o.alpha;
  ctx.save();
  ctx.globalCompositeOperation = o.blend || "source-over";
  for (let i = 0; i < amt; i++) {
    const t = (i + rnd() * 0.9) / amt;
    const cx = t * W * 1.02 - W * 0.01;
    const cy = y + (rnd() - 0.5) * (o.thick || 60) - Math.sin(t * 6.1 + rnd()) * (o.wave || 16);
    const r = (o.rmin || 40) + rnd() * (o.rmax === undefined ? 130 : o.rmax);
    const a = a0 * (0.32 + rnd() * 0.68) * (o.taper ? Math.sin(t * Math.PI) * 0.7 + 0.3 : 1);
    const g = ctx.createRadialGradient(cx, cy - r * 0.18, r * 0.05, cx, cy, r);
    g.addColorStop(0, U.rgba(col, a));
    g.addColorStop(0.45, U.rgba(col, a * 0.55));
    g.addColorStop(1, U.rgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.45, r * (o.flat || 0.42), 0, 0, U.TAU);
    ctx.fill();
  }
  ctx.restore();
  return B;
};

B.reflection = function (dst, srcCanvas, srcW, srcH, y, h, t, o) {
  o = o || {};
  const bands = o.bands === undefined ? 26 : o.bands;
  const bh = h / bands;
  const amp = o.amp === undefined ? 3.2 : o.amp;
  const speed = o.speed === undefined ? 1 : o.speed;
  const a0 = o.alpha === undefined ? 0.5 : o.alpha;
  const pass = dst.globalAlpha;
  for (let i = 0; i < bands; i++) {
    const v = i / (bands - 1);
    const sy = srcH * (1 - v * (o.depth || 0.62));
    const sh = Math.max(1, (srcH * (o.depth || 0.62)) / bands);
    const dx = Math.sin(t * 0.9 * speed + i * 0.55) * amp * (0.3 + v) + Math.sin(t * 2.7 * speed + i * 1.9) * amp * 0.24;
    dst.globalAlpha = pass * a0 * (1 - v * 0.82) * (o.fadeIn === false ? 1 : Math.min(1, v * 6 + 0.25));
    dst.drawImage(srcCanvas, 0, sy, srcW, sh, dx, y + i * bh, srcW * (o.widen || 1.01), bh + 0.7);
  }
  dst.globalAlpha = pass;
  return B;
};

B.rippleSet = function (ctx, x, y, t, o) {
  o = o || {};
  const n = o.n === undefined ? 3 : o.n;
  const rate = o.rate === undefined ? 0.45 : o.rate;
  const spread = o.spread === undefined ? 46 : o.spread;
  ctx.save();
  ctx.strokeStyle = o.color || "rgba(240,248,255,0.6)";
  ctx.lineWidth = o.w || 1;
  for (let i = 0; i < n; i++) {
    const ph = U.wrap(t * rate + i / n, 0, 1);
    const r = 4 + ph * spread;
    ctx.globalAlpha = (1 - ph) * (o.alpha === undefined ? 0.5 : o.alpha);
    ctx.beginPath();
    ctx.ellipse(x, y, r * (o.sx || 1.9), r * (o.sy || 0.42), 0, 0, U.TAU);
    ctx.stroke();
  }
  ctx.restore();
  return B;
};

B.shimmer = function (ctx, x, y, w, h, t, o) {
  o = o || {};
  const n = o.n === undefined ? 22 : o.n;
  const rnd = U.rng(o.seed || 17);
  ctx.save();
  ctx.fillStyle = o.color || "rgba(255,250,235,0.7)";
  for (let i = 0; i < n; i++) {
    const yy = y + ((i / n) * h) + (rnd() - 0.5) * (h / n) * 1.6;
    const ph = t * (o.speed === undefined ? 1.1 : o.speed) + i * 1.7;
    const pulse = Math.sin(ph) * 0.5 + 0.5;
    const len = (o.len === undefined ? 26 : o.len) * (0.5 + pulse);
    const xx = x + (rnd() * 0.94 + 0.03) * w + Math.sin(ph * 0.4) * 14;
    ctx.globalAlpha = (o.alpha === undefined ? 0.34 : o.alpha) * (0.5 + pulse * 0.5);
    ctx.fillRect(xx - len / 2, yy, len, o.thick === undefined ? 1.15 : o.thick);
  }
  ctx.restore();
  return B;
};

B.featherTop = function (ctx, W, y, h, col) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = U.vgrad(ctx, 0, y, 0, y + h, [[0, U.rgba(col || "#000", 1)], [1, U.rgba(col || "#000", 0)]]);
  ctx.fillRect(0, y - h, W, h * 2);
  ctx.restore();
  return B;
};

B.haze = function (ctx, W, H, stops) {
  ctx.fillStyle = U.vgrad(ctx, 0, 0, 0, H, stops);
  ctx.fillRect(0, 0, W, H);
  return B;
};

B.hairline = function (ctx, line, o) {
  o = o || {};
  const step = o.step || 3;
  ctx.save();
  ctx.strokeStyle = o.ink || "#e8eef5";
  ctx.lineWidth = o.w || 1;
  ctx.globalAlpha = o.alpha === undefined ? 0.5 : o.alpha;
  ctx.beginPath();
  let px = line[0].x, py = line[0].y;
  ctx.moveTo(px, py);
  for (let i = 1; i < line.length; i++) {
    if (i % step === 0) { ctx.lineTo(line[i].x, line[i].y); }
  }
  ctx.stroke();
  ctx.restore();
  return B;
};

B.tuft = function (ctx, x, y, len, o) {
  o = o || {};
  const n = o.n === undefined ? 5 : o.n;
  const rnd = o.rnd || U.rng(Math.round(x * 7 + y * 3) | 0);
  const a0 = o.dir === undefined ? -Math.PI / 2 : o.dir;
  const spread = o.spread === undefined ? 0.9 : o.spread;
  const ink = o.ink || "#1b2130";
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const a = a0 + (rnd() - 0.5) * spread;
    const L = len * (0.5 + rnd() * 0.8);
    const bend = (rnd() - 0.5) * len * 0.5;
    ctx.globalAlpha = (o.alpha === undefined ? 0.85 : o.alpha) * (0.5 + rnd() * 0.5);
    ctx.lineWidth = (o.w === undefined ? 1.6 : o.w) * (0.5 + rnd() * 0.8);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * L * 0.5 - bend * 0.2, y + Math.sin(a) * L * 0.5, x + Math.cos(a) * L - bend * 0.4, y + Math.sin(a) * L);
    ctx.stroke();
  }
  ctx.restore();
  return B;
};

B.grain = function (ctx, W, H, o) {
  o = o || {};
  const cell = o.cell || 2;
  const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
  const rnd = U.rng(o.seed || 5);
  ctx.save();
  ctx.globalAlpha = o.alpha === undefined ? 0.06 : o.alpha;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const v = rnd();
      if (v > (o.threshold === undefined ? 0.62 : o.threshold)) {
        ctx.fillStyle = v > 0.9 ? o.light || "rgba(255,255,255,0.5)" : o.dark || "rgba(0,0,0,0.4)";
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }
  ctx.restore();
  return B;
};
})();
