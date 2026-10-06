(function () {
const TC = window.TC;
const U = TC.U;
const AU = (TC.Audio = {});

AU.ok = false;
AU.ctx = null;
AU.master = null;
AU.muted = false;
AU.act = 0;
AU.ready = false;

const SCALES = [
  [0, 2, 4, 7, 9],
  [0, 3, 5, 7, 10],
  [0, 2, 4, 7, 9],
  [0, 2, 5, 7, 9],
  [0, 3, 5, 7, 10],
  [0, 2, 4, 7, 11],
  [0, 2, 5, 7, 10],
  [0, 2, 4, 7, 9],
];
const ROOTS = [57, 50, 55, 45, 52, 45, 50, 43];
const TEMPO = [0.62, 0.5, 0.72, 0.44, 0.58, 0.4, 0.5, 0.62];
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

AU.state = function () {
  if (!AU.ctx) return AU.ok ? "suspended" : "none";
  return AU.ctx.state;
};

const makeIR = function (ctx, sec, decay) {
  const len = Math.floor(ctx.sampleRate * sec);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  const rnd = U.rng(9182);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      d[i] = (rnd() * 2 - 1) * Math.pow(1 - t, decay) * (1 - Math.exp(-i / 400));
    }
  }
  return buf;
};

const noiseBuf = function (ctx, sec) {
  const len = Math.floor(ctx.sampleRate * sec);
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  const rnd = U.rng(3311);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = last * 0.86 + (rnd() * 2 - 1) * 0.34;
    d[i] = last;
  }
  return b;
};

AU.init = function () {
  if (AU.ok) {
    AU.resume();
    return true;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = new AC();
    AU.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = AU.muted ? 0 : 0.0001;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 22;
    comp.ratio.value = 3.2;
    comp.attack.value = 0.008;
    comp.release.value = 0.28;
    master.connect(comp);
    comp.connect(ctx.destination);
    AU.master = master;
    const verb = ctx.createConvolver();
    verb.buffer = makeIR(ctx, 3.4, 2.6);
    const verbGain = ctx.createGain();
    verbGain.gain.value = 0.36;
    verb.connect(verbGain);
    verbGain.connect(master);
    AU.verb = verb;
    const verb2 = ctx.createConvolver();
    verb2.buffer = makeIR(ctx, 1.5, 3.4);
    const verb2Gain = ctx.createGain();
    verb2Gain.gain.value = 0.2;
    verb2.connect(verb2Gain);
    verb2Gain.connect(master);
    AU.verb2 = verb2;
    const ns = ctx.createBufferSource();
    ns.buffer = noiseBuf(ctx, 4);
    ns.loop = true;
    const nf = ctx.createBiquadFilter();
    nf.type = "bandpass";
    nf.frequency.value = 420;
    nf.Q.value = 0.6;
    const ng = ctx.createGain();
    ng.gain.value = 0.05;
    ns.connect(nf); nf.connect(ng); ng.connect(master); ng.connect(verb2);
    ns.start();
    AU.windGain = ng;
    AU.windFilter = nf;
    const ws = ctx.createBufferSource();
    ws.buffer = noiseBuf(ctx, 4);
    ws.loop = true;
    const wf = ctx.createBiquadFilter();
    wf.type = "bandpass";
    wf.frequency.value = 1500;
    wf.Q.value = 0.9;
    const wg = ctx.createGain();
    wg.gain.value = 0.0;
    ws.connect(wf); wf.connect(wg); wg.connect(master); wg.connect(verb);
    ws.start();
    AU.waterGain = wg;
    AU.waterFilter = wf;
    const busPad = ctx.createGain();
    busPad.gain.value = 0.16;
    const padF = ctx.createBiquadFilter();
    padF.type = "lowpass";
    padF.frequency.value = 900;
    padF.Q.value = 0.4;
    busPad.connect(padF); padF.connect(master); padF.connect(verb);
    AU.padBus = busPad;
    AU.ok = true;
    AU.ready = true;
    AU.resume();
    AU.startBed();
    AU.onAct(AU.act);
    return true;
  } catch (e) {
    AU.ok = false;
    AU.err = String((e && e.message) || e) + " | " + String((e && e.stack) || "").split("\n")[1];
    return false;
  }
};

AU.resume = function () {
  if (!AU.ctx) return;
  try {
    if (AU.ctx.state === "suspended" && AU.ctx.resume) AU.ctx.resume();
  } catch (e) { }
};

AU.setMuted = function (m) {
  AU.muted = !!m;
  if (!AU.ok || !AU.master) return;
  try {
    const t = AU.ctx.currentTime;
    AU.master.gain.cancelScheduledValues(t);
    AU.master.gain.setTargetAtTime(AU.muted ? 0 : 0.85, t, 0.12);
  } catch (e) { }
};

