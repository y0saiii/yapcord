window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var PLUGIN = "character-counter";
  var chip = null;

  function cfg() {
    try { return YC.store.plugin(PLUGIN); } catch (e) { return {}; }
  }

  function field() {
    var f = document.querySelector("#cf");
    return f ? f.querySelector('[name="body"]') : null;
  }

  function hide() {
    if (chip && !chip.hidden) chip.hidden = true;
  }

  function update() {
    if (!chip) return;
    var el = field();
    if (!el) { hide(); return; }
    var max = Number(el.getAttribute("maxlength")) || 2000;
    var len = el.value.length;
    var always = cfg().when === "always";
    if (!len && !always) { hide(); return; }
    if (chip.hidden) chip.hidden = false;
    var text = len + " / " + max;
    if (chip.textContent !== text) chip.textContent = text;
    var warn = len >= max - 100;
    if (warn !== chip.classList.contains("yc-cc-warn")) chip.classList.toggle("yc-cc-warn", warn);
  }

  function place() {
    var f = document.querySelector("#cf");
    if (!f) {
      if (chip) { chip.remove(); chip = null; }
      return;
    }
    if (cfg().show === false) {
      if (chip) { chip.remove(); chip = null; }
      return;
    }
    if (chip && chip.parentNode === f) { update(); return; }
    if (chip && chip.parentNode) chip.remove();
    chip = document.createElement("span");
    chip.id = "yc-cc";
    chip.hidden = true;
    f.appendChild(chip);
    update();
  }

  var CSS = [
    "#cf{position:relative}",
    "#yc-cc{position:absolute;top:-.72rem;right:1.4rem;font-size:.72rem;line-height:1;font-weight:700;letter-spacing:.02em;padding:.24rem .52rem;border-radius:999px;background:var(--paper);color:var(--mute);box-shadow:0 0 0 1px color-mix(in srgb,var(--ink) 22%,transparent);pointer-events:none;z-index:3}",
    "#yc-cc.yc-cc-warn{background:#c9372c;color:#fff;box-shadow:none}"
  ].join("\n");


  YC.registerPlugin({
    id: PLUGIN,
    name: "Character Counter",
    description: "A small counter above the composer showing how much of Yapit's 2000 character limit you have used.",
    defaultEnabled: false,

    settings: [
      { id: "show", type: "toggle", label: "Show the counter", default: true },
      { id: "when", type: "select", label: "Show it", options: [["typing", "While you are typing"], ["always", "Always"]], default: "typing",
        desc: "While you are typing hides it until the box has something in it." }
    ],

    start: function (ctx) {
      ctx.css(CSS);
      place();
      ctx.observe(document.body || document.documentElement, function () { place(); },
        { childList: true, subtree: true });
      document.addEventListener("input", update, true);
      ctx.onDispose(function () { document.removeEventListener("input", update, true); });
      ctx.on("plugin-settings", function (e) {
        if (e.id === PLUGIN) place();
      });
    },

    stop: function () {
      if (chip) { chip.remove(); chip = null; }
    }
  });
})(window.YapCord);
