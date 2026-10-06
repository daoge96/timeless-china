(function () {
const TC = window.TC;
const U = TC.U;
const B = TC.Brush;
const G = TC.Gen;

G.wallPath = function (W, H, o) {
  o = o || {};
  const rnd = U.rng(o.seed || 11);
  const n = o.n === undefined ? 15 : o.n;
  const pts = [];
  const y0 = o.y0 === undefined ? 0.6 : o.y0;
  const amp = o.amp === undefined ? 0.09 : o.amp;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const x = U.lerp(-W * 0.06, W * 1.06, u);
    const y = H * (y0 + Math.sin(u * 3.1 + (o.ph || 0)) * amp - Math.sin(u * 7.3 + (o.ph || 0) * 2) * amp * 0.34 - u * (o.slope || 0) + (rnd() - 0.5) * 0.012);
    pts.push({ x: x, y: y });
  }
  return pts;
};

G.wall = function (ctx, pts, o) {
  o = o || {};
  const H = o.H || 900;
  const rnd = U.rng(o.seed || 5);
  const W0 = Math.max(2.5, H * (o.thick === undefined ? 0.045 : o.thick));
  const W1 = W0 * 0.74;
  const line = o.line || B.centerline(pts, 9, false, W0 * 0.05, o.seed || 3);
  const side = o.side || 1;
  const body = (o.body || "#141a26");
  const shade = (o.shade || "#0a0e16");
  const lit = (o.lit || "rgba(255,222,164,0.75)");
  const n = line.length;

  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const w = W0 * 0.5;
    const x = line[i].x + line[i].nx * w, y = line[i].y + line[i].ny * w;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  for (let i = n - 1; i >= 0; i--) {
    ctx.lineTo(line[i].x - line[i].nx * W1 * 0.5, line[i].y - line[i].ny * W1 * 0.5);
  }
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();

  const mh = W0 * (o.mh === undefined ? 0.44 : o.mh);
  const step = o.step || 5;
  ctx.fillStyle = shade;
  for (let i = 0; i < n - 1; i += step) {
    const p0 = line[i], p1 = line[Math.min(n - 1, i + 1)];
    if (Math.abs(p1.x - p0.x) < 0.3) continue;
    const bx = p0.x + p0.nx * (side * W0 * 0.5), by = p0.y + p0.ny * (side * W0 * 0.5);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + (p1.x - p0.x) * 0.55, by + (p1.y - p0.y) * 0.55);
    ctx.lineTo(bx + (p1.x - p0.x) * 0.42, by + (p1.y - p0.y) * 0.42 - mh);
    ctx.lineTo(bx + (p1.x - p0.x) * 0.1, by + (p1.y - p0.y) * 0.1 - mh);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = lit;
  ctx.lineWidth = o.rimW === undefined ? 1.6 : o.rimW;
  ctx.globalAlpha = o.rimA === undefined ? 0.85 : o.rimA;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const p = line[i];
    const x = p.x - p.nx * (side * W1 * 0.5), y = p.y - p.ny * (side * W1 * 0.5);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  if (o.masonry) {
    ctx.globalAlpha = o.masonryA === undefined ? 0.22 : o.masonryA;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    for (let i = 0; i < n; i += 2) {
      const p = line[i];
      for (let k = -1; k <= 1; k += 2) {
        const off = k * W0 * 0.25;
        ctx.beginPath();
        ctx.moveTo(p.x + p.nx * off, p.y + p.ny * off);
        ctx.lineTo(p.x + p.nx * off + p.ny * W0 * 0.6, p.y + p.ny * off - p.nx * W0 * 0.6);
        ctx.stroke();
      }
    }
  }

  if (o.detail !== false) {
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < n; i += 3) {
      const p = line[i];
      if (rnd() < 0.34) B.tuft(ctx, p.x + p.nx * side * W0 * 0.5, p.y + p.ny * side * W0 * 0.5, H * 0.016, { n: 3, ink: o.weed || "rgba(20,26,38,0.8)", w: 1, alpha: 0.5, spread: 1.4, rnd: rnd });
    }
  }
  ctx.restore();
  return line;
};

