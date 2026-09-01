/* Shared chrome: theme toggle, language switch (English-first with fallback),
   service-worker registration, PWA install button, active nav tab, scroll effects.
   Loaded on every page. */
(function () {
  "use strict";

  /* ---------- theme ---------- */
  function applyTheme(theme) {
    var next = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    document.body.setAttribute("data-theme", next);
    var button = document.querySelector(".theme-toggle");
    if (button) {
      var isDark = (next === "dark");
      button.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
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
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var v = resolve(dict, en, el.getAttribute("data-i18n-placeholder"));
      if (v !== undefined) el.setAttribute("placeholder", v);
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      var v = resolve(dict, en, el.getAttribute("data-i18n-aria-label"));
      if (v !== undefined) el.setAttribute("aria-label", v);
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

  /* ---------- lightbox (click any guide or model photo to view it full size) ----------
     Delegated on document so it covers static images as well as dynamically
     injected content from wizard/setup.js. */
  (function () {
    var overlay = null;
    var lastFocusedEl = null;

    function ensureOverlay() {
      if (overlay) return overlay;
      overlay = document.createElement("div");
      overlay.className = "lightbox-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "Image preview");
      overlay.innerHTML =
        '<button type="button" class="lightbox-close" aria-label="Close image preview">&times;</button>' +
        '<img class="lightbox-img" alt="">';
      document.body.appendChild(overlay);
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay || e.target.classList.contains("lightbox-close")) closeLightbox();
      });
      return overlay;
    }

    function openLightbox(src, alt) {
      if (!src) return;
      lastFocusedEl = document.activeElement;
      var box = ensureOverlay();
      var img = box.querySelector(".lightbox-img");
      img.src = src;
      img.alt = alt || "";
      box.classList.add("open");
      var closeBtn = box.querySelector(".lightbox-close");
      if (closeBtn) {
        setTimeout(function () { closeBtn.focus(); }, 50);
      }
    }

    function closeLightbox() {
      if (overlay && overlay.classList.contains("open")) {
        overlay.classList.remove("open");
        if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
          lastFocusedEl.focus();
        }
      }
    }

    document.addEventListener("click", function (e) {
      var img = e.target.closest(".hp-shot img, .figure img, .prose img:not(.no-zoom), .device-visual img, .wr-photo, [data-zoomable]");
      if (img) {
        openLightbox(img.currentSrc || img.getAttribute("src"), img.getAttribute("alt"));
      }
    });

    document.addEventListener("keydown", function (e) {
      if (!overlay || !overlay.classList.contains("open")) return;
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "Tab") {
        var focusables = overlay.querySelectorAll("button, [tabindex]:not([tabindex='-1'])");
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  })();

  /* ---------- active nav tab ---------- */
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav.sitenav a").forEach(function (a) {
    var target = a.getAttribute("href").split("#")[0];
    if (target === here || (here === "" && target === "index.html")) {
      a.setAttribute("aria-current", "page");
    }
  });

  /* ---------- header scroll shadow ---------- */
  var appBar = document.getElementById("appBar") || document.querySelector("header.app-bar");
  if (appBar) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 10) {
        appBar.classList.add("scrolled");
      } else {
        appBar.classList.remove("scrolled");
      }
    }, { passive: true });
  }

  /* ---------- scroll animations & active TOC ---------- */
  if ("IntersectionObserver" in window) {
    // Reveal animations
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -40px 0px", threshold: 0.05 });

    document.querySelectorAll(".animate-in").forEach(function (el) {
      revealObserver.observe(el);
    });

    // Install TOC observer
    var sections = document.querySelectorAll(".install-layout section.anchor[id]");
    var tocLinks = document.querySelectorAll(".toc a");
    if (sections.length && tocLinks.length) {
      var tocObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute("id");
            tocLinks.forEach(function (link) {
              var href = link.getAttribute("href");
              if (href === "#" + id) {
                link.classList.add("active");
                if (window.innerWidth <= 840) {
                  link.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }
              } else {
                link.classList.remove("active");
              }
            });
          }
        });
      }, { rootMargin: "-80px 0px -65% 0px", threshold: 0.1 });

      sections.forEach(function (s) { tocObserver.observe(s); });
    }
  }

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

  /* ---------- Interactive Click Wi-Fi Wave Waves ---------- */
  (function initClickWifiRipples() {
    var container = null;
    var lastSpawnTime = 0;

    function getContainer() {
      if (container && document.body.contains(container)) return container;
      container = document.createElement("div");
      container.className = "click-wifi-canvas";
      container.setAttribute("aria-hidden", "true");
      document.body.appendChild(container);
      return container;
    }

    function createWifiPulse(x, y) {
      var c = getContainer();
      if (!c) return;

      var core = document.createElement("div");
      core.className = "click-wifi-core";
      core.style.left = x + "px";
      core.style.top = y + "px";

      var ring1 = document.createElement("div");
      ring1.className = "click-wifi-ripple ring-1";
      ring1.style.left = x + "px";
      ring1.style.top = y + "px";

      var ring2 = document.createElement("div");
      ring2.className = "click-wifi-ripple ring-2";
      ring2.style.left = x + "px";
      ring2.style.top = y + "px";

      var ring3 = document.createElement("div");
      ring3.className = "click-wifi-ripple ring-3";
      ring3.style.left = x + "px";
      ring3.style.top = y + "px";

      c.appendChild(core);
      c.appendChild(ring1);
      c.appendChild(ring2);
      c.appendChild(ring3);

      setTimeout(function () {
        if (core.parentNode) core.parentNode.removeChild(core);
        if (ring1.parentNode) ring1.parentNode.removeChild(ring1);
        if (ring2.parentNode) ring2.parentNode.removeChild(ring2);
        if (ring3.parentNode) ring3.parentNode.removeChild(ring3);
      }, 1600);
    }

    window.addEventListener("pointerdown", function (e) {
      // Throttle rapid clicks to prevent DOM flooding (min 70ms apart)
      var now = Date.now();
      if (now - lastSpawnTime < 70) return;
      lastSpawnTime = now;

      // Don't animate if user prefers reduced motion
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      createWifiPulse(e.clientX, e.clientY);
    }, { passive: true });
  })();
})();