AU.mute = function () { AU.setMuted(true); };
AU.unmute = function () { AU.setMuted(false); AU.resume(); };

AU.pluck = function (freq, when, vel, pan) {
  const ctx = AU.ctx;
  const t = when === undefined ? ctx.currentTime : when;
  const v = vel === undefined ? 0.3 : vel;
  const dur = 2.6;
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  const period = Math.max(2, Math.round(ctx.sampleRate / freq));
  const rnd = U.rng(Math.round(freq * 13) + 7);
  for (let i = 0; i < n; i++) {
    d[i] = i < period ? (rnd() * 2 - 1) : 0;
  }
  const damp = 0.996 - U.clamp((freq - 120) / 2400, 0, 0.5) * 0.02;
  for (let i = period; i < n; i++) {
    d[i] = (d[i - period] + d[i - period + 1]) * 0.5 * damp;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  const env = ctx.createGain();
  g.gain.value = v;
  const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = Math.min(9000, freq * 7 + 1400);
  lp.Q.value = 0.5;
  src.connect(lp); lp.connect(g); g.connect(env);
  if (p) { p.pan.value = pan === undefined ? 0 : pan; env.connect(p); p.connect(AU.master); p.connect(AU.verb); }
  else { env.connect(AU.master); env.connect(AU.verb); }
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(1, t + 0.005);
  env.gain.setTargetAtTime(0.0, t + 0.02, 0.9 + 1.6 / (1 + freq / 400));
  src.start(t);
  src.stop(t + dur + 0.1);
};

AU.bell = function (freq, when, vel) {
  const ctx = AU.ctx;
  const t = when === undefined ? ctx.currentTime : when;
  const v = vel === undefined ? 0.12 : vel;
  const g = ctx.createGain();
  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  o1.type = "sine"; o2.type = "sine";
  o1.frequency.value = freq;
  o2.frequency.value = freq * 2.76;
  const g2 = ctx.createGain();
  g2.gain.value = 0.3;
  o1.connect(g); o2.connect(g2); g2.connect(g);
  g.connect(AU.master); g.connect(AU.verb);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
  o1.start(t); o2.start(t);
  o1.stop(t + 3.6); o2.stop(t + 3.6);
};

AU.bow = function (freq, when, dur, vel) {
  const ctx = AU.ctx;
  const t = when === undefined ? ctx.currentTime : when;
  const v = vel === undefined ? 0.11 : vel;
  const D = dur === undefined ? 3 : dur;
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq * 2.2;
  f.Q.value = 1.1;
  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  o1.type = "sawtooth"; o2.type = "sawtooth";
  o1.frequency.value = freq;
  o2.frequency.value = freq * 1.006;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5.2;
  const lfoG = ctx.createGain();
  lfoG.gain.value = freq * 0.007;
  lfo.connect(lfoG);
  lfoG.connect(o1.frequency);
  lfoG.connect(o2.frequency);
  o1.connect(f); o2.connect(f);
  f.connect(g);
  g.connect(AU.master); g.connect(AU.verb);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.35);
  g.gain.setValueAtTime(v, t + Math.max(0.4, D - 0.7));
  g.gain.exponentialRampToValueAtTime(0.0001, t + D);
  lfo.start(t); o1.start(t); o2.start(t);
  lfo.stop(t + D + 0.1); o1.stop(t + D + 0.1); o2.stop(t + D + 0.1);
};

AU.pad = function (freq, when, dur, vel) {
  const ctx = AU.ctx;
  const t = when === undefined ? ctx.currentTime : when;
  const D = dur === undefined ? 12 : dur;
  const v = vel === undefined ? 0.1 : vel;
  const g = ctx.createGain();
  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  const o3 = ctx.createOscillator();
  o1.type = "triangle"; o2.type = "triangle"; o3.type = "sine";
  o1.frequency.value = freq * 0.5;
  o2.frequency.value = freq * 0.5 * 1.004;
  o3.frequency.value = freq;
  const g3 = ctx.createGain();
  g3.gain.value = 0.34;
  o1.connect(g); o2.connect(g); o3.connect(g3); g3.connect(g);
  g.connect(AU.padBus);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + D * 0.32);
  g.gain.setValueAtTime(v, t + D * 0.68);
  g.gain.linearRampToValueAtTime(0.0001, t + D);
  o1.start(t); o2.start(t); o3.start(t);
  o1.stop(t + D + 0.2); o2.stop(t + D + 0.2); o3.stop(t + D + 0.2);
};

