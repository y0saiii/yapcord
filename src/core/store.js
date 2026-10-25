window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var KEY = "yapcord.config";
  var CACHE_KEY = "yapcord_cache";

  YC.defaults = {
    master: true,
    plugins: {},
    pset: {},
    keybinds: {},
    theme: { id: "discord", accent: "" },
    notify: { browser: true, toast: true, pollSeconds: 45 },
    log: { maxPerConv: 400, maxConvs: 60 }
  };

  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }

  function merge(base, extra) {
    var out = clone(base);
    if (!isObj(extra)) return out;
    Object.keys(extra).forEach(function (k) {
      if (isObj(extra[k]) && isObj(out[k])) out[k] = merge(out[k], extra[k]);
      else out[k] = extra[k];
    });
    return out;
  }

  var store = YC.store = {
    cfg: clone(YC.defaults),
    loaded: false,
    _saveTimer: 0,
    _change: [],

    load: async function () {
      var saved = null;
      try { saved = (await chrome.storage.local.get(KEY))[KEY]; } catch (e) {}
      this.cfg = merge(YC.defaults, saved || {});
      this.loaded = true;
      this.writeCache();
      return this.cfg;
    },

    get: function (path, fallback) {
      var parts = String(path).split("."), cur = this.cfg;
      for (var i = 0; i < parts.length; i++) {
        if (cur == null) return fallback;
        cur = cur[parts[i]];
      }
      return cur === undefined ? fallback : cur;
    },

    set: function (path, value, opts) {
      var parts = String(path).split("."), cur = this.cfg;
      for (var i = 0; i < parts.length - 1; i++) {
        if (!isObj(cur[parts[i]])) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      this.save(opts && opts.now);
      if (parts[0] === "theme") this.writeCache();
    },

    save: function (now) {
      var self = this;
      clearTimeout(this._saveTimer);
      var run = function () {
        try { chrome.storage.local.set({ [KEY]: self.cfg }); } catch (e) {}
        self._change.forEach(function (fn) { try { fn(self.cfg); } catch (e) {} });
      };
      if (now) run();
      else this._saveTimer = setTimeout(run, 250);
    },

    onChange: function (fn) { this._change.push(fn); },

    plugin: function (id) {
      if (!isObj(this.cfg.pset[id])) this.cfg.pset[id] = {};
      var bag = this.cfg.pset[id];
      var spec = YC.plugins && YC.plugins.get(id);
      if (spec && spec.settings) {
        spec.settings.forEach(function (s) {
          if (bag[s.id] === undefined && s.default !== undefined) bag[s.id] = s.default;
        });
      }
      return bag;
    },

    writeCache: function () {
      try {
        var css = YC.resolveTheme ? YC.resolveTheme(this.cfg.theme) : "";
        localStorage.setItem(CACHE_KEY, JSON.stringify({ css: css, t: Date.now() }));
      } catch (e) {}
    },

    wipe: function () {
      return chrome.storage.local.remove([KEY, "yapcord.log", "yapcord.notes", "yapcord.relations"]);
    }
  };

  YC.storage = {
    get: async function (key, fallback) {
      try {
        var res = await chrome.storage.local.get(key);
        return res[key] === undefined ? fallback : res[key];
      } catch (e) { return fallback; }
    },
    set: async function (key, value) {
      var out = {}; out[key] = value;
      try { await chrome.storage.local.set(out); } catch (e) {}
    },
    remove: async function (key) {
      try { await chrome.storage.local.remove(key); } catch (e) {}
    }
  };
})(window.YapCord);
