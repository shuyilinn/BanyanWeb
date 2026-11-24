// Side-by-side radial trees of two stored runs: the baseline on the left, Banyan on the right.
// A dot is a tree node; distance from the centre is the token position; both panels use the same scale and the
// same number of real nodes per dot. Banyan.mount(element, pair, options); Banyan.still(canvas, side).
(function () {
  "use strict";
  var DPR = Math.min(window.devicePixelRatio || 1, 2), LEFT = "#2a78d6", RIGHT = "#228B22", MARK = "#12805c", INK = "#111111", RULE = "#cfcbc1";
  var BASE_S = 22;                                   // seconds of wall time a replay takes at 1x
  function fmt(v) { return Math.round(v).toLocaleString("en-US"); }

  function layout(s) {                               // the angles come with the data: one layout for both panels
    if (s.deep) return;
    s.deep = 1;
    for (var i = 0; i < s.dep.length; i++) if (s.dep[i] > s.deep) s.deep = s.dep[i];
  }
  function shown(s, f) {                             // a replayed side's dots are stored in creation order
    if (!s.t || f >= 1) return s.par.length;
    var lo = 0, hi = s.t.length; while (lo < hi) { var m = (lo + hi) >> 1; if (s.t[m] <= f) lo = m + 1; else hi = m; } return lo;
  }
  function draw(cv, s, f, color, axis, ring) {
    layout(s);
    var ctx = cv.getContext("2d"), W = cv.width, H = cv.height, cx = W / 2, cy = H / 2;
    var rstep = (Math.min(W, H) / 2 - 8 * DPR) / axis, count = shown(s, f), i;
    var X = function (k) { return cx + Math.cos(s.ang[k]) * s.dep[k] * rstep; }, Y = function (k) { return cy + Math.sin(s.ang[k]) * s.dep[k] * rstep; };
    ctx.clearRect(0, 0, W, H);
    if (ring) { ctx.setLineDash([3 * DPR, 4 * DPR]); ctx.strokeStyle = RULE; ctx.lineWidth = DPR; ctx.beginPath(); ctx.arc(cx, cy, ring * rstep, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]); }
    ctx.lineWidth = Math.max(1, 0.8 * DPR); ctx.strokeStyle = color; ctx.globalAlpha = s.par.length > 8000 ? 0.16 : 0.3; ctx.beginPath();
    for (i = 1; i < count; i++) { ctx.moveTo(X(s.par[i]), Y(s.par[i])); ctx.lineTo(X(i), Y(i)); }
    ctx.stroke();
    var rad = s.par.length > 8000 ? Math.max(0.7, 0.75 * DPR) : Math.max(1.1, 1.3 * DPR), marked = 0;
    ctx.globalAlpha = 0.9; ctx.fillStyle = color; ctx.beginPath();
    for (i = 0; i < count; i++) { if (s.mark[i]) continue; ctx.moveTo(X(i) + rad, Y(i)); ctx.arc(X(i), Y(i), rad, 0, 6.2832); }
    ctx.fill();
    if (f < 1) { ctx.globalAlpha = 1; ctx.fillStyle = INK;           // the newest arrivals
      for (i = Math.max(0, count - Math.ceil(s.par.length * 0.012)); i < count; i++) { ctx.beginPath(); ctx.arc(X(i), Y(i), Math.max(1.6 * DPR, rad * 1.5), 0, 6.2832); ctx.fill(); } }
    ctx.globalAlpha = 1;
    for (i = 0; i < count; i++) { if (!s.mark[i]) continue; marked++;
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(X(i), Y(i), 4.2 * DPR, 0, 6.2832); ctx.fill();
      ctx.fillStyle = MARK; ctx.beginPath(); ctx.arc(X(i), Y(i), 3.1 * DPR, 0, 6.2832); ctx.fill(); }
    return marked;
  }
  function fit(cv, ratio) { var w = cv.clientWidth || 300, h = Math.round(w * ratio); cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR); cv.style.height = h + "px"; }

  function still(cv, s, color) {
    function go() { fit(cv, 1); layout(s); draw(cv, s, 1, color || RIGHT, s.deep * 1.07, 0); }
    addEventListener("resize", go); go();
  }

  // options: left / right = {name, sub}; marked = label of the highlighted leaves; rows(side data) = extra
  // [label, value] pairs of measured totals for a panel. The slider is a position in the recorded creation order:
  // a side whose run recorded that order grows with it, a side whose run did not is drawn finished, and a side with
  // no stored tree is not drawn.
  function mount(root, pair, opt) {
    var sides = [{ d: pair.left, o: opt.left, color: LEFT }, { d: pair.right, o: opt.right, color: RIGHT }];
    var axis = 0;
    sides.forEach(function (s) { if (s.d.par) { layout(s.d); axis = Math.max(axis, s.d.deep); } });
    axis = Math.max(axis, pair.ring || 0) * 1.07;
    root.innerHTML =
      '<div class="clockbar"><button class="btn primary" type="button">Play</button><button class="btn" type="button">Restart</button>' +
      '<div class="clock"><span data-r="clock">0</span><span class="u">% of the nodes created</span></div>' +
      '<input type="range" min="0" max="1000" value="0" step="1" aria-label="Position in the order the nodes were created">' +
      '<label>speed <select><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="3">3×</option></select></label></div>' +
      '<div class="panels"></div>';
    var play = root.querySelectorAll("button")[0], reset = root.querySelectorAll("button")[1], scrub = root.querySelector("input"),
      speedSel = root.querySelector("select"), clock = root.querySelector('[data-r="clock"]'), panels = root.querySelector(".panels");
    function cell(k, v, id) { return '<div class="ro"><span class="k">' + k + '</span><span class="v"' + (id ? ' data-r="' + id + '"' : '') + '>' + v + '</span></div>'; }
    sides.forEach(function (s) {
      var d = s.d, p = document.createElement("div"); p.className = "panel";
      var ro = "";
      if (d.par && d.replay) ro += cell("nodes created", "0", "nodes");
      if (d.par && d.replay && opt.samples) ro += cell("samples finished", "0", "done");
      if (d.par && opt.marked) ro += cell(opt.marked, "0", "marked");
      (opt.rows ? opt.rows(d) : []).forEach(function (r) { ro += cell(r[0], r[1]); });
      var mid = d.par ? '<canvas></canvas>' : '<div class="nodraw">No tree to draw: this run stored its totals but not its outputs.</div>';
      var note = !d.par ? "" : d.replay ? "replayed in the order the run recorded" : "finished tree; this run did not record the order";
      p.innerHTML = '<div class="phead"><span class="sq" style="background:' + s.color + '"></span><span class="pname"></span><span class="psub"></span></div>' + mid +
        '<div class="pnote">' + note + '</div><div class="readout">' + ro + '</div>';
      p.querySelector(".pname").textContent = s.o.name; p.querySelector(".psub").textContent = s.o.sub;
      panels.appendChild(p); s.cv = p.querySelector("canvas"); s.out = {};
      p.querySelectorAll("[data-r]").forEach(function (e) { s.out[e.dataset.r] = e; });
    });
    var st = { f: 0, playing: false, last: 0, speed: 1 };
    function render(fromScrub) {
      clock.textContent = Math.round(st.f * 100);
      if (!fromScrub) scrub.value = String(Math.round(st.f * 1000));
      sides.forEach(function (s) {
        if (!s.d.par) return;
        var f = s.d.replay ? st.f : 1, marked = draw(s.cv, s.d, f, s.color, axis, pair.ring);
        if (s.out.nodes) s.out.nodes.textContent = fmt(f * (s.d.nodes - 1) + 1);       // exact: t is the rank among all the run's nodes
        if (s.out.done) s.out.done.textContent = fmt(s.d.done[Math.floor(f * 100 + 1e-9)]);
        if (s.out.marked) s.out.marked.textContent = fmt(marked);
      });
    }
    function setPlaying(on) { st.playing = on; play.textContent = on ? "Pause" : (st.f >= 1 ? "Replay" : "Play"); if (on) { st.last = performance.now(); requestAnimationFrame(tick); } }
    function tick(now) {
      if (!st.playing) return;
      st.f += (now - st.last) / 1000 / BASE_S * st.speed; st.last = now;
      if (st.f >= 1) { st.f = 1; render(); setPlaying(false); return; }
      render(); requestAnimationFrame(tick);
    }
    play.addEventListener("click", function () { if (st.f >= 1) st.f = 0; setPlaying(!st.playing); });
    reset.addEventListener("click", function () { st.f = 0; setPlaying(false); render(); });
    scrub.addEventListener("input", function () { setPlaying(false); st.f = Number(scrub.value) / 1000; render(true); play.textContent = st.f >= 1 ? "Replay" : "Play"; });
    speedSel.addEventListener("change", function () { st.speed = Number(speedSel.value); });
    function size() { sides.forEach(function (s) { if (s.cv) fit(s.cv, 0.94); }); render(true); }
    addEventListener("resize", size); size();
    st.f = opt.open == null ? 0.4 : opt.open; render();
  }
  window.Banyan = { mount: mount, still: still, LEFT: LEFT, RIGHT: RIGHT, MARK: MARK };
})();
