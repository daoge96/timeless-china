(function () {
const TC = window.TC;
const U = TC.U;
const B = TC.Brush;
const S = TC.Sky;
const G = TC.Gen;
const C = TC.Cloud;
const E = TC.Engine;
const A = (TC.Acts = TC.Acts || {});

A.huangshanScene = function (g, W, H) {
  S.paint(g, W, H, [
    [0, "#0a1526"], [0.1, "#152a44"], [0.22, "#2c4a68"], [0.34, "#57738c"],
    [0.44, "#93a6b6"], [0.54, "#c3c9cd"], [0.64, "#e8e0d4"], [0.74, "#f6ead6"], [1, "#dfe3e8"],
  ]);
  S.milky(g, W, H, { y: H * 0.2, alpha: 0.06, seed: 15, color: "#a9c2e0" });
  const glowX = W * 0.78, glowY = H * 0.3;
  S.disc(g, glowX, glowY, H * 0.05, { core: "#fffdf8", halo: "#ffe6bc", haloR: 8, rays: 13, raySeed: 4, alpha: 0.62 });
  S.glare(g, glowX, glowY, W * 0.6, { alpha: 0.14, color: "#ffe9cc", sq: 0.2 });
  C.skyClouds(g, W, H, { seed: 61, n: 8, y0: H * 0.04, y1: H * 0.3, rmin: 130, rmax: 420, alpha: 0.12, color: "#b9cde4", bias: 1 });
  const planes = [
    { seed: 3.9, baseY: 0.6, ink: "#8fa3b8", n: 9, hmin: 0.14, hmax: 0.22, bank: 0.46, bankY: 0.64 },
    { seed: 8.3, baseY: 0.7, ink: "#5b7288", n: 7, hmin: 0.12, hmax: 0.2, bank: 0.5, bankY: 0.74 },
    { seed: 14.7, baseY: 0.83, ink: "#33475f", n: 6, hmin: 0.14, hmax: 0.24, bank: 0.52, bankY: 0.86 },
    { seed: 21.1, baseY: 1.06, ink: "#0d141f", n: 5, hmin: 0.16, hmax: 0.28, bank: 0.44, bankY: 0.95 },
  ];
  planes.forEach(function (p, i) {
    G.karst(g, W, H, {
      seed: p.seed, n: p.n, baseY: H * p.baseY, hmin: p.hmin, hmax: p.hmax, ratio: 0.42, tower: true,
      grad: [[0, U.mixHex(p.ink, "#ffffff", 0.44)], [0.14, U.mixHex(p.ink, "#ffffff", 0.14)], [0.5, U.shade(p.ink, 0.94)], [1, U.shade(p.ink, 0.5)]],
      flute: "#000", fluteA: 0.3 - i * 0.04, rim: "rgba(255,248,232,0.95)", rimA: 0.5 - i * 0.09, rimW: 1.6,
    });
    if (i < 3) {
      C.bank(g, W, H * p.bankY, {
        seed: 30 + i * 9, thick: 44 - i * 6, fade: 40, alpha: p.bank * 0.86, puffs: 30,
        rmin: 20, rmax: 78, wave: 0.3, color: "#f4f8fc", spill: true, spillN: 7, spillH: H * 0.07,
      });
    }
  });
  G.rock(g, W * 0.135, H * 0.775, W * 0.15, H * 0.05, { seed: 5, ink: "#101825", rim: "rgba(255,240,214,0.5)", rimW: 1.2 });
  G.pine(g, W * 0.115, H * 0.775, H * 0.2, { seed: 9, ink: "#080c14", needles: true, spread: 0.72, limbs: 5, trunk: 0.055, detail: true });
  G.pine(g, W * 0.2, H * 0.79, H * 0.13, { seed: 13, ink: "#0a0f18", needles: true, spread: 0.6, limbs: 4, trunk: 0.05 });
  G.rock(g, W * 0.88, H * 0.83, W * 0.11, H * 0.04, { seed: 17, ink: "#0c121c" });
  G.pine(g, W * 0.87, H * 0.83, H * 0.14, { seed: 21, ink: "#080c14", needles: true, spread: 0.65, limbs: 4 });
  const stair = [];
  for (let k = 0; k <= 14; k++) {
    const t = k / 14;
    stair.push({ x: W * (0.52 + t * 0.12 + Math.sin(t * 3) * 0.02), y: H * (0.58 + t * 0.3) });
  }
  B.stroke(g, stair, { w0: H * 0.005, w1: H * 0.008, ink: "rgba(230,238,246,0.5)", profile: "flat", bristles: 0 });
  C.streaks(g, W, H, H * 0.4, { seed: 9, n: 6, alpha: 0.16, color: "#ffffff", spread: 0.16 });
  B.haze(g, W, H, [[0, U.rgba("#cfe0f2", 0.08)], [0.4, U.rgba("#ffffff", 0.04)], [1, U.rgba("#c8d2de", 0.16)]]);
  B.grain(g, W, H, { alpha: 0.024, cell: 2, seed: 12 });
};

A.huangshan = A.mk({
  id: "huangshan", label: "YELLOW MOUNTAINS", labelZh: "\u9ec4\u5c71", dur: 30,
  build: function (ctx, W, H) {
    const a = A.huangshan;
    a.bg = a.bake(W, H, function (g) { A.huangshanScene(g, W, H); });
    a.fg = a.bake(W, H, function (g) {
      G.rock(g, W * 0.05, H * 1.04, W * 0.34, H * 0.1, { seed: 31, ink: "#060a11" });
      G.pine(g, W * 0.045, H * 1.02, H * 0.3, { seed: 41, ink: "#04070c", needles: true, spread: 0.85, limbs: 5, trunk: 0.06 });
      G.pine(g, W * 0.16, H * 1.03, H * 0.16, { seed: 43, ink: "#04070c", needles: true, spread: 0.7, limbs: 4 });
    });
  },
  frame: function (ctx, T, l, t) {
    const W = E.W, H = E.H, a = A.huangshan;
    const p = t / a.dur;
    const dx = -W * 0.03 * U.st5(p), dy = H * 0.02 * U.st5(p) - H * 0.012;
    a.bg.blit(ctx, dx, dy, W * 1.06, H * 1.05);
    C.bank(ctx, W, H * (0.63 + Math.sin(t * 0.055) * 0.01), { seed: 121, thick: 32, fade: 36, alpha: 0.38, puffs: 26, rmin: 42, rmax: 150, wave: 0.26, color: "#ffffff", spill: true, spillN: 8, spillH: H * 0.09 });
    C.bank(ctx, W, H * (0.745 + Math.sin(t * 0.045 + 1.7) * 0.012), { seed: 127, thick: 38, fade: 42, alpha: 0.36, puffs: 24, rmin: 52, rmax: 180, wave: 0.22, color: "#f0f5fb", spill: true, spillN: 8, spillH: H * 0.1 });
    C.bank(ctx, W, H * (0.87 + Math.sin(t * 0.04 + 3.1) * 0.01), { seed: 131, thick: 40, fade: 44, alpha: 0.32, puffs: 22, rmin: 62, rmax: 200, wave: 0.2, color: "#e6eef8" });
    C.streaks(ctx, W, H, H * 0.5 + Math.sin(t * 0.06) * H * 0.02, { seed: 3, n: 4, alpha: 0.2, color: "#ffffff", spread: 0.1 });
    G.birds(ctx, [
      { x: U.wrap(W * 0.3 + T * 9, -40, W + 40), y: H * 0.24 + Math.sin(T * 0.45) * H * 0.01, s: 6.5, flap: Math.sin(T * 5.4), a: 0.42 },
      { x: U.wrap(W * 0.3 + T * 9 + 26, -40, W + 40), y: H * 0.222 + Math.sin(T * 0.55 + 1) * H * 0.01, s: 5, flap: Math.sin(T * 6.2 + 1), a: 0.32 },
    ], { ink: "rgba(40,54,74,0.7)" });
    a.fg.blit(ctx, dx * 2.1, dy * 2.1 + Math.sin(t * 0.5) * 1.5, W * 1.03, H * 1.03);
  },
});

A.liriverScene = function (g, W, H) {
  const horizon = H * 0.63;
  S.paint(g, W, H, [
    [0, "#0b1a2a"], [0.14, "#17304a"], [0.3, "#33556f"], [0.44, "#7d94a4"],
    [0.55, "#c3c3b8"], [0.63, "#e6d9c4"], [0.7, "#b9c3c4"], [0.86, "#6d8494"], [1, "#dfe7ec"],
  ]);
  S.milky(g, W, H, { y: H * 0.18, alpha: 0.05, seed: 33, color: "#a8c4e2" });
  S.disc(g, W * 0.66, H * 0.34, H * 0.042, { core: "#fffdf6", halo: "#ffe4bc", haloR: 9, rays: 11, raySeed: 6, alpha: 0.7 });
  S.glare(g, W * 0.66, H * 0.6, W * 0.5, { alpha: 0.2, color: "#ffe9c8", sq: 0.06 });
  C.skyClouds(g, W, H, { seed: 71, n: 8, y0: H * 0.06, y1: H * 0.36, rmin: 130, rmax: 430, alpha: 0.14, color: "#cfe0f2", bias: 1 });
  const far = G.profile(W, { h: H, seed: 4.4, base: 0.6, amp: 0.012, detail: 0.008, scale: 2.6, smooth: 3 });
  G.fillUnder(g, W, H, far, { grad: [[0, "#8fa6b6"], [0.5, "#6a8093"], [1, "#4d6478"]] });
  G.karst(g, W, H, {
    seed: 5.7, n: 6, baseY: horizon, hmin: 0.16, hmax: 0.3, ratio: 0.34,
    grad: [[0, "#93a9b8"], [0.4, "#647c90"], [1, "#3c5265"]], flute: "#22303e", fluteA: 0.24,
    rim: "rgba(255,246,226,0.8)", rimA: 0.34, rimW: 1.3,
  });
  C.bank(g, W, horizon - H * 0.01, { seed: 141, thick: 30, fade: 30, alpha: 0.5, puffs: 30, rmin: 18, rmax: 70, wave: 0.3, color: "#ffffff", spill: true, spillN: 6, spillH: H * 0.05 });
  G.karst(g, W, H, {
    seed: 13.1, n: 4, baseY: horizon + H * 0.035, hmin: 0.2, hmax: 0.34, ratio: 0.42,
    grad: [[0, "#5f7789"], [0.36, "#3b5165"], [1, "#1d2c3c"]], flute: "#0e1620", fluteA: 0.3,
    rim: "rgba(255,244,220,0.85)", rimA: 0.45, rimW: 1.5,
  });
  G.karst(g, W, H, {
    seed: 22.6, n: 3, baseY: horizon + H * 0.09, hmin: 0.24, hmax: 0.4, ratio: 0.5,
    grad: [[0, "#33485c"], [0.36, "#1b2836"], [1, "#0b121b"]], flute: "#050a10", fluteA: 0.34,
    rim: "rgba(255,240,210,0.6)", rimA: 0.4, rimW: 1.6,
  });
  G.rock(g, W * 0.02, H * 0.86, W * 0.14, H * 0.035, { seed: 61, ink: "#101a24", rim: "rgba(230,240,248,0.4)", rimW: 1 });
  G.rock(g, W * 0.93, H * 0.89, W * 0.12, H * 0.03, { seed: 63, ink: "#0e1721", rim: "rgba(230,240,248,0.35)", rimW: 1 });
  B.wispNear(g, W, H, 0.6, { seed: 9, n: 6, alpha: 0.24, color: "#ffffff", wav: 8 });
  B.haze(g, W, H, [[0, U.rgba("#cfe0f2", 0.07)], [0.5, U.rgba("#ffffff", 0.05)], [0.64, U.rgba("#dfe7ec", 0.1)], [1, U.rgba("#8fa6b6", 0.18)]]);
  B.grain(g, W, H, { alpha: 0.02, cell: 2, seed: 6 });
};

A.liriver = A.mk({
  id: "liriver", label: "LI RIVER", labelZh: "\u6f13\u6c5f", dur: 30,
  build: function (ctx, W, H) {
    const a = A.liriver;
    a.bg = a.bake(W, H, function (g) { A.liriverScene(g, W, H); });
    a.raft = U.Layer(W, H, E.dpr);
    G.rafter(a.raft.ctx, W * 0.3, H * 0.72, H * 0.062, { pole: 0, birds: 2, ink: "#0d1119" });
    a.raft.ctx.setTransform(1, 0, 0, 1, 0, 0);
  },
  frame: function (ctx, T, l, t) {
    const W = E.W, H = E.H, a = A.liriver;
    const p = t / a.dur;
    const dx = W * 0.025 * Math.sin(p * 1.9), dy = -H * 0.008 * p;
    const hy = H * 0.63;
    a.bg.blit(ctx, dx, dy, W * 1.04, H * 1.02);
    ctx.save();
    ctx.globalAlpha = 0.5;
    B.reflection(ctx, a.bg.canvas, W, hy, hy - H * 0.02, H - hy + H * 0.05, t, { bands: 30, amp: 3.4, depth: 0.5, speed: 0.7, alpha: 0.6 });
    ctx.restore();
    B.shimmer(ctx, 0, hy + H * 0.02, W, H * 0.3, t, { n: 15, alpha: 0.15, color: "#fff6e4", speed: 0.55, len: 54, seed: 4, thick: 1.1 });
    B.shimmer(ctx, 0, hy + H * 0.16, W, H * 0.22, t * 1.3, { n: 11, alpha: 0.12, color: "#ffffff", speed: 0.45, len: 76, seed: 9, thick: 1.4 });
    const bx = W * (0.22 + 0.02 * Math.sin(t * 0.24)) + dx;
    const by = hy + H * 0.055 + Math.sin(t * 0.5) * 2;
    B.rippleSet(ctx, bx + W * 0.04, by + H * 0.008, t, { n: 4, rate: 0.26, spread: 78, alpha: 0.42, sx: 2.6, sy: 0.3 });
    B.rippleSet(ctx, bx - W * 0.02, by + H * 0.014, t * 1.7, { n: 3, rate: 0.3, spread: 52, alpha: 0.3, sx: 2.2, sy: 0.28 });
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.translate(bx + W * 0.02, by + H * 0.03);
    ctx.scale(1, -1.15);
    a.raft.blit(ctx, -W * 0.02, 0, W, H, { alpha: 0.6 });
    ctx.restore();
    ctx.save();
    ctx.translate(bx, by + Math.sin(t * 0.9) * 1.6);
    a.raft.ctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
    G.rafter(ctx, 0, 0, H * 0.075, { pole: Math.sin(t * 0.6) * 0.5 + 0.5, birds: 2, ink: "#0b0f17" });
    G.lantern(ctx, -H * 0.07, -H * 0.042, H * 0.016, { alpha: 1, glow: 6.5, color: "#ffb05e" });
    ctx.restore();
    C.streaks(ctx, W, H, hy - H * 0.05 + Math.sin(t * 0.05) * H * 0.02, { seed: 11, n: 5, alpha: 0.2, color: "#ffffff", spread: 0.07 });
    G.birds(ctx, [
      { x: U.wrap(W * 0.6 + T * 8, -40, W + 40), y: H * 0.2 + Math.sin(T * 0.4) * H * 0.012, s: 7, flap: Math.sin(T * 4.8), a: 0.4 },
      { x: U.wrap(W * 0.6 + T * 8 + 30, -40, W + 40), y: H * 0.185 + Math.sin(T * 0.5 + 1) * H * 0.012, s: 5.5, flap: Math.sin(T * 5.6 + 1), a: 0.3 },
    ], { ink: "rgba(52,68,84,0.6)" });
  },
});

A.dunhuangScene = function (g, W, H) {
  S.paint(g, W, H, [
    [0, "#141a30"], [0.16, "#2b2c44"], [0.3, "#5a4a52"], [0.42, "#96704f"],
    [0.5, "#c68f50"], [0.56, "#e8b268"], [0.64, "#f3cd93"], [0.76, "#e0ac6f"], [1, "#c08a52"],
  ]);
  S.stars(g, W, H, { n: 150, seed: 23, alpha: 0.4, cover: 0.34, pw: 1.4 });
  S.milky(g, W, H, { y: H * 0.26, alpha: 0.055, seed: 41, color: "#b9a7dd" });
  const sunX = W * 0.76, sunY = H * 0.5, sunR = H * 0.058;
  S.disc(g, sunX, sunY, sunR, { core: "#fff6dc", halo: "#ffb968", haloR: 8, rays: 14, raySeed: 5, alpha: 0.92 });
  S.glare(g, sunX, sunY, W * 0.6, { alpha: 0.24, color: "#ffcf94", sq: 0.1 });
  C.skyClouds(g, W, H, { seed: 51, n: 7, y0: H * 0.2, y1: H * 0.42, rmin: 120, rmax: 400, alpha: 0.18, color: "#ffd9a8", bias: 1 });
  G.dunes(g, W, H, { rows: 5, seed: 3, y0: H * 0.5, y1: H * 1.1, near: "#3a2418", far: "#eccb96", crest: "rgba(255,244,214,0.95)" });
  const ty = H * 0.6;
  G.beacon = true;
  ctxTower(g, W * 0.815, ty, H * 0.1);
  const car = G.caravan(g, W, H, H * 0.82, 5, H * 0.05, { x0: W * 0.1, gap: 2.6, phase: 1.1 });
  car.forEach(function (c, i) { G.camel(g, c.x, c.y, H * 0.05, { phase: 1.1 + i * 0.7, ink: "#20150e" }); });
  for (let i = 0; i < car.length; i++) {
    const c = car[i];
    ctxShadow(g, c.x, c.y, H * 0.05, 1);
  }
  B.haze(g, W, H, [[0, U.rgba("#ffcf94", 0.1)], [0.4, U.rgba("#ffb968", 0.06)], [0.65, U.rgba("#8a5a34", 0.05)], [1, U.rgba("#2a1a12", 0.2)]]);
  B.grain(g, W, H, { alpha: 0.03, cell: 2, seed: 17 });
};

const ctxTower = function (g, x, y, s) {
  G.tower(g, x, y, s, { w: 1.9, h: 1.3, body: "#7a5334", shade: "#4a3020", lit: "rgba(255,226,170,0.7)", rimA: 0.55, rimW: 1.4, arch: false });
  G.tower(g, x, y - s * 1.3, s * 0.72, { w: 1.7, h: 1.2, body: "#6b4629", shade: "#402818", lit: "rgba(255,226,170,0.6)", rimA: 0.5, arch: false });
};
const ctxShadow = function (g, x, y, s, dir) {
  const g2 = g.createLinearGradient(x, y, x + dir * s * 3.4, y);
  g2.addColorStop(0, "rgba(40,22,12,0.4)");
  g2.addColorStop(1, "rgba(40,22,12,0)");
  g.save();
  g.fillStyle = g2;
  g.beginPath();
  g.ellipse(x + dir * s * 1.6, y + s * 0.02, s * 1.7, s * 0.11, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
};

A.dunhuang = A.mk({
  id: "dunhuang", label: "SILK ROAD", labelZh: "\u4e1d\u7ef8\u4e4b\u8def", dur: 31,
  build: function (ctx, W, H) {
    const a = A.dunhuang;
    a.bg = a.bake(W, H, function (g) { A.dunhuangScene(g, W, H); });
    const rnd = U.rng(77);
    a.dust = [];
    for (let i = 0; i < 54; i++) a.dust.push({ x: rnd(), y: rnd(), sp: 0.32 + rnd() * 0.5, r: 0.7 + rnd() * 2.1, a: 0.1 + rnd() * 0.24, sx: (rnd() - 0.5) * 0.05, ph: rnd() * 6.28 });
  },
  frame: function (ctx, T, l, t) {
    const W = E.W, H = E.H, a = A.dunhuang;
    const p = t / a.dur;
    const dx = -W * 0.02 * U.st5(p), dy = -H * 0.006 * U.st5(p);
    a.bg.blit(ctx, dx, dy, W * 1.04, H * 1.03);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "#ffe9c8";
    for (let i = 0; i < a.dust.length; i++) {
      const d = a.dust[i];
      const prog = U.wrap(d.y - t * d.sp, 0, 1);
      const bx = (d.x + Math.sin(t * 0.5 + d.ph) * d.sx) * W;
      const by = H * (0.42 + prog * 0.6);
      ctx.globalAlpha = d.a * Math.sin(prog * Math.PI) * 1.6;
      ctx.beginPath();
      ctx.arc(bx, by, d.r, 0, U.TAU);
      ctx.fill();
    }
    ctx.restore();
    S.glare(ctx, W * 0.76 + dx * 0.6, H * 0.5 + dy * 0.6, W * 0.42, { alpha: 0.12, color: "#ffd9a0", sq: 0.07 });
    G.dunes(ctx, W, H, { rows: 2, seed: 19, y0: H * 0.86, y1: H * 1.14, near: "#2a1810", far: "#84552f", crest: "rgba(255,232,190,0.6)" });
    C.streaks(ctx, W, H, H * 0.56 + Math.sin(t * 0.06) * H * 0.012, { seed: 21, n: 4, alpha: 0.16, color: "#ffe6c2", spread: 0.06 });
  },
});

A.shanghaiScene = function (g, W, H) {
  const hy = H * 0.66;
  S.paint(g, W, H, [
    [0, "#050a18"], [0.14, "#0a1730"], [0.3, "#143250"], [0.44, "#255270"],
    [0.54, "#3c7186"], [0.62, "#6b8a92"], [0.68, "#b08a72"], [0.74, "#dfa374"], [0.82, "#8f6a56"], [1, "#2a2a3c"],
  ]);
  S.stars(g, W, H, { n: 130, seed: 29, alpha: 0.36, cover: 0.3, pw: 1.3 });
  C.skyClouds(g, W, H, { seed: 81, n: 8, y0: H * 0.1, y1: H * 0.42, rmin: 140, rmax: 440, alpha: 0.14, color: "#8fb0d4", bias: 1 });
  S.glare(g, W * 0.42, H * 0.62, W * 0.5, { alpha: 0.16, color: "#ffb877", sq: 0.07 });
  const skyline = function (x0, x1, baseY, hmin, hmax, ink, seed) {
    const rnd = U.rng(seed);
    let x = x0;
    const blocks = [];
    while (x < x1) {
      const bw = U.lerp(W * 0.012, W * 0.042, rnd());
      const bh = H * (hmin + rnd() * (hmax - hmin));
      blocks.push({ x: x, w: bw, h: bh });
      x += bw + W * 0.0015;
    }
    g.save();
    g.fillStyle = ink;
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      g.beginPath();
      g.rect(b.x, baseY - b.h, b.w, b.h + 4);
      g.fill();
    }
    g.restore();
    return blocks;
  };
  skyline(W * 0.02, W * 0.98, hy - H * 0.02, 0.1, 0.26, "#16233a", 12);
  const blocks2 = skyline(W * 0.06, W * 0.94, hy - H * 0.005, 0.06, 0.16, "#0e1828", 31);
  const rnd = U.rng(101);
  g.save();
  for (let i = 0; i < blocks2.length; i++) {
    const b = blocks2[i];
    if (rnd() < 0.25) continue;
    const rows = Math.max(2, Math.floor(b.h / (H * 0.014)));
    const cols = Math.max(2, Math.floor(b.w / (W * 0.008)));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rnd() > 0.46) continue;
        g.globalAlpha = 0.2 + rnd() * 0.6;
        g.fillStyle = rnd() < 0.72 ? "#ffca7e" : "#bfe0ff";
        g.fillRect(b.x + (c + 0.28) * (b.w / cols), b.y0 | 0, 0, 0);
        g.fillRect(b.x + (c + 0.28) * (b.w / cols), hy - b.h + (r + 0.3) * (b.h / rows), (b.w / cols) * 0.42, (b.h / rows) * 0.4);
      }
    }
  }
  g.restore();
  const px = W * 0.42;
  const tower = function (x, baseY, s) {
    g.save();
    g.fillStyle = "#0d1626";
    const legs = [0.1, 0.2, 0.3];
    for (const l of legs) {
      g.beginPath();
      g.moveTo(x - s * l, baseY);
      g.lineTo(x + s * l, baseY);
      g.lineTo(x + s * l * 0.3, baseY - s * 3.4);
      g.lineTo(x - s * l * 0.3, baseY - s * 3.4);
      g.closePath();
      g.fill();
    }
    const spheres = [[0, 1.05, 0.62], [0, 2.05, 0.44], [0, 3.0, 0.3], [0, 3.72, 0.17]];
    for (const sp of spheres) {
      g.beginPath();
      g.arc(x + sp[0] * s, baseY - s * sp[1], s * sp[2], 0, U.TAU);
      g.fill();
      g.globalAlpha = 0.5;
      g.fillStyle = "#ffb968";
      g.beginPath();
      g.arc(x + sp[0] * s, baseY - s * sp[1], s * sp[2] * 1.12, 0, U.TAU);
      g.stroke();
      g.fillStyle = "#0d1626";
      g.globalAlpha = 1;
    }
    g.globalAlpha = 0.75;
    g.strokeStyle = "#ffd28e";
    g.lineWidth = Math.max(1.2, s * 0.09);
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.ellipse(x, baseY - s * (0.5 + i * 0.9), s * (1.15 - i * 0.26), s * 0.09, 0, 0, U.TAU);
      g.stroke();
    }
    g.restore();
  };
  tower(px, hy - H * 0.01, H * 0.062);
  g.save();
  g.fillStyle = "#0d1626";
  U.roundedPath(g, W * 0.62, hy - H * 0.2, W * 0.026, H * 0.2, W * 0.012);
  g.fill();
  g.beginPath();
  g.arc(W * 0.633, hy - H * 0.235, W * 0.017, 0, U.TAU);
  g.fill();
  g.restore();
  g.save();
  g.fillStyle = "#101a2a";
  U.roundedPath(g, W * 0.7, hy - H * 0.15, W * 0.05, H * 0.15, W * 0.004);
  g.fill();
  g.beginPath();
  g.moveTo(W * 0.7, hy - H * 0.15);
  g.lineTo(W * 0.725, hy - H * 0.19);
  g.lineTo(W * 0.75, hy - H * 0.15);
  g.closePath();
  g.fill();
  g.restore();
  g.save();
  g.fillStyle = "#0f1826";
  g.fillRect(0, hy - H * 0.016, W, H * 0.022);
  g.globalAlpha = 0.5;
  g.fillStyle = "#ffc478";
  for (let i = 0; i < 20; i++) {
    g.fillRect(W * (0.02 + i * 0.049), hy - H * 0.014, W * 0.006, H * 0.004);
  }
  g.restore();
  B.haze(g, W, H, [[0, U.rgba("#8fb0d4", 0.06)], [0.5, U.rgba("#dfa374", 0.05)], [0.68, U.rgba("#b08a72", 0.05)], [1, U.rgba("#0a1020", 0.24)]]);
  B.grain(g, W, H, { alpha: 0.022, cell: 2, seed: 19 });
  return { hy: hy, px: px };
};