G.tower = function (ctx, x, y, s, o) {
  o = o || {};
  const w = s * (o.w === undefined ? 1.4 : o.w);
  const h = s * (o.h === undefined ? 1.5 : o.h);
  const lean = o.lean || 0;
  const body = o.body || "#131924";
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, y);
  ctx.lineTo(x + w * 0.5, y);
  ctx.lineTo(x + w * 0.42 + lean, y - h);
  ctx.lineTo(x - w * 0.42 + lean, y - h);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  const mh = h * 0.2;
  ctx.fillStyle = o.shade || "#0a0e16";
  const gaps = 4;
  for (let i = 0; i < gaps; i++) {
    const gx = x - w * 0.42 + lean + (i / gaps) * w * 0.84;
    ctx.fillRect(gx, y - h - mh, w * 0.11, mh);
  }
  if (o.arch !== false) {
    const aw = w * (o.archW === undefined ? 0.24 : o.archW), ah = h * 0.42;
    ctx.fillStyle = o.dark || "#070a10";
    ctx.beginPath();
    ctx.moveTo(x - aw * 0.5 + lean * 0.5, y);
    ctx.lineTo(x + aw * 0.5 + lean * 0.5, y);
    ctx.lineTo(x + aw * 0.5 + lean * 0.5, y - ah * 0.62);
    ctx.quadraticCurveTo(x + lean * 0.5, y - ah * 1.15, x - aw * 0.5 + lean * 0.5, y - ah * 0.62);
    ctx.closePath();
    ctx.fill();
  }
  if (o.win) {
    const ww = w * (o.winW === undefined ? 0.1 : o.winW), wh2 = h * (o.winH === undefined ? 0.16 : o.winH);
    ctx.fillStyle = o.winCol || "rgba(255,206,130,0.9)";
    ctx.fillRect(x - w * 0.11 + lean, y - h * 0.8, ww, wh2);
    ctx.fillRect(x + w * 0.15 + lean, y - h * 0.8, ww, wh2);
  }
  ctx.globalAlpha = o.rimA === undefined ? 0.7 : o.rimA;
  ctx.strokeStyle = o.lit || "rgba(255,224,170,0.85)";
  ctx.lineWidth = o.rimW === undefined ? 1.3 : o.rimW;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y);
  ctx.lineTo(x + w * 0.42 + lean, y - h);
  ctx.lineTo(x + w * 0.42 + lean, y - h - mh);
  ctx.stroke();
  ctx.restore();
  return G;
};

G.pagoda = function (ctx, x, y, s, o) {
  o = o || {};
  const tiers = o.tiers || 5;
  const body = o.body || "#121826";
  ctx.save();
  ctx.fillStyle = body;
  for (let i = 0; i < tiers; i++) {
    const tw = s * (1 - i * 0.13);
    const th = s * 0.34;
    const ty = y - i * th * 0.92;
    ctx.beginPath();
    ctx.moveTo(x - tw * 0.5, ty);
    ctx.lineTo(x + tw * 0.5, ty);
    ctx.lineTo(x + tw * 0.4, ty - th);
    ctx.lineTo(x - tw * 0.4, ty - th);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - tw * 0.78, ty);
    ctx.quadraticCurveTo(x - tw * 0.5, ty + th * 0.1, x - tw * 0.42, ty - th * 0.08);
    ctx.lineTo(x + tw * 0.42, ty - th * 0.08);
    ctx.quadraticCurveTo(x + tw * 0.5, ty + th * 0.1, x + tw * 0.78, ty);
    ctx.quadraticCurveTo(x, ty + th * 0.26, x - tw * 0.78, ty);
    ctx.closePath();
    ctx.fill();
  }
  const topY = y - (tiers - 1) * s * 0.313 - s * 0.34;
  B.stroke(ctx, [{ x: x, y: topY }, { x: x, y: topY - s * 0.5 }], { w0: s * 0.05, w1: s * 0.02, ink: body, profile: "taper", bristles: 0 });
  ctx.globalAlpha = o.rimA === undefined ? 0.6 : o.rimA;
  ctx.strokeStyle = o.lit || "rgba(255,222,168,0.8)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < tiers; i++) {
    const ty = y - i * s * 0.313;
    ctx.beginPath();
    ctx.moveTo(x + s * 0.3 * (1 - i * 0.13), ty);
    ctx.lineTo(x + s * 0.4 * (1 - i * 0.13), ty - s * 0.34);
    ctx.stroke();
  }
  ctx.restore();
  return G;
};

G.rocks = function (ctx, W, H, y, o) {
  o = o || {};
  const rnd = U.rng(o.seed || 3);
  const n = o.n === undefined ? 14 : o.n;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const x = rnd() * W;
    const r = H * (0.012 + rnd() * 0.05) * (o.scale || 1);
    G.rock(ctx, x, y + (rnd() - 0.5) * H * 0.02, r * (1.6 + rnd()), r, { seed: i * 3 + 1, ink: o.ink || "#0b1017", alpha: o.alpha === undefined ? 0.95 : o.alpha, rim: o.rim, rimW: 1 });
  }
  ctx.restore();
  return G;
};
})();
