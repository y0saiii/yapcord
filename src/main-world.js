
(function () {
  "use strict";
  if (window.__yapcordMain) return;
  window.__yapcordMain = true;

  var THEME_STYLE_ID = "yapcord-theme";

  function post(t, extra) {
    try {
      var msg = { yc: 1, dir: "evt", t: t };
      if (extra) for (var k in extra) msg[k] = extra[k];
      window.postMessage(msg, "*");
    } catch (e) {}
  }

  function paintCachedTheme() {
    try {
      var raw = localStorage.getItem("yapcord_cache");
      if (!raw) return;
      var cache = JSON.parse(raw);
      if (!cache || !cache.css) return;
      var st = document.getElementById(THEME_STYLE_ID);
      if (!st) {
        st = document.createElement("style");
        st.id = THEME_STYLE_ID;
        (document.head || document.documentElement).appendChild(st);
      }
      st.textContent = cache.css;
    } catch (e) {}
  }
  paintCachedTheme();

  var originalFetch = window.fetch;
  if (typeof originalFetch === "function") {
    window.fetch = function () {
      var url = "", action = null, body = null;
      try {
        var input = arguments[0];
        url = typeof input === "string" ? input : (input && input.url) || "";
        var m = /[?&]a=([a-z_]+)/.exec(url);
        if (m) {
          action = m[1];
          var init = arguments[1];
          if (init && typeof init.body === "string") {
            try { body = JSON.parse(init.body); } catch (e) { body = null; }
          }
        }
      } catch (e) {}

      if (action) {
        if (action === "message_delete" && body && body.id != null) {
          post("deleq", { id: body.id, req: body });
        }
      }

      var result = originalFetch.apply(this, arguments);

      if (action) {
        result.then(function (res) {
          try {
            res.clone().text().then(
              function (txt) {
                var parsed = null;
                try { parsed = JSON.parse(txt); } catch (e) { parsed = null; }
                post("api", { action: action, req: body, res: parsed, status: res.status, ts: Date.now() });
              },
              function () { post("api", { action: action, req: body, res: null, status: res.status, ts: Date.now() }); }
            );
          } catch (e) {}
        }, function () {
          post("api", { action: action, req: body, res: null, error: true, ts: Date.now() });
        });
      }

      return result;
    };
  }

  var lastState = "";

  function snapshot() {
    var out = { path: location.hash || "" };
    try {
      if (typeof S !== "undefined" && S) {
        out.srv = S.srv != null ? S.srv : null;
        out.ch = S.ch != null ? S.ch : null;
        out.peer = (S.peer && S.peer.id != null) ? S.peer.id : null;
        out.rank = S.rank != null ? S.rank : null;
        out.tab = S.tab || null;
        out.ft = S.ft || null;
        out.chs = (S.chs || []).map(function (c) { return { id: c.id, name: c.name }; });
        out.servers = (S.servers || []).map(function (s) { return { id: s.id, name: s.name }; });
        out.members = (S.mem || []).map(function (m) { return { id: m.id, username: m.username }; });
        out.peerName = (S.peer && S.peer.username) || null;
      }
    } catch (e) {}
    try {
      if (typeof me !== "undefined" && me) {
        out.me = { id: me.id, username: me.username, role: me.role || "member", color: me.color || "" };
      }
    } catch (e) {}
    return out;
  }

  function pushState(force) {
    var snap = snapshot();
    var json = JSON.stringify(snap);
    if (!force && json === lastState) return;
    lastState = json;
    post("state", snap);
  }

  window.addEventListener("hashchange", function () { pushState(true); });
  setInterval(function () { pushState(false); }, 1000);

  window.addEventListener("message", function (e) {
    if (e.source !== window) return;
    var d = e.data;
    if (!d || d.yc !== 1 || d.dir !== "cmd") return;

    try {
      if (d.cmd === "settingsTab") {
        try { if (typeof S !== "undefined" && S) S.tab = "yapcord"; } catch (e) {}
        try { if (typeof settings === "function") settings(); } catch (e) {}
        pushState(true);
      } else if (d.cmd === "state") {
        pushState(true);
      } else if (d.cmd === "setReply") {
        try {
          var node = document.querySelector('#msgs .m[data-mid="' + String(d.id).replace(/["\\]/g, "") + '"]');
          if (node && typeof setReply === "function") setReply(node);
        } catch (e) {}
      } else if (d.cmd === "theme") {
        try {
          var st = document.getElementById(THEME_STYLE_ID);
          if (!st) {
            st = document.createElement("style");
            st.id = THEME_STYLE_ID;
            (document.head || document.documentElement).appendChild(st);
          }
          st.textContent = d.css || "";
        } catch (e) {}
      }
    } catch (e) {}
  });

  post("ready", { ts: Date.now() });
})();