A.shanghai = A.mk({
  id: "shanghai", label: "SHANGHAI", labelZh: "\u4e0a\u6d77", dur: 30,
  build: function (ctx, W, H) {
    const a = A.shanghai;
    a.meta = a.bake(W, H, function () { });
    a.bg = a.bake(W, H, function (g) { a.info = A.shanghaiScene(g, W, H); });
  },
  frame: function (ctx, T, l, t) {
    const W = E.W, H = E.H, a = A.shanghai;
    const hy = H * 0.66;
    const p = t / a.dur;
    const dx = W * 0.014 * Math.sin(p * 1.6);
    a.bg.blit(ctx, dx - W * 0.007, -H * 0.004, W * 1.015, H * 1.01);
    B.reflection(ctx, a.bg.canvas, W, hy, hy - H * 0.01, H - hy + H * 0.06, t, { bands: 34, amp: 2.6, depth: 0.62, speed: 0.5, alpha: 0.62, widen: 1.015 });
    const winT = U.sat((t - 2) / (a.dur * 0.6));
    const rnd = U.rng(303);
    ctx.save();
    for (let i = 0; i < 70; i++) {
      const wx = rnd() * W;
      const wy = H * (0.3 + rnd() * 0.36);
      const ph = rnd() * 6.28;
      const on = U.sat((winT * 1.6 - rnd() * 0.8) * 3);
      if (on <= 0.02) continue;
      ctx.globalAlpha = on * (0.28 + Math.abs(Math.sin(t * 0.7 + ph)) * 0.5);
      ctx.fillStyle = rnd() < 0.74 ? "#ffcf8a" : "#cfe6ff";
      ctx.fillRect(wx + dx, wy, Math.max(1.4, W * 0.0022), Math.max(1, H * 0.0032));
    }
    ctx.restore();
    B.shimmer(ctx, 0, hy + H * 0.01, W, H * 0.3, t, { n: 30, alpha: 0.24, color: "#ffe0b0", speed: 0.5, len: 60, seed: 12, thick: 1.4 });
    const bx = W * (0.3 + 0.03 * Math.sin(t * 0.2));
    const by = H * 0.885 + Math.sin(t * 0.6) * 1.4;
    ctx.save();
    ctx.fillStyle = "#070c14";
    U.roundedPath(ctx, bx, by, W * 0.062, H * 0.015, H * 0.007);
    ctx.fill();
    ctx.fillRect(bx + W * 0.03, by - H * 0.035, W * 0.012, H * 0.036);
    G.lantern(ctx, bx + W * 0.012, by - H * 0.012, H * 0.011, { alpha: 0.9, glow: 6, color: "#ff9e4a" });
    G.lantern(ctx, bx + W * 0.03, by - H * 0.042, H * 0.009, { alpha: 0.85, glow: 5, color: "#ffbe6a" });
    G.lantern(ctx, bx + W * 0.058, by - H * 0.012, H * 0.01, { alpha: 0.9, glow: 5, color: "#ff9e4a" });
    ctx.restore();
    B.rippleSet(ctx, bx + W * 0.02, by + H * 0.02, t, { n: 3, rate: 0.3, spread: W * 0.06, alpha: 0.22, sx: 2.6, sy: 0.24 });
  },
});

