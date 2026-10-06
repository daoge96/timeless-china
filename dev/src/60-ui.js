(function () {
const TC = window.TC;
const U = TC.U;
const E = TC.Engine;
const UI = (TC.UI = {});
const $ = (id) => document.getElementById(id);

UI.started = false;
UI.pickerOpen = false;
UI.hudVisible = function () { return UI.started && !UI.pickerOpen; };

const dprEl = () => 1;

UI.mount = function () {
  const intro = $("intro"), play = $("btnPlay"), picker = $("picker"), grid = $("pkGrid"), app = $("app");

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
        a.build(g, c.width, c.height, i);
        if (a.frame) a.frame(g, a._dur * 0.6, a._dur * 0.6, 0);
        g.setTransform(1, 0, 0, 1, 0, 0);
        im.src = c.toDataURL("image/jpeg", 0.78);
      } catch (e) { }
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
    if (!UI.started) UI.begin(true);
    E.transFrom = null; E.trans = 0;
    E.gotoAct(i, 0.05);
  };

  UI.openPicker = function () { buildPicker(); UI.pickerOpen = true; picker.classList.add("on"); };
  UI.closePicker = function () { UI.pickerOpen = false; picker.classList.remove("on"); };
  UI.togglePicker = function () { if (UI.pickerOpen) UI.closePicker(); else UI.openPicker(); };

  UI.begin = function (silent) {
    if (UI.started) return;
    UI.started = true;
    intro.classList.add("hide");
    intro.style.pointerEvents = "none";
    if (!silent && TC.Audio && !E.muted) TC.Audio.init();
  };

  play.addEventListener("click", function (ev) { ev.stopPropagation(); UI.begin(); });

  app.addEventListener("click", function () {
    if (!UI.started) { UI.begin(); return; }
    if (UI.pickerOpen) { UI.closePicker(); return; }
    E.nextAct();
  });

  const bM = $("btnMute"), bP = $("btnPause"), bN = $("btnNext"), bG = $("btnGrid");
  const mark = function () {
    bM.style.opacity = E.muted ? "0.42" : "1";
    bP.innerHTML = E.paused ? "&#9654;" : "&#10073;&#10073;";
    bP.style.opacity = E.paused ? "1" : "0.72";
    bM.style.color = E.muted ? "rgba(240,234,222,0.4)" : "";
  };
  const stop = (el, fn) => el.addEventListener("click", function (ev) { ev.stopPropagation(); fn(); mark(); });
  stop(bM, function () { E.setMuted(!E.muted); });
  stop(bP, function () { E.togglePause(); });
  stop(bN, function () { E.nextAct(); });
  stop(bG, function () { UI.togglePicker(); });
  picker.addEventListener("click", function () { UI.closePicker(); });
  mark();

  window.addEventListener("keydown", function (e) {
    const k = e.key;
    if (k === " " || k === "Enter") {
      if (!UI.started) { UI.begin(); e.preventDefault(); return; }
      E.togglePause(); mark(); e.preventDefault();
    } else if (k === "n" || k === "N" || k === "ArrowRight") { if (!UI.started) UI.begin(); else E.nextAct(); }
    else if (k === "p" || k === "P") { E.togglePause(); mark(); }
    else if (k === "m" || k === "M") { E.setMuted(!E.muted); mark(); }
    else if (k === "s" || k === "S") { UI.togglePicker(); }
    else if (k === "f" || k === "F") {
      const d = document;
      if (!d.fullscreenElement) { if (app.requestFullscreen) app.requestFullscreen(); }
      else if (d.exitFullscreen) d.exitFullscreen();
    } else if (k === "Escape") { if (UI.pickerOpen) UI.closePicker(); }
  });

  const unlock = function () {
    if (TC.Audio && !E.muted && !E.audioBlocked) { TC.Audio.init(); }
    if (UI.started) window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("pointerdown", unlock);

  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  if (TC.Audio) TC.Audio.setMuted(E.muted);
  if (E.cfg.act >= 0 || TC.U.qs().auto === "1") UI.begin(true);
};

UI.frame = function () { };

UI.boot = function () {
  const err = $("err");
  try {
    if (!window.requestAnimationFrame) throw new Error("no raf");
    E.fit();
    UI.mount();
    E.start();
    window.TC.ready = true;
  } catch (e) {
    if (err) { err.style.display = "grid"; err.firstElementChild.innerHTML = "<b>Timeless China</b><br>" + (e && e.message ? e.message : "startup error") + "<br>Please try the latest Chrome, Edge, Safari or Firefox."; }
    if (window.console) console.error(e);
  }
};

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", UI.boot);
else UI.boot();
})();
