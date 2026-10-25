window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var PLUGIN = "custom-font";
  var styleEl = null;

  var PRESETS = [
    ["site", "Yapit default"],
    ["Verdana", "Verdana"],
    ["Tahoma", "Tahoma"],
    ["Trebuchet MS", "Trebuchet MS"],
    ["Georgia", "Georgia"],
    ["Comic Sans MS", "Comic Sans MS"],
    ["Courier New", "Courier New (monospace)"]
  ];

  function cfg() {
    try { return YC.store.plugin(PLUGIN); } catch (e) { return {}; }
  }

  function family() {
    var c = cfg();
    var custom = String(c.custom || "").replace(/[^A-Za-z0-9 ,'-]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
    if (custom) return custom;
    var pick = String(c.preset || "site");
    return pick === "site" ? "" : pick;
  }

  function apply() {
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.setAttribute("data-yc-plugin", PLUGIN);
      (document.head || document.documentElement).appendChild(styleEl);
    }
    var fam = family();
    styleEl.textContent = fam
      ? "html,body,button,input,textarea,select{font-family:" + fam + " !important}"
      : "";
  }

  function cleanup() {
    if (styleEl) { styleEl.remove(); styleEl = null; }
  }


  YC.registerPlugin({
    id: PLUGIN,
    name: "Custom Font",
    description: "Give Yapit any font you like, with a handful of presets or a font name you type yourself.",
    defaultEnabled: false,

    settings: [
      { id: "preset", type: "select", label: "Font", options: PRESETS, default: "site",
        desc: "Yapit default keeps whatever the site and your YapCord theme use." },
      { id: "custom", label: "Type your own", placeholder: "e.g. Lato, Segoe UI, sans-serif",
        desc: "Overrides the pick above. Names, spaces, commas and hyphens only, and it falls back to the system font if it is not installed." }
    ],

    start: function (ctx) {
      apply();
      ctx.on("plugin-settings", function (e) {
        if (e.id === PLUGIN) apply();
      });
    },

    stop: cleanup
  });
})(window.YapCord);