A.gardenScene = function (g, W, H) {
  const pondY = H * 0.7;
  const wallTop = H * 0.31, wallBot = H * 0.55;
  const wallL = W * 0.1, wallR = W * 0.52;
  const gx = W * 0.29, gy = H * 0.43, gr = H * 0.082;
  S.paint(g, W, H, [
    [0, "#0a1a18"], [0.18, "#12302a"], [0.34, "#1e4638"], [0.5, "#356d50"],
    [0.62, "#5d8f68"], [0.72, "#9cba90"], [0.82, "#c9d8ae"], [1, "#e8e6c8"],
  ]);
  S.milky(g, W, H, { y: H * 0.2, alpha: 0.045, seed: 77, color: "#bcd8c8" });
  S.disc(g, W * 0.87, H * 0.18, H * 0.03, { core: "#fffdf0", halo: "#ffe8bc", haloR: 10, rays: 9, raySeed: 7, alpha: 0.5 });
  C.skyClouds(g, W, H, { seed: 91, n: 7, y0: H * 0.03, y1: H * 0.3, rmin: 120, rmax: 380, alpha: 0.1, color: "#dcecdc", bias: 1 });
  for (let i = 0; i < 5; i++) {
    const p = G.profile(W, { h: H, seed: 71.1 + i * 5.3, base: 0.3 + i * 0.042, amp: 0.042, detail: 0.02, scale: 1.35 });
    G.fillUnder(g, W, H, p, {
      grad: [[0, U.mixHex("#5f8a6c", "#0c1a14", i / 4.2)], [0.4, U.mixHex("#3d6650", "#0a1410", i / 4)], [1, U.mixHex("#254434", "#070d0b", i / 3.6)]],
      rim: "rgba(226,244,220,0.5)", rimA: 0.34 - i * 0.04, rimW: 1.2,
    });
    if (i < 4) C.bank(g, W, H * (0.318 + i * 0.042), { seed: 160 + i * 7, thick: 30, fade: 30, alpha: 0.32, puffs: 24, rmin: 18, rmax: 74, wave: 0.26, color: "#eef6ee", spill: true, spillN: 5, spillH: H * 0.045 });
  }
  for (let k = 0; k < 12; k++) {
    const x = W * ((k * 0.087 + 0.02) % 1);
    G.bamboo(g, x, H * (0.46 + (k % 3) * 0.03), H * (0.16 + ((k * 7) % 4) * 0.04), { seed: k * 5 + 2, culms: 3, ink: "#0b1a12", leaves: 5, alpha: 0.55 });
  }
  const wallL2 = U.Layer(W, H, E.dpr);
  const wc = wallL2.ctx;
  wc.fillStyle = "#eae5d7";
  wc.fillRect(wallL, wallTop, wallR - wallL, wallBot - wallTop);
  wc.globalAlpha = 0.35;
  wc.fillStyle = "#a9a294";
  for (let i = 1; i < 6; i++) wc.fillRect(wallL, wallTop + i * (wallBot - wallTop) / 6, wallR - wallL, 1.2);
  wc.globalAlpha = 0.22;
  wc.fillStyle = "#8d8straight".replace("straight", "673");
  for (let i = 0; i < 30; i++) wc.fillRect(wallL + ((i * 137) % (wallR - wallL)), wallTop + ((i * 91) % (wallBot - wallTop)), 2, 2);
  wc.globalAlpha = 1;
  G.tileRoof(wc, (wallL + wallR) * 0.5, wallTop + H * 0.002, wallR - wallL + W * 0.022, { ink: "#1d2620", line: "#465448", rise: 0.026 });
  wc.fillStyle = "#cdc6b4";
  wc.fillRect(wallL - W * 0.008, wallTop + H * 0.02, wallR - wallL + W * 0.016, H * 0.007);
  wc.fillRect(wallL - W * 0.008, wallBot - H * 0.006, wallR - wallL + W * 0.016, H * 0.008);
  wc.fillStyle = "#d8d2c2";
  wc.fillRect(wallL - W * 0.012, wallTop + H * 0.008, W * 0.024, wallBot - wallTop - H * 0.008);
  wc.fillRect(wallR - W * 0.012, wallTop + H * 0.008, W * 0.024, wallBot - wallTop - H * 0.008);
  wc.globalCompositeOperation = "destination-out";
  wc.beginPath();
  wc.arc(gx, gy, gr, 0, U.TAU);
  wc.fill();
  wc.globalCompositeOperation = "source-over";
  wc.strokeStyle = "#b3ab99";
  wc.lineWidth = Math.max(1.6, H * 0.0045);
  wc.globalAlpha = 0.6;
  wc.beginPath();
  wc.arc(gx, gy, gr, 0, U.TAU);
  wc.stroke();
  wc.globalAlpha = 0.28;
  wc.beginPath();
  wc.arc(gx, gy, gr * 1.13, 0, U.TAU);
  wc.stroke();
  wc.globalAlpha = 1;
  g.save();
  g.fillStyle = "#0d1a14";
  g.globalAlpha = 0.5;
  g.fillRect(wallL - W * 0.02, wallBot, wallR - wallL + W * 0.04, H * 0.016);
  g.globalAlpha = 0.25;
  g.fillRect(wallL - W * 0.03, wallBot + H * 0.016, wallR - wallL + W * 0.06, H * 0.018);
  g.restore();
  wallL2.blit(g, 0, 0);
  G.lattice(g, W * 0.37, H * 0.35, W * 0.062, H * 0.055, { cols: 5, ink: "#8d8471", w: 1.8, alpha: 0.5 });
  G.lattice(g, W * 0.455, H * 0.375, W * 0.044, H * 0.04, { cols: 4, ink: "#8d8471", w: 1.5, alpha: 0.4 });
  g.save();
  g.fillStyle = "#191f19";
  g.fillRect(W * 0.367, H * 0.347, W * 0.068, H * 0.004);
  g.fillRect(W * 0.452, H * 0.372, W * 0.05, H * 0.004);
  g.globalAlpha = 0.45;
  g.fillStyle = "#5d5544";
  g.fillRect(W * 0.7, H * 0.36, W * 0.022, H * 0.2);
  g.fillRect(W * 0.78, H * 0.39, W * 0.018, H * 0.17);
  g.restore();
  G.willow(g, W * 0.06, H * 0.16, H * 0.3, { seed: 5, n: 12, ink: "#182b1a" });
  G.willow(g, W * 0.965, H * 0.13, H * 0.26, { seed: 11, n: 10, ink: "#182b1a" });
  C.bank(g, gx, gy + gr * 0.45, { seed: 163, thick: gr * 0.5, fade: gr * 0.8, alpha: 0.13, puffs: 10, rmin: gr * 0.16, rmax: gr * 0.5, wave: 0.3, color: "#ffffff" });
  g.save();
  const wg = g.createLinearGradient(0, pondY, 0, H);
  wg.addColorStop(0, "#2f5847");
  wg.addColorStop(0.45, "#1e3d33");
  wg.addColorStop(1, "#0b1a16");
  g.fillStyle = wg;
  g.fillRect(0, pondY, W, H - pondY);
  g.restore();
  g.save();
  g.globalAlpha = 0.3;
  g.strokeStyle = "#cfd8c4";
  g.lineWidth = 1.1;
  for (let i = 0; i < 9; i++) {
    const y = pondY + H * (0.02 + i * 0.032);
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= W; x += W / 16) g.lineTo(x, y + Math.sin(x * 0.011 + i * 1.7) * 1.5);
    g.stroke();
  }
  g.restore();
  g.save();
  const mb = g.createLinearGradient(0, H * 0.54, 0, pondY);
  mb.addColorStop(0, "#2b4a37");
  mb.addColorStop(0.5, "#26422f");
  mb.addColorStop(1, "#182f24");
  g.fillStyle = mb;
  g.fillRect(0, H * 0.54, W, pondY - H * 0.54);
  g.globalAlpha = 0.3;
  g.fillStyle = "#8fa878";
  for (let i = 0; i < 22; i++) {
    const mx = (i * 0.135 % 1) * W;
    const my = H * (0.63 + ((i * 7) % 5) * 0.022);
    g.beginPath();
    g.ellipse(mx, my, W * (0.008 + (i % 4) * 0.004), H * 0.008, 0, 0, U.TAU);
    g.fill();
  }
  g.globalAlpha = 0.4;
  g.fillStyle = "#d3d9be";
  for (let i = 0; i < 13; i++) {
    const tt = i / 12;
    const px = gx + Math.sin(tt * 1.35) * W * 0.06 + tt * W * 0.05;
    const py = wallBot + H * 0.02 + tt * (pondY - wallBot - H * 0.03);
    g.beginPath();
    g.ellipse(px, py, W * (0.028 - tt * 0.007), H * (0.0068 - tt * 0.0018), 0, 0, U.TAU);
    g.fill();
  }
  g.restore();
  for (let i = 0; i < 6; i++) {
    G.lotus(g, W * (0.09 + i * 0.165), pondY + H * (0.075 + (i % 3) * 0.05), H * 0.026, { seed: i * 4 + 1, leaves: 3, flowers: 2, leaf: "#1e3828", flower: "#f8dfe9" });
  }
  G.zigBridge(g, W * 0.28, pondY + H * 0.042, W * 0.46, { spans: 7, ink: "#e8e3d5", h: H * 0.014, jog: H * 0.007, arch: W * 0.026 });
  B.haze(g, W, H, [[0, U.rgba("#dcecdc", 0.06)], [0.5, U.rgba("#e6e3c4", 0.035)], [1, U.rgba("#0c1a16", 0.2)]]);
  B.grain(g, W, H, { alpha: 0.018, cell: 2, seed: 23 });
  return { pondY: pondY };
};

