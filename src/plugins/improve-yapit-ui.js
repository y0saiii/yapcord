window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var PLUGIN = "improve-yapit-ui";

  var FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

  var styleEl = null;
  var linkObs = null;
  var imgObs = null;
  var removedLinks = [];

  function cfg() {
    try { return YC.store.plugin(PLUGIN); } catch (e) { return {}; }
  }


  var STRUCT_LIGHT = [
    "--yc-rail:color-mix(in srgb,var(--paper) 90%,var(--ink));",
    "--yc-side:color-mix(in srgb,var(--paper) 95%,var(--ink));",
    "--yc-main:var(--paper);",
    "--yc-sv:var(--paper);",
    "--yc-me:color-mix(in srgb,var(--paper) 88%,var(--ink));",
    "--yc-border:color-mix(in srgb,var(--paper) 88%,var(--ink));",
    "--yc-ch-hover:color-mix(in srgb,var(--paper) 92%,var(--ink));",
    "--yc-ch-on:color-mix(in srgb,var(--paper) 84%,var(--ink));",
    "--yc-msg-hover:color-mix(in srgb,var(--paper) 95%,var(--ink));",
    "--yc-input:color-mix(in srgb,var(--paper) 92%,var(--ink));",
    "--yc-menu:var(--paper);",
    "--yc-menu-hover:color-mix(in srgb,var(--paper) 94%,var(--ink));",
    "--yc-scroll:color-mix(in srgb,var(--paper) 80%,var(--ink));",
    "--yc-menu-shadow:0 8px 16px color-mix(in srgb,var(--ink) 18%,transparent);",
    "--yc-hover:color-mix(in srgb,var(--ink) 8%,transparent);",
    "--yc-pill:var(--ink);",
    "--yc-mention-bg:color-mix(in srgb,var(--yap) 22%,transparent);",
    "--yc-mention-text:var(--ink);",
    "--yc-ping-bg:color-mix(in srgb,var(--yap) 12%,transparent);",
    "--yc-text:var(--ink);",
    "--yc-ch-text:var(--mute);",
    "--yc-ch-on-text:var(--ink);",
    "--yc-mute:var(--mute);",
    "--yc-font:" + FONT + ";"
  ].join("");

  var STRUCT_DARK = [
    "--yc-rail:color-mix(in srgb,var(--paper) 62%,#000);",
    "--yc-side:color-mix(in srgb,var(--paper) 88%,#000);",
    "--yc-main:var(--paper);",
    "--yc-sv:var(--paper);",
    "--yc-me:color-mix(in srgb,var(--paper) 78%,#000);",
    "--yc-border:color-mix(in srgb,var(--paper) 78%,#000);",
    "--yc-ch-hover:color-mix(in srgb,var(--paper) 97%,#fff);",
    "--yc-ch-on:color-mix(in srgb,var(--paper) 93%,#fff);",
    "--yc-msg-hover:color-mix(in srgb,var(--paper) 94%,#000);",
    "--yc-input:color-mix(in srgb,var(--paper) 96%,#fff);",
    "--yc-menu:color-mix(in srgb,var(--paper) 45%,#000);",
    "--yc-menu-hover:color-mix(in srgb,var(--paper) 97%,#fff);",
    "--yc-scroll:color-mix(in srgb,var(--paper) 45%,#000);",
    "--yc-menu-shadow:0 8px 16px rgba(0,0,0,.45);",
    "--yc-hover:color-mix(in srgb,var(--ink) 8%,transparent);",
    "--yc-pill:var(--ink);",
    "--yc-mention-bg:color-mix(in srgb,var(--yap) 30%,transparent);",
    "--yc-mention-text:var(--ink);",
    "--yc-ping-bg:color-mix(in srgb,var(--yap) 14%,transparent);",
    "--yc-text:var(--ink);",
    "--yc-ch-text:var(--mute);",
    "--yc-ch-on-text:var(--ink);",
    "--yc-mute:var(--mute);",
    "--yc-font:" + FONT + ";"
  ].join("");

  function structure() {
    return ":root:root:not([data-theme=dark]){" + STRUCT_LIGHT + "}" +
      "[data-theme=dark]:root{" + STRUCT_DARK + "}";
  }


  var SKIN = [
    "html,body,button,input,textarea,select{font-family:var(--yc-font) !important}",

    ".app{grid-template-columns:72px 240px 1fr}",
    ".app.mem{grid-template-columns:72px 240px 1fr 240px}",
    "body{background:var(--yc-main) !important;color:var(--yc-text) !important}",
    ".rail{background:var(--yc-rail) !important}",
    ".side{background:var(--yc-side) !important;border-right:1px solid var(--yc-border) !important}",
    ".members{background:var(--yc-side) !important;border-left:1px solid var(--yc-border) !important}",
    ".main > h3,.side h3{border-bottom:1px solid var(--yc-border) !important;padding:.85rem 1rem !important;font-size:1.0625rem !important;font-weight:700 !important}",
    ".list{padding:.5rem .5rem !important}",
    ".tabs2{border-bottom:1px solid var(--yc-border) !important}",
    ".me,.side form{background:var(--yc-me) !important;border-top:1px solid var(--yc-border) !important}",
    ".sd{color:var(--yc-mute) !important}",

    ".sv{background:var(--yc-sv) !important;color:var(--yc-text) !important;border:0 !important}",
    ".sv:hover{background:var(--yc-ch-hover) !important;color:var(--yc-text) !important;border-radius:16px !important}",
    ".sv.on{background:var(--yap) !important;color:var(--yc-on-accent,#fff) !important;border-radius:16px !important}",
    ".sv.on:hover{background:var(--yap) !important;color:var(--yc-on-accent,#fff) !important}",
    ".sv.on::before{background:var(--yc-pill) !important}",

    ".it{border:0 !important;border-radius:8px !important;padding:.35rem .65rem !important;color:var(--yc-ch-text) !important;font-weight:500 !important}",
    ".it:hover{background:var(--yc-ch-hover) !important;color:var(--yc-text) !important}",
    ".it.on{background:var(--yc-ch-on) !important;border:0 !important;color:var(--yc-ch-on-text) !important;font-weight:600 !important}",
    ".it.on .cn{color:var(--yc-ch-on-text) !important}",

    "#msgs .m{border-radius:8px !important;margin:0 -8px !important;padding:2px 8px !important}",
    "#msgs .m b{font-weight:600 !important}",
    "#msgs .m small{font-size:.75rem !important;color:var(--yc-mute) !important;margin-left:.5rem}",
    "#msgs .m:hover{background:var(--yc-msg-hover) !important}",
    "#msgs .m .av{border:0 !important;width:40px !important;height:40px !important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}",
    ".av:not(:has(img)){background-image:linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.4)) !important;color:#fff !important;font-weight:800}",
    ".mn{background:var(--yc-mention-bg) !important;color:var(--yc-mention-text) !important;border:0 !important;border-radius:4px !important;padding:0 .2rem !important;font-weight:500 !important}",
    ".mn.you,.mn.all{background:var(--yap) !important;color:var(--yc-on-accent,#fff) !important}",
    ".m.ping{background:var(--yc-ping-bg) !important;box-shadow:-4px 0 0 var(--yap) !important;border-radius:6px !important}",
    ".rq b{color:var(--yc-text) !important}",
    ".empty{color:var(--yc-mute) !important}",
    ".badge{border:0 !important;border-radius:999px !important;background:var(--yap) !important;color:var(--yc-on-accent,#fff) !important;font-size:.6875rem !important;padding:0 .5rem !important}",

    ".compose{border-top:1px solid var(--yc-border) !important;background:var(--yc-main) !important;padding:12px 16px 24px !important;gap:.5rem !important}",
    ".compose input,.compose textarea,.compose [name=body]{background:var(--yc-input) !important;border:0 !important;border-radius:8px !important;box-shadow:none !important;color:var(--yc-text) !important;padding:.7rem .9rem !important;font-size:.9375rem !important}",
    ".compose input::placeholder,.compose textarea::placeholder{color:var(--yc-mute) !important}",
    ".compose input:focus,.compose textarea:focus{border:0 !important;box-shadow:none !important;outline:2px solid var(--yap) !important}",
    ".reply-bar{background:var(--yc-input) !important;border:1px solid var(--yc-border) !important;border-radius:8px !important}",

    ".btn{background:var(--yap) !important;color:var(--yc-on-accent,#fff) !important;border:0 !important;border-radius:3px !important;box-shadow:none !important;font-weight:600 !important;padding:.55rem 1rem !important}",
    ".btn:hover{background:color-mix(in srgb, var(--yap) 86%, #000) !important;filter:none !important;box-shadow:none !important}",
    ".btn.sm{padding:.28rem .7rem !important;font-size:.8125rem !important}",
    ".btn:active{transform:none !important}",
    ".btn:disabled{opacity:.5;filter:none !important;box-shadow:none !important}",
    ".ghost{background:transparent !important;border:1px solid transparent !important;border-radius:3px !important;box-shadow:none !important;color:var(--yc-text) !important;font-weight:600 !important}",
    ".ghost:hover{background:var(--yc-hover) !important;filter:none !important;color:var(--yc-text) !important}",
    ".ghost:active{transform:none !important}",
    ".ghost.on{background:var(--yap) !important;border-color:transparent !important;color:var(--yc-on-accent,#fff) !important}",
    ".ghost.danger{color:#DA373C !important;border-color:rgba(218,55,60,.45) !important}",
    "[data-theme=dark] .ghost.danger{color:#FF7B7B !important;border-color:rgba(255,123,123,.4) !important}",

    ".cm{background:var(--yc-menu) !important;color:var(--yc-text) !important;border:1px solid var(--yc-border) !important;border-radius:6px !important;box-shadow:var(--yc-menu-shadow) !important;padding:.35rem !important}",
    ".cm button{border-radius:3px !important;padding:.3rem .55rem !important;font-size:.875rem !important;font-weight:500 !important;color:var(--yc-text) !important}",
    ".cm button:hover,.cm button:focus-visible{background:var(--yc-menu-hover) !important;color:var(--yc-text) !important}",
    ".cm .dn{color:#DA373C !important}",
    "[data-theme=dark] .cm .dn{color:#FF6B6B !important}",
    ".cm .dn:hover,.cm .dn:focus-visible{background:#DA373C !important;color:#fff !important}",
    ".cm hr{border-top:1px solid var(--yc-border) !important;opacity:.7;margin:.3rem .25rem !important}",

    ".card{border:1px solid var(--yc-border) !important;border-radius:8px !important;box-shadow:none !important}",
    ".card:hover{box-shadow:none !important}",
    "input,textarea,select{border-radius:8px !important}",
    "input:focus,textarea:focus,select:focus{box-shadow:0 0 0 3px color-mix(in srgb, var(--yap) 35%, transparent) !important}",

    "::-webkit-scrollbar{width:14px;height:14px}",
    "::-webkit-scrollbar-track{background:transparent}",
    "::-webkit-scrollbar-thumb{background:var(--yc-scroll) !important;border:3px solid transparent !important;border-radius:8px !important;background-clip:padding-box !important}"
  ].join("\n");


  var FAST = [
    "*,*::before,*::after{transition-duration:0s !important;transition-delay:0s !important;animation-delay:0s !important}",
    "#yc-toasts .yc-toast{transition-duration:.22s !important}",
    ".yc-key.recording{animation-duration:1s !important}",
    "#msgs .m.hl{animation-duration:1.6s !important}",
    ".btn:hover,.ghost:hover,.card:hover{filter:none !important}",

    "#msgs .m{content-visibility:auto;contain-intrinsic-size:auto 84px}",
    "#msgs{overscroll-behavior:contain}",
    ".rail,.side,.members,.list,.tabs2,.compose{contain:layout}",
    ".card,.cm{contain:layout paint}"
  ].join("\n");

  var COMPACT = [
    "#msgs .m{padding:1px 8px !important;gap:.5rem !important}",
    "#msgs .m .av{width:24px !important;height:24px !important;font-size:.7rem !important}",
    "#msgs .m p{line-height:1.35}",
    "#msgs .m b{font-size:.9375rem !important}",
    ".it{padding:.2rem .6rem !important;font-size:.9375rem !important}",
    ".list{padding:.35rem .5rem !important}"
  ].join("\n");


  function buildCSS() {
    var c = cfg();
    var skin = c.discord !== false;
    var fast = c.fast !== false;
    var out = [];
    if (skin) { out.push(structure()); out.push(SKIN); }
    if (fast) out.push(FAST);
    if (c.compact === true) out.push(COMPACT);
    return out.join("\n");
  }

  function apply() {
    var css = buildCSS();
    if (!styleEl || !styleEl.isConnected) {
      styleEl = document.getElementById("yc-ui-css") || document.createElement("style");
      styleEl.id = "yc-ui-css";
      styleEl.setAttribute("data-yc-plugin", PLUGIN);
      (document.head || document.documentElement).appendChild(styleEl);
    }
    if (styleEl.textContent !== css) styleEl.textContent = css;
  }


  function isFontLink(node) {
    if (!node || node.nodeType !== 1 || node.tagName !== "LINK") return false;
    var href = node.getAttribute("href") || "";
    return /fonts\.(googleapis|gstatic)\.com/.test(href);
  }

  function blockFonts() {
    if (linkObs) return;
    var head = document.head || document.documentElement;
    var take = function (l) {
      if (!isFontLink(l)) return;
      if (removedLinks.indexOf(l) < 0) removedLinks.push(l);
      l.remove();
    };
    var scan = function () {
      Array.prototype.forEach.call(head.querySelectorAll("link"), take);
    };
    scan();
    linkObs = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, function (n) {
          if (isFontLink(n)) take(n);
          else if (n.nodeType === 1) scan();
        });
      });
    });
    linkObs.observe(head, { childList: true });

    var stop = function () { if (linkObs) { try { linkObs.disconnect(); } catch (e) {} linkObs = null; } };
    if (document.readyState === "complete") setTimeout(stop, 3000);
    else window.addEventListener("load", function () { setTimeout(stop, 3000); }, { once: true });
  }

  function unblockFonts() {
    if (linkObs) { try { linkObs.disconnect(); } catch (e) {} linkObs = null; }
    removedLinks.forEach(function (l) { try { document.head.appendChild(l); } catch (e) {} });
    removedLinks = [];
  }


  function lazyImages() {
    var root = document.querySelector("#msgs");
    if (!root) return null;
    var mark = function (node) {
      if (!node || node.nodeType !== 1) return;
      if (node.tagName === "IMG") node.loading = "lazy";
      if (node.querySelectorAll) Array.prototype.forEach.call(node.querySelectorAll("img"), function (i) { i.loading = "lazy"; });
    };
    Array.prototype.forEach.call(root.querySelectorAll("img"), function (i) { i.loading = "lazy"; });
    var mo = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, mark);
      });
    });
    mo.observe(root, { childList: true, subtree: true });
    return mo;
  }


  YC.registerPlugin({
    id: PLUGIN,
    name: "Improve Yapit UI",
    description: "Reshapes Yapit to look and feel like Discord, plus a fast mode that makes the page lighter and quicker.",
    defaultEnabled: true,

    settings: [
      { id: "discord", type: "toggle", label: "Discord look", default: true,
        desc: "Rail, sidebar, channels, messages, composer, buttons and menus in Discord's shape and spacing. It never changes the colours, so it works with any theme you pick." },
      { id: "fast", type: "toggle", label: "Fast mode", default: true,
        desc: "Drops unused web fonts, stops the animations and skips messages that are off screen, so chat feels quicker." },
      { id: "compact", type: "toggle", label: "Compact messages", default: false,
        desc: "Tighter rows and smaller avatars, like Discord's compact mode." }
    ],

    start: function (ctx) {
      apply();
      if (cfg().fast !== false) blockFonts();

      var mount = function () {
        if (imgObs) { try { imgObs.disconnect(); } catch (e) {} imgObs = null; }
        imgObs = lazyImages();
      };
      mount();
      if (!imgObs) ctx.timeout(mount, 1500);
      ctx.on("api:messages", mount);
      ctx.on("api:dm", mount);
      ctx.onDispose(function () { if (imgObs) { try { imgObs.disconnect(); } catch (e) {} imgObs = null; } });

      ctx.on("plugin-settings", function (e) {
        if (e.id === PLUGIN && e.key === "fast") { if (e.value) blockFonts(); else unblockFonts(); }
        if (e.id === PLUGIN || e.id === "theme-manager") apply();
      });

      ctx.observe(document.head || document.documentElement, function () { apply(); },
        { childList: true, characterData: true, subtree: true });
    },

    stop: function () {
      unblockFonts();
      if (imgObs) { try { imgObs.disconnect(); } catch (e) {} imgObs = null; }
      if (styleEl) { styleEl.remove(); styleEl = null; }
    }
  });
})(window.YapCord);
