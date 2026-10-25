window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var h = YC.ui.h;

  var state = {
    q: "",
    scope: "current",
    rows: [],
    sel: 0,
    busy: false,
    abort: null,
    shown: false,
    timer: 0
  };

  var panel = null, input = null, list = null, status = null, scopeBtn = null;


  function tokens(s) {
    var out = [], re = /"([^"]*)"|(\S+)/g, m;
    while ((m = re.exec(s))) out.push(m[1] !== undefined ? m[1] : m[2]);
    return out;
  }

  function parseQuery(raw) {
    var q = { text: [], author: "", from: "", to: "" };
    tokens(String(raw || "")).forEach(function (t) {
      var m = /^([a-z]+):(.*)$/i.exec(t);
      if (m) {
        var key = m[1].toLowerCase(), val = m[2];
        if (!val) return;
        if (key === "from" || key === "author" || key === "by") { q.author = val; return; }
        if (key === "after" || key === "since") { q.from = val; return; }
        if (key === "before" || key === "until") { q.to = val; return; }
      }
      q.text.push(t.toLowerCase());
    });
    return q;
  }

  function dayOf(msg) {
    var s = msg.created || "";
    var d = new Date(String(s).replace(" ", "T"));
    if (isNaN(d.getTime())) return String(s).slice(0, 10);
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function matches(msg, q) {
    var body = String(msg.body || "").toLowerCase();
    for (var i = 0; i < q.text.length; i++) if (body.indexOf(q.text[i]) < 0) return false;
    if (q.author && String(msg.username || "").toLowerCase().indexOf(q.author.toLowerCase()) < 0) return false;
    if (q.from || q.to) {
      var day = dayOf(msg);
      if (q.from && day < q.from) return false;
      if (q.to && day > q.to) return false;
    }
    return true;
  }

  function targets() {
    var conv = YC.page.conversation();
    if (state.scope === "all") {
      var chans = YC.page.channels();
      if (!chans.length) return conv.kind === "channel" ? [{ kind: "channel", id: conv.id, label: conv.label }] : [];
      return chans.map(function (c) { return { kind: "channel", id: c.id, label: c.name }; });
    }
    return conv.kind === "none" ? [] : [{ kind: conv.kind, id: conv.id, label: conv.label }];
  }

  function localRows(q) {
    if (!YC.logStore) return [];
    return YC.logStore.rows().filter(function (row) {
      var r = row.rec;
      if (!matches({ body: r.body, username: r.username, created: r.created }, q)) return false;
      if (state.scope !== "all") {
        var wanted = targets().map(function (t) { return (t.kind === "channel" ? "c:" : "d:") + t.id; });
        if (wanted.indexOf(row.key) < 0) return false;
      }
      return true;
    }).map(function (row) {
      return {
        id: row.rec.id,
        username: row.rec.username,
        body: row.rec.body,
        created: row.rec.created,
        captured: row.rec.captured,
        label: row.conv.label,
        kind: row.conv.kind === "dm" ? "dm" : "channel",
        convId: row.key.split(":")[1],
        deleted: row.rec.deleted,
        local: true
      };
    });
  }


  function setStatus(text) { if (status) status.textContent = text; }

  function schedule() {
    clearTimeout(state.timer);
    if (state.abort) { state.abort.aborted = true; state.abort = null; state.busy = false; }

    if (!state.q.trim()) {
      state.rows = [];
      state.sel = 0;
      renderRows();
      setStatus("Type to search this conversation.");
      return;
    }
    setStatus("Searching…");
    state.timer = setTimeout(runSearch, 260);
  }

  async function runSearch() {
    var q = parseQuery(state.q);
    var scope = targets();
    if (!scope.length) { setStatus("Open a conversation first."); return; }

    var abort = state.abort = { aborted: false };
    state.busy = true;

    var out = [];
    var seen = Object.create(null);
    var push = function (m, label, kind, convId) {
      if (!matches(m, q)) return;
      var key = String(m.id) + "@" + label;
      if (seen[key]) return;
      seen[key] = true;
      out.push({
        id: m.id, username: m.username || "", body: m.body || "",
        created: m.created || "", label: label, kind: kind, convId: convId, local: false
      });
    };

    localRows(q).forEach(function (r) {
      var key = String(r.id) + "@" + r.label;
      if (seen[key]) return;
      seen[key] = true;
      out.push(r);
    });
    state.rows = out;
    state.sel = 0;
    renderRows();

    var pages = Number(YC.store.plugin("message-search").pages) || 60;

    for (var i = 0; i < scope.length && !abort.aborted; i++) {
      var t = scope[i];
      setStatus("Reading " + (t.label || "conversation") + "…");
      var msgs;
      try {
        msgs = await YC.api.fetchHistory({
          kind: t.kind, id: t.id, maxPages: pages, delay: 35,
          signal: abort,
          onError: function () {}
        });
      } catch (e) { msgs = []; }
      if (abort.aborted) break;
      msgs.forEach(function (m) { push(m, t.label, t.kind, t.id); });
      state.rows = out;
      renderRows();
    }

    if (state.abort !== abort) return;
    state.busy = false;
    state.abort = null;
    setStatus(out.length
      ? out.length + " match" + (out.length === 1 ? "" : "es") + ". Enter jumps, arrows move."
      : "Nothing found.");
    renderRows();
  }


  function renderRows() {
    if (!list) return;
    list.innerHTML = "";

    if (!state.rows.length) {
      list.appendChild(h("p", { class: "yc-muted yc-sempty", text: state.q.trim() ? "No messages match." : "" }));
      return;
    }

    state.rows.sort(function (a, b) {
      var ta = a.created || "", tb = b.created || "";
      if (ta !== tb) return ta < tb ? 1 : -1;
      return (b.captured || 0) - (a.captured || 0);
    });
    if (state.sel >= state.rows.length) state.sel = 0;

    state.rows.slice(0, 120).forEach(function (r, i) {
      var row = h("div", {
        class: "yc-sres" + (r.deleted ? " is-deleted" : "") + (i === state.sel ? " is-sel" : ""),
        role: "option", dataset: { i: String(i) },
        onclick: function (e) {
          if (e.target.closest(".yc-linkbtn")) return;
          jump(r);
        }
      },
        h("div", { class: "yc-sres-head" },
          h("b", { text: r.username || "unknown" }),
          h("span", { class: "yc-muted", text: r.label }),
          h("small", { class: "yc-muted", text: YC.api.fmtWhen(r.created, r.captured) }),
          r.deleted ? h("span", { class: "yc-badge yc-badge-del", text: "deleted" }) : null,
          r.local ? h("span", { class: "yc-badge yc-badge-local", text: "log" }) : null),
        h("p", { text: String(r.body || "") }),
        h("div", { class: "yc-logacts" },
          h("button", { type: "button", class: "yc-linkbtn", text: "Copy", onclick: function () { YC.ui.copy(r.body); } }),
          h("button", { type: "button", class: "yc-linkbtn", text: "Jump", onclick: function () { jump(r); } })));
      row.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        e.stopPropagation();
        YC.ui.menu(e.clientX, e.clientY, [
          { label: "Jump to message", fn: function () { jump(r); } },
          { label: "Copy text", fn: function () { YC.ui.copy(r.body); } }
        ]);
      });
      list.appendChild(row);
    });

    if (state.rows.length > 120) {
      list.appendChild(h("p", { class: "yc-muted yc-sempty", text: "Showing the 120 most recent matches, narrow the query." }));
    }
  }

  function jump(r) {
    if (r.kind === "dm") {
      if (!YC.page.openFriend(Number(r.convId))) YC.ui.toast("That DM isn't in your list.", "warn");
    } else if (!YC.page.openChannel(Number(r.convId))) {
      YC.ui.toast("That channel isn't in this server, switch server first.", "warn");
      return;
    }
    closePanel();
    setTimeout(function () {
      var sel = '#msgs .m[data-mid="' + (window.CSS && CSS.escape ? CSS.escape(String(r.id)) : String(r.id)) + '"]';
      var el = document.querySelector(sel);
      if (el) {
        el.scrollIntoView({ block: "center" });
        el.classList.add("yc-flash");
        setTimeout(function () { el.classList.remove("yc-flash"); }, 2200);
      } else {
        YC.ui.toast(r.deleted ? "That message was deleted, it only exists in the log." : "Message not loaded on screen yet, scroll up.", "info");
      }
    }, 450);
  }


  function ensurePanel() {
    if (panel && panel.isConnected) return panel;

    scopeBtn = h("button", {
      type: "button", class: "yc-btn ghost sm", title: "Switch between this conversation and every channel",
      onclick: function () {
        state.scope = state.scope === "current" ? "all" : "current";
        updateScope();
        schedule();
      }
    });
    status = h("small", { class: "yc-sb-status", text: "Type to search this conversation." });
    var closeBtn = h("button", { type: "button", class: "yc-x", text: "✕", title: "Close search", onclick: closePanel });
    list = h("div", { class: "yc-slist", role: "listbox", "aria-label": "Search results" });

    panel = h("div", { class: "yc-spanel", id: "yc-spanel", hidden: true },
      h("div", { class: "yc-sb-head" }, scopeBtn, status, closeBtn),
      list);

    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); closePanel(); }
    });
    document.body.appendChild(panel);
    updateScope();
    return panel;
  }

  function updateScope() {
    if (!scopeBtn) return;
    scopeBtn.textContent = state.scope === "all" ? "All channels" : "This chat";
    scopeBtn.classList.toggle("on", state.scope === "all");
  }

  function place() {
    if (!panel || panel.hidden) return;
    var w = Math.max(300, Math.min(560, window.innerWidth - 24));
    var left = Math.max(8, (window.innerWidth - w) / 2);
    var top = 64;
    if (input && input.isConnected) {
      var r = input.getBoundingClientRect();
      left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
      top = Math.min(r.bottom + 6, window.innerHeight - 140);
    }
    panel.style.left = left + "px";
    panel.style.top = top + "px";
    panel.style.width = w + "px";
  }

  function openPanel() {
    ensurePanel();
    panel.hidden = false;
    state.shown = true;
    place();
    renderRows();
  }

  function closePanel() {
    state.shown = false;
    if (state.abort) { state.abort.aborted = true; state.abort = null; state.busy = false; }
    clearTimeout(state.timer);
    if (panel && !panel.hidden) panel.hidden = true;
  }

  function outside(e) {
    if (!state.shown || !panel) return;
    var t = e.target;
    if (t && t.closest && (t.closest("#yc-spanel") || t.closest(".yc-sb"))) return;
    closePanel();
  }
  ["click", "scroll", "resize", "blur"].forEach(function (ev) {
    addEventListener(ev, outside, true);
  });


  function onInputKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (state.shown) closePanel();
      else { state.q = ""; e.target.value = ""; }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!state.rows.length) return;
      e.preventDefault();
      var n = state.rows.length;
      state.sel = (state.sel + (e.key === "ArrowDown" ? 1 : n - 1)) % n;
      renderRows();
      var sel = list && list.querySelector(".is-sel");
      if (sel) sel.scrollIntoView({ block: "nearest" });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      var r = state.rows[state.sel];
      if (r) jump(r);
    }
  }

  var MAGNIFIER = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"></circle><path d="M16.5 16.5 21 21"></path></svg>';


  function open() {
    openPanel();
    if (input && input.isConnected) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
    if (state.q.trim()) schedule();
    else setStatus("Type to search this conversation.");
  }

  function close() { closePanel(); if (input) input.blur(); }

  YC.messageSearch = { open: open, close: close };

  YC.registerPlugin({
    id: "message-search",
    name: "Message Search",
    description: "A search bar in the chat header. Search by text, who sent it and date, including deleted messages still in your log.",
    settings: [
      { id: "pages", type: "select", label: "History depth per conversation", default: "60",
        options: [["20", "20 pages (~1k messages)"], ["60", "60 pages (~3k messages)"], ["150", "150 pages (~7.5k messages)"], ["400", "400 pages (~20k messages)"]],
        desc: "How far back each conversation is read while searching." },
      { id: "openBtn", type: "buttons", label: "Search", actions: [
        { label: "Open the search bar", fn: function () { open(); } }
      ], desc: "You can also press the magnifier in the chat header, or Alt+M." }
    ],

    start: function (ctx) {
      ctx.css([
        ".yc-sb{display:flex;align-items:center;gap:.28rem;margin-left:auto;position:relative}",
        ".yc-sb-icon{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;",
        "border:2px solid transparent;border-radius:8px;background:none;color:var(--ink);cursor:pointer}",
        ".yc-sb-icon:hover{background:var(--yap);color:var(--yc-on-accent,#141210);border-color:var(--ink,#000)}",
        ".yc-sb-input{width:clamp(110px,20vw,230px);height:30px;padding:0 .55rem;font:inherit;font-size:.85rem;",
        "color:var(--ink);background:var(--sky);border:2px solid var(--ink,#000);border-radius:8px;outline:none}",
        ".yc-sb-input:focus{box-shadow:0 0 0 3px rgba(255,128,32,.45)}",
        ".yc-spanel{position:fixed;z-index:210;display:flex;flex-direction:column;background:var(--paper);",
        "border:var(--line);border-radius:14px;box-shadow:var(--hard);overflow:hidden;max-height:min(64vh,560px)}",
        ".yc-spanel[hidden]{display:none}",
        ".yc-sb-head{display:flex;align-items:center;gap:.6rem;padding:.45rem .55rem;background:var(--sky);border-bottom:2px solid var(--ink,#000)}",
        ".yc-sb-status{flex:1;min-width:0;color:var(--mute);font-size:.76rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
        ".yc-slist{display:grid;gap:.35rem;overflow:auto;padding:.4rem}",
        ".yc-sempty{margin:.5rem .35rem;font-size:.82rem}",
        ".yc-sres{border:2px solid transparent;border-radius:10px;padding:.4rem .5rem;cursor:pointer;background:transparent}",
        ".yc-sres:hover{background:var(--sky)}",
        ".yc-sres.is-sel{border-color:var(--yap);background:var(--sky)}",
        ".yc-sres.is-deleted{border-color:var(--yc-red,#E8412C)}",
        ".yc-sres.is-sel.is-deleted{border-color:var(--yc-red,#E8412C)}",
        ".yc-sres-head{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;font-size:.78rem}",
        ".yc-sres p{margin:.3rem 0 .1rem;white-space:pre-wrap;word-break:break-word;font-size:.86rem}",
        ".yc-logacts{display:flex;gap:.5rem;margin-top:.2rem}",
        ".yc-badge-local{background:var(--yap);color:var(--yc-on-accent,#141210)}",
        ".yc-flash{animation:yc-flash 1.1s ease 2}",
        "@keyframes yc-flash{0%,100%{box-shadow:none}50%{box-shadow:0 0 0 3px var(--yap)}}"
      ].join("\n"));

      YC.ui.headerButton("message-search", function () {
        var icon = h("button", {
          type: "button", class: "yc-sb-icon", title: "Search messages (Alt+M)", "aria-label": "Search messages",
          onclick: function (e) {
            e.stopPropagation();
            if (state.shown && document.activeElement === input) closePanel();
            else open();
          }
        });
        icon.innerHTML = MAGNIFIER;

        var inp = h("input", {
          class: "yc-sb-input", type: "search", placeholder: "Search", value: state.q,
          "aria-label": "Search messages",
          oninput: function (e) { state.q = e.target.value; openPanel(); schedule(); },
          onkeydown: onInputKey,
          onfocus: function () { if (state.q.trim()) openPanel(); }
        });
        input = inp;

        var wrap = h("span", { class: "yc-sb" }, icon, inp);
        if (state.shown) setTimeout(function () { open(); }, 0);
        return wrap;
      });

      ctx.on("log-changed", function () { if (state.shown) schedule(); });
    },

    stop: function () {
      closePanel();
      YC.ui.removeHeaderButton("message-search");
      if (panel) panel.remove();
      panel = input = list = status = scopeBtn = null;
      state.shown = false;
    }
  });
})(window.YapCord);
