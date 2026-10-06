(function () {
const TC = window.TC;
const U = TC.U;
const B = TC.Brush;
const G = TC.Gen;

G.karst = function (ctx, W, H, o) {
  o = o || {};
  const rnd = U.rng(o.seed || 12);
  const n = o.n === undefined ? 7 : o.n;
  const baseY = o.baseY === undefined ? H * 0.62 : o.baseY;
  const ink = o.ink || "#0f1620";
  const cols = [];
  for (let i = 0; i < n; i++) {
    const cx = W * ((i + 0.5 + (rnd() - 0.5) * 0.7) / n);
    const hh = H * ((o.hmin === undefined ? 0.16 : o.hmin) + rnd() * (o.hmax === undefined ? 0.34 : o.hmax));
    const w0 = hh * ((o.ratio === undefined ? 0.42 : o.ratio) * (0.62 + rnd() * 0.8));
    const surge = (rnd() - 0.5) * hh * 0.2;
    const pts = [];
    const sides = 18;
    const shape = (t, sd) => {
      const flut = 1 + (U.fbm1(t * 6.5 + i * 3.3 + sd, 4, i + sd * 0.1) - 0.5) * 0.2;
      const taper = o.tower ? (0.44 + Math.pow(t, 0.62) * 0.72) : (0.24 + Math.pow(t, 0.46) * 0.92);
      return w0 * taper * flut;
    };
    for (let s = 0; s <= sides; s++) {
      const t = s / sides;
      const yy = baseY - hh * (1 - t) + (t > 0.9 ? (t - 0.9) * hh * 0.9 : 0);
      pts.push({ x: cx - shape(t, 0) * 0.5 + surge * (1 - t), y: yy });
    }
    for (let s = sides; s >= 0; s--) {
      const t = s / sides;
      const yy = baseY - hh * (1 - t) + (t > 0.9 ? (t - 0.9) * hh * 0.9 : 0);
      pts.push({ x: cx + shape(t, 40) * 0.5 + surge * (1 - t), y: yy });
    }
    ctx.save();
    ctx.beginPath();
    U.poly(ctx, pts, true);
    ctx.fillStyle = o.grad ? U.vgrad(ctx, 0, baseY - hh, 0, baseY + hh * 0.1, o.grad) : ink;
    ctx.fill();
    ctx.globalAlpha = o.fluteA === undefined ? 0.2 : o.fluteA;
    ctx.strokeStyle = o.flute || "#000";
    ctx.lineWidth = o.fluteW || 1;
    for (let k = 0; k < 7; k++) {
      const off = (k / 6 - 0.5) * w0 * 0.72;
      ctx.beginPath();
      ctx.moveTo(cx + off, baseY - hh * 0.1);
      ctx.quadraticCurveTo(cx + off * 1.1, baseY - hh * 0.55, cx + off * 0.55 + surge * 0.6, baseY - hh * 0.93);
      ctx.stroke();
    }
    if (o.rim) {
      ctx.globalAlpha = o.rimA === undefined ? 0.5 : o.rimA;
      ctx.strokeStyle = o.rim;
      ctx.lineWidth = o.rimW || 1.4;
      ctx.beginPath();
      for (let s = 0; s <= sides; s++) {
        const t = s / sides;
        const yy = baseY - hh * (1 - t);
        const ww = shape(t, 20);
        if (s === 0) ctx.moveTo(cx + ww * 0.5, yy); else ctx.lineTo(cx + ww * 0.5 + surge * (1 - t) * 0.4, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
    cols.push({ x: cx, top: baseY - hh, w: w0, h: hh });
  }
  return cols;
};

G.dunes = function (ctx, W, H, o) {
  o = o || {};
  const rows = o.rows === undefined ? 5 : o.rows;
  const rnd = U.rng(o.seed || 8);
  const y0 = o.y0 === undefined ? H * 0.52 : o.y0;
  const y1 = o.y1 === undefined ? H * 1.02 : o.y1;
  for (let i = 0; i < rows; i++) {
    const t = i / (rows - 1 || 1);
    const y = U.lerp(y0, y1, Math.pow(t, 0.82));
    const amp = H * (0.02 + t * 0.05);
    const ph = rnd() * 6;
    const pts = [];
    const seg = 9;
    for (let s = 0; s <= seg; s++) {
      const u = s / seg;
      pts.push({ x: u * W, y: y + Math.sin(u * U.TAU * (0.55 + t * 0.5) + ph) * amp + Math.sin(u * U.TAU * 1.9 + ph * 2) * amp * 0.24 });
    }
    const ink = U.mixHex(o.far || "#e0b478", o.near || "#3a2a1e", Math.pow(t, 0.7));
    const p = { pts: pts };
    G.fillUnder(ctx, W, H, p, { grad: [[0, U.mixHex(ink, "#ffffff", 0.3)], [0.3, ink], [1, U.shade(ink, 0.72)]] });
    ctx.save();
    ctx.globalAlpha = 0.34 - t * 0.12;
    ctx.strokeStyle = o.crest || "rgba(255,238,200,0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let s = 0; s <= seg; s++) { if (s === 0) ctx.moveTo(pts[s].x, pts[s].y); else ctx.lineTo(pts[s].x, pts[s].y); }
    ctx.stroke();
    ctx.restore();
  }
  return G;
};

G.camel = function (ctx, x, y, s, o) {
  o = o || {};
  const ph = o.phase || 0;
  const ink = o.ink || "#1a1410";
  const step = Math.sin(ph);
  const step2 = Math.sin(ph + Math.PI);
  const bob = Math.abs(Math.sin(ph * 2)) * s * 0.03;
  const body = "#0f0b09";
  ctx.save();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(x, y - s * 0.52 - bob, s * 0.3, s * 0.15, 0, 0, U.TAU);
  ctx.fill();
  const humps = o.humps === undefined ? 2 : o.humps;
  for (let i = 0; i < humps; i++) {
    const hx = x + (i - (humps - 1) / 2) * s * 0.2;
    ctx.beginPath();
    ctx.moveTo(hx - s * 0.1, y - s * 0.6 - bob);
    ctx.quadraticCurveTo(hx, y - s * 0.82 - bob, hx + s * 0.1, y - s * 0.6 - bob);
    ctx.closePath();
    ctx.fill();
  }
  B.stroke(ctx, [{ x: x + s * 0.28, y: y - s * 0.56 - bob }, { x: x + s * 0.4, y: y - s * 0.7 - bob }, { x: x + s * 0.44, y: y - s * 0.95 - bob }], { w0: s * 0.055, w1: s * 0.04, ink: body, bristles: 0 });
  ctx.beginPath();
  ctx.ellipse(x + s * 0.5, y - s * 1.0 - bob, s * 0.075, s * 0.05, -0.3, 0, U.TAU);
  ctx.fill();
  B.stroke(ctx, [{ x: x + s * 0.5, y: y - s * 0.99 - bob }, { x: x + s * 0.58, y: y - s * 0.95 - bob }], { w0: s * 0.03, w1: s * 0.02, ink: body, bristles: 0 });
  ctx.beginPath();
  ctx.ellipse(x + s * 0.3, y - s * 1.02 - bob, s * 0.03, s * 0.026, 0, 0, U.TAU);
  ctx.fill();
  const legs = [[0.16, step], [-0.14, step2], [0.24, step2], [-0.22, step]];
  for (let i = 0; i < legs.length; i++) {
    const lx = x + legs[i][0] * s;
    const sw = legs[i][1] * s * 0.1;
    B.stroke(ctx, [{ x: lx, y: y - s * 0.46 - bob }, { x: lx + sw * 0.4, y: y - s * 0.24 }, { x: lx + sw, y: y }], { w0: s * 0.042, w1: s * 0.028, ink: body, bristles: 0, profile: "flat" });
  }
  B.stroke(ctx, [{ x: x - s * 0.3, y: y - s * 0.58 - bob }, { x: x - s * 0.4, y: y - s * 0.42 - bob }], { w0: s * 0.022, w1: s * 0.012, ink: body, bristles: 0 });
  ctx.restore();
  return G;
};

G.caravan = function (ctx, W, H, y, n, s, o) {
  o = o || {};
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = o.x0 === undefined ? W * 0.2 : o.x0;
    const px = x + i * s * (o.gap === undefined ? 2.5 : o.gap);
    out.push({ x: px, y: y + (i % 2) * s * 0.012 });
  }
  if (o.rope !== false) {
    ctx.save();
    ctx.strokeStyle = o.ink || "#161009";
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = Math.max(0.8, s * 0.02);
    for (let i = 0; i < out.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(out[i].x - s * 0.3, out[i].y - s * (0.5 + Math.abs(Math.sin((o.phase || 0) + i)) * 0.02));
      ctx.quadraticCurveTo((out[i].x + out[i + 1].x) / 2, out[i].y - s * 0.36, out[i + 1].x - s * 0.3, out[i + 1].y - s * 0.52);
      ctx.stroke();
    }
    ctx.restore();
  }
  return out;
};

G.rafter = function (ctx, x, y, s, o) {
  o = o || {};
  const ink = o.ink || "#12161e";
  const pole = o.pole || 0;
  ctx.save();
  ctx.fillStyle = ink;
  U.roundedPath(ctx, x - s * 0.5, y - s * 0.075, s, s * 0.15, s * 0.05);
  ctx.fill();
  for (let i = -3; i <= 3; i++) {
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = o.line || "#2a3240";
    ctx.lineWidth = Math.max(0.6, s * 0.01);
    ctx.beginPath();
    ctx.moveTo(x + i * s * 0.13, y - s * 0.075);
    ctx.lineTo(x + i * s * 0.13, y + s * 0.072);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const man = o.man === undefined ? true : o.man;
  if (man) {
    const mx = x + s * 0.06, my = y - s * 0.08;
    ctx.beginPath();
    ctx.moveTo(mx - s * 0.055, my);
    ctx.lineTo(mx + s * 0.055, my);
    ctx.lineTo(mx + s * 0.04, my - s * 0.14);
    ctx.lineTo(mx - s * 0.04, my - s * 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(mx, my - s * 0.185, s * 0.038, s * 0.055, 0.1, 0, U.TAU);
    ctx.fill();
    const hatW = s * 0.11;
    ctx.beginPath();
    ctx.moveTo(mx - hatW, my - s * 0.225);
    ctx.lineTo(mx + hatW, my - s * 0.225);
    ctx.lineTo(mx, my - s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(mx - hatW * 1.24, my - s * 0.225, hatW * 0.4, hatW * 0.11, 0, 0, U.TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(mx + hatW * 1.24, my - s * 0.225, hatW * 0.4, hatW * 0.11, 0, 0, U.TAU);
    ctx.fill();
    if (pole > 0) {
      B.stroke(ctx, [{ x: mx + s * 0.02, y: my - s * 0.2 }, { x: mx + s * 0.34, y: my - s * 0.44 - pole * s * 0.24 }], { w0: s * 0.022, w1: s * 0.008, ink: ink, bristles: 0, profile: "taper" });
    } else {
      B.stroke(ctx, [{ x: mx + s * 0.16, y: my - s * 0.26 }, { x: mx + s * 0.02, y: my - s * 0.72 }], { w0: s * 0.02, w1: s * 0.01, ink: ink, bristles: 0, profile: "taper" });
    }
  }
  const birds = o.birds === undefined ? 1 : o.birds;
  for (let i = 0; i < birds; i++) {
    const bx = x - s * 0.34 - i * s * 0.14;
    const by = y - s * 0.1;
    ctx.beginPath();
    ctx.ellipse(bx, by, s * 0.055, s * 0.032, -0.25, 0, U.TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx + s * 0.03, by - s * 0.02);
    ctx.lineTo(bx + s * 0.1, by - s * 0.075);
    ctx.lineTo(bx + s * 0.055, by - s * 0.005);
    ctx.closePath();
    ctx.fill();
    B.stroke(ctx, [{ x: bx - s * 0.03, y: by - s * 0.02 }, { x: bx - s * 0.04, y: by - s * 0.115 }], { w0: s * 0.013, w1: s * 0.008, ink: ink, bristles: 0 });
  }
  ctx.restore();
  return G;
};

G.lantern = function (ctx, x, y, s, o) {
  o = o || {};
  const a = o.alpha === undefined ? 1 : o.alpha;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const g = ctx.createRadialGradient(x, y, 0, x, y, s * (o.glow === undefined ? 4 : o.glow));
  g.addColorStop(0, U.rgba(o.color || "#ffb45e", 0.6 * a));
  g.addColorStop(0.28, U.rgba(o.color || "#ffb45e", 0.24 * a));
  g.addColorStop(1, U.rgba(o.color || "#ffb45e", 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, s * (o.glow === undefined ? 4 : o.glow), 0, U.TAU); ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = o.core || "#ffe6bd";
  ctx.globalAlpha = a;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.5, s * 0.62, 0, 0, U.TAU);
  ctx.fill();
  ctx.restore();
  return G;
};

G.koi = function (ctx, x, y, len, ang, o) {
  o = o || {};
  const ph = o.phase || 0;
  const body = o.body || "#f6f4ea";
  const patch = o.patch || "#e2622a";
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = o.alpha === undefined ? 0.95 : o.alpha;
  const spine = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    spine.push({ x: -len * t, y: Math.sin(ph - t * 3.1) * len * 0.085 * t });
  }
  const tail = spine[n];
  const wave = Math.sin(ph - 3.4);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(spine[0].x, spine[0].y);
  for (let i = 1; i <= n; i++) {
    const w = len * 0.135 * Math.sin(Math.PI * Math.pow(i / n, 0.7)) + len * 0.004;
    ctx.lineTo(spine[i].x, spine[i].y - w);
  }
  for (let i = n; i >= 0; i--) {
    const w = len * 0.135 * Math.sin(Math.PI * Math.pow(i / n, 0.7)) + len * 0.004;
    ctx.lineTo(spine[i].x, spine[i].y + w);
  }
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(tail.x + len * 0.03, tail.y);
  ctx.quadraticCurveTo(tail.x - len * 0.14, tail.y - len * 0.1 + wave * len * 0.16, tail.x - len * 0.24, tail.y - len * 0.15 + wave * len * 0.26);
  ctx.quadraticCurveTo(tail.x - len * 0.13, tail.y + wave * len * 0.2, tail.x + len * 0.03, tail.y);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(tail.x + len * 0.03, tail.y);
  ctx.quadraticCurveTo(tail.x - len * 0.14, tail.y + len * 0.1 + wave * len * 0.16, tail.x - len * 0.24, tail.y + len * 0.15 + wave * len * 0.26);
  ctx.quadraticCurveTo(tail.x - len * 0.13, tail.y + wave * len * 0.2, tail.x + len * 0.03, tail.y);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-len * 0.6, -len * 0.13, len * 0.1, len * 0.045, 0.35, 0, U.TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-len * 0.6, len * 0.13, len * 0.1, len * 0.045, -0.35, 0, U.TAU);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(spine[0].x, spine[0].y);
  for (let i = 1; i <= n; i++) {
    const w = len * 0.135 * Math.sin(Math.PI * Math.pow(i / n, 0.7)) + len * 0.004;
    ctx.lineTo(spine[i].x, spine[i].y - w);
  }
  for (let i = n; i >= 0; i--) {
    const w = len * 0.135 * Math.sin(Math.PI * Math.pow(i / n, 0.7)) + len * 0.004;
    ctx.lineTo(spine[i].x, spine[i].y + w);
  }
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = patch;
  const rk = U.rng(o.seed || 7);
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.ellipse(-len * (0.14 + k * 0.22), (rk() - 0.5) * len * 0.1, len * (0.07 + rk() * 0.04), len * (0.05 + rk() * 0.03), rk(), 0, U.TAU);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = "#1c1c1c";
  ctx.beginPath();
  ctx.arc(-len * 0.06, -len * 0.055, len * 0.017, 0, U.TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-len * 0.06, len * 0.055, len * 0.017, 0, U.TAU);
  ctx.fill();
  ctx.restore();
  return G;
};

G.willow = function (ctx, x, y, len, o) {
  o = o || {};
  const rnd = U.rng(o.seed || 6);
  const strands = o.n === undefined ? 12 : o.n;
  const ink = o.ink || "#20301f";
  B.stroke(ctx, [{ x: x, y: y }, { x: x - len * 0.12, y: y - len * 0.16 }, { x: x - len * 0.3, y: y - len * 0.22 }], { w0: len * 0.045, w1: len * 0.016, ink: ink, profile: "taper", bristles: 2, wobble: 2 });
  for (let i = 0; i < strands; i++) {
    const t = i / strands;
    const sx = x - len * (0.04 + t * 0.34) + (rnd() - 0.5) * len * 0.05;
    const sy = y - len * (0.2 + Math.sin(t * 2.4) * 0.03);
    const L = len * (0.24 + rnd() * 0.4);
    const bend = (rnd() - 0.5) * len * 0.1;
    const pts = [];
    for (let k = 0; k <= 4; k++) {
      const tt = k / 4;
      pts.push({ x: sx + bend * tt * tt + Math.sin(tt * 3) * len * 0.02, y: sy + L * tt });
    }
    B.stroke(ctx, pts, { w0: len * 0.016, w1: len * 0.005, ink: ink, alpha: 0.6 + rnd() * 0.4, profile: "taper", bristles: 2, wobble: 0.6 });
    for (let k = 1; k < 4; k++) {
      const tt = k / 4;
      const px = sx + bend * tt * tt, py = sy + L * tt;
      const dir = rnd() < 0.5 ? -1 : 1;
      ctx.save();
      ctx.globalAlpha = (0.35 + rnd() * 0.4) * 0.9;
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + dir * len * 0.03, py + len * 0.008, px + dir * len * 0.062, py + len * 0.024);
      ctx.quadraticCurveTo(px + dir * len * 0.03, py + len * 0.024, px, py);
      ctx.fill();
      ctx.restore();
    }
  }
  return G;
};

G.lotus = function (ctx, x, y, r, o) {
  o = o || {};
  const rnd = U.rng(o.seed || 3);
  ctx.save();
  ctx.fillStyle = o.leaf || "#1d3323";
  for (let i = 0; i < (o.leaves === undefined ? 3 : o.leaves); i++) {
    const px = x + (rnd() - 0.5) * r * 3.2;
    const py = y + (rnd() - 0.5) * r * 1.6;
    ctx.globalAlpha = 0.5 + rnd() * 0.4;
    ctx.beginPath();
    ctx.ellipse(px, py, r * (0.7 + rnd() * 0.6), r * (0.34 + rnd() * 0.24), (rnd() - 0.5) * 0.5, 0, U.TAU);
    ctx.fill();
  }
  const flowers = o.flowers === undefined ? 2 : o.flowers;
  ctx.fillStyle = o.flower || "#f6dfe8";
  for (let i = 0; i < flowers; i++) {
    const px = x + (rnd() - 0.5) * r * 2.6;
    const py = y - r * (0.3 + rnd() * 0.5);
    ctx.globalAlpha = 0.85;
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + (k / 5 - 0.5) * 1.7;
      ctx.beginPath();
      ctx.ellipse(px + Math.cos(a) * r * 0.24, py + Math.sin(a) * r * 0.3, r * 0.1, r * 0.24, a + Math.PI / 2, 0, U.TAU);
      ctx.fill();
    }
  }
  ctx.restore();
  return G;
};

G.petal = function (ctx, x, y, r, ang, o) {
  o = o || {};
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = o.color || "#f7dbe4";
  ctx.globalAlpha = o.alpha === undefined ? 0.85 : o.alpha;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.52, 0, 0, U.TAU);
  ctx.fill();
  ctx.restore();
  return G;
};

G.tileRoof = function (ctx, x, y, w, o) {
  o = o || {};
  const h = w * (o.rise === undefined ? 0.22 : o.rise);
  const ink = o.ink || "#161d28";
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - w * 0.56, y);
  ctx.quadraticCurveTo(x - w * 0.2, y - h * 1.16, x, y - h * 1.2);
  ctx.quadraticCurveTo(x + w * 0.2, y - h * 1.16, x + w * 0.56, y);
  ctx.quadraticCurveTo(x, y + h * 0.34, x - w * 0.56, y);
  ctx.closePath();
  ctx.fillStyle = ink;
  ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = o.line || "#3a4658";
  ctx.lineWidth = Math.max(0.6, w * 0.006);
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + (i / 4) * w * 0.5, y - h * (0.62 - Math.abs(i) * 0.06));
    ctx.lineTo(x + (i / 4) * w * 0.56, y + h * 0.06);
    ctx.stroke();
  }
  ctx.restore();
  return G;
};

