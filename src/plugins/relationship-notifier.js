window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var h = YC.ui.h;
  var KEY = "yapcord.relations";

  var base = null;
  var loaded = false;
  var seenOnce = false;

  async function load() {
    if (loaded) return base;
    var saved = await YC.storage.get(KEY, null);
    base = saved && saved.friends && saved.servers
      ? saved
      : { v: 1, friends: {}, servers: {} };
    loaded = true;
    return base;
  }

  var saveTimer = 0;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { YC.storage.set(KEY, base); }, 400);
  }


  function notify(text, kind) {
    YC.notes.add(text, kind || "rel");
    if (YC.store.get("notify.toast", true)) YC.ui.toast(text, kind === "warn" ? "warn" : "info");
    if (YC.store.get("notify.browser", true)) {
      try {
        chrome.runtime.sendMessage({
          type: "yapcord-notify",
          title: "YapCord",
          message: text
        }, function () { void chrome.runtime.lastError; });
      } catch (e) {}
    }
  }


  function diff(which, now, labelFn) {
    if (!seenOnce) {
      Object.keys(now).forEach(function (id) { base[which][id] = now[id]; });
      Object.keys(base[which]).forEach(function (id) { if (!(id in now)) delete base[which][id]; });
      seenOnce = true;
      save();
      return;
    }

    Object.keys(base[which]).forEach(function (id) {
      if (!(id in now)) notify(labelFn(id, base[which][id], "gone"), "warn");
    });
    if (YC.store.plugin("relationship-notifier").watchJoins !== false) {
      Object.keys(now).forEach(function (id) {
        if (!(id in base[which])) notify(labelFn(id, now[id], "new"), "info");
      });
    }

    base[which] = now;
    save();
  }

  function friendList(res) {
    var out = {};
    ((res && res.friends) || []).forEach(function (f) { if (f && f.id != null) out[String(f.id)] = f.username || String(f.id); });
    return out;
  }

  function serverList(res) {
    var out = {};
    ((res && res.servers) || []).forEach(function (s) { if (s && s.id != null) out[String(s.id)] = s.name || String(s.id); });
    return out;
  }

  function friendLabel(id, name, dir) {
    return dir === "gone"
      ? name + " is no longer on your friends list (unfriended or banned)."
      : name + " is now your friend.";
  }
  function serverLabel(id, name, dir) {
    return dir === "gone"
      ? "You were removed from " + name + "."
      : "You joined " + name + ".";
  }

  function observeFriends(res) {
    if (!YC.enabled("relationship-notifier") || !res) return;
    load().then(function () { diff("friends", friendList(res), friendLabel); });
  }

  function observeServers(res) {
    if (!YC.enabled("relationship-notifier") || !res) return;
    load().then(function () { diff("servers", serverList(res), serverLabel); });
  }


  async function poll() {
    var conf = YC.store.plugin("relationship-notifier");
    if (conf.poll === false || state.busy || document.hidden) return;
    state.busy = true;
    try {
      var res = await Promise.all([
        conf.watchFriends === false ? null : YC.api("friends"),
        conf.watchServers === false ? null : YC.api("servers")
      ]);
      if (res[0]) observeFriends(res[0]);
      if (res[1]) observeServers(res[1]);
    } catch (e) {
    } finally {
      state.busy = false;
    }
  }

  var state = { busy: false, timer: 0, secs: 0 };


  YC.registerPlugin({
    id: "relationship-notifier",
    name: "RelationshipNotifier",
    description: "Get told when someone unfriends you or you get kicked from a server.",
    settings: [
      { id: "watchFriends", type: "toggle", label: "Watch friends", default: true },
      { id: "watchServers", type: "toggle", label: "Watch server memberships", default: true },
      { id: "watchJoins", type: "toggle", label: "Also announce joins and new friends", default: true },
      { id: "poll", type: "toggle", label: "Poll in the background", default: true, desc: "Checks friends and servers even when the page doesn't." },
      { id: "pollSeconds", type: "range", label: "Poll every", min: 15, max: 300, step: 15, unit: "s", default: 45 },
      {
        id: "baseline", type: "buttons", label: "Baseline", actions: [
          {
            label: "Save current state as baseline", fn: async function () {
              var res = await Promise.all([YC.api("friends"), YC.api("servers")]);
              base = { v: 1, friends: friendList(res[0]), servers: serverList(res[1]) };
              seenOnce = true;
              save();
              YC.ui.toast("Baseline saved; future changes are measured against this.");
            }
          },
          {
            label: "Forget baseline", danger: true, fn: function () {
              base = { v: 1, friends: {}, servers: {} };
              seenOnce = false;
              save();
              YC.ui.toast("Baseline cleared; the next check starts fresh.");
            }
          }
        ],
        desc: "The baseline is what counts as \"normal\". The first check always sets it silently."
      }
    ],

    start: function (ctx) {
      load();

      ctx.on("api:friends", function (e) {
        var conf = YC.store.plugin("relationship-notifier");
        if (conf.watchFriends !== false) observeFriends(e.res);
      });
      ctx.on("api:servers", function (e) {
        var conf = YC.store.plugin("relationship-notifier");
        if (conf.watchServers !== false) observeServers(e.res);
      });

      var startTimer = function () {
        clearInterval(state.timer);
        var secs = Number(YC.store.plugin("relationship-notifier").pollSeconds) || 45;
        state.secs = Math.max(15, secs);
        state.timer = setInterval(poll, state.secs * 1000);
      };
      startTimer();
      ctx.interval(function () {
        var secs = Number(YC.store.plugin("relationship-notifier").pollSeconds) || 45;
        if (Math.max(15, secs) !== state.secs) startTimer();
      }, 5000);
      ctx.on("plugin-settings", function (e) {
        if (e.id === "relationship-notifier" && e.key === "pollSeconds") startTimer();
      });

      ctx.timeout(poll, 6000);
    },

    stop: function () {
      clearInterval(state.timer);
      state.timer = 0;
    }
  });
})(window.YapCord);
