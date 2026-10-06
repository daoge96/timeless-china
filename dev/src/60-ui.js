(function () {
const TC = window.TC;
const U = TC.U;
const E = TC.Engine;
const UI = (TC.UI = {});
const $ = (id) => document.getElementById(id);

UI.started = false;
UI.pickerOpen = false;
UI.hudVisible = function () { return UI.started && !UI.pickerOpen; };
UI._shown = -1;
UI._autoT = 0;

let card = null, cardZh = null, cardEn = null, cardNo = null, cardRule = null;

UI.mount = function () {
  const intro = $("intro"), play = $("btnPlay"), picker = $("picker"), grid = $("pkGrid"), app = $("app"), hud = $("hud");
  card = $("card"); cardZh = $("cardZh"); cardEn = $("cardEn"); cardNo = $("cardNo"); cardRule = $("cardRule");

  const buildPicker = function () {
    if (grid.getAttribute("data-built") === "1") return;
    grid.setAttribute("data-built", "1");
    E.acts.forEach(function (a, i) {
      const b = document.createElement("button");
      const im = document.createElement("img");
      im.alt = a.label;
      const c = document.createElement("canvas");
      c.width = 480; c.height = 270;
      try {
        const g = c.getContext("2d");
        U.beginArena();
        a.build(g, c.width, c.height, i);
        if (a.frame) a.frame(g, a._dur * 0.6, a._dur * 0.6, 0);
        g.setTransform(1, 0, 0, 1, 0, 0);
        U.freeArena(U.endArena());
        im.src = c.toDataURL("image/jpeg", 0.78);
      } catch (e) { U.freeArena(U.endArena()); }
      const lab = document.createElement("span");
      lab.textContent = a.label;
      const num = document.createElement("i");
      num.textContent = String(i + 1).padStart(2, "0") + "  " + (a.labelZh || "");
      b.appendChild(im); b.appendChild(num); b.appendChild(lab);
      b.addEventListener("click", function (ev) { ev.stopPropagation(); UI.jumpTo(i); });
      grid.appendChild(b);
    });
  };

  UI.jumpTo = function (i) {
    UI.closePicker();
    if (!UI.started) UI.begin();
    E.transFrom = null; E.trans = 0;
    E.gotoAct(i, 0.05);
  };

  UI.openPicker = function () { buildPicker(); UI.pickerOpen = true; picker.classList.add("on"); };
  UI.closePicker = function () { UI.pickerOpen = false; picker.classList.remove("on"); };
  UI.togglePicker = function () { if (UI.pickerOpen) UI.closePicker(); else UI.openPicker(); };

  UI.begin = function () {
    if (UI.started) return;
    UI.started = true;
    intro.classList.add("hide");
    intro.style.pointerEvents = "none";
    hud.classList.add("on");
    if (TC.Audio && !E.muted) TC.Audio.init();
    if (UI.onBegin) UI.onBegin();
  };

  UI.autoplay = function (delay) {
    UI._autoT = setTimeout(function () { UI.begin(); }, delay === undefined ? 4200 : delay);
  };

  play.addEventListener("click", function (ev) { ev.stopPropagation(); UI.begin(); });

  app.addEventListener("click", function (ev) {
    if (!UI.started) { UI.begin(); return; }
    if (UI.pickerOpen) { UI.closePicker(); return; }
    E.nextAct();
  });

  const bM = $("btnMute"), bP = $("btnPause"), bN = $("btnNext"), bG = $("btnGrid");
  const mark = function () {
    bM.style.opacity = E.muted ? "0.45" : "1";
    bP.innerHTML = E.paused ? "&#9654;" : "&#10073;&#10073;";
    bP.style.opacity = E.paused ? "1" : "0.75";
    bM.style.color = E.muted ? "rgba(240,234,222,0.42)" : "";
  };
  const stop = function (el, fn) { el.addEventListener("click", function (ev) { ev.stopPropagation(); fn(); mark(); }); };
  stop(bM, function () { E.setMuted(!E.muted); });
  stop(bP, function () { E.togglePause(); });
  stop(bN, function () { E.nextAct(); });
  stop(bG, function () { UI.togglePicker(); });
  picker.addEventListener("click", function () { UI.closePicker(); });
  mark();

  const gesture = function () {
    if (!UI.started) UI.begin();
    else if (TC.Audio && !E.muted) TC.Audio.init();
  };
  window.addEventListener("pointerdown", gesture);
  window.addEventListener("keydown", gesture);
  window.addEventListener("touchstart", gesture, { passive: true });

  window.addEventListener("keydown", function (e) {
    const k = e.key;
    if (k === " " || k === "Enter") { if (!UI.started) UI.begin(); else E.togglePause(); mark(); e.preventDefault(); }
    else if (k === "n" || k === "N" || k === "ArrowRight" || k === "ArrowDown") { if (!UI.started) UI.begin(); else E.nextAct(); }
    else if (k === "ArrowLeft" || k === "ArrowUp") { if (UI.started) E.prevAct(); }
    else if (k === "p" || k === "P") { E.togglePause(); mark(); }
    else if (k === "m" || k === "M") { E.setMuted(!E.muted); mark(); }
    else if (k === "s" || k === "S") { UI.togglePicker(); }
    else if (k === "f" || k === "F") { if (!document.fullscreenElement) { if (app.requestFullscreen) app.requestFullscreen(); } else if (document.exitFullscreen) document.exitFullscreen(); }
    else if (k === "Escape") { if (UI.pickerOpen) UI.closePicker(); }
  });

  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  if (TC.Audio) TC.Audio.setMuted(E.muted);
  if (E.cfg.act >= 0 || U.qs().auto === "1") { UI.begin(); UI._autoT = 1; }
};

UI.frame = function (t, local, idx) {
  if (!card) return;
  const a = E.acts[idx];
  if (!a) { card.style.opacity = "0"; return; }
  if (UI._shown !== idx) {
    UI._shown = idx;
    cardZh.textContent = a.labelZh || "";
    cardEn.textContent = a.label || "";
    cardNo.textContent = String(idx + 1).padStart(2, "0") + " / " + String(E.acts.length).padStart(2, "0");
    cardRule.style.transform = "scaleX(0)";
  }
  const off = idx === 0 ? 3.1 : 0;
  const l = local - off;
  const tin = 0.45, tfull = 1.5, hold = 4.6, gone = 5.6;
  let o = 0, y = 20, sc = 0;
  if (l >= tin && l < tfull) { const k = U.easeOut3((l - tin) / (tfull - tin)); o = k; y = 20 * (1 - k); sc = k; }
  else if (l >= tfull && l < hold) { o = 1; y = 0; sc = 1; }
  else if (l >= hold && l < gone) { const k = 1 - U.easeInOut((l - hold) / (gone - hold)); o = k; y = -14 * (1 - k); sc = 1; }
  else if (l >= gone) { o = 0; sc = 1; }
  card.style.opacity = o.toFixed(3);
  card.style.transform = "translateY(" + y.toFixed(1) + "px)";
  cardRule.style.transform = "scaleX(" + sc.toFixed(3) + ")";
};

UI.boot = function () {
  const err = $("err");
  try {
    if (!window.requestAnimationFrame) throw new Error("no raf");
    E.fit(false);
    UI.mount();
    E.start();
    UI.autoplay();
    window.TC.ready = true;
  } catch (e) {
    if (err) { err.style.display = "grid"; err.firstElementChild.innerHTML = "<b>Timeless China</b><br>" + (e && e.message ? e.message : "startup error") + "<br>Please try the latest Chrome, Edge, Safari or Firefox."; }
    if (window.console) console.error(e);
  }
};

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", UI.boot);
else UI.boot();
})();
