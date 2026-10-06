(function () {
const TC = window.TC;
const U = TC.U;
const B = TC.Brush;
const S = TC.Sky;
const G = TC.Gen;
const C = TC.Cloud;
const E = TC.Engine;
const A = (TC.Acts = TC.Acts || {});

const ink0 = "#0a0e16", ink1 = "#111726", ink2 = "#18202f";
const gold = "#ffd9a0";

A.mk = function (o) {
  const a = {
    id: o.id, label: o.label, labelZh: o.labelZh, dur: o.dur, palette: o.palette,
    build: o.build, frame: o.frame, bg: null, _st: {},
  };
  a.st = function (k, v) { if (v === undefined) return a._st[k]; if (a._st[k] === undefined) a._st[k] = typeof v === "function" ? v() : v; return a._st[k]; };
  a.bake = function (W, H, draw) { const L = U.Layer(W, H, E.dpr); draw(L.ctx, W, H); return L; };
  return a;
};

B.tuftNear = function (ctx, W, pts) {
  const rnd = U.rng(41);
  for (let i = 0; i < pts.length; i += 2) {
    if (rnd() < 0.4) continue;
    const p = pts[i];
    B.tuft(ctx, p.x + (rnd() - 0.5) * 8, p.y + 3, 7 + rnd() * 8, { n: 4, ink: "rgba(10,14,22,0.75)", w: 1.1, alpha: 0.6, spread: 1.6, rnd: rnd });
  }
};

A.wallScene = function (g, W, H) {
  S.paint(g, W, H, [
    [0, "#040814"], [0.08, "#0a1526"], [0.17, "#152741"], [0.26, "#26405e"],
    [0.34, "#3e5872"], [0.41, "#64798e"], [0.47, "#93867c"], [0.52, "#c9a274"],
    [0.57, "#efc98f"], [0.63, "#fce3b4"], [0.72, "#f7d29c"],
  ]);
  S.milky(g, W, H, { y: H * 0.18, alpha: 0.05, seed: 5, color: "#8fa8cc" });
  S.stars(g, W, H, { n: 130, seed: 11, alpha: 0.38, cover: 0.2, pw: 1.2 });
  C.skyClouds(g, W, H, { seed: 44, n: 7, y0: H * 0.03, y1: H * 0.26, rmin: 130, rmax: 420, alpha: 0.15, color: "#93aed2", bias: 1.1 });
  const sunX = W * 0.71, sunY = H * 0.578, sunR = H * 0.052;
  S.disc(g, sunX, sunY, sunR, { core: "#fffdf6", halo: "#ffc887", haloR: 9, rays: 17, raySeed: 9, alpha: 1 });
  S.glare(g, sunX, sunY, W * 0.72, { alpha: 0.26, color: "#ffcf94", sq: 0.055 });
  C.skyClouds(g, W, H, { seed: 33, n: 7, y0: H * 0.3, y1: H * 0.5, rmin: 110, rmax: 400, alpha: 0.2, color: "#ffe4c2", bias: 1 });
  const bands = [
    { seed: 2.1, base: 0.452, amp: 0.028, sc: 2.6, near: "#7c8fa6", far: "#a9b8c9", bank: 0.4, thick: 20 },
    { seed: 7.7, base: 0.497, amp: 0.03, sc: 2.1, near: "#5c7089", far: "#8fa2b5", bank: 0.46, thick: 26 },
    { seed: 13.3, base: 0.548, amp: 0.033, sc: 1.75, near: "#405478", far: "#73889f", bank: 0.48, thick: 30, wall: true },
    { seed: 19.9, base: 0.614, amp: 0.035, sc: 1.45, near: "#26324c", far: "#516484", bank: 0.44, thick: 32 },
    { seed: 26.5, base: 0.688, amp: 0.038, sc: 1.2, near: "#131a29", far: "#35435a", bank: 0.4, thick: 34 },
    { seed: 31.1, base: 0.772, amp: 0.04, sc: 1.02, near: "#070b13", far: "#1b2334", bank: 0.36, thick: 36 },
  ];
  bands.forEach(function (b, i) {
    if (i > 0) {
      C.bank(g, W, b.base * H + H * 0.014, {
        seed: b.seed + 3, thick: b.thick, fade: 24, alpha: b.bank * 0.8, puffs: 30,
        rmin: 16, rmax: 58, wave: 0.28, color: i < 3 ? "#fff3e0" : "#e8eef7",
        spill: true, spillN: 5, spillH: H * 0.04,
      });
    }
    const p = G.profile(W, { h: H, seed: b.seed, base: b.base, amp: b.amp, detail: 0.05 - i * 0.006, scale: b.sc });
    G.fillUnder(g, W, H, p, {
      grad: [[0, b.far], [0.2, U.mixHex(b.far, b.near, 0.5)], [1, b.near]],
      rim: "rgba(255,238,200,0.95)", rimA: 0.85 - i * 0.1, rimW: 1.9 - i * 0.16,
    });
    G.hatch(g, W, H, b.base * H + H * 0.05, H, { n: 13, alpha: 0.05, seed: i * 5 + 1, color: "#000", len: 170 });
    G.crags(g, W, H * b.base, { seed: b.seed * 3, n: 24 + i * 2, ink: b.near, alpha: 0.5, hmin: 0.05 - i * 0.006 });
    for (let k = 0; k < 8; k++) {
      const x = W * (((k * 0.131 + i * 0.037) % 1));
      G.pine(g, x, b.base * H + H * 0.008, H * (0.026 + ((k * 13 + i * 7) % 5) * 0.005), {
        seed: k * 3 + i * 11 + 1, ink: U.shade(b.near, i > 2 ? 0.5 : 0.72), needles: false, detail: false,
        trunk: 0.05, spread: 0.5, limbs: 3, pads: 2,
      });
    }
    if (b.wall) {
      const wy = b.base - 0.012;
      const wp = G.wallPath(W, H, { seed: 8.2, n: 16, y0: wy, amp: b.amp * 0.8, ph: 1.1, slope: 0.034 });
      const line = G.wall(g, wp, {
        H: H, thick: 0.046, seed: 4.4, side: 1, body: "#1b2436", shade: "#0a0f1c",
        lit: "rgba(255,242,208,0.98)", rimA: 1, rimW: 2.4, masonry: true, masonryA: 0.34, step: 5,
        weed: "rgba(12,18,30,0.85)",
      });
      const towers = [0.1, 0.245, 0.385, 0.53, 0.675, 0.82, 0.955];
      for (let k = 0; k < towers.length; k++) {
        const ii = U.clamp(Math.round(towers[k] * (line.length - 1)), 0, line.length - 1);
        const p2 = line[ii];
        const pn = line[Math.min(line.length - 1, ii + 4)];
        G.tower(g, p2.x, p2.y - H * 0.008, H * 0.058, {
          w: 1.32, h: 1.72, body: "#192233", shade: "#080d18", lean: (pn.x - p2.x) * 0.5,
          lit: "rgba(255,246,216,0.98)", rimA: 0.95, rimW: 1.9, win: towers[k] > 0.14 && towers[k] < 0.92,
          winW: 0.075, winH: 0.13, archW: 0.2,
        });
      }
      B.tuftNear(g, W, line);
      C.bank(g, W, wy * H + H * 0.058, {
        seed: 71, thick: 22, fade: 22, alpha: 0.32, puffs: 26, rmin: 16, rmax: 62,
        wave: 0.3, color: "#fff7ea", spill: true, spillN: 7, spillH: H * 0.055,
      });
    }
  });
  C.streaks(g, W, H, H * 0.5, { seed: 6, n: 5, alpha: 0.16, color: "#ffe9cc", spread: 0.055 });
  B.haze(g, W, H, [
    [0, U.rgba("#ffcf94", 0.07)],
    [0.38, U.rgba("#ffcf94", 0.03)],
    [0.58, U.rgba("#33405a", 0.035)],
    [1, U.rgba("#05080f", 0.22)],
  ]);
  B.grain(g, W, H, { alpha: 0.025, cell: 2, seed: 3 });
  return { sunX: sunX, sunY: sunY, sunR: sunR };
};

A.fgPine = function (ctx, W, H, o) {
  o = o || {};
  const rnd = U.rng(o.seed || 17);
  const side = o.side || 1;
  const y0 = o.y === undefined ? 0.05 : o.y;
  const bx = side > 0 ? W * 1.03 : -W * 0.03;
  const by = H * y0;
  const ink = o.ink || "#04070c";
  B.stroke(ctx, [{ x: bx, y: by - H * 0.01 }, { x: bx - side * W * 0.1, y: by + H * 0.004 }, { x: bx - side * W * 0.26, y: by + H * 0.019 }], {
    w0: H * 0.019, w1: H * 0.007, ink: ink, profile: "taper", wobble: 2, step: 6, bristles: 0,
  });
  for (let i = 0; i < 6; i++) {
    const t = 0.06 + i * 0.19;
    const px = bx - side * W * 0.26 * t;
    const py = by + H * 0.019 * t + (rnd() - 0.5) * H * 0.022;
    const r = H * (0.022 + rnd() * 0.026) * (1 - t * 0.3);
    const g = ctx.createRadialGradient(px, py, 0, px, py, r * 2.9);
    g.addColorStop(0, U.rgba(ink, 0.8));
    g.addColorStop(0.38, U.rgba(ink, 0.36));
    g.addColorStop(0.62, U.rgba(ink, 0.1));
    g.addColorStop(0.82, U.rgba(ink, 0));
    g.addColorStop(1, U.rgba(ink, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(px, py, r * 2.7, r * 0.8, (rnd() - 0.5) * 0.6, 0, U.TAU);
    ctx.fill();
    B.tuft(ctx, px, py, r * 2.6, { n: 7, ink: ink, w: 1.2, alpha: 0.62, spread: 2.9, rnd: rnd });
    B.stroke(ctx, [{ x: px + side * r * 0.3, y: py + r * 0.2 }, { x: px - side * r * 1.4, y: py - r * 0.9 }, { x: px - side * r * 2.6, y: py - r * 1.5 }], {
      w0: H * 0.006, w1: H * 0.0025, ink: ink, profile: "taper", wobble: 1, step: 4, bristles: 0,
    });
  }
};

A.wall = A.mk({
  id: "wall", label: "THE GREAT WALL", labelZh: "\u4e07\u91cc\u957f\u57ce", dur: 33,
  build: function (ctx, W, H) {
    const a = A.wall;
    a.bg = a.bake(W, H, function (g) { A.wallScene(g, W, H); });
    for (let k = 0; k < 2; k++) {
      a["fg" + k] = a.bake(W, H, function (g) { A.fgPine(g, W, H, { seed: 11 + k * 7, side: k === 0 ? 1 : -1, y: k === 0 ? 0.13 : 0.08 }); });
    }
  },
  frame: function (ctx, T, l, t) {
    const W = E.W, H = E.H, a = A.wall;
    const p = t / a.dur;
    const dx = -W * 0.022 * U.st5(p), dy = H * 0.014 * U.st5(p) - H * 0.008;
    a.bg.blit(ctx, dx, dy, W * 1.04, H * 1.04);
    S.disc(ctx, W * 0.71 + dx * 0.7, H * 0.6 + dy * 0.7, H * (0.05 + Math.sin(t * 0.2) * 0.0008), { core: "#fffef8", halo: "#ffca80", haloR: 5.5, alpha: 0.5 });
    C.bank(ctx, W, H * 0.512 + Math.sin(t * 0.1) * H * 0.006, { seed: 91, thick: 26, fade: 30, alpha: 0.3, puffs: 16, rmin: 40, rmax: 130, wave: 0.26, color: "#fff3e2" });
    C.bank(ctx, W, H * 0.72 + Math.sin(t * 0.08 + 2) * H * 0.007, { seed: 93, thick: 30, fade: 34, alpha: 0.26, puffs: 14, rmin: 46, rmax: 150, wave: 0.24, color: "#f2f6fb" });
    C.streaks(ctx, W, H, H * 0.47 + Math.sin(t * 0.07) * H * 0.01, { seed: 5, n: 3, alpha: 0.2, color: "#ffe9cc", spread: 0.05 });
    G.birds(ctx, [
      { x: U.wrap(W * 0.5 + T * 12, -40, W + 40), y: H * 0.3 + Math.sin(T * 0.5) * H * 0.012, s: 7.5, flap: Math.sin(T * 5.6), a: 0.5 },
      { x: U.wrap(W * 0.5 + T * 12 + 32, -40, W + 40), y: H * 0.278 + Math.sin(T * 0.6 + 1) * H * 0.012, s: 6, flap: Math.sin(T * 6.4 + 1), a: 0.4 },
      { x: U.wrap(W * 0.5 + T * 12 + 62, -40, W + 40), y: H * 0.325 + Math.sin(T * 0.55 + 2) * H * 0.012, s: 5, flap: Math.sin(T * 7 + 2), a: 0.3 },
    ], { ink: "rgba(30,36,48,0.7)" });
    a.fg0.blit(ctx, dx * 2.4, dy * 2.4, W * 1.02, H * 1.02);
    a.fg1.blit(ctx, -dx * 2.4, dy * 2.4, W * 1.02, H * 1.02);
  },
});
A.intro = A.mk({
  id: "intro", label: "OPENING", labelZh: "\u5e8f\u7ae0", dur: 17,
  build: function (ctx, W, H) {
    const a = A.intro;
    a.bg = a.bake(W, H, function (g) {
      S.paint(g, W, H, [
        [0, "#04060f"], [0.16, "#080f1e"], [0.32, "#101c33"], [0.48, "#1d2e4b"],
        [0.6, "#2f4462"], [0.72, "#51637a"], [0.84, "#8e836f"], [0.94, "#c9a06a"], [1, "#e6bb80"],
      ]);
      S.milky(g, W, H, { y: H * 0.26, alpha: 0.06, seed: 21 });
      S.stars(g, W, H, { n: 170, seed: 5, alpha: 0.55, cover: 0.55, pw: 1.3 });
      S.disc(g, W * 0.74, H * 0.6, H * 0.036, { core: "#fdf7e8", halo: "#ffd7a0", haloR: 9, alpha: 0.9 });
      S.glare(g, W * 0.74, H * 0.62, W * 0.5, { alpha: 0.14, color: "#ffcf94", sq: 0.05 });
      C.skyClouds(g, W, H, { seed: 71, n: 11, y0: H * 0.18, y1: H * 0.56, rmin: 110, rmax: 380, alpha: 0.11, color: "#c6d8ee", bias: 0.85 });
      C.skyClouds(g, W, H, { seed: 84, n: 7, y0: H * 0.3, y1: H * 0.62, rmin: 150, rmax: 460, alpha: 0.07, color: "#e2ecf8", bias: 1.1 });
      const far = G.profile(W, { h: H, seed: 31.7, base: 0.6, amp: 0.038, detail: 0.045, scale: 1.5 });
      G.fillUnder(g, W, H, far, { grad: [[0, "#5b7290"], [0.3, "#3d5271"], [1, "#26364f"]], rim: "rgba(255,230,186,0.6)", rimA: 0.5, rimW: 1.4 });
      G.crags(g, W, H * 0.6, { seed: 91, n: 16, ink: "#3d5271", alpha: 0.5 });
      C.bank(g, W, H * 0.628, { seed: 3, thick: 44, fade: 52, alpha: 0.5, puffs: 34, rmin: 30, rmax: 110, wave: 0.26, color: "#eef4fb", spill: true, spillN: 8, spillH: H * 0.06 });
      const mid = G.profile(W, { h: H, seed: 44.3, base: 0.74, amp: 0.04, detail: 0.04, scale: 1.25 });
      G.fillUnder(g, W, H, mid, { grad: [[0, "#2b3a54"], [0.35, "#1b2536"], [1, "#0e1522"]], rim: "rgba(255,230,186,0.42)", rimA: 0.36, rimW: 1.3 });
      C.bank(g, W, H * 0.772, { seed: 9, thick: 40, fade: 46, alpha: 0.44, puffs: 30, rmin: 34, rmax: 120, wave: 0.24, color: "#f2f6fb", spill: true, spillN: 7, spillH: H * 0.05 });
      const near = G.profile(W, { h: H, seed: 57.1, base: 0.9, amp: 0.035, detail: 0.03, scale: 1 });
      G.fillUnder(g, W, H, near, { grad: [[0, "#131b2a"], [1, "#04070c"]] });
      G.pine(g, W * 0.09, H * 0.99, H * 0.19, { seed: 5, ink: "#04070c", needles: false, detail: false });
      G.pine(g, W * 0.94, H * 1.0, H * 0.15, { seed: 8, ink: "#04070c", needles: false, detail: false });
      B.haze(g, W, H, [[0, U.rgba("#8fa8c8", 0.09)], [0.55, U.rgba("#c9a06a", 0.03)], [1, U.rgba("#04070c", 0.42)]]);
      B.grain(g, W, H, { alpha: 0.024, cell: 2, seed: 8 });
    });
  },
  frame: function (ctx, T, l, t) {
    const W = E.W, H = E.H, a = A.intro;
    const push = U.easeInOut(U.sat(t / a.dur));
    const dx = -W * 0.035 * push, dy = H * 0.014 * (1 - push) - H * 0.012;
    a.bg.blit(ctx, dx, dy, W * 1.08, H * 1.05);
    C.bank(ctx, W, H * (0.63 + Math.sin(t * 0.06) * 0.01), { seed: 51, thick: 40, fade: 54, alpha: 0.3, puffs: 22, rmin: 60, rmax: 200, wave: 0.22, color: "#e8f0f9" });
    C.bank(ctx, W, H * (0.775 + Math.sin(t * 0.05 + 2) * 0.01), { seed: 55, thick: 44, fade: 58, alpha: 0.26, puffs: 20, rmin: 70, rmax: 220, wave: 0.2, color: "#dfe8f4" });
  },
});

B.wispNear = function (ctx, W, H, y, o) {
  o = o || {};
  const rnd = U.rng(o.seed || 4);
  for (let i = 0; i < (o.n || 5); i++) {
    const px = rnd() * W, py = H * (y + (rnd() - 0.5) * 0.1);
    TC.Sky.wisp(ctx, px, py, W * (0.2 + rnd() * 0.4), { seed: i * 3 + 1, alpha: o.alpha === undefined ? 0.15 : o.alpha, color: o.color || "#e6eef8", w: 20, w1: 4, n: 7, dir: rnd() < 0.5 ? 1 : -1 });
  }
};

E.register(A.intro);
E.register(A.wall);
})();