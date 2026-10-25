window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var extraCSS = "";

  function buildExtra(ctx) {
    var css = "";
    var size = ctx.get("fontSize", "auto");
    if (size && size !== "auto") css += ":root:root{font-size:" + Number(size) + "px !important}\n";
    if (ctx.get("reduceMotion", false)) css += "*,*::before,*::after{transition:none !important;animation:none !important}\n";
    if (ctx.get("hideBanners", false)) css += ".banner{display:none !important}\n";
    return css;
  }

  function paint(ctx) {
    extraCSS = buildExtra(ctx);
    if (extraEl) extraEl.textContent = extraCSS;
    YC.applyTheme();
  }

  var extraEl = null;

  YC.registerPlugin({
    id: "theme-manager",
    name: "ThemeManager",
    description: "Themes for Yapit: seven built-in looks, an accent colour of your own, and a CSS editor.",
    settings: [
      {
        id: "fontSize", type: "select", label: "Page font size", default: "auto",
        options: [["auto", "Follow Yapit"], ["14", "14 px"], ["16", "16 px"], ["18", "18 px"], ["20", "20 px"], ["22", "22 px"]],
        desc: "Overrides Yapit's own text size setting."
      },
      { id: "reduceMotion", type: "toggle", label: "Disable all animations", default: false, desc: "For motion sensitivity: kills every transition and animation." },
      { id: "hideBanners", type: "toggle", label: "Hide announcement banners", default: false }
    ],

    start: function (ctx) {
      extraEl = document.createElement("style");
      extraEl.setAttribute("data-yc-plugin", "theme-manager-extra");
      (document.head || document.documentElement).appendChild(extraEl);
      ctx.onDispose(function () { extraEl = null; });

      paint(ctx);

      ctx.observe(document.documentElement, function () { paint(ctx); },
        { attributes: true, attributeFilter: ["data-theme", "class"] });

      ctx.on("plugin-settings", function (e) { if (e.id === "theme-manager") paint(ctx); });
    },

    stop: function () {
      if (extraEl) { extraEl.remove(); extraEl = null; }
      YC.applyTheme();
    }
  });
})(window.YapCord);
