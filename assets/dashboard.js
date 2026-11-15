(function () {
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; }
  }
  var subjects = window.SUBJECTS || [];
  var ready = subjects.filter(function (s) { return s.ready; });
  var pending = ready.length;
  if (!pending) render();
  ready.forEach(function (s) {
    var sc = document.createElement("script");
    sc.src = "data/" + s.id + ".js";
    sc.onload = sc.onerror = function () { if (--pending === 0) render(); };
    document.head.appendChild(sc);
  });

  function render() {
  var data = window.SUBJECT_DATA || {};
  var grid = document.getElementById("subjects");
  var totalQ = 0, totalAttempts = 0, bestOverall = null;

  subjects.forEach(function (s) {
    var qs = data[s.id];
    var count = qs ? qs.length : 0;
    var hist = load("hist_" + s.id) || [];
    totalQ += count;
    totalAttempts += hist.length;
    var best = hist.reduce(function (m, h) { return Math.max(m, h.pct); }, -1);
    if (best >= 0) bestOverall = Math.max(bestOverall || 0, best);
    var last = hist[hist.length - 1];

    var el = document.createElement(s.ready && count ? "a" : "div");
    el.className = "card subject" + (s.ready && count ? "" : " disabled");
    if (s.ready && count) el.href = "test.html?s=" + encodeURIComponent(s.id);
    el.innerHTML =
      '<div class="subj-icon">' + s.icon + '</div>' +
      '<div class="subj-body"><h3>' + s.name + '</h3><p class="muted">' + s.desc + '</p>' +
      '<div class="chips">' +
      (count ? '<span class="chip">' + count + ' ta savol</span>' : '<span class="chip">Tez orada</span>') +
      (best >= 0 ? '<span class="chip ok">Eng yaxshi: ' + best + '%</span>' : '') +
      (last ? '<span class="chip">Oxirgi: ' + last.correct + '/' + last.total + '</span>' : '') +
      '</div></div>' +
      (s.ready && count ? '<span class="go">Boshlash →</span>' : '');
    grid.appendChild(el);
  });

  document.getElementById("stats").innerHTML =
    stat(subjects.filter(function (s) { return s.ready; }).length + " / " + subjects.length, "Faol fanlar") +
    stat(totalQ, "Jami savollar") +
    stat(totalAttempts, "Urinishlar") +
    stat(bestOverall === null ? "—" : bestOverall + "%", "Eng yaxshi natija");
  }

  function stat(v, l) { return '<div class="card stat"><b>' + v + '</b><span class="muted">' + l + '</span></div>'; }
})();
