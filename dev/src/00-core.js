(function () {
const TC = (window.TC = window.TC || {});
const U = (TC.U = {});

U.TAU = Math.PI * 2;
U.RAD = Math.PI / 180;
U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
U.sat = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
U.lerp = (a, b, t) => a + (b - a) * t;
U.mix = U.lerp;
U.inv = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
U.remap = (v, a, b, c, d) => c + (d - c) * U.sat(U.inv(a, b, v));
U.st = (t) => { t = U.sat(t); return t * t * (3 - 2 * t); };
U.st5 = (t) => { t = U.sat(t); return t * t * t * (t * (t * 6 - 15) + 10); };
U.easeIn = (t) => t * t;
U.easeOut = (t) => 1 - (1 - t) * (1 - t);
U.easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
U.easeOut3 = (t) => 1 - Math.pow(1 - t, 3);
U.easeOut4 = (t) => 1 - Math.pow(1 - t, 4);
U.easeOut5 = (t) => 1 - Math.pow(1 - t, 5);
U.easeIn3 = (t) => t * t * t;
U.easeIn4 = (t) => t * t * t * t;
U.easeOutBack = (t) => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
U.easeOutElastic = (t) => { if (t <= 0) return 0; if (t >= 1) return 1; const p = 0.32; return Math.pow(2, -11 * t) * Math.sin(((t - p / 4) * U.TAU) / p) + 1; };
U.smoothPulse = (t) => { t = U.sat(t); return U.st(t < 0.5 ? t * 2 : (1 - t) * 2); };
U.arch = (t) => U.sat(t) * (1 - U.sat(t)) * 4;
U.tri = (t) => 1 - Math.abs(((t % 1) + 1) % 1 * 2 - 1);
U.wrap = (v, a, b) => { const d = b - a; return a + ((((v - a) % d) + d) % d); };
U.floorTo = (v, s) => Math.floor(v / s) * s;
U.isPow2 = (v) => (v & (v - 1)) === 0;
U.hash2 = (x, y, s) => {
  let h = x * 374761393 + y * 668265263 + (s || 0) * 2246822519;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
U.rng = function (seed) {
  let a = (seed >>> 0) || 0x9e3779b9;
  const f = function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.range = (lo, hi) => lo + f() * (hi - lo);
  f.int = (lo, hi) => Math.floor(lo + f() * (hi - lo + 1));
  f.pick = (arr) => arr[Math.floor(f() * arr.length) % arr.length];
  f.sign = () => (f() < 0.5 ? -1 : 1);
  f.chance = (p) => f() < p;
  f.gauss = (mu, sd) => {
    let u = 0, v = 0;
    while (u === 0) u = f();
    while (v === 0) v = f();
    return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(U.TAU * v);
  };
  f.walk = (n, step, o) => {
    const out = new Float64Array(n);
    let v = (o && o.from) || 0;
    for (let i = 0; i < n; i++) { v += f.gauss(0, step); out[i] = v; }
    return out;
  };
  return f;
};
const NPERM = new Uint8Array(512);
(function () {
  const r = U.rng(0x51ed270b);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
  for (let i = 0; i < 512; i++) NPERM[i] = p[i & 255];
})();
const GX = new Float32Array(256), GY = new Float32Array(256), GZ = new Float32Array(256);
(function () {
  const r = U.rng(0x27d4eb2f);
  for (let i = 0; i < 256; i++) {
    const th = r() * U.TAU, z = r() * 2 - 1, s = Math.sqrt(1 - z * z);
    GX[i] = Math.cos(th) * s; GY[i] = Math.sin(th) * s; GZ[i] = z;
  }
})();
const g3 = (ix, iy, iz, x, y, z) => {
  const h = NPERM[(NPERM[(NPERM[ix & 255] + (iy & 255)) & 255] + (iz & 255)) & 255];
  return GX[h] * x + GY[h] * y + GZ[h] * z;
};
U.noise3 = function (x, y, z) {
  const fx = Math.floor(x), fy = Math.floor(y), fz = Math.floor(z);
  const rx = x - fx, ry = y - fy, rz = z - fz;
  const u = U.st5(rx), v = U.st5(ry), w = U.st5(rz);
  const n000 = g3(fx, fy, fz, rx, ry, rz), n100 = g3(fx + 1, fy, fz, rx - 1, ry, rz);
  const n010 = g3(fx, fy + 1, fz, rx, ry - 1, rz), n110 = g3(fx + 1, fy + 1, fz, rx - 1, ry - 1, rz);
  const n001 = g3(fx, fy, fz + 1, rx, ry, rz - 1), n101 = g3(fx + 1, fy, fz + 1, rx - 1, ry, rz - 1);
  const n011 = g3(fx, fy + 1, fz + 1, rx, ry - 1, rz - 1), n111 = g3(fx + 1, fy + 1, fz + 1, rx - 1, ry - 1, rz - 1);
  const x00 = n000 + u * (n100 - n000), x10 = n010 + u * (n110 - n010);
  const x01 = n001 + u * (n101 - n001), x11 = n011 + u * (n111 - n011);
  const y0 = x00 + v * (x10 - x00), y1 = x01 + v * (x11 - x01);
  return y0 + w * (y1 - y0);
};
U.noise2 = (x, y, s) => U.noise3(x, y, (s || 0) * 13.13);
U.fbm2 = function (x, y, oct, lac, gain, s) {
  oct = oct || 4; lac = lac || 2.02; gain = gain === undefined ? 0.5 : gain;
  let a = 0.5, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += a * U.noise2(x * f, y * f, (s || 0) + i * 7.77);
    norm += a; a *= gain; f *= lac;
  }
  return sum / norm;
};
U.fbm1 = function (x, oct, s) {
  oct = oct || 5;
  let a = 0.5, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) { sum += a * U.noise2(x * f, 0.5, (s || 0) + i * 3.7); norm += a; a *= 0.5; f *= 2.03; }
  return sum / norm;
};
U.ridge2 = function (x, y, oct, s) {
  oct = oct || 5;
  let a = 0.5, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) {
    const n = 1 - Math.abs(U.noise2(x * f, y * f, (s || 0) + i * 4.31));
    sum += a * n * n; norm += a; a *= 0.5; f *= 2.07;
  }
  return sum / norm;
};
U.warp2 = function (x, y, amp, s) {
  const wx = U.fbm2(x, y, 3, 2.1, 0.5, (s || 0) + 11.1);
  const wy = U.fbm2(x, y, 3, 2.1, 0.5, (s || 0) + 23.7);
  return [x + wx * amp, y + wy * amp];
};
U.cr = function (p0, p1, p2, p3, f) {
  const f2 = f * f, f3 = f2 * f;
  const ax = -p0.x + 3 * p1.x - 3 * p2.x + p3.x, ay = -p0.y + 3 * p1.y - 3 * p2.y + p3.y;
  const bx = 2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x, by = 2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y;
  const cx = -p0.x + p2.x, cy = -p0.y + p2.y;
  return {
    x: 0.5 * (2 * p1.x + cx * f + bx * f2 + ax * f3),
    y: 0.5 * (2 * p1.y + cy * f + by * f2 + ay * f3),
    a: 0.5 * (cx + 2 * bx * f + 3 * ax * f2),
    b: 0.5 * (cy + 2 * by * f + 3 * ay * f2),
  };
};
U.splineAt = function (pts, t, closed) {
  const n = pts.length;
  if (n < 2) { const p = pts[0] || { x: 0, y: 0 }; return { x: p.x, y: p.y, ang: 0 }; }
  let ft;
  if (closed) ft = U.wrap(t, 0, 1) * n; else ft = U.sat(t) * (n - 1);
  const i = Math.floor(ft);
  const f = ft - i;
  const at = (k) => (closed ? pts[(k % n + n) % n] : pts[U.clamp(k, 0, n - 1)]);
  const p = U.cr(at(i - 1), at(i), at(i + 1), at(i + 2), f);
  const p2 = U.cr(at(i - 1), at(i), at(i + 1), at(i + 2), f + 0.002);
  return { x: p.x, y: p.y, ang: Math.atan2(p2.y - p.y, p2.x - p.x) };
};
U.sampleSpline = function (pts, count, closed, from, to) {
  from = from === undefined ? 0 : from;
  to = to === undefined ? 1 : to;
  const out = [];
  for (let i = 0; i < count; i++) out.push(U.splineAt(pts, U.lerp(from, to, i / (count - 1 || 1)), closed));
  return out;
};
U.resize1 = function (arr, n) {
  const out = new Float64Array(n);
  if (arr.length === 0) return out;
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1 || 1)) * (arr.length - 1);
    const i0 = Math.floor(t), i1 = Math.min(arr.length - 1, i0 + 1), f = t - i0;
    out[i] = arr[i0] + (arr[i1] - arr[i0]) * f;
  }
  return out;
};
U.smoothArr = function (arr, passes) {
  passes = passes || 1;
  const out = Float64Array.from(arr);
  for (let p = 0; p < passes; p++) {
    const tmp = Float64Array.from(out);
    for (let i = 1; i < out.length - 1; i++) out[i] = (tmp[i - 1] + tmp[i] * 2 + tmp[i + 1]) * 0.25;
  }
  return out;
};
U.hex = function (h) {
  h = h.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
U.rgba = function (c, a) {
  if (a === undefined) a = 1;
  if (typeof c === "string") { const v = U.hex(c); return "rgba(" + v[0] + "," + v[1] + "," + v[2] + "," + a + ")"; }
  return "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a + ")";
};
U.mixHex = function (a, b, t) {
  const A = U.hex(a), B = U.hex(b);
  return "rgb(" + Math.round(U.lerp(A[0], B[0], t)) + "," + Math.round(U.lerp(A[1], B[1], t)) + "," + Math.round(U.lerp(A[2], B[2], t)) + ")";
};
U.mixRgb = function (a, b, t) {
  const A = typeof a === "string" ? U.hex(a) : a, B = typeof b === "string" ? U.hex(b) : b;
  return [U.lerp(A[0], B[0], t), U.lerp(A[1], B[1], t), U.lerp(A[2], B[2], t)];
};
U.shade = function (c, f) {
  const v = typeof c === "string" ? U.hex(c) : c;
  return "rgb(" + U.clamp(Math.round(v[0] * f), 0, 255) + "," + U.clamp(Math.round(v[1] * f), 0, 255) + "," + U.clamp(Math.round(v[2] * f), 0, 255) + ")";
};
U.lum = function (c) {
  const v = typeof c === "string" ? U.hex(c) : c;
  return (v[0] * 0.2126 + v[1] * 0.7152 + v[2] * 0.0722) / 255;
};
U.ramp = function (stops, t) {
  t = U.sat(t);
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (t <= b[0] || i === stops.length - 2) {
      const f = U.inv(a[0], b[0], U.clamp(t, a[0], b[0]));
      return U.mixRgb(a[1], b[1], f);
    }
  }
  return U.hex(stops[stops.length - 1][1]);
};
U.gradStops = function (stops, alphaFn) {
  return stops.map((s, i) => {
    const c = typeof s[1] === "string" ? U.hex(s[1]) : s[1];
    const a = alphaFn ? alphaFn(s[0], i) : (s.length > 2 ? s[2] : 1);
    return U.rgba(c, a);
  });
};
const LAYERS = [];
U.Layer = function (w, h, dpr) {
  dpr = dpr || 1;
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w * dpr));
  c.height = Math.max(1, Math.ceil(h * dpr));
  const g = c.getContext("2d");
  g.scale(dpr, dpr);
  const L = {
    canvas: c, ctx: g, w: w, h: h, dpr: dpr,
    clear() { g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); return L; },
    fill(col) { g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = col; g.fillRect(0, 0, w, h); return L; },
    blit(ctx, x, y, sw, sh, o) {
      if (sw === undefined) sw = w;
      if (sh === undefined) sh = h;
      if (o && o.alpha !== undefined) { const p = ctx.globalAlpha; ctx.globalAlpha = p * o.alpha; ctx.drawImage(c, 0, 0, c.width, c.height, x, y, sw, sh); ctx.globalAlpha = p; }
      else ctx.drawImage(c, 0, 0, c.width, c.height, x, y, sw, sh);
      return L;
    },
    blitD(ctx, x, y, sw, sh, o) {
      if (sw === undefined) sw = w;
      if (sh === undefined) sh = h;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (o && o.alpha !== undefined) ctx.globalAlpha = ctx.globalAlpha * o.alpha;
      ctx.drawImage(c, 0, 0, c.width, c.height, x, y, sw, sh);
      ctx.restore();
      return L;
    },
    readInto(ctx, x, y, sw, sh) {
      ctx.drawImage(c, x * dpr, y * dpr, sw * dpr, sh * dpr, x, y, sw, sh);
      return L;
    },
    slice(ctx, sx, sy, sw, sh, dx, dy, dw, dh) { ctx.drawImage(c, sx * dpr, sy * dpr, sw * dpr, sh * dpr, dx, dy, dw, dh); },
    blur(px) { const t = document.createElement("canvas"); t.width = c.width; t.height = c.height; const tg = t.getContext("2d"); tg.filter = "blur(" + px + "px)"; tg.drawImage(c, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.drawImage(t, 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0); return L; },
    destroy() { c.width = c.height = 1; },
  };
  LAYERS.push(L);
  return L;
};
U.disposeLayers = function (keep) {
  keep = keep || 0;
  while (LAYERS.length > keep) { const l = LAYERS.pop(); if (l) l.destroy(); }
};
const GCACHE = new Map();
const gkey = (tag, args) => {
  let k = tag;
  for (let i = 0; i < args.length; i++) k += "|" + args[i];
  return k;
};
U.gc = function (kind, ctx, a0, a1, a2, a3, a4, stops) {
  const key = gkey(kind + a0 + "," + a1 + "," + a2 + "," + a3 + "," + a4, stops);
  let g = GCACHE.get(key);
  if (!g) {
    g = kind === "v" ? ctx.createLinearGradient(a0, a1, a2, a3) : ctx.createRadialGradient(a0, a1, Math.max(0, a2), a3, a4, Math.max(0.001, a4 - a3));
    for (let i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    if (GCACHE.size > 900) GCACHE.clear();
    GCACHE.set(key, g);
  }
  return g;
};
U.gcClear = function () { GCACHE.clear(); };
U.vgrad = function (ctx, x0, y0, x1, y1, stops) {
  if (stops.length < 2) { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, stops[0][1]); return g; }
  return U.gc("v", ctx, x0, y0, x1, y1, 0, stops);
};
U.rgrad = function (ctx, x, y, r0, r1, stops) { return gcRadial(ctx, x, y, r0, r1, stops); };
const gcRadial = function (ctx, x, y, r0, r1, stops) {
  const key = gkey("r" + x + "," + y + "," + r0 + "," + r1, stops);
  let g = GCACHE.get(key);
  if (!g) {
    g = ctx.createRadialGradient(x, y, Math.max(0, r0), x, y, Math.max(0.001, r1));
    for (let i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    if (GCACHE.size > 900) GCACHE.clear();
    GCACHE.set(key, g);
  }
  return g;
};
U.fillV = function (ctx, x, y, w, h, stops) { ctx.fillStyle = U.vgrad(ctx, x, y, x, y + h, stops); ctx.fillRect(x, y, w, h); };
U.even = function () {
  const v = Array.prototype.slice.call(arguments);
  const base = v[0];
  return [base, U.lerp(base, v[1], 0.5), v[1]];
};
U.poly = function (ctx, pts, close) {
  if (!pts.length) return;
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  if (close !== false) ctx.closePath();
};
U.polySm = function (ctx, pts, close) {
  const n = pts.length;
  if (n < 3) { U.poly(ctx, pts, close); return; }
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < (close === false ? n - 1 : n); i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i % n], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    ctx.bezierCurveTo(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6, p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6, p2.x, p2.y);
  }
  if (close !== false) ctx.closePath();
};
U.roundedPath = function (ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};
U.qs = function () {
  const o = {};
  const s = location.search.replace(/^\?/, "");
  if (s) for (const kv of s.split("&")) { const i = kv.indexOf("="); if (i > 0) o[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1)); }
  return o;
};
U.debounce = function (fn, ms) {
  let h = 0;
  return function () { const a = arguments, self = this; if (h) clearTimeout(h); h = setTimeout(() => { h = 0; fn.apply(self, a); }, ms); };
};
U.once = function (fn) { let done = false, val; return function () { if (!done) { done = true; val = fn.apply(this, arguments); } return val; }; };
U.now = () => (window.performance && performance.now ? performance.now() : Date.now());
U.fmtTime = function (s) {
  s = Math.max(0, Math.round(s));
  const m = Math.floor(s / 60);
  return m + ":" + String(s % 60).padStart(2, "0");
};
U.hasPath2D = typeof Path2D !== "undefined";
U.spriteFrom = function (w, h, draw, dpr) {
  const L = U.Layer(w, h, dpr || 1);
  draw(L.ctx, w, h);
  return L;
};
U.shadowIn = function (ctx, fn, col, blur, ox, oy) {
  ctx.save();
  ctx.shadowColor = col; ctx.shadowBlur = blur; ctx.shadowOffsetX = ox || 0; ctx.shadowOffsetY = oy || 0;
  ctx.beginPath(); fn(); ctx.fill();
  ctx.restore();
};
U.pxRatio = function (want) {
  const d = window.devicePixelRatio || 1;
  return U.clamp(want || d, 1, 2);
};
U.softEdge = function (ctx, x, y, w, h, dir, col) {
  const g = dir === "top" ? U.vgrad(ctx, x, y, x, y + h, [[0, U.rgba(col, 1)], [1, U.rgba(col, 0)]])
    : dir === "bottom" ? U.vgrad(ctx, x, y, x, y + h, [[0, U.rgba(col, 0)], [1, U.rgba(col, 1)]])
      : dir === "left" ? U.vgrad(ctx, x, y, x + w, y, [[0, U.rgba(col, 1)], [1, U.rgba(col, 0)]])
        : U.vgrad(ctx, x, y, x + w, y, [[0, U.rgba(col, 0)], [1, U.rgba(col, 1)]]);
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.restore();
};
})();
