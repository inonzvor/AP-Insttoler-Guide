/* Shared chrome: theme toggle, language switch (English-first with fallback),
   service-worker registration, PWA install button, active nav tab. Loaded on
   every page. */
(function () {
  "use strict";

  /* ---------- theme ---------- */
  function applyTheme(theme) {
    var next = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    document.body.setAttribute("data-theme", next);
    var button = document.querySelector(".theme-toggle");
    if (button) {
      button.textContent = next === "dark" ? "☀️" : "🌙";
      button.setAttribute("aria-label", next === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
    try { localStorage.setItem("hikvision-ap-theme", next); } catch (e) {}
  }

  /* ---------- language ---------- */
  function dictFor(lang) {
    return (window.I18N && window.I18N[lang]) || {};
  }
  function resolve(dict, en, key) {
    if (dict[key] !== undefined) return dict[key];
    if (en[key] !== undefined) return en[key];   // fall back to English
    return undefined;                             // then leave in-HTML default
  }

  function applyLanguage(lang) {
    var dict = dictFor(lang);
    var en = dictFor("en");
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = resolve(dict, en, el.getAttribute("data-i18n"));
      if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var v = resolve(dict, en, el.getAttribute("data-i18n-html"));
      if (v !== undefined) el.innerHTML = v;
    });
    var isRtl = lang === "he";
    document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
    var title = resolve(dict, en, "hdr.h1");
    if (title) document.title = title + (document.body.dataset.pagetitle ? " — " + document.body.dataset.pagetitle : "");
    document.querySelectorAll(".langbtn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === lang);
    });
    try { localStorage.setItem("hikvision-ap-lang", lang); } catch (e) {}
  }

  document.querySelectorAll(".langbtn").forEach(function (btn) {
    btn.addEventListener("click", function () { applyLanguage(btn.getAttribute("data-lang")); });
  });

  var initialLang = "en";
  try {
    var savedLang = localStorage.getItem("hikvision-ap-lang");
    if (savedLang === "ru" || savedLang === "en" || savedLang === "he") initialLang = savedLang;
  } catch (e) {}
  applyLanguage(initialLang);

  var savedTheme = "light";
  try { savedTheme = localStorage.getItem("hikvision-ap-theme") || "light"; } catch (e) {}
  if (savedTheme !== "dark" && savedTheme !== "light") {
    savedTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  applyTheme(savedTheme);

  var themeToggle = document.querySelector(".theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var current = document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

  /* ---------- active nav tab ---------- */
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav.sitenav a").forEach(function (a) {
    var target = a.getAttribute("href").split("#")[0];
    if (target === here || (here === "" && target === "index.html")) {
      a.setAttribute("aria-current", "page");
    }
  });

  /* ---------- service worker ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }

  /* ---------- PWA install button ---------- */
  var installBtn = document.getElementById("installBtn");
  var installTip = document.getElementById("installTip");
  var installTipClose = document.getElementById("installTipClose");
  if (!installBtn) return;

  function isStandalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;
  }
  if (isStandalone()) return;

  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  var deferredPrompt = null;

  if (isIOS) {
    installBtn.hidden = false;
    installBtn.addEventListener("click", function () { if (installTip) installTip.hidden = false; });
    if (installTipClose) installTipClose.addEventListener("click", function () { installTip.hidden = true; });
    if (installTip) installTip.addEventListener("click", function (e) { if (e.target === installTip) installTip.hidden = true; });
  } else {
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferredPrompt = e;
      installBtn.hidden = false;
    });
    installBtn.addEventListener("click", function () {
      if (!deferredPrompt) return;
      installBtn.hidden = true;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () { deferredPrompt = null; });
    });
    window.addEventListener("appinstalled", function () {
      installBtn.hidden = true;
      deferredPrompt = null;
    });
  }
})();
