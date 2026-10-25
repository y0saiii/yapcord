window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var API = YC.api = async function (action, data) {
    var res = await fetch("api.php?a=" + action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {})
    });
    var text = await res.text();
    var json;
    try { json = JSON.parse(text); }
    catch (e) { throw new Error("Server replied with: " + String(text).replace(/<[^>]*>/g, " ").trim().slice(0, 160)); }
    if (json && json.error) throw new Error(json.error);
    return json;
  };

  API.fetchHistory = async function (opts) {
    opts = opts || {};
    var kind = opts.kind || "channel";
    var id = opts.id;
    var maxPages = opts.maxPages || 150;
    var delay = opts.delay == null ? 60 : opts.delay;
    var onBatch = opts.onBatch || null;
    var collected = [];
    var after = 0;
    var done = false;

    for (var page = 0; page < maxPages && !done; page++) {
      if (opts.signal && opts.signal.aborted) break;
      var payload = kind === "dm" ? { with: id, after: after } : { channel: id, after: after };
      var res;
      try {
        res = await API(kind === "dm" ? "dm" : "messages", payload);
      } catch (e) {
        if (opts.throwOnError) throw e;
        if (opts.onError) opts.onError(e);
        break;
      }
      var msgs = (res && res.messages) || [];
      if (onBatch) { try { onBatch(msgs, page); } catch (e) {} }
      if (opts.collect !== false) collected = collected.concat(msgs);
      if (!msgs.length) break;
      var last = Number(msgs[msgs.length - 1].id);
      if (!isFinite(last) || last <= after) break;
      after = last;
      if (msgs.length < 50 && !opts.keepGoing) {  }
      if (page < maxPages - 1 && delay) await YC.ui.sleep(delay);
    }
    return collected;
  };

  var page = YC.page = {
    isApp: function () { return !!document.querySelector(".app"); },
    isSettings: function () { return /^#\/settings/.test(location.hash || ""); },

    conversation: function () {
      var ch = document.querySelector("[data-ch].on");
      if (ch) {
        var name = (ch.textContent || "").replace(/^#\s*/, "").replace(/ lock$/i, "").trim();
        return { kind: "channel", id: Number(ch.dataset.ch), label: name || ("channel " + ch.dataset.ch), el: ch };
      }
      var peer = document.querySelector("[data-peer].on");
      if (peer) {
        var uname = (peer.textContent || "").trim().split("\n")[0];
        return { kind: "dm", id: Number(peer.dataset.peer), label: "@" + uname, el: peer };
      }
      return { kind: "none", id: null, label: "", el: null };
    },

    server: function () {
      var sv = document.querySelector(".rail [data-srv].on");
      if (!sv) return { id: null, name: "Home", home: true };
      var id = sv.dataset.srv;
      if (id === "home") return { id: "home", name: "Home", home: true };
      var title = document.querySelector(".side h3");
      return { id: id, name: title ? title.textContent.trim().split("\n")[0] : id, home: false, el: sv };
    },

    channels: function () {
      return Array.prototype.map.call(document.querySelectorAll("[data-ch]"), function (el) {
        return {
          id: Number(el.dataset.ch),
          name: (el.textContent || "").replace(/^#\s*/, "").replace(/ lock$/i, "").trim(),
          active: el.classList.contains("on")
        };
      });
    },

    servers: function () {
      return Array.prototype.map.call(document.querySelectorAll(".rail [data-srv]"), function (el) {
        return { id: el.dataset.srv, name: el.getAttribute("title") || el.dataset.srv, active: el.classList.contains("on") };
      });
    },

    friends: function () {
      return Array.prototype.map.call(document.querySelectorAll("[data-peer]"), function (el) {
        return {
          id: Number(el.dataset.peer),
          username: (el.textContent || "").trim().split("\n")[0],
          active: el.classList.contains("on")
        };
      });
    },

    composer: function () {
      return document.querySelector("#cf [name=body]") || document.querySelector(".compose input[name=body]");
    },

    composerForm: function () { return document.querySelector("#cf"); },

    hovered: function () { return document.querySelector(".m[data-yc-hover='1']") || null; },

    messagesRoot: function () { return document.querySelector("#msgs"); },

    openChannel: function (id) {
      var el = document.querySelector('[data-ch="' + id + '"]');
      if (el) { el.click(); return true; }
      return false;
    },
    openServer: function (id) {
      var el = document.querySelector('[data-srv="' + id + '"]');
      if (el) { el.click(); return true; }
      return false;
    },
    openFriend: function (id) {
      var el = document.querySelector('[data-peer="' + id + '"]');
      if (el) { el.click(); return true; }
      return false;
    }
  };

  API.fmtWhen = function (created, fallbackMs) {
    if (created) {
      var d = new Date(String(created).replace(" ", "T"));
      if (!isNaN(d.getTime())) return d.toLocaleString();
      return String(created);
    }
    if (fallbackMs) return new Date(fallbackMs).toLocaleString();
    return "";
  };
})(window.YapCord);
