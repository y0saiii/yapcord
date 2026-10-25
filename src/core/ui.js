window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var UI = YC.ui = {};

  UI.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  UI.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function append(el, children) {
    if (children == null || children === false) return;
    if (Array.isArray(children)) { children.forEach(function (c) { append(el, c); }); return; }
    el.appendChild(children.nodeType ? children : document.createTextNode(String(children)));
  }

  UI.h = function (tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k === "html") el.innerHTML = v;
        else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
        else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2), v);
        else if (k === "dataset") Object.assign(el.dataset, v);
        else if (v === true) el.setAttribute(k, "");
        else el.setAttribute(k, v);
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  };

  var toastHost = null;

  UI.toast = function (message, kind) {
    try {
      if (!toastHost || !toastHost.isConnected) {
        toastHost = document.getElementById("yc-toasts");
        if (!toastHost) {
          toastHost = document.createElement("div");
          toastHost.id = "yc-toasts";
          document.body.appendChild(toastHost);
        }
      }
      var el = UI.h("div", { class: "yc-toast " + (kind || "info") },
        UI.h("span", { class: "yc-toast-dot" }),
        UI.h("span", { class: "yc-toast-text", text: message }));
      toastHost.appendChild(el);
      requestAnimationFrame(function () { el.classList.add("in"); });
      setTimeout(function () {
        el.classList.remove("in");
        setTimeout(function () { el.remove(); }, 300);
      }, kind === "error" ? 6000 : 3800);
      return el;
    } catch (e) {
      console.log("[YapCord]", message);
    }
  };

  UI.openModal = function (opts) {
    opts = opts || {};
    var body = UI.h("div", { class: "yc-modal-body" });
    var head = UI.h("div", { class: "yc-modal-head" },
      UI.h("b", { text: opts.title || "YapCord" }),
      UI.h("button", { class: "yc-x", type: "button", text: "✕", onclick: function () { api.close(); } }));

    var root = UI.h("div", { class: "yc-modal-inner" }, head, body);
    var dlg = UI.h("dialog", { class: "yc-modal", id: "yc-modal" }, root);

    var api = {
      el: dlg,
      body: body,
      close: function () { try { dlg.close(); } catch (e) {} },
      setTitle: function (t) { head.querySelector("b").textContent = t; }
    };

    dlg.addEventListener("close", function () { dlg.remove(); if (opts.onClose) opts.onClose(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) api.close(); });
    document.body.appendChild(dlg);
    try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); }

    if (typeof opts.render === "function") opts.render(body, api);
    else if (opts.content) append(body, opts.content);

    return api;
  };

  UI.confirm = function (message, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var m = UI.openModal({
        title: opts.title || "Are you sure?",
        content: UI.h("div", null,
          UI.h("p", { class: "yc-muted", text: message }),
          UI.h("div", { class: "yc-row" },
            UI.h("button", { class: "yc-btn ghost", text: opts.cancel || "Cancel", onclick: function () { m.close(); resolve(false); } }),
            UI.h("button", { class: "yc-btn " + (opts.danger ? "danger" : "primary"), text: opts.ok || "Confirm", onclick: function () { m.close(); resolve(true); } })))
      });
      m.el.addEventListener("close", function () { resolve(false); });
    });
  };

  UI.copy = function (text) {
    return navigator.clipboard.writeText(String(text)).then(
      function () { UI.toast("Copied to clipboard."); },
      function () { window.prompt("Copy this:", String(text)); }
    );
  };

  UI.download = function (filename, text, mime) {
    try {
      var blob = new Blob([text], { type: mime || "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      return true;
    } catch (e) { UI.toast("Download failed: " + e.message, "error"); return false; }
  };
  YC.download = UI.download;

  var headerBtns = Object.create(null);
  var headerObs = null;

  function ensureHeader() {
    var h3 = document.querySelector(".main > h3");
    if (!h3) return;
    var bar = h3.querySelector("#yc-hbtns");
    if (!bar) { bar = UI.h("span", { class: "yc-hbtns", id: "yc-hbtns" }); h3.appendChild(bar); }
    Object.keys(headerBtns).forEach(function (id) {
      if (bar.querySelector('[data-yc-btn="' + id + '"]')) return;
      var node = null;
      try { node = headerBtns[id](); } catch (e) { console.warn("[YapCord] header button " + id, e); }
      if (node) { node.setAttribute("data-yc-btn", id); bar.appendChild(node); }
    });
  }

  UI.headerButton = function (id, factory) {
    headerBtns[id] = factory;
    ensureHeader();
    if (!headerObs) {
      headerObs = new MutationObserver(function () { ensureHeader(); });
      headerObs.observe(document.documentElement, { childList: true, subtree: true });
    }
  };

  UI.removeHeaderButton = function (id) {
    delete headerBtns[id];
    var el = document.querySelector('[data-yc-btn="' + id + '"]');
    if (el) el.remove();
  };

  var menuEl = null;

  function closeMenu() {
    if (menuEl) { menuEl.remove(); menuEl = null; }
  }

  UI.closeMenu = closeMenu;

  UI.menu = function (x, y, items) {
    closeMenu();
    var m = UI.h("div", { class: "cm yc-menu", role: "menu", tabindex: "-1" });
    (items || []).forEach(function (it) {
      if (it === "-" || (it && it.sep)) { m.appendChild(document.createElement("hr")); return; }
      if (!it) return;
      m.appendChild(UI.h("button", {
        type: "button", role: "menuitem", class: it.danger ? "dn" : "",
        text: it.label || "",
        onclick: function (e) {
          e.stopPropagation();
          closeMenu();
          if (it.fn) { try { it.fn(); } catch (err) { console.warn("[YapCord] menu item", err); } }
        }
      }));
    });
    if (!m.querySelector("button")) return null;

    document.body.appendChild(m);
    m.setAttribute("data-yc-menu", "1");
    var w = m.offsetWidth, hgt = m.offsetHeight;
    m.style.left = Math.max(8, Math.min(x || 0, window.innerWidth - w - 8)) + "px";
    m.style.top = Math.max(8, Math.min(y || 0, window.innerHeight - hgt - 8)) + "px";
    menuEl = m;
    m.focus();

    m.addEventListener("keydown", function (e) {
      var btns = Array.prototype.slice.call(m.querySelectorAll("button"));
      var i = btns.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); btns[(i + 1) % btns.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); btns[(i + btns.length - 1) % btns.length].focus(); }
      else if (e.key === "Escape") { e.preventDefault(); closeMenu(); }
    });
    return m;
  };

  ["click", "scroll", "resize", "blur", "contextmenu"].forEach(function (ev) {
    addEventListener(ev, function (e) {
      if (!menuEl) return;
      var t = e.target;
      if (t && t.closest && t.closest(".yc-menu")) return;
      closeMenu();
    }, true);
  });

  var NOTES_KEY = "yapcord.notes";  var noteCache = null;
  var noteTimer = 0;

  UI.notes = YC.notes = {
    list: function () { return noteCache ? noteCache.slice() : []; },
    add: function (text, kind) {
      if (!noteCache) noteCache = [];
      noteCache.unshift({ text: String(text), kind: kind || "info", t: Date.now() });
      if (noteCache.length > 60) noteCache.length = 60;
      clearTimeout(noteTimer);
      noteTimer = setTimeout(function () { YC.storage.set(NOTES_KEY, noteCache); }, 400);
      YC.bus.emit("notes-changed", {});
      return noteCache[0];
    },
    clear: function () {
      noteCache = [];
      YC.storage.set(NOTES_KEY, []);
      YC.bus.emit("notes-changed", {});
    },
    init: async function () {
      noteCache = (await YC.storage.get(NOTES_KEY, [])) || [];
      return noteCache;
    }
  };;
})(window.YapCord);