AU.startBed = function () {
  if (!AU.ok) return;
  AU.sched = { next: 0, i: 0, bar: 0 };
  AU.nextTime = AU.ctx.currentTime + 0.15;
};

AU.onAct = function (i) {
  AU.act = i;
  if (!AU.ok) return;
  const t = AU.ctx.currentTime;
  const root = ROOTS[i % ROOTS.length];
  const sc = SCALES[i % SCALES.length];
  try {
    AU.pad(mtof(root - 12), t + 0.02, 16, 0.085);
    AU.pad(mtof(root + sc[2]), t + 0.4, 15, 0.06);
    if (i === 0 || i === 7) AU.bell(mtof(root + 24), t + 0.6, 0.1);
    if (AU.windGain) AU.windGain.gain.setTargetAtTime(i === 1 || i === 2 || i === 4 ? 0.085 : 0.045, t, 1.4);
    if (AU.waterGain) AU.waterGain.gain.setTargetAtTime(i === 3 || i === 6 ? 0.075 : 0.02, t, 1.4);
    if (AU.waterFilter) AU.waterFilter.frequency.setTargetAtTime(i === 3 ? 1100 : 1900, t, 1.2);
    if (AU.windFilter) AU.windFilter.frequency.setTargetAtTime(i === 1 ? 320 : 520, t, 1.2);
  } catch (e) { }
};

AU.update = function (dt, t, act) {
  if (!AU.ok || !AU.ctx || AU.ctx.state !== "running") return;
  const temp = TEMPO[act % TEMPO.length];
  const beat = temp;
  const look = AU.ctx.currentTime + 1.2;
  if (AU.nextTime < AU.ctx.currentTime - 0.6) AU.nextTime = AU.ctx.currentTime + 0.1;
  let guard = 0;
  while (AU.nextTime < look && guard++ < 24) {
    const root = ROOTS[act % ROOTS.length];
    const sc = SCALES[act % SCALES.length];
    const i = AU.sched.i++;
    const bar = Math.floor(i / 8);
    const pos = i % 8;
    const oct = bar % 3 === 2 ? 12 : 0;
    const deg = sc[(pos * 3 + bar) % sc.length];
    const mel = [0, 4, 2, 3, 1, 2, 4, 3];
    const deg2 = sc[(mel[pos] + bar) % sc.length];
    const when = AU.nextTime;
    if (act === 0 || act === 7) {
      if (pos === 0 || pos === 4) AU.pluck(mtof(root + deg + oct), when, 0.16, -0.3);
      if (pos === 2) AU.bell(mtof(root + deg2 + 12), when, 0.07);
      if (pos === 6) AU.pluck(mtof(root + sc[1] + 12), when, 0.1, 0.3);
    } else if (act === 1) {
      if (pos % 2 === 0 || pos === 5) AU.pluck(mtof(root + deg + oct), when, 0.15, (pos - 4) * 0.06);
      if (pos === 3) AU.pluck(mtof(root + sc[4] + 12), when, 0.09, 0.25);
    } else if (act === 2) {
      if (pos === 0 || pos === 3 || pos === 6) AU.pluck(mtof(root + deg + oct), when, 0.13, -0.2);
      if (pos === 5) AU.bell(mtof(root + deg2 + 12), when, 0.06);
    } else if (act === 3) {
      if (pos % 3 === 0) AU.pluck(mtof(root + deg), when, 0.14, 0.2);
      if (pos === 4) AU.bow(mtof(root + deg2 + 5), when, 3.4, 0.075);
    } else if (act === 4) {
      if (pos === 0) AU.bow(mtof(root + deg2 - 12), when, 4.2, 0.08);
      if (pos === 4) AU.pluck(mtof(root + deg + 12), when, 0.1, -0.25);
      if (pos === 6) AU.pluck(mtof(root + sc[2]), when, 0.11, 0.25);
    } else if (act === 5) {
      if (pos % 2 === 1) AU.pluck(mtof(root + deg + 12), when, 0.1, (pos - 4) * 0.08);
      if (pos === 0) AU.pad(mtof(root + sc[3]), when, beat * 4, 0.05);
      if (pos === 4) AU.bell(mtof(root + 24), when, 0.05);
    } else {
      if (pos === 0 || pos === 4) AU.pluck(mtof(root + deg + oct), when, 0.13, 0.25);
      if (pos === 2 || pos === 6) AU.pluck(mtof(root + deg2 + 12), when, 0.09, -0.25);
      if (pos === 7) AU.bell(mtof(root + sc[0] + 12), when, 0.05);
    }
    AU.nextTime += beat;
  }
};

AU.chime = function () {
  if (!AU.ok) return;
  AU.bell(mtof(ROOTS[AU.act % ROOTS.length] + 31), undefined, 0.1);
};
})();
