window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var PLUGIN = "multi-line";
  var MARK = "data-yc-ml";
  var off = false;

  function cfg() {
    try { return YC.store.plugin(PLUGIN); } catch (e) { return {}; }
  }

  function form() {
    return document.querySelector("#cf");
  }

  function field() {
    var f = form();
    return f ? f.querySelector('[name="body"]') : null;
  }

  function copyAttrs(from, to) {
    for (var i = 0; i < from.attributes.length; i++) {
      var a = from.attributes[i];
      if (a.name === "rows" || a.name === "style" || a.name === MARK) continue;
      to.setAttribute(a.name, a.value);
    }
  }

  function grow(el) {
    if (!el || el.tagName !== "TEXTAREA") return;
    if (cfg().grow === false) {
      el.style.height = "";
      el.style.resize = "vertical";
      el.style.overflowY = "auto";
      if (el.rows !== 5) el.rows = 5;
      return;
    }
    el.style.resize = "none";
    el.style.overflowY = "hidden";
    el.style.height = "auto";
    var extra = el.offsetHeight - el.clientHeight;
    var cap = Math.max(96, Math.round(window.innerHeight * 0.38));
    var want = el.scrollHeight + extra;
    if (want <= cap) {
      el.style.height = want + "px";
    } else {
      el.style.height = cap + "px";
      el.style.overflowY = "auto";
    }
  }

  function suggestOpen() {
    return !!document.querySelector("#cf #sg:not([hidden]),#cf #mg:not([hidden]),.yc-sg:not([hidden])");
  }

  function send() {
    var f = form();
    if (!f) return;
    if (typeof f.requestSubmit === "function") {
      try { f.requestSubmit(); return; } catch (e) {}
    }
    try { f.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); } catch (e) {}
  }

  function wrap(el, mark) {
    var a = el.selectionStart;
    var z = el.selectionEnd;
    if (a == null || z == null) return;
    el.value = el.value.slice(0, a) + mark + el.value.slice(a, z) + mark + el.value.slice(z);
    el.setSelectionRange(a + mark.length, z + mark.length);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function onOwnKey(e) {
    var el = e.target;
    if (!el || el.tagName !== "TEXTAREA") return;
    var ctrl = e.ctrlKey || e.metaKey;
    if (e.key === "Enter") {
      var sends = ctrl ? !e.altKey : (cfg().enterSends !== false && !e.shiftKey && !e.altKey);
      if (!sends) return;
      if (suggestOpen()) return;
      e.preventDefault();
      e.stopPropagation();
      send();
      return;
    }
    if (!ctrl || e.altKey || e.shiftKey) return;
    var mark = { b: "**", i: "*", u: "__" }[String(e.key || "").toLowerCase()];
    if (!mark) return;
    e.preventDefault();
    wrap(el, mark);
  }

  function onEscape(e) {
    if (e.key !== "Escape") return;
    var bar = document.querySelector("#replyBar");
    var x = document.querySelector("#replyX");
    if (!bar || bar.hidden || !x) return;
    e.preventDefault();
    e.stopPropagation();
    x.click();
  }

  function onPaste(e) {
    var list = (e.clipboardData && e.clipboardData.files) || [];
    var img = null;
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].type).indexOf("image/") === 0) { img = list[i]; break; }
    }
    if (!img) return;
    var picker = document.querySelector("#ifile");
    if (!picker) return;
    e.preventDefault();
    try {
      var dt = new DataTransfer();
      dt.items.add(img);
      picker.files = dt.files;
      picker.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (err) {}
  }

  function onInput(e) {
    grow(e.target);
  }

  function bindSite(el) {
    var f = el.form || form();
    el.addEventListener("keydown", onEscape, false);
    el.addEventListener("paste", onPaste, false);
    if (!f) return;
    try { if (typeof window.emojiUI === "function") window.emojiUI(el, f); } catch (e) {}
    try { if (typeof window.mentionUI === "function") window.mentionUI(el, f); } catch (e) {}
  }

  function install(inp) {
    var ta = document.createElement("textarea");
    copyAttrs(inp, ta);
    ta.setAttribute(MARK, "1");
    ta.rows = 1;
    ta.value = inp.value;
    ta.addEventListener("keydown", onOwnKey, false);
    ta.addEventListener("input", onInput, false);
    if (inp.parentNode) inp.parentNode.replaceChild(ta, inp);
    bindSite(ta);
    grow(ta);
    return ta;
  }

  function restore() {
    var list = document.querySelectorAll('#cf textarea[data-yc-ml]');
    Array.prototype.forEach.call(list, function (ta) {
      var inp = document.createElement("input");
      copyAttrs(ta, inp);
      inp.removeAttribute(MARK);
      inp.removeAttribute("rows");
      inp.removeAttribute("style");
      inp.value = ta.value.replace(/[\r\n]+/g, " ");
      if (ta.parentNode) ta.parentNode.replaceChild(inp, ta);
      bindSite(inp);
    });
  }

  function apply() {
    if (off) return;
    var el = field();
    if (!el) return;
    if (el.tagName === "TEXTAREA") { grow(el); return; }
    install(el);
  }

  var CSS = [
    "#cf{align-items:flex-end}",
    '#cf [name="body"]{box-sizing:border-box}',
    '#cf textarea[name="body"]{min-width:0;width:auto;flex:1 1 0;border-radius:999px;padding:.7rem 1.1rem;resize:none;overflow-y:hidden;max-height:38vh}',
    '#cf textarea[name="body"]::placeholder{color:var(--mute)}'
  ].join("\n");

  YC.registerPlugin({
    id: PLUGIN,
    name: "MultiLine",
    description: "Shift + Enter starts a new line instead of sending, so one message can run over as many lines as you like.",
    defaultEnabled: false,

    settings: [
      { id: "enterSends", type: "toggle", label: "Enter sends", default: true,
        desc: "Enter sends the message and Shift + Enter starts a new line, the usual way. Turn this off and Enter starts the new line instead, with Ctrl + Enter to send." },
      { id: "grow", type: "toggle", label: "Grow the box as you type", default: true,
        desc: "The message box gets taller for every line, up to about a third of the window. Off leaves a fixed box you can resize by dragging." }
    ],

    start: function (ctx) {
      off = false;
      ctx.css(CSS);
      apply();
      ctx.observe(document.body || document.documentElement, function () { apply(); },
        { childList: true, subtree: true });
      ctx.on("plugin-settings", function (e) {
        if (e.id !== PLUGIN) return;
        var el = field();
        if (el) { grow(el); }
      });
    },

    stop: function () {
      off = true;
      restore();
    }
  });
})(window.YapCord);