G.moonGate = function (ctx, x, y, r, o) {
  o = o || {};
  const wall = o.wall || "#e9e4d8";
  const th = o.thick || r * 0.34;
  const y1 = o.bottom === undefined ? y + r * 2.4 : o.bottom;
  ctx.save();
  ctx.fillStyle = wall;
  ctx.fillRect(x - th * 1.5, y - r - th * 1.7, th * 3 + r * 4.6, y1 - y + r + th * 1.7);
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, U.TAU);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = o.edgeA === undefined ? 0.55 : o.edgeA;
  ctx.strokeStyle = o.edge || "#b9b2a2";
  ctx.lineWidth = o.edgeW || r * 0.055;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.03, 0, U.TAU);
  ctx.stroke();
  ctx.restore();
  return G;
};

G.lattice = function (ctx, x, y, w, h, o) {
  o = o || {};
  const cols = o.cols === undefined ? 5 : o.cols;
  ctx.save();
  ctx.strokeStyle = o.ink || "#6f6a5e";
  ctx.lineWidth = o.w === undefined ? 1.4 : o.w;
  ctx.globalAlpha = o.alpha === undefined ? 0.6 : o.alpha;
  for (let i = 0; i <= cols; i++) {
    const px = x + (i / cols) * w;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px + w * 0.18, y + h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px - w * 0.18, y + h);
    ctx.stroke();
  }
  ctx.globalAlpha *= 1.4;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
  return G;
};

G.zigBridge = function (ctx, x, y, w, o) {
  o = o || {};
  const spans = o.spans === undefined ? 5 : o.spans;
  const ink = o.ink || "#cfc7b6";
  ctx.save();
  for (let i = 0; i < spans; i++) {
    const t = i / spans;
    const bx = x + t * w;
    const by = y + Math.sin(t * Math.PI) * -(o.arch === undefined ? w * 0.06 : o.arch) + (i % 2) * o.jog;
    ctx.fillStyle = ink;
    ctx.beginPath();
    U.roundedPath(ctx, bx, by, w / spans + w * 0.01, o.h === undefined ? 10 : o.h, 2);
    ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#8c8574";
    ctx.beginPath();
    U.roundedPath(ctx, bx, by + (o.h === undefined ? 10 : o.h) - 2, w / spans + w * 0.01, 4, 1);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  return G;
};
})();