A.garden = A.mk({
  id: "garden", label: "SUZHOU GARDEN", labelZh: "\u82cf\u5dde\u56ed\u6797", dur: 30,
  build: function (ctx, W, H) {
    const a = A.garden;
    const seedKoi = function (n) {
      const rnd = U.rng(404);
      const out = [];
      for (let i = 0; i < n; i++) {
        out.push({ x: rnd() * W, y: H * (0.78 + rnd() * 0.15), len: H * (0.05 + rnd() * 0.04), sp: (0.2 + rnd() * 0.3) * (rnd() < 0.5 ? -1 : 1), ph: rnd() * 6.28, amp: H * (0.02 + rnd() * 0.05), body: rnd() < 0.5 ? "#f6f4ea" : "#f9e9d6", patch: rnd() < 0.5 ? "#e2622a" : "#d8d2c4" });
      }
      return out;
    };
    a.bg = a.bake(W, H, function (g) { A.gardenScene(g, W, H); });
    a.koi = seedKoi(7);
    a.petals = (function () { const rnd = U.rng(505); const o = []; for (let i = 0; i < 22; i++) o.push({ x: rnd() * W, y: rnd() * H * 0.6, r: H * (0.004 + rnd() * 0.006), vy: 0.2 + rnd() * 0.5, vx: (rnd() - 0.5) * 0.4, ph: rnd() * 6.28, rot: rnd() * 6.28 }); return o; })();
  },
  frame: function (ctx, T, l, t) {
    const W = E.W, H = E.H, a = A.garden;
    const pondY = H * 0.7;
    const p = t / a.dur;
    const dx = -W * 0.02 * U.st5(p), dy = -H * 0.008 * U.st5(p);
    a.bg.blit(ctx, dx, dy, W * 1.03, H * 1.02);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, pondY, W, H - pondY);
    ctx.clip();
    B.reflection(ctx, a.bg.canvas, W, pondY, pondY, H - pondY, t, { bands: 20, amp: 1.8, depth: 0.4, speed: 0.4, alpha: 0.4 });
    ctx.restore();
    const koi = a.koi;
    for (let i = 0; i < koi.length; i++) {
      const k = koi[i];
      const x = U.wrap(k.x + t * k.sp * 22, -W * 0.1, W * 1.1);
      const y = k.y + Math.sin(t * 0.35 + k.ph) * k.amp;
      const ang = k.sp > 0 ? Math.sin(t * 0.3 + k.ph) * 0.3 : Math.PI + Math.sin(t * 0.3 + k.ph) * -0.3;
      B.rippleSet(ctx, x, y - k.len * 0.2, t * 1.4 + k.ph, { n: 2, rate: 0.2, spread: k.len * 1.6, alpha: 0.16, sx: 1.6, sy: 0.26 });
      G.koi(ctx, x, y, k.len, ang, { phase: t * 2.6 + k.ph, body: k.body, patch: k.patch, alpha: 0.92 });
    }
    const petals = a.petals;
    for (let i = 0; i < petals.length; i++) {
      const pt = petals[i];
      const y = U.wrap(pt.y + t * pt.vy * 26, -H * 0.05, H * 0.86);
      const x = U.wrap(pt.x + Math.sin(t * 0.5 + pt.ph) * 26 + t * pt.vx * 8, -W * 0.05, W * 1.05);
      G.petal(ctx, x, y, pt.r, pt.rot + t * 0.5, { alpha: 0.7 * (1 - y / (H * 0.9)) + 0.2 });
    }
    C.streaks(ctx, W, H, H * 0.3 + Math.sin(t * 0.07) * H * 0.03, { seed: 13, n: 4, alpha: 0.14, color: "#f2f8f0", spread: 0.08 });
    G.birds(ctx, [{ x: U.wrap(W * 0.72 + T * 6, -40, W + 40), y: H * 0.16 + Math.sin(T * 0.4) * H * 0.01, s: 6, flap: Math.sin(T * 5), a: 0.35 }], { ink: "rgba(40,60,48,0.55)" });
  },
});

E.register(A.huangshan);
E.register(A.liriver);
E.register(A.dunhuang);
E.register(A.shanghai);
E.register(A.garden);
})();