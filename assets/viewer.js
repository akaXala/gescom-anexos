/* Visor de diagramas GESCOM: zoom con rueda, pellizco y botones; arrastre para mover.
   Durante el gesto se escala con CSS (rápido) y al terminar se ajusta el tamaño real
   de la imagen para que el navegador la vuelva a dibujar nítida. */
(function () {
  "use strict";
  var stage = document.getElementById("stage");
  var img = document.getElementById("diagram");
  var zoomLabel = document.getElementById("zoom-level");
  var loader = document.getElementById("loader");
  var hint = document.getElementById("hint");
  var isVector = /\.svg(\?|$)/i.test(img.getAttribute("src"));

  var nw = 1, nh = 1;          // tamaño natural
  var s = 1, cs = 1;           // escala actual y escala ya aplicada al tamaño real
  var tx = 0, ty = 0;          // traslación
  var fitScale = 1, minScale = 0.1, maxScale = 8;
  var touched = false, commitTimer = null;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function apply() {
    img.style.width = nw * cs + "px";
    img.style.height = nh * cs + "px";
    img.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + s / cs + ")";
    zoomLabel.textContent = Math.round((s / fitScale) * 100) + " %";
  }

  function scheduleCommit() {
    clearTimeout(commitTimer);
    commitTimer = setTimeout(function () { cs = s; apply(); }, 140);
  }

  function limits() {
    var r = stage.getBoundingClientRect();
    fitScale = Math.min((r.width - 32) / nw, (r.height - 32) / nh);
    minScale = fitScale * 0.5;
    // vectorial: mucho acercamiento; mapa de bits: hasta 4 veces su resolución
    maxScale = isVector ? fitScale * 40 : Math.max(fitScale * 2, 4);
  }

  function fit() {
    var r = stage.getBoundingClientRect();
    limits();
    s = cs = fitScale;
    tx = (r.width - nw * s) / 2;
    ty = (r.height - nh * s) / 2;
    apply();
  }

  function zoomAt(factor, px, py) {
    var ns = clamp(s * factor, minScale, maxScale);
    if (ns === s) return;
    tx = px - (px - tx) * (ns / s);
    ty = py - (py - ty) * (ns / s);
    s = ns;
    touched = true;
    apply();
    scheduleCommit();
  }

  function center() {
    var r = stage.getBoundingClientRect();
    return [r.width / 2, r.height / 2];
  }

  function local(e) {
    var r = stage.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  function hideHint() { if (hint) hint.classList.add("hidden"); }

  /* ---- rueda (incluye pellizco de trackpad) ---- */
  stage.addEventListener("wheel", function (e) {
    e.preventDefault();
    hideHint();
    var p = local(e);
    var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)), p[0], p[1]);
  }, { passive: false });

  /* ---- punteros: arrastre y pellizco ---- */
  var pointers = new Map(), last = null, lastDist = 0, lastMid = null;
  var lastTap = 0;

  stage.addEventListener("pointerdown", function (e) {
    if (e.target.closest && e.target.closest(".controls")) return;
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, local(e));
    stage.classList.add("dragging");
    hideHint();
    if (pointers.size === 1) {
      last = local(e);
      var now = Date.now();
      if (e.pointerType !== "mouse" && now - lastTap < 300) {
        zoomAt(2, last[0], last[1]);
        lastTap = 0;
      } else {
        lastTap = now;
      }
    } else if (pointers.size === 2) {
      var pts = Array.from(pointers.values());
      lastDist = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
      lastMid = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
    }
  });

  stage.addEventListener("pointermove", function (e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, local(e));
    if (pointers.size === 1 && last) {
      var p = local(e);
      tx += p[0] - last[0];
      ty += p[1] - last[1];
      last = p;
      touched = true;
      apply();
    } else if (pointers.size === 2) {
      var pts = Array.from(pointers.values());
      var d = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
      var mid = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
      tx += mid[0] - lastMid[0];
      ty += mid[1] - lastMid[1];
      if (lastDist > 0) zoomAt(d / lastDist, mid[0], mid[1]);
      else apply();
      lastDist = d;
      lastMid = mid;
    }
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size === 1) {
      last = Array.from(pointers.values())[0];
    } else if (pointers.size === 0) {
      last = null;
      stage.classList.remove("dragging");
    }
  }
  stage.addEventListener("pointerup", endPointer);
  stage.addEventListener("pointercancel", endPointer);

  stage.addEventListener("dblclick", function (e) {
    if (e.target.closest && e.target.closest(".controls")) return;
    var p = local(e);
    zoomAt(2, p[0], p[1]);
  });

  /* ---- botones y teclado ---- */
  document.getElementById("zoom-in").addEventListener("click", function () {
    var c = center(); zoomAt(1.5, c[0], c[1]);
  });
  document.getElementById("zoom-out").addEventListener("click", function () {
    var c = center(); zoomAt(1 / 1.5, c[0], c[1]);
  });
  document.getElementById("zoom-fit").addEventListener("click", function () {
    touched = false; fit();
  });
  var fsBtn = document.getElementById("fullscreen");
  if (fsBtn) {
    if (!document.documentElement.requestFullscreen) {
      fsBtn.hidden = true;
    } else {
      fsBtn.addEventListener("click", function () {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      });
    }
  }

  document.addEventListener("keydown", function (e) {
    var c = center(), step = 80;
    switch (e.key) {
      case "+": case "=": zoomAt(1.25, c[0], c[1]); break;
      case "-": case "_": zoomAt(0.8, c[0], c[1]); break;
      case "0": touched = false; fit(); break;
      case "ArrowLeft": tx += step; apply(); break;
      case "ArrowRight": tx -= step; apply(); break;
      case "ArrowUp": ty += step; apply(); break;
      case "ArrowDown": ty -= step; apply(); break;
      default: return;
    }
    e.preventDefault();
  });

  window.addEventListener("resize", function () {
    if (!touched) fit(); else limits();
  });

  /* ---- carga ---- */
  function ready() {
    nw = img.naturalWidth || 1600;
    nh = img.naturalHeight || 1000;
    img.classList.add("loaded");
    if (loader) loader.hidden = true;
    fit();
    setTimeout(hideHint, 5000);
  }
  if (img.complete && img.naturalWidth) ready();
  else {
    img.addEventListener("load", ready);
    img.addEventListener("error", function () {
      if (loader) loader.textContent = "No se pudo cargar el diagrama.";
    });
  }
})();
