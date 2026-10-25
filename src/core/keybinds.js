window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var MODS = ["ctrl", "alt", "shift", "meta"];
  var NON_KEYS = ["Control", "Shift", "Alt", "Meta", "Dead", "Process", "CapsLock", "NumLock", "ScrollLock"];

  function normalizeKey(key) {
    if (key == null) return "";
    if (key === " ") return "space";
    if (key.length === 1) return key.toLowerCase();
    if (/^F\d{1,2}$/.test(key)) return key.toLowerCase();
    return key;
  }

  var KB = YC.keybinds = {
    defs: new Map(),
    recording: null,

    define: function (def) {
      this.defs.set(def.id, def);
      return def;
    },
    get: function (id) { return this.defs.get(id); },
    list: function () { return Array.from(this.defs.values()); },

    combo: function (id) {
      var stored = YC.store.get("keybinds." + id, undefined);
      if (stored !== undefined) return stored || null;
      var def = this.defs.get(id);
      return def && def.default ? def.default : null;
    },
    setCombo: function (id, combo) {
      YC.store.set("keybinds." + id, combo || null, { now: true });
      YC.bus.emit("keybinds-changed", { id: id, combo: combo });
    },
    reset: function (id) {
      YC.store.set("keybinds." + id, undefined, { now: true });
      try { delete YC.store.cfg.keybinds[id]; } catch (e) {}
      YC.store.save(true);
      YC.bus.emit("keybinds-changed", { id: id });
    },
    resetAll: function () {
      YC.store.cfg.keybinds = {};
      YC.store.save(true);
      YC.bus.emit("keybinds-changed", {});
    },

    fromEvent: function (e) {
      if (!e || NON_KEYS.indexOf(e.key) >= 0) return null;
      var key = normalizeKey(e.key);
      if (!key) return null;
      var parts = [];
      if (e.ctrlKey) parts.push("ctrl");
      if (e.altKey) parts.push("alt");
      if (e.shiftKey) parts.push("shift");
      if (e.metaKey) parts.push("meta");
      parts.push(key);
      return parts.join("+");
    },

    pretty: function (combo) {
      if (!combo) return "Not set";
      return combo.split("+").map(function (p) {
        switch (p) {
          case "ctrl": return "Ctrl";
          case "alt": return "Alt";
          case "shift": return "Shift";
          case "meta": return "Win/Cmd";
          case "space": return "Space";
          case "escape": return "Esc";
          case "arrowup": return "↑";
          case "arrowdown": return "↓";
          case "arrowleft": return "←";
          case "arrowright": return "→";
          default: return p.length === 1 ? p.toUpperCase() : p;
        }
      }).join(" + ");
    },

    warnFor: function (combo) {
      if (!combo) return "";
      if (/^(ctrl|meta)\+(t|w|n|q)$/.test(combo)) return "The browser uses this one, YapCord can't catch it.";
      if (combo === "ctrl+r" || combo === "ctrl+shift+r") return "This reloads the page in most browsers.";
      if (combo === "escape") return "Escape is already used to close things.";
      return "";
    },

    record: function (cb) {
      var self = this;
      this.recording = function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "Escape") { self.recording = null; cb(null); return; }
        var combo = self.fromEvent(e);
        if (!combo) return;
        self.recording = null;
        cb(combo);
      };
      return function () { self.recording = null; };
    },

    unavailable: function (def) {
      if (def.plugin && !YC.enabled(def.plugin)) return true;
      if (typeof def.requires === "function") {
        try { if (!def.requires()) return true; }
        catch (e) { return true; }
      }
      return false;
    },

    run: function (def) {
      if (!def) return false;
      if (def.plugin && !YC.enabled(def.plugin)) return false;
      if (typeof def.requires === "function") {
        var ok;
        try { ok = def.requires(); } catch (e) { ok = false; }
        if (!ok) {
          if (def.needsHint) def.needsHint();
          else if (YC.ui && YC.ui.toast) YC.ui.toast(def.hint || (def.name + " isn't available right now."), "warn");
          return false;
        }
      }
      try { def.run(); return true; }
      catch (e) { console.warn("[YapCord] keybind " + def.id, e); return false; }
    }
  };

  document.addEventListener("keydown", function (e) {
    if (KB.recording) { KB.recording(e); return; }
    if (e.defaultPrevented || e.isComposing) return;

    var combo = KB.fromEvent(e);
    if (!combo) return;

    var target = e.target;
    var typing = !!(target && target.matches &&
      (target.matches("input, textarea, select") || (target.isContentEditable && target.isContentEditable)));
    var hasModifier = /(ctrl|alt|meta)\+/.test(combo);
    if (typing && !hasModifier) return;

    var match = null;
    KB.defs.forEach(function (def) {
      if (match) return;
      if (KB.combo(def.id) === combo) match = def;
    });
    if (!match) return;

    e.preventDefault();
    e.stopPropagation();
    KB.run(match);
  }, true);
})(window.YapCord);
