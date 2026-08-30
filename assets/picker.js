/* Model picker (wizard) — runs only on the page that contains #wizard.
   Scores all 8 DS-3WAP models against the installer's answers, shows a primary
   recommendation plus alternatives. */
(function () {
  "use strict";
  var root = document.getElementById("wizard");
  if (!root) return;

  var MODELS = [
    { id: "521",  name: "DS‑3WAP521‑SI",  mount: "wall",    wifi: 5, cap: 50,  dc: false, ports: 2, uplink: 1,   wpa3: false },
    { id: "621e", name: "DS‑3WAP621E‑SI", mount: "wall",    wifi: 6, cap: 120, dc: false, ports: 2, uplink: 1,   wpa3: true  },
    { id: "522",  name: "DS‑3WAP522‑SI",  mount: "ceiling", wifi: 5, cap: 80,  dc: true,  ports: 1, uplink: 1,   wpa3: false },
    { id: "622g", name: "DS‑3WAP622G‑SI", mount: "ceiling", wifi: 6, cap: 100, dc: true,  ports: 1, uplink: 1,   wpa3: true  },
    { id: "6218", name: "DS‑3WAP6218‑EI", mount: "ceiling", wifi: 6, cap: 100, dc: true,  ports: 2, uplink: 1,   wpa3: true  },
    { id: "622e", name: "DS‑3WAP622E‑SI", mount: "ceiling", wifi: 6, cap: 150, dc: true,  ports: 1, uplink: 2.5, wpa3: true  },
    { id: "5312", name: "DS‑3WAP5312‑EI", mount: "outdoor", wifi: 5, cap: 128, dc: false, ports: 2, uplink: 1,   wpa3: false, climate: "mild"  },
    { id: "623e", name: "DS‑3WAP623E‑SI", mount: "outdoor", wifi: 6, cap: 150, dc: false, ports: 1, uplink: 1,   wpa3: true,  climate: "harsh" }
  ];
  var NEED = { light: 15, normal: 50, dense: 95 };

  var state = { mount: null, density: null, wifi: null, power: null, passthrough: null, climate: null };

  function t(key, fallback) {
    try {
      var lang = document.documentElement.getAttribute("lang") || "en";
      var d = window.I18N && window.I18N[lang];
      if (d && d[key] != null) return d[key];
      var en = window.I18N && window.I18N.en;
      if (en && en[key] != null) return en[key];
    } catch (e) {}
    return fallback;
  }

  function score(m) {
    var s = 0;
    var need = NEED[state.density] || 50;

    if (m.cap >= need) s += 3 - Math.min(2, (m.cap - need) / 120);
    else s -= 6;

    if (state.wifi === "w5")          s += (m.wifi === 5) ? 2 : 0.5;
    else if (state.wifi === "w6")     s += (m.wifi === 6) ? 3 : -3;
    else if (state.wifi === "w6plus") s += (m.wifi === 6 && m.wpa3) ? 4 : -8;

    if (state.power === "mains")       s += m.dc ? 3 : -10;
    else if (state.power === "unsure") s += m.dc ? 1 : 0;

    if (state.passthrough === "yes")  s += (m.ports >= 2) ? 3 : -5;

    if (state.density === "dense" && m.uplink >= 2.5) s += 2;

    if (state.mount === "outdoor" && state.climate) s += (m.climate === state.climate) ? 3 : -3;

    return s;
  }

  function ready() {
    if (!state.mount || !state.density || !state.wifi || !state.power) return false;
    if (state.mount === "outdoor" && !state.climate) return false;
    return true;
  }

  function esc(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render() {
    var climQ = root.querySelector('.wq[data-when="outdoor"]');
    if (climQ) climQ.hidden = (state.mount !== "outdoor");
    if (state.mount !== "outdoor") state.climate = null;

    // Update aria-pressed and active classes
    root.querySelectorAll(".wopt").forEach(function (b) {
      var isSelected = (state[b.getAttribute("data-q")] === b.getAttribute("data-v"));
      b.classList.toggle("on", isSelected);
      b.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });

    // Calculate progress
    var requiredKeys = ["mount", "density", "wifi", "power"];
    if (state.mount === "outdoor") requiredKeys.push("climate");
    var totalRequired = requiredKeys.length;
    var answeredCount = 0;
    requiredKeys.forEach(function (k) {
      if (state[k] !== null) answeredCount++;
    });

    var progressFill = root.querySelector(".wizard-progress-fill");
    var progressText = root.querySelector(".wizard-progress-text");
    if (progressFill) {
      var pct = Math.round((answeredCount / totalRequired) * 100);
      progressFill.style.width = pct + "%";
    }
    if (progressText) {
      var progStr = t("wiz.progress", "Answered {n} of {total}")
        .replace("{n}", answeredCount)
        .replace("{total}", totalRequired);
      progressText.textContent = progStr;
    }

    var out = root.querySelector(".wresult");
    var placeholder = root.querySelector(".wresult-placeholder");

    if (!ready()) {
      if (out) { out.hidden = true; out.innerHTML = ""; }
      if (placeholder) placeholder.hidden = false;
      return;
    }

    if (placeholder) placeholder.hidden = true;

    var ranked = MODELS
      .filter(function (m) { return m.mount === state.mount; })
      .map(function (m) { return { m: m, s: score(m) }; })
      .sort(function (a, b) { return b.s - a.s; });

    var top = ranked[0].m;
    var alts = ranked.slice(1, 3)
      .filter(function (r) { return r.s > ranked[0].s - 9; })
      .map(function (r) { return r.m; });

    var chips = ["mount", "density", "wifi", "power"]
      .map(function (q) { return t("wiz.s." + state[q], state[q]); });
    if (state.passthrough === "yes") chips.push(t("wiz.s.passyes", "spare LAN port"));
    if (state.climate) chips.push(t("wiz.s." + state.climate, state.climate));

    var html =
      '<div class="wr-tag">' +
      '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg> ' +
      esc(t("wiz.rec", "Recommended")) + '</div>' +
      '<div class="wr-model mono">' + esc(top.name) + '</div>' +
      '<p class="wr-why">' + esc(t("result." + top.id + ".why", "")) + '</p>' +
      '<div class="wr-specs mono">' + t("result." + top.id + ".specs", "") + '</div>';

    if (alts.length) {
      html += '<div class="wr-alts"><span class="wr-alts-h">' + esc(t("wiz.alts", "Also consider")) + '</span>' +
        alts.map(function (a) {
          return '<div class="wr-alt"><b class="mono">' + esc(a.name) + '</b> — ' + esc(t("result." + a.id + ".not", "")) + '</div>';
        }).join("") + '</div>';
    }

    html += '<div class="wr-basis">' + esc(t("wiz.basis", "Based on") + ": " + chips.join(" · ")) + '</div>' +
      '<a class="wr-jump" href="catalog.html#card-' + top.id + '">' +
      esc(t("result.jump", "Full specs in the catalog ↓")) +
      ' <svg class="ui-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></a>';

    if (out) {
      out.innerHTML = html;
      out.hidden = false;
    }
  }

  root.addEventListener("click", function (e) {
    var opt = e.target.closest(".wopt");
    if (opt) {
      var q = opt.getAttribute("data-q");
      var v = opt.getAttribute("data-v");
      state[q] = (state[q] === v) ? null : v;
      render();
      return;
    }
    if (e.target.closest(".wreset")) {
      Object.keys(state).forEach(function (k) { state[k] = null; });
      render();
      root.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  });

  document.querySelectorAll(".langbtn").forEach(function (b) {
    b.addEventListener("click", function () { setTimeout(render, 0); });
  });

  render();
})();
