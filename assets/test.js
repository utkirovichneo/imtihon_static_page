(function () {
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var sid = params.get("s");
  var subject = (window.SUBJECTS || []).filter(function (s) { return s.id === sid; })[0];
  if (!subject || !subject.ready) { location.href = "index.html"; return; }

  document.title = subject.name + " — Test";
  $("title").textContent = subject.name;

  var sc = document.createElement("script");
  sc.src = "data/" + sid + ".js";
  sc.onload = init;
  sc.onerror = function () { $("setup-info").textContent = "Savollar faylini yuklab bo'lmadi."; };
  document.head.appendChild(sc);

  var ALL, quiz, idx, startTime, timerId, limitSec, lastWrongIds = [];
  var LETTERS = ["A", "B", "C", "D", "E", "F"];

  function store(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function read(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; } }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(sec) { var m = Math.floor(sec / 60), s = sec % 60; return m + ":" + (s < 10 ? "0" : "") + s; }

  function init() {
    ALL = ((window.SUBJECT_DATA || {})[sid] || []).map(function (q, i) { return { id: i, q: q.q, o: q.o, a: q.a }; });
    $("setup-info").textContent = "Jami " + ALL.length + " ta savol. Har bir javob belgilanganda to'g'ri yoki xatoligi darhol ko'rsatiladi.";
    var sel = $("opt-count");
    [10, 20, 30, 50].filter(function (n) { return n < ALL.length; }).forEach(function (n) {
      sel.add(new Option(n + " ta", n));
    });
    sel.add(new Option("Hammasi (" + ALL.length + " ta)", ALL.length));
    sel.value = ALL.length;
    $("start").onclick = function () { start(null); };
  }

  function start(onlyIds) {
    var pool = onlyIds ? ALL.filter(function (q) { return onlyIds.indexOf(q.id) >= 0; }) : ALL;
    if ($("opt-shuffle-q").checked) pool = shuffle(pool);
    if (!onlyIds) pool = pool.slice(0, +$("opt-count").value);
    var shuffleO = $("opt-shuffle-o").checked;
    quiz = pool.map(function (q) {
      var order = q.o.map(function (_, i) { return i; });
      if (shuffleO) order = shuffle(order);
      return { src: q, order: order, picked: null };
    });
    idx = 0;
    startTime = Date.now();
    limitSec = +$("opt-time").value * 60;
    clearInterval(timerId);
    $("timer").classList.remove("hidden");
    tick();
    timerId = setInterval(tick, 1000);
    show("quiz");
    buildPalette();
    render();
  }

  function tick() {
    var el = Math.floor((Date.now() - startTime) / 1000);
    if (limitSec) {
      var left = limitSec - el;
      $("timer").textContent = "⏱ " + fmt(Math.max(0, left));
      $("timer").classList.toggle("warn", left <= 60);
      if (left <= 0) finish();
    } else {
      $("timer").textContent = "⏱ " + fmt(el);
    }
  }

  function show(which) {
    ["setup", "quiz", "result"].forEach(function (s) { $(s).classList.toggle("hidden", s !== which); });
    window.scrollTo(0, 0);
  }

  function render() {
    var item = quiz[idx], q = item.src;
    $("counter").textContent = "Savol " + (idx + 1) + " / " + quiz.length;
    $("q-text").textContent = (idx + 1) + ". " + q.q;
    var box = $("options");
    box.innerHTML = "";
    item.order.forEach(function (oi, pos) {
      var b = document.createElement("button");
      b.className = "opt";
      b.innerHTML = '<span class="letter">' + LETTERS[pos] + '</span><span>' + esc(q.o[oi]) + '</span>';
      if (item.picked !== null) {
        b.disabled = true;
        if (oi === q.a) b.classList.add("correct");
        else if (oi === item.picked) b.classList.add("wrong");
      } else {
        b.onclick = function () { pick(oi); };
      }
      box.appendChild(b);
    });
    var fb = $("feedback");
    if (item.picked === null) { fb.className = "feedback hidden"; }
    else if (item.picked === q.a) { fb.className = "feedback ok"; fb.textContent = "✓ To'g'ri!"; }
    else {
      fb.className = "feedback bad";
      fb.innerHTML = "✗ Xato. To'g'ri javob: <b>" + LETTERS[item.order.indexOf(q.a)] + ") " + esc(q.o[q.a]) + "</b>";
    }
    $("prev").disabled = idx === 0;
    $("next").textContent = idx === quiz.length - 1 ? "Natijani ko'rish" : "Keyingi →";
    updateLive();
  }

  function pick(oi) {
    quiz[idx].picked = oi;
    render();
  }

  function updateLive() {
    var ok = 0, bad = 0, done = 0;
    quiz.forEach(function (it, i) {
      var cell = $("palette").children[i];
      cell.className = "cell" + (i === idx ? " current" : "");
      if (it.picked !== null) {
        done++;
        if (it.picked === it.src.a) { ok++; cell.classList.add("ok"); } else { bad++; cell.classList.add("bad"); }
      }
    });
    $("live-ok").textContent = ok;
    $("live-bad").textContent = bad;
    $("bar-fill").style.width = (done / quiz.length * 100) + "%";
  }

  function buildPalette() {
    var p = $("palette");
    p.innerHTML = "";
    quiz.forEach(function (_, i) {
      var c = document.createElement("button");
      c.className = "cell";
      c.textContent = i + 1;
      c.onclick = function () { idx = i; render(); };
      p.appendChild(c);
    });
  }

  $("prev").onclick = function () { if (idx > 0) { idx--; render(); } };
  $("next").onclick = function () {
    if (idx < quiz.length - 1) { idx++; render(); }
    else confirmFinish();
  };
  $("finish").onclick = confirmFinish;
  document.addEventListener("keydown", function (e) {
    if ($("quiz").classList.contains("hidden")) return;
    var k = e.key.toUpperCase();
    var pos = LETTERS.indexOf(k);
    if (pos < 0 && /^[1-6]$/.test(k)) pos = +k - 1;
    if (pos >= 0 && quiz[idx].picked === null && pos < quiz[idx].order.length) pick(quiz[idx].order[pos]);
    else if (e.key === "ArrowRight" || e.key === "Enter") $("next").click();
    else if (e.key === "ArrowLeft") $("prev").click();
  });

  function confirmFinish() {
    var left = quiz.filter(function (it) { return it.picked === null; }).length;
    if (left) {
      var fb = $("feedback");
      if (fb.dataset.confirm !== "1") {
        fb.className = "feedback warn";
        fb.innerHTML = left + " ta savolga javob berilmagan. Baribir yakunlash uchun «Yakunlash» tugmasini yana bir bor bosing.";
        fb.dataset.confirm = "1";
        setTimeout(function () { fb.dataset.confirm = ""; }, 5000);
        return;
      }
    }
    finish();
  }

  function finish() {
    clearInterval(timerId);
    $("feedback").dataset.confirm = "";
    var sec = Math.floor((Date.now() - startTime) / 1000);
    var ok = 0, bad = 0, skip = 0;
    lastWrongIds = [];
    quiz.forEach(function (it) {
      if (it.picked === null) { skip++; lastWrongIds.push(it.src.id); }
      else if (it.picked === it.src.a) ok++;
      else { bad++; lastWrongIds.push(it.src.id); }
    });
    var pct = Math.round(ok / quiz.length * 100);
    $("r-ok").textContent = ok;
    $("r-bad").textContent = bad;
    $("r-skip").textContent = skip;
    $("r-time").textContent = fmt(sec);
    $("score-pct").textContent = pct + "%";
    var color = pct >= 86 ? "var(--ok)" : pct >= 56 ? "var(--accent)" : "var(--bad)";
    $("score-ring").style.background = "conic-gradient(" + color + " " + pct * 3.6 + "deg, var(--line) 0)";
    var grade = pct >= 86 ? "A'lo (5)" : pct >= 71 ? "Yaxshi (4)" : pct >= 56 ? "Qoniqarli (3)" : "Qoniqarsiz (2)";
    $("score-title").textContent = ok + " / " + quiz.length + " — " + grade;
    $("retry-wrong").classList.toggle("hidden", !lastWrongIds.length);

    var hist = read("hist_" + sid) || [];
    hist.push({ date: Date.now(), correct: ok, total: quiz.length, pct: pct, sec: sec });
    store("hist_" + sid, hist.slice(-50));

    renderReview("all");
    show("result");
    $("timer").classList.add("hidden");
  }

  function renderReview(filter) {
    var html = "";
    quiz.forEach(function (it, i) {
      var q = it.src;
      var st = it.picked === null ? "skip" : it.picked === q.a ? "ok" : "bad";
      if (filter !== "all" && filter !== st) return;
      html += '<div class="card rev ' + st + '"><div class="rev-head"><b>' + (i + 1) + '. ' + esc(q.q) + '</b>' +
        '<span class="chip ' + st + '">' + (st === "ok" ? "To'g'ri" : st === "bad" ? "Xato" : "Javobsiz") + '</span></div><ul>';
      it.order.forEach(function (oi, pos) {
        var cls = oi === q.a ? "correct" : oi === it.picked ? "wrong" : "";
        html += '<li class="' + cls + '">' + LETTERS[pos] + ') ' + esc(q.o[oi]) +
          (oi === it.picked ? ' <em>(sizning javobingiz)</em>' : '') + '</li>';
      });
      html += "</ul></div>";
    });
    $("review").innerHTML = html || '<p class="muted">Bu bo\'limda savol yo\'q.</p>';
  }

  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
    t.onclick = function () {
      document.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("active"); });
      t.classList.add("active");
      renderReview(t.dataset.f);
    };
  });
  $("retry").onclick = function () { $("timer").classList.add("hidden"); show("setup"); };
  $("retry-wrong").onclick = function () { start(lastWrongIds.slice()); };
})();
