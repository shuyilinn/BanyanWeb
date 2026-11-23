// What each use-case page shows around its trees. Every number is a measured total read from the stored runs.
(function () {
  "use strict";
  var n = function (x) { return Math.round(x).toLocaleString("en-US"); };
  var pct = function (x) { return x >= 0.1 ? (100 * x).toFixed(0) + "%" : x >= 0.01 ? (100 * x).toFixed(1) + "%" : (100 * x).toFixed(3) + "%"; };
  var secs = function (d) { return (d.seconds >= 100 ? n(d.seconds) : d.seconds.toFixed(1)) + " s"; };
  var CASES = {
    sampling: { subs: ["generate(n=1000)", "one tree"], samples: true,
      rows: function (d) { return d.par ? [["tokens generated", n(d.tokens)], ["time", secs(d)]]
                                        : [["samples", n(d.samples)], ["distinct samples", n(d.distinct)], ["tokens generated", n(d.tokens)], ["time", secs(d)]]; } },
    risk: { subs: ["no steering", "steered proposal"], marked: "judged harmful", samples: true, open: 1,
      rows: function (d) { return [["time, with judging", secs(d)]]; } },
    search: { subs: ["microsoft/rStar on vLLM", "same algorithm"], marked: "answers valued +1",
      rows: function (d) { return (d.replay ? [] : [["tokens in the tree", n(d.nodes - 1)]]).concat([["tokens generated", n(d.tokens)], ["time, 16 questions", secs(d)]]); } },
    jailbreak: { subs: ["BOA on HF transformers", "same algorithm"],
      rows: function (d) { return (d.replay ? [] : [["tree nodes", n(d.nodes)]]).concat([["nodes scored", n(d.scored)], ["tokens generated", n(d.tokens)], ["time", secs(d)]]); } }
  };
  function run(key, left, right) {
    var pair = window.RUNS[key], c = CASES[key];
    document.getElementById("prompt").textContent = pair.prompt;
    var drawn = function (d) { return d.drawn === d.nodes ? "all " + n(d.nodes) + " nodes" : n(d.drawn) + " of " + n(d.nodes) + " nodes"; };
    document.getElementById("ratio").textContent = (pair.left.par ? "left: " + drawn(pair.left) + "; right: " : "") + drawn(pair.right);
    Banyan.mount(document.getElementById("stage"), pair, { left: { name: left, sub: c.subs[0] }, right: { name: right, sub: c.subs[1] },
      marked: c.marked, rows: c.rows, open: c.open, samples: c.samples });
    var su = document.getElementById("setup");
    if (su && pair.setup) {
      var tr = document.createElement("tr");
      ["", left, right].forEach(function (x) { var th = document.createElement("th"); th.textContent = x; tr.appendChild(th); });
      var thd = document.createElement("thead"); thd.appendChild(tr); su.appendChild(thd);
      var tbd = document.createElement("tbody");
      pair.setup.forEach(function (r) { var t = document.createElement("tr"); r.forEach(function (x, i) { var td = document.createElement(i ? "td" : "th"); td.textContent = x; t.appendChild(td); }); tbd.appendChild(t); });
      su.appendChild(tbd);
    }
    if (key === "risk") {
      var NAMES = ["Phishing email", "Hate-speech bot", "Propaganda tips", "Bot network", "Plagiarism (shown above)", "Watermark removal"], tbl = document.getElementById("riskTable");
      var row = function (cells, tag) { var tr = document.createElement("tr"); cells.forEach(function (x, i) { var td = document.createElement(tag); td.textContent = x; if (i) td.className = "num"; tr.appendChild(td); }); return tr; };
      var th = document.createElement("thead"); th.appendChild(row(["Request", "Brute force (10,000)", "Banyan (1,000)", "Harmful found", "By plain sampling"], "th")); tbl.appendChild(th);
      var tb = document.createElement("tbody"); pair.table.forEach(function (x, i) { tb.appendChild(row([NAMES[i], pct(x.mc), pct(x.est), x.hits, x.plain], "td")); }); tbl.appendChild(tb);
    }
  }
  window.Page = { run: run };
})();
