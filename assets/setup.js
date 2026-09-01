/* Tailored install guide — runs only on the page that contains #setup-wizard.
   The installer picks the exact model, a power method and a first-contact
   method; this assembles a step-by-step manual for that one unit. Deep link:
   install.html?model=621e  preselects the model and scrolls to the section. */
(function () {
  "use strict";
  var root = document.getElementById("setup-wizard");
  if (!root) return;

  /* id -> facts the generated text needs. Names/standards are language-neutral;
     watt is a number so the unit can be localised. dc = 0 | 12 | 48. */
  var MODELS = {
    "521":  { name: "DS‑3WAP521‑SI",  mount: "wall",    wifi: 5, dc: 0,  poe: "802.3af/at", watt: 8,     ports: 2, uplink: 1,   wpa3: false, outdoor: false },
    "621e": { name: "DS‑3WAP621E‑SI", mount: "wall",    wifi: 6, dc: 0,  poe: "802.3af/at", watt: 13,    ports: 2, uplink: 1,   wpa3: true,  outdoor: false },
    "522":  { name: "DS‑3WAP522‑SI",  mount: "ceiling", wifi: 5, dc: 12, poe: "802.3af/at", watt: 11.35, ports: 1, uplink: 1,   wpa3: false, outdoor: false },
    "622g": { name: "DS‑3WAP622G‑SI", mount: "ceiling", wifi: 6, dc: 12, poe: "802.3af/at", watt: 11.35, ports: 1, uplink: 1,   wpa3: true,  outdoor: false },
    "6218": { name: "DS‑3WAP6218‑EI", mount: "ceiling", wifi: 6, dc: 12, poe: "802.3at",    watt: 18,    ports: 2, uplink: 1,   wpa3: true,  outdoor: false },
    "622e": { name: "DS‑3WAP622E‑SI", mount: "ceiling", wifi: 6, dc: 12, poe: "802.3af/at", watt: 13.5,  ports: 1, uplink: 2.5, wpa3: true,  outdoor: false },
    "5312": { name: "DS‑3WAP5312‑EI", mount: "outdoor", wifi: 5, dc: 0,  poe: "802.3at",    watt: 18,    ports: 2, uplink: 1,   wpa3: false, outdoor: true  },
    "623e": { name: "DS‑3WAP623E‑SI", mount: "outdoor", wifi: 6, dc: 48, poe: "802.3af/at", watt: 14.4,  ports: 1, uplink: 1,   wpa3: true,  outdoor: true  }
  };

  var state = { model: null, power: null, reach: null };

  var PHOTO = {
    "521":  "assets/images/DS-3WAP521-SI.jpg",
    "621e": "assets/images/DS-3WAP621E-SI.jpg",
    "522":  "assets/images/DS-3WAP522-SI.webp",
    "622g": "assets/images/DS-3WAP622G-SI.jpg",
    "6218": "assets/images/DS-3WAP6218-EI.png",
    "622e": "assets/images/DS-3WAP622E-SI.jpg",
    "5312": "assets/images/DS-3WAP5312-EI.png",
    "623e": "assets/images/DS-3WAP623E-SI.jpg"
  };

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

  function esc(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function wattLabel(m) { return m.watt + " " + t("su.u.w", "W"); }
  function dcLabel(m)   { return t(m.dc === 48 ? "su.dc.48" : "su.dc.12", m.dc + " V DC"); }

  var HP_SHOTS = [
    ["hp-01-sites.png",        "hp.c1"],
    ["hp-02-new-device.png",   "hp.c2"],
    ["hp-03-find-devices.png", "hp.c3"],
    ["hp-04-activate.png",     "hp.c4"],
    ["hp-05-init.png",         "hp.c5"],
    ["hp-06-wifi.png",         "hp.c6"],
    ["hp-07-add-site.png",     "hp.c7"],
    ["hp-08-done.png",         "hp.c8"]
  ];
  function hpGallery() {
    var shots = HP_SHOTS.map(function (s, i) {
      return '<figure class="hp-shot"><span class="hp-n">' + (i + 1) + '</span>' +
        '<img src="assets/images/hikpartner/' + s[0] + '" alt="" loading="lazy">' +
        '<figcaption class="hp-cap">' + esc(t(s[1], "")) + "</figcaption></figure>";
    }).join("");
    return '<p class="hp-gallery-h">' + esc(t("hp.h", "The app, screen by screen:")) + "</p>" +
      '<div class="hp-gallery">' + shots + "</div>";
  }

  function singleShot(src, capKey) {
    return '<div class="hp-gallery"><figure class="hp-shot" style="width:150px">' +
      '<img src="' + src + '" alt="" loading="lazy">' +
      '<figcaption class="hp-cap">' + esc(t(capKey, "")) + "</figcaption></figure></div>";
  }

  function build(m) {
    var pwr, notes1 = [];
    if (state.power === "switch") {
      pwr = t("su.pwr.switch", "").replace("{poe}", m.poe).replace("{watt}", wattLabel(m));
    } else if (state.power === "injector") {
      pwr = t("su.pwr.injector", "");
    } else {
      pwr = t("su.pwr.dc", "").replace("{dcv}", dcLabel(m));
      if (!m.dc) notes1.push(t("su.note.nodc", ""));
    }
    if (state.power === "dc" && m.dc && m.ports >= 2) notes1.push(t("su.note.dc2port", ""));
    if (state.power !== "dc" && m.ports >= 2)          notes1.push(t("su.note.pass2port", ""));
    if (m.uplink >= 2.5)                               notes1.push(t("su.note.uplink25", ""));
    if (m.outdoor)                                     notes1.push(t("su.note.outdoor", ""));
    if (state.model === "623e")                        notes1.push(t("su.note.623ewind", ""));

    var wifiNote = m.wpa3 ? t("su.note.wpa3", "") : t("su.note.nowpa3", "");

    var actShot = "";
    if (state.reach === "sadp") {
      actShot = singleShot("assets/images/activation/act-sadp.png", "act.c1");
    } else if (state.reach === "dhcp" || state.reach === "direct") {
      actShot = singleShot("assets/images/activation/act-web.png", "act.c2");
    }

    var chips = [
      t("su.sub." + m.mount, m.mount),
      "Wi‑Fi " + m.wifi,
      t("su.chip." + state.power, state.power)
    ];

    function step(h, body, notes, extra) {
      var n = (notes || []).filter(Boolean).map(function (x) {
        return '<p class="su-note">' + x + "</p>";
      }).join("");
      return '<li class="su-step"><h4>' + esc(h) + "</h4><p>" + body + "</p>" + n + (extra || "") + "</li>";
    }

    var more = [
      ["#power",     t("in.toc.2", "")],
      ["#find",      t("in.toc.3", "")],
      ["#activate",  t("in.toc.4", "")],
      ["#configure", t("in.toc.5", "")],
      ["#wifi",      t("in.toc.6", "")],
      ["#handover",  t("in.toc.7", "")],
      ["#trouble",   t("in.toc.8", "")]
    ].map(function (p) {
      return '<a href="' + p[0] + '">' + esc(p[1]) + "</a>";
    }).join("");

    return (
      '<div class="wr-tag">' +
        '<svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg> ' +
        esc(t("su.result.tag", "Manual for this install")) +
      "</div>" +
      '<div class="wr-top">' +
        '<img class="wr-photo" src="' + PHOTO[state.model] + '" alt="" loading="lazy">' +
        '<div class="wr-top-text">' +
          '<div class="su-model mono">' + esc(m.name) + "</div>" +
          '<div class="su-sub">' + esc(chips.join(" · ")) + "</div>" +
        "</div>" +
      "</div>" +
      '<ol class="su-steps">' +
        step(t("su.s1.h", ""), pwr, notes1) +
        step(t("su.s2.h", ""), t("su.reach." + state.reach, ""), [], state.reach === "hikpartner" ? hpGallery() : "") +
        step(t("su.s3.h", ""), t("su.s3.p", ""), [], actShot) +
        step(t("su.s4.h", ""), t("su.s4.p", ""), [wifiNote]) +
        step(t("su.s5.h", ""), t("su.s5.p", ""), []) +
      "</ol>" +
      '<div class="su-more"><span class="su-more-h">' + esc(t("su.more", "Full sections:")) + "</span>" + more + "</div>" +
      '<a class="wr-jump" href="catalog.html#card-' + state.model + '">' + esc(t("su.jump.catalog", "Open the model card")) + "</a>"
    );
  }

  function render() {
    var m = state.model ? MODELS[state.model] : null;

    // The DC option only exists for models with a DC input.
    var dcBtn = root.querySelector('.wopt[data-v="dc"]');
    if (dcBtn) {
      dcBtn.hidden = m ? !m.dc : false;
      if (m && !m.dc && state.power === "dc") state.power = null;
    }

    root.querySelectorAll(".wopt").forEach(function (b) {
      var on = state[b.getAttribute("data-q")] === b.getAttribute("data-v");
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });

    var req = ["model", "power", "reach"];
    var answered = req.filter(function (k) { return state[k]; }).length;
    var fill = root.querySelector(".wizard-progress-fill");
    var ptext = root.querySelector(".wizard-progress-text");
    if (fill) fill.style.width = Math.round((answered / req.length) * 100) + "%";
    if (ptext) {
      ptext.textContent = t("su.progress", "Answered {n} of {total}")
        .replace("{n}", answered).replace("{total}", req.length);
    }

    var out = root.querySelector(".wresult");
    var ph = root.querySelector(".wresult-placeholder");
    if (!(state.model && state.power && state.reach)) {
      if (out) { out.hidden = true; out.innerHTML = ""; }
      if (ph) ph.hidden = false;
      return;
    }
    if (ph) ph.hidden = true;
    if (out) {
      out.innerHTML = build(MODELS[state.model]);
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
      state.model = state.power = state.reach = null;
      render();
      root.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  });

  document.querySelectorAll(".langbtn").forEach(function (b) {
    b.addEventListener("click", function () { setTimeout(render, 0); });
  });

  // Deep link from a catalog card: install.html?model=<id>
  try {
    var pre = new URLSearchParams(location.search).get("model");
    if (pre && MODELS[pre]) {
      state.model = pre;
      setTimeout(function () {
        var sec = document.getElementById("tailored");
        if (sec) sec.scrollIntoView({ block: "start", behavior: "smooth" });
      }, 120);
    }
  } catch (e) {}

  render();
})();
