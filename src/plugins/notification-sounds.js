window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var PLUGIN = "notification-sounds";

  var actx = null;
  var bound = false;
  var myId = null;
  var myName = "";
  var maxId = {};
  var turns = {};

  function cfg() {
    try { return YC.store.plugin(PLUGIN); } catch (e) { return {}; }
  }

  function ensureCtx() {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      return actx;
    } catch (e) { return null; }
  }

  function unlock() { ensureCtx(); }

  function tone(freq, at, dur, vol, type) {
    var o = actx.createOscillator();
    var g = actx.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g);
    g.connect(actx.destination);
    o.start(at);
    o.stop(at + dur + 0.03);
  }

  function play(kind) {
    var a = ensureCtx();
    if (!a) return;
    var vol = ((Number(cfg().volume) || 60) / 100) * 0.3;
    var t = a.currentTime + 0.02;
    if (kind === "mention") {
      tone(660, t, 0.18, vol, "sine");
      tone(990, t + 0.12, 0.3, vol, "sine");
    } else {
      tone(520, t, 0.2, vol, "triangle");
      tone(780, t + 0.14, 0.34, vol, "triangle");
    }
  }

  function msgTime(m) {
    if (m.ts) return Number(m.ts) * 1000;
    if (m.created) {
      var d = new Date(String(m.created).replace(" ", "T") + "Z");
      if (!isNaN(d.getTime())) return d.getTime();
    }
    return Date.now();
  }

  function mentionsMe(m) {
    if (myId == null) return false;
    if (Number(m.uid) === Number(myId)) return false;
    if (m.reply_to && Number(m.ruid) === Number(myId)) return true;
    var body = String(m.body || "");
    if (myName) {
      var re = new RegExp("(^|[\\s(*_])@" + myName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\w-])", "i");
      if (re.test(body)) return true;
    }
    return /(^|[\s(*_])@everyone(?![\w-])/i.test(body);
  }

  function handle(kind, conv, list) {
    if (!conv || !Array.isArray(list) || !list.length) return;
    var key = (kind === "dm" ? "d" : "c") + conv;
    var known = maxId[key] !== undefined;
    var newest = 0;
    var fresh = [];
    var last = null;
    list.forEach(function (m) {
      var id = Number(m.id);
      if (!isFinite(id)) return;
      if (id > newest) newest = id;
      if (!last || id > Number(last.id)) last = m;
      if (known && id > maxId[key]) fresh.push(m);
    });
    if (!known) {
      maxId[key] = newest;
      if (kind === "dm" && last) turns[key] = { uid: Number(last.uid), t: msgTime(last) };
      return;
    }
    if (newest > maxId[key]) maxId[key] = newest;
    if (!fresh.length) return;

    var now = Date.now();
    fresh.forEach(function (m) {
      var mine = myId != null && Number(m.uid) === Number(myId);
      if (kind === "channel") {
        if (!mine && cfg().mention !== false && mentionsMe(m)) play("mention");
        return;
      }
      if (mine) {
        turns[key] = { uid: Number(m.uid), t: now };
        return;
      }
      var prev = turns[key];
      var newTurn = !prev || Number(prev.uid) !== Number(m.uid) || (now - prev.t > 60000);
      if (newTurn && cfg().dm !== false) play("dm");
      turns[key] = { uid: Number(m.uid), t: now };
    });
  }


  YC.registerPlugin({
    id: PLUGIN,
    name: "Notification Sounds",
    description: "A soft note when someone pings you or sends you a direct message, so you hear Yapit without watching it.",
    defaultEnabled: false,

    settings: [
      { id: "mention", type: "toggle", label: "Ping sound", default: true,
        desc: "Plays when a new message mentions you, replies to you or calls @everyone." },
      { id: "dm", type: "toggle", label: "Direct message sound", default: true,
        desc: "Plays when a direct message lands while you are not mid conversation with that person." },
      { id: "volume", type: "range", label: "Volume", min: 0, max: 100, step: 5, unit: "%", default: 60 },
      {
        id: "test", type: "buttons", label: "Try it", actions: [
          { label: "Play ping sound", fn: function () { play("mention"); } },
          { label: "Play DM sound", fn: function () { play("dm"); } }
        ],
        desc: "Browsers only start sound after you have clicked or typed once on the page."
      }
    ],

    start: function (ctx) {
      YC.api("me").then(function (res) {
        if (res && res.user) {
          myId = res.user.id;
          myName = res.user.username || "";
        }
      }).catch(function () {});

      if (!bound) {
        bound = true;
        document.addEventListener("pointerdown", unlock, true);
        document.addEventListener("keydown", unlock, true);
      }
      ctx.onDispose(function () {
        document.removeEventListener("pointerdown", unlock, true);
        document.removeEventListener("keydown", unlock, true);
        bound = false;
      });

      ctx.on("api:messages", function (e) {
        handle("channel", e.req && e.req.channel, e.res && e.res.messages);
      });
      ctx.on("api:dm", function (e) {
        handle("dm", e.req && e.req.with, e.res && e.res.messages);
      });
    },

    stop: function () {
      maxId = {};
      turns = {};
      myId = null;
      myName = "";
      if (actx) { try { actx.close(); } catch (e) {} actx = null; }
    }
  });
})(window.YapCord);
