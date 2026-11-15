/* Test sahifasini himoyalash:
 * - Test faqat to'liq ekran rejimida ko'rinadi (qo'llab-quvvatlanadigan qurilmalarda)
 * - Oynadan chiqilganda, boshqa ilovaga o'tilganda, PrintScreen / screenshot
 *   tugmalari bosilganda sahifa darhol yopiladi (xiralashadi)
 * - Nusxa olish, o'ng tugma, belgilash, chop etish, saqlash, DevTools tugmalari bloklanadi
 * Eslatma: brauzer operatsion tizim darajasidagi screenshotni 100% to'xtata olmaydi,
 * bu himoya uni imkon qadar qiyinlashtiradi.
 */
(function () {
  var doc = document.documentElement;
  var fsSupported = !!(doc.requestFullscreen || doc.webkitRequestFullscreen);
  var guard, msg, btn;

  function isFs() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }
  function enterFs() {
    try {
      var p = doc.requestFullscreen ? doc.requestFullscreen({ navigationUI: "hide" }) : doc.webkitRequestFullscreen();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  function build() {
    guard = document.createElement("div");
    guard.id = "guard";
    guard.innerHTML =
      '<div class="guard-box"><div class="guard-icon">🔒</div>' +
      '<p id="guard-msg"></p>' +
      '<button id="guard-btn" class="btn primary"></button></div>';
    document.body.appendChild(guard);
    msg = document.getElementById("guard-msg");
    btn = document.getElementById("guard-btn");
    btn.onclick = function () {
      if (fsSupported && !isFs()) enterFs();
      locked = false;
      reason = "";
      render();
    };
  }

  var locked = false, reason = "";
  function lock(why) {
    locked = true;
    reason = why || reason;
    document.body.classList.add("shielded");
    render();
  }
  function render() {
    var needFs = fsSupported && !isFs();
    var show = locked || needFs;
    document.body.classList.toggle("shielded", show);
    guard.style.display = show ? "flex" : "none";
    if (!show) return;
    msg.textContent = reason ||
      "Test faqat to'liq ekran rejimida ishlaydi. Davom etish uchun to'liq ekranga o'ting.";
    btn.textContent = needFs ? "To'liq ekranda davom etish" : "Davom etish";
  }

  // To'liq ekrandan chiqish
  ["fullscreenchange", "webkitfullscreenchange"].forEach(function (ev) {
    document.addEventListener(ev, function () {
      if (!isFs()) lock("Siz to'liq ekran rejimidan chiqdingiz. Testni davom ettirish uchun qayta kiring.");
      else render();
    });
  });

  // Boshqa oyna/ilovaga o'tish, ekran kesish vositalari (Snipping Tool va h.k.) fokusni oladi
  window.addEventListener("blur", function () {
    lock("Sahifa fokusdan chiqdi. Test vaqtida boshqa oyna yoki dasturga o'tish mumkin emas.");
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) lock("Siz boshqa ilova yoki tabga o'tdingiz. Davom etish uchun tugmani bosing.");
  });

  function wipeClipboard() {
    try {
      var p = navigator.clipboard && navigator.clipboard.writeText(" ");
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  // Klaviatura
  function onKey(e) {
    var k = (e.key || "").toLowerCase();
    var ctrl = e.ctrlKey || e.metaKey;
    var screenshot =
      k === "printscreen" || e.keyCode === 44 ||
      (e.metaKey && e.shiftKey) ||                       // macOS: Cmd+Shift+3/4/5, Windows: Win+Shift+S
      k === "meta" || k === "os";                        // Win / Cmd tugmasi
    if (screenshot) {
      wipeClipboard();
      lock("Ekran rasmini olish taqiqlangan.");
      e.preventDefault();
      return false;
    }
    var blocked =
      k === "f12" ||
      (ctrl && ["p", "s", "u", "c", "x", "a"].indexOf(k) >= 0) ||
      (ctrl && e.shiftKey && ["i", "j", "c", "k"].indexOf(k) >= 0);
    if (blocked) { e.preventDefault(); e.stopPropagation(); return false; }
  }
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("keyup", function (e) {
    if ((e.key || "").toLowerCase() === "printscreen" || e.keyCode === 44) {
      wipeClipboard();
      lock("Ekran rasmini olish taqiqlangan.");
    }
  }, true);

  // Nusxa olish, o'ng tugma, belgilash, sudrash
  ["copy", "cut", "contextmenu", "selectstart", "dragstart"].forEach(function (ev) {
    document.addEventListener(ev, function (e) { e.preventDefault(); }, true);
  });
  // Chop etish
  window.addEventListener("beforeprint", function () { lock("Chop etish taqiqlangan."); });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  function init() { build(); render(); }
})();
