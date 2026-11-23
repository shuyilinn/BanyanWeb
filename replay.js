// Two measured runs replayed on one clock: the baseline on the left, Banyan on the right, and a chart of what each
// has finished. Every time drawn is a measured one (demo/build.py, experiments/demo_checks/*_tokens).
// Replay.mount(root, D): D = {sides: {left, right}, names, chart: {label, total, left, right}, seconds, ring, ...};
// a side is {kind: "rows", runs, len, step} or {kind: "tree", seg, units}.
(function () {
  "use strict";
  var BLUE = "#2a78d6", ORANGE = "#eb6834", DPR = Math.min(window.devicePixelRatio || 1, 2);
  var n = function (x) { return Math.round(x).toLocaleString("en-US"); };
  function bs(arr, t) { var lo = 0, hi = arr.length; while (lo < hi) { var m = (lo + hi) >> 1; if (arr[m] <= t) lo = m + 1; else hi = m; } return lo; }

  function mount(root, D) {
    var S = [D.sides.left, D.sides.right], COL = [BLUE, ORANGE], SEC = [D.seconds.left, D.seconds.right];
    var TMAX = Math.max(SEC[0], SEC[1]), RING = D.ring || 0, R = RING;
    S.forEach(function (s) {
      if (s.kind === "tree") {
        s.made = []; s.deep = 0;
        s.seg.forEach(function (g) { for (var k = 0; k < g[4].length; k++) s.made.push(g[4][k]); if (g[2] + g[4].length > s.deep) s.deep = g[2] + g[4].length; });
        s.made.sort(function (a, b) { return a - b; });
      } else { s.deep = Math.max.apply(null, s.len); s.units = s.len.length; }
      R = Math.max(R, s.deep);
    });
    var FIN = [D.chart.left, D.chart.right], TOTAL = D.chart.total;
    root.innerHTML =
      '<div class="clockbar"><button class="btn primary" type="button">Play</button><button class="btn" type="button">Restart</button>' +
      '<div class="clock"><span data-r="clock">0.0</span><span class="u"> s</span></div>' +
      '<input type="range" min="0" max="1000" value="0" step="1" aria-label="Time in the runs">' +
      '<label>speed <select><option value="0.25">¼×</option><option value="0.5">½×</option><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option><option value="8">8×</option></select></label></div>' +
      '<div class="panels"></div>' +
      '<div style="background:#fff;padding:10px 14px 4px;border-top:1px solid var(--rule)"><div class="phead" style="margin-bottom:4px"><span class="pname"></span>' +
      '<span class="legend-i" style="margin-left:14px"><i style="background:' + BLUE + '"></i></span><span class="legend-i" style="margin-left:10px"><i style="background:' + ORANGE + '"></i></span></div><svg role="img"></svg></div>' +
      '<div class="status"></div>';
    var btns = root.querySelectorAll("button"), play = btns[0], scrub = root.querySelector("input"), sel = root.querySelector("select");
    var clock = root.querySelector('[data-r="clock"]'), status = root.querySelector(".status"), panels = root.querySelector(".panels");
    var startSpeed = D.speed || (TMAX > 40 ? 4 : TMAX > 10 ? 1 : 0.5); sel.value = String(startSpeed);
    root.querySelector(".phead .pname").textContent = D.chart.label[0].toUpperCase() + D.chart.label.slice(1);
    var li = root.querySelectorAll(".legend-i"); li[0].appendChild(document.createTextNode(D.names.left[0])); li[1].appendChild(document.createTextNode(D.names.right[0]));
    var cv = [], out = [];
    [D.names.left, D.names.right].forEach(function (nm, k) {
      var p = document.createElement("div"); p.className = "panel";
      p.innerHTML = '<div class="phead"><span class="sq" style="background:' + COL[k] + '"></span><span class="pname"></span><span class="psub"></span></div><canvas></canvas><div class="readout"></div>';
      p.querySelector(".pname").textContent = nm[0]; p.querySelector(".psub").textContent = nm[1];
      panels.appendChild(p); cv.push(p.querySelector("canvas")); out.push(p.querySelector(".readout"));
    });
    var geo = [];
    // layout: "radial" (the prompt at the centre, token position outwards) or "h" (the prompt on the left, token
    // position to the right, outputs stacked top to bottom). In both a side's outputs are ordered by their text.
    var HZ = D.layout === "h";
    function fit(c) {
      var w = c.clientWidth || 300, h = HZ ? Math.round(w * 1.05) : Math.round(w * 0.94);
      c.width = Math.round(w * DPR); c.height = Math.round(h * DPR); c.style.height = h + "px";
      var g = { W: c.width, H: c.height, cx: c.width / 2, cy: c.height / 2, rs: (Math.min(c.width, c.height) / 2 - 8 * DPR) / (R * 1.05) };
      if (HZ) { g.x0 = 6 * DPR; g.y0 = 6 * DPR; g.xs = (g.W - 12 * DPR) / (R * 1.02); g.hh = g.H - 26 * DPR; }
      return g;
    }
    function pt(g, depth, frac) {             // frac in 0..1: the place among the outputs
      if (HZ) return [g.x0 + depth * g.xs, g.y0 + frac * g.hh];
      var a = -Math.PI / 2 + 2 * Math.PI * frac, r = depth * g.rs; return [g.cx + Math.cos(a) * r, g.cy + Math.sin(a) * r];
    }
    function frame(k) {
      var g = geo[k], c = cv[k].getContext("2d"); c.clearRect(0, 0, g.W, g.H);
      c.setLineDash([3 * DPR, 4 * DPR]); c.strokeStyle = "#cfcbc1"; c.lineWidth = DPR;
      if (HZ) {
        if (RING) { c.beginPath(); c.moveTo(g.x0 + RING * g.xs, g.y0); c.lineTo(g.x0 + RING * g.xs, g.y0 + g.hh); c.stroke(); }
        c.setLineDash([]); c.fillStyle = "#828282"; c.font = (11 * DPR) + "px sans-serif"; c.textAlign = "center";
        var step = [8, 16, 32, 64, 128, 256].find(function (x) { return R / x <= 6; }) || 256;
        for (var x = 0; x <= R; x += step) c.fillText(x, Math.min(g.W - 10 * DPR, Math.max(8 * DPR, g.x0 + x * g.xs)), g.H - 6 * DPR);
      } else if (RING) { c.beginPath(); c.arc(g.cx, g.cy, RING * g.rs, 0, 6.2832); c.stroke(); }
      c.setLineDash([]);
      return c;
    }
    function drawRows(k, t) {
      var s = S[k], g = geo[k], c = frame(k), st = bs(s.step, t) - 1, i, written = 0, done = [], live = [], paused = [], N = s.len.length;
      for (i = 0; i < N; i++) {
        var ru = s.runs[i], L = 0, on = false;
        for (var q = 0; q < ru.length; q += 2) { var got = st - ru[q] + 1; if (got > 0) { L += Math.min(got, ru[q + 1]); if (got <= ru[q + 1]) on = true; } }
        written += L; if (L > 0) (L >= s.len[i] ? done : (on ? live : paused)).push(i, L);
      }
      c.lineWidth = HZ ? Math.max(0.5, Math.min(2 * DPR, g.hh / N * 0.8)) : Math.max(0.6, 0.5 * DPR); c.strokeStyle = COL[k];
      var base = N > 3000 ? 0.12 : 0.25;
      [[done, HZ ? base * 1.6 : base], [paused, base * 2], [live, 0.6]].forEach(function (p) { var arr = p[0]; c.globalAlpha = p[1]; c.beginPath();
        for (var j = 0; j < arr.length; j += 2) { var f = (arr[j] + 0.5) / N, a0 = pt(g, 0, f), a1 = pt(g, arr[j + 1], f); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); } c.stroke(); });
      c.globalAlpha = 1;
      return [["tokens written", n(written)], ["rows being written", n(live.length / 2)]];
    }
    function drawTree(k, t) {
      var s = S[k], g = geo[k], c = frame(k), i, U = s.units;
      c.strokeStyle = COL[k];
      for (i = 0; i < s.seg.length; i++) {
        var sg = s.seg[i], m = bs(sg[4], t); if (!m) continue;
        var f = sg[0] / U, pf = sg[1] / U, p0 = pt(g, sg[2], f), p1 = pt(g, sg[2] + m, f);
        c.globalAlpha = sg[3] > 1 ? 0.9 : 0.5; c.lineWidth = Math.max(0.7, 0.6 * DPR) + 7 * DPR * Math.sqrt(sg[3] / U);
        c.beginPath();
        if (sg[2] > 0 && Math.abs(f - pf) > 1e-9) {
          if (HZ) { var q = pt(g, sg[2], pf); c.moveTo(q[0], q[1]); c.lineTo(p0[0], p0[1]); }
          else { var a = -Math.PI / 2 + 2 * Math.PI * f, pa = -Math.PI / 2 + 2 * Math.PI * pf; c.arc(g.cx, g.cy, sg[2] * g.rs, Math.min(a, pa), Math.max(a, pa)); }
        }
        c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
      }
      c.globalAlpha = 1;
      return [["tree nodes written", n(bs(s.made, t))], ["", ""]];
    }
    function cells(k, list) { var e = out[k]; if (!e.firstChild) list.forEach(function () { var d = document.createElement("div"); d.className = "ro"; d.innerHTML = '<span class="k"></span><span class="v"></span>'; e.appendChild(d); });
      list.forEach(function (r, j) { e.children[j].firstChild.textContent = r[0]; e.children[j].lastChild.textContent = r[1]; }); }

    // the chart
    var svg = root.querySelector("svg"), NS = "http://www.w3.org/2000/svg", Wc = 760, Hc = 240, L = 64, Rm = 70, T = 10, Bm = 38;
    svg.setAttribute("viewBox", "0 0 " + Wc + " " + Hc); svg.style.width = "100%"; svg.style.height = "auto"; svg.style.display = "block";
    var X = function (t) { return L + t / TMAX * (Wc - L - Rm); }, Y = function (v) { return T + (1 - v / TOTAL) * (Hc - T - Bm); };
    function el(tag, at, txt) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; }
    [0, TOTAL / 2, TOTAL].forEach(function (v) { el("line", { x1: L, x2: Wc - Rm, y1: Y(v), y2: Y(v), stroke: "#e8e8e8" }); el("text", { x: L - 8, y: Y(v) + 4, "text-anchor": "end", "font-size": 12, fill: "#828282" }, n(v)); });
    var tick = [0.5, 1, 2, 5, 10, 20].filter(function (x) { return TMAX / x <= 10; })[0] || 20;
    for (var tt = 0; tt <= TMAX + 1e-9; tt += tick) el("text", { x: X(tt), y: Hc - Bm + 18, "text-anchor": "middle", "font-size": 12, fill: "#828282" }, +tt.toFixed(1));
    el("text", { x: (L + Wc - Rm) / 2, y: Hc - 4, "text-anchor": "middle", "font-size": 12, fill: "#424242" }, "seconds");
    el("line", { x1: L, x2: Wc - Rm, y1: Y(0), y2: Y(0), stroke: "#424242" });
    function curve(F, upto) { var d = "M" + X(0) + "," + Y(0), k, prev = 0; for (k = 0; k < F.length && F[k] <= upto; k++) { d += "L" + X(F[k]).toFixed(1) + "," + Y(prev).toFixed(1) + "L" + X(F[k]).toFixed(1) + "," + Y(k + 1).toFixed(1); prev = k + 1; } return d + "L" + X(upto).toFixed(1) + "," + Y(prev).toFixed(1); }
    var path = [el("path", { fill: "none", stroke: BLUE, "stroke-width": 2 }), el("path", { fill: "none", stroke: ORANGE, "stroke-width": 2 })];
    var cl = el("line", { y1: T, y2: Y(0), stroke: "#424242", "stroke-dasharray": "3 3" });
    var lab = [el("text", { "font-size": 12.5, fill: "#111" }, D.names.left[0]), el("text", { "font-size": 12.5, fill: "#111" }, D.names.right[0])];
    var hit = el("rect", { x: L, y: T, width: Wc - L - Rm, height: Hc - T - Bm, fill: "transparent", style: "cursor:crosshair" });

    var st = { t: 0, playing: false, last: 0, speed: startSpeed };
    function render(fromScrub) {
      var t = st.t, cnt = [];
      clock.textContent = t.toFixed(TMAX >= 20 ? 1 : 2);
      if (!fromScrub) scrub.value = String(Math.round(t / TMAX * 1000));
      [0, 1].forEach(function (k) {
        var tk = Math.min(t, SEC[k]), rows = S[k].kind === "rows" ? drawRows(k, tk) : drawTree(k, tk), c = bs(FIN[k], tk);
        cnt.push(c);
        cells(k, [[D.chart.label.split(",")[0], n(c) + " of " + n(TOTAL)], rows[0], ["tokens generated (run total)", n(D.tokens[k ? "right" : "left"])], ["finished at", t >= SEC[k] ? SEC[k].toFixed(SEC[k] >= 20 ? 1 : 2) + " s" : "–"]]);
        path[k].setAttribute("d", curve(FIN[k], tk));
        lab[k].setAttribute("x", X(tk) + 6); lab[k].setAttribute("y", Y(c) + 4 + (k === 0 && Math.abs(Y(cnt[0]) - Y(bs(FIN[1], Math.min(t, SEC[1])))) < 13 ? 13 : 0));
      });
      cl.setAttribute("x1", X(t)); cl.setAttribute("x2", X(t));
      var nm = [D.names.left[0], D.names.right[0]], lbl = D.chart.label.split(",")[0];
      status.textContent = t >= TMAX - 1e-9
        ? nm[1] + " finished in " + SEC[1].toFixed(SEC[1] >= 20 ? 1 : 2) + " s, " + nm[0] + " in " + SEC[0].toFixed(SEC[0] >= 20 ? 1 : 2) + " s."
        : "At " + t.toFixed(TMAX >= 20 ? 1 : 2) + " s, " + lbl + ": " + nm[0] + " " + n(cnt[0]) + ", " + nm[1] + " " + n(cnt[1]) + " of " + n(TOTAL) + "." +
          (t >= SEC[1] ? " " + nm[1] + " finished at " + SEC[1].toFixed(SEC[1] >= 20 ? 1 : 2) + " s." : "");
    }
    function setPlaying(on) { st.playing = on; play.textContent = on ? "Pause" : (st.t >= TMAX ? "Replay" : "Play"); if (on) { st.last = performance.now(); requestAnimationFrame(step); } }
    function step(now) { if (!st.playing) return; st.t += (now - st.last) / 1000 * st.speed; st.last = now; if (st.t >= TMAX) { st.t = TMAX; render(); setPlaying(false); return; } render(); requestAnimationFrame(step); }
    play.addEventListener("click", function () { if (st.t >= TMAX) st.t = 0; setPlaying(!st.playing); });
    btns[1].addEventListener("click", function () { st.t = 0; setPlaying(false); render(); });
    scrub.addEventListener("input", function () { setPlaying(false); st.t = Number(scrub.value) / 1000 * TMAX; render(true); });
    sel.addEventListener("change", function () { st.speed = Number(sel.value); });
    hit.addEventListener("mousemove", function (ev) { var r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * Wc; setPlaying(false); st.t = Math.max(0, Math.min(TMAX, (x - L) / (Wc - L - Rm) * TMAX)); render(); });
    function size() { geo = cv.map(fit); render(true); }
    addEventListener("resize", size); size();
    return { set: function (t) { st.t = t; render(); } };
  }

  function setup(table, D) {
    var hr = document.createElement("tr");
    ["", D.names.left[0], D.names.right[0]].forEach(function (x) { var th = document.createElement("th"); th.textContent = x; hr.appendChild(th); });
    var thd = document.createElement("thead"); thd.appendChild(hr); table.appendChild(thd); var tb = document.createElement("tbody");
    D.setup.forEach(function (r) { var tr = document.createElement("tr"); r.forEach(function (x, i) { var td = document.createElement(i ? "td" : "th"); td.textContent = x; tr.appendChild(td); }); tb.appendChild(tr); });
    table.appendChild(tb);
  }
  window.Replay = { mount: mount, setup: setup, n: n };
})();
