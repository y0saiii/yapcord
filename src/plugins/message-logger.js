window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var h = YC.ui.h, esc = YC.ui.esc;
  var LOG_KEY = "yapcord.log";


  var logStore = YC.logStore = {
    data: { v: 1, convs: {} },
    loaded: false,
    _timer: 0,

    init: async function () {
      var saved = await YC.storage.get(LOG_KEY, null);
      if (saved && saved.convs) this.data = saved;
      if (!this.data || !this.data.convs) this.data = { v: 1, convs: {} };
      this.loaded = true;
      return this;
    },

    _save: function () {
      var self = this;
      clearTimeout(this._timer);
      this._timer = setTimeout(function () {
        self._trim();
        YC.storage.set(LOG_KEY, self.data);
      }, 500);
    },

    _trim: function () {
      var conf = YC.store.plugin("message-logger");
      var perConv = Number(conf.limit) || 400;
      var maxConvs = Number(conf.convLimit) || 60;
      var convs = this.data.convs;
      var keys = Object.keys(convs);

      keys.forEach(function (k) {
        var ids = Object.keys(convs[k].msgs || {});
        if (ids.length > perConv) {
          ids.sort(function (a, b) { return Number(a) - Number(b); });
          ids.slice(0, ids.length - perConv).forEach(function (id) { delete convs[k].msgs[id]; });
        }
      });

      if (keys.length > maxConvs) {
        keys.sort(function (a, b) { return (convs[a].touched || 0) - (convs[b].touched || 0); });
        keys.slice(0, keys.length - maxConvs).forEach(function (k) { delete convs[k]; });
      }
    },

    conv: function (key, meta) {
      var convs = this.data.convs;
      var c = convs[key];
      if (!c) c = convs[key] = { label: key, kind: "channel", srv: "", ch: "", msgs: {}, touched: Date.now() };
      if (meta) {
        if (meta.label) c.label = meta.label;
        if (meta.kind) c.kind = meta.kind;
        if (meta.srv != null) c.srv = String(meta.srv || "");
        if (meta.ch != null) c.ch = String(meta.ch || "");
      }
      c.touched = Date.now();
      return c;
    },

    upsert: function (key, meta, m) {
      if (!m || m.id == null) return null;
      var c = this.conv(key, meta);
      var id = String(m.id);
      var rec = c.msgs[id];
      var isNew = false, edited = false;

      if (!rec) {
        isNew = true;
        rec = c.msgs[id] = {
          id: m.id, uid: m.uid, username: m.username || "", role: m.role || "",
          badges: m.badges || "", body: m.body == null ? "" : String(m.body),
          created: m.created || "", captured: Date.now(),
          deleted: 0, edited: 0, orig: ""
        };
      } else if (m.body != null && String(m.body) !== rec.body && rec.body !== "") {
        rec.orig = rec.body;
        rec.body = String(m.body);
        rec.edited = Date.now();
        if (m.username) rec.username = m.username;
        edited = true;
      } else if (rec.deleted) {
        rec.deleted = 0;
      }

      c.touched = Date.now();
      this._save();
      return { rec: rec, isNew: isNew, edited: edited };
    },

    markDeleted: function (key, id) {
      var c = this.data.convs[key];
      var rec = c && c.msgs[String(id)];
      if (!rec) return null;
      if (!rec.deleted) rec.deleted = Date.now();
      this._save();
      YC.bus.emit("log-changed", { kind: "deleted", id: id, rec: rec, key: key });
      return rec;
    },

    markEdited: function (key, id, oldBody) {
      var c = this.data.convs[key];
      var rec = c && c.msgs[String(id)];
      if (!rec) return null;
      if (!rec.edited) { rec.edited = Date.now(); rec.orig = oldBody || rec.orig; }
      this._save();
      YC.bus.emit("log-changed", { kind: "edited", id: id, rec: rec, key: key });
      return rec;
    },

    find: function (id) {
      id = String(id);
      var convs = this.data.convs;
      var keys = Object.keys(convs);
      for (var i = 0; i < keys.length; i++) {
        var rec = convs[keys[i]].msgs[id];
        if (rec) return { key: keys[i], conv: convs[keys[i]], rec: rec };
      }
      return null;
    },

    remove: function (key, id) {
      var c = this.data.convs[key];
      if (!c) return;
      delete c.msgs[String(id)];
      this._save();
      YC.bus.emit("log-changed", { kind: "removed", id: id, key: key });
    },

    forget: function (id) {
      var found = this.find(id);
      if (!found) return null;
      this.remove(found.key, id);
      return found;
    },

    clearConv: function (key) {
      var c = this.data.convs[key];
      if (!c) return null;
      var ids = Object.keys(c.msgs || {});
      delete this.data.convs[key];
      this._save();
      YC.bus.emit("log-changed", { kind: "cleared", key: key });
      return { key: key, label: c.label, count: ids.length, ids: ids };
    },

    keysForServer: function (srvId, channelIds) {
      var self = this;
      var want = String(srvId);
      var keys = Object.keys(this.data.convs).filter(function (k) {
        var c = self.data.convs[k];
        return k.charAt(0) === "c:" && String(c.srv || "") === want;
      });
      if (!keys.length && channelIds && channelIds.length) {
        keys = Object.keys(this.data.convs).filter(function (k) {
          return k.charAt(0) === "c:" && channelIds.indexOf(String(k.slice(2))) >= 0;
        });
      }
      return keys;
    },

    clearServer: function (srvId, channelIds) {
      var self = this;
      var keys = this.keysForServer(srvId, channelIds);
      var count = 0, ids = [], labels = [];
      keys.forEach(function (k) {
        var r = self.clearConv(k);
        if (r) { count += r.count; ids = ids.concat(r.ids); labels.push(r.label); }
      });
      return { keys: keys, count: count, ids: ids, labels: labels };
    },

    stats: function () {
      var convs = this.data.convs, messages = 0, deleted = 0, edited = 0;
      Object.keys(convs).forEach(function (k) {
        Object.keys(convs[k].msgs || {}).forEach(function (id) {
          var r = convs[k].msgs[id];
          messages++;
          if (r.deleted) deleted++;
          if (r.edited) edited++;
        });
      });
      return { messages: messages, deleted: deleted, edited: edited, convs: Object.keys(convs).length };
    },

    rows: function () {
      var out = [];
      var convs = this.data.convs;
      Object.keys(convs).forEach(function (k) {
        var c = convs[k];
        Object.keys(c.msgs || {}).forEach(function (id) {
          var r = c.msgs[id];
          out.push({ key: k, conv: c, rec: r });
        });
      });
      out.sort(function (a, b) { return (b.rec.captured || 0) - (a.rec.captured || 0); });
      return out;
    },

    clear: function () {
      var convs = this.data.convs;
      var ids = [];
      Object.keys(convs).forEach(function (k) {
        Object.keys(convs[k].msgs || {}).forEach(function (id) { ids.push(id); });
      });
      this.data = { v: 1, convs: {} };
      clearTimeout(this._timer);
      YC.storage.set(LOG_KEY, this.data);
      if (ids.length) dropGhosts(ids);
      YC.bus.emit("log-changed", { kind: "cleared" });
    },

    exportJSON: function () {
      return {
        app: "YapCord", version: YC.VERSION, exported: new Date().toISOString(),
        stats: this.stats(), conversations: this.data.convs
      };
    }
  };


  function convKeyFromDOM() {
    var conv = YC.page.conversation();
    var srv = YC.page.server();
    var srvId = srv && srv.id != null && !srv.home ? String(srv.id) : "";
    if (conv.kind === "channel") return { key: "c:" + conv.id, meta: { label: "# " + conv.label, kind: "channel", srv: srvId, ch: String(conv.id) } };
    if (conv.kind === "dm") return { key: "d:" + conv.id, meta: { label: "@" + conv.label.replace(/^@/, ""), kind: "dm", srv: "", ch: "" } };
    return null;
  }

  function findNode(id) {
    var sel = '#msgs .m[data-mid="' + (window.CSS && CSS.escape ? CSS.escape(String(id)) : String(id)) + '"]';
    return document.querySelector(sel);
  }

  function recordFromEl(el) {
    var body = el.dataset.body || "";
    var nameEl = el.querySelector("b");
    var timeEl = el.querySelector("small");
    return {
      id: el.dataset.mid,
      uid: Number(el.dataset.uid),
      username: nameEl ? nameEl.textContent.trim() : "",
      body: body,
      created: timeEl ? timeEl.textContent.trim() : "",
      role: "", badges: ""
    };
  }

  function badge(text, kind) {
    return h("span", { class: "yc-badge yc-badge-" + kind, text: text });
  }

  function ghostNode(el) {
    if (!el || el.dataset.ycGhost === "1") return el;
    var clone = el.cloneNode(true);
    clone.dataset.ycGhost = "1";
    clone.classList.add("yc-deleted");
    var rec = logStore.find(clone.dataset.mid);
    if (rec && rec.rec && rec.rec.plain) clone.classList.add("yc-plain");
    el.dataset.ycSwap = "1";

    var inner = clone.querySelector("div");
    if (inner && !inner.querySelector(".yc-badge")) inner.insertBefore(badge("deleted", "del"), inner.firstChild);

    Array.prototype.forEach.call(clone.querySelectorAll("[data-del]"), function (b) { b.removeAttribute("data-del"); });

    el.replaceWith(clone);
    YC.bus.emit("ghost-changed", {});
    return clone;
  }

  YC.ghostMessage = function (id) {
    var el = findNode(id);
    if (el) return ghostNode(el);
    return null;
  };

  function showAgain(id) {
    var el = findNode(id);
    if (!el) return false;
    delete el.dataset.ycGhost;
    el.classList.remove("yc-deleted");
    var b = el.querySelector(".yc-badge");
    if (b) b.remove();
    return true;
  }

  function dropGhosts(ids) {
    var n = 0;
    (ids || []).forEach(function (id) {
      var el = findNode(id);
      if (el && el.dataset.ycGhost === "1") { el.dataset.ycSwap = "1"; el.remove(); n++; }
    });
    return n;
  }


  function forgetMessage(id) {
    var found = logStore.forget(id);
    if (!found) return false;
    dropGhosts([id]);
    return true;
  }

  function togglePlain(id) {
    var found = logStore.find(id);
    if (!found) return null;
    found.rec.plain = !found.rec.plain;
    logStore._save();
    var el = findNode(id);
    if (el && el.dataset.ycGhost === "1") {
      if (found.rec.plain) el.classList.add("yc-plain");
      else el.classList.remove("yc-plain");
    }
    YC.bus.emit("log-changed", { kind: "plain", id: id });
    return !!found.rec.plain;
  }

  function clearConversation(key) {
    var r = logStore.clearConv(key);
    if (!r) return false;
    dropGhosts(r.ids);
    return r;
  }

  function clearServerLog(srvId) {
    var ids = YC.page.channels().map(function (c) { return String(c.id); });
    var r = logStore.clearServer(srvId, ids);
    if (r && r.ids.length) dropGhosts(r.ids);
    return r;
  }

  function clearDmLogs() {
    var keys = Object.keys(logStore.data.convs).filter(function (k) { return k.charAt(0) === "d:"; });
    var count = 0, ids = [];
    keys.forEach(function (k) {
      var r = logStore.clearConv(k);
      if (r) { count += r.count; ids = ids.concat(r.ids); }
    });
    if (ids.length) dropGhosts(ids);
    return { keys: keys, count: count };
  }

  function clearedToast(result, none) {
    if (result && result.count) {
      YC.ui.toast("Cleared " + result.count + " message" + (result.count === 1 ? "" : "s") + " from the log.");
    } else {
      YC.ui.toast(none || "Nothing logged there yet.", "warn");
    }
  }


  function withPageMenu(x, y, items) {
    if (!items || !items.length) return;
    setTimeout(function () {
      var menus = document.querySelectorAll(".cm");
      var menu = null;
      for (var i = menus.length - 1; i >= 0; i--) {
        if (menus[i].classList.contains("yc-menu")) continue;
        if (menus[i].isConnected) { menu = menus[i]; break; }
      }
      if (!menu) { YC.ui.menu(x, y, items); return; }
      if (menu.querySelector("[data-yc-item]")) return;

      menu.appendChild(h("hr"));
      items.forEach(function (it) {
        if (it === "-" || (it && it.sep)) { menu.appendChild(document.createElement("hr")); return; }
        var b = h("button", {
          type: "button", role: "menuitem", text: it.label,
          onclick: function (e) {
            e.stopPropagation();
            menu.remove();
            if (it.fn) it.fn();
          }
        });
        b.setAttribute("data-yc-item", "1");
        menu.appendChild(b);
      });

      var w = menu.offsetWidth, hgt = menu.offsetHeight;
      var left = parseFloat(menu.style.left) || x || 0;
      var top = parseFloat(menu.style.top) || y || 0;
      menu.style.left = Math.max(8, Math.min(left, window.innerWidth - w - 8)) + "px";
      menu.style.top = Math.max(8, Math.min(top, window.innerHeight - hgt - 8)) + "px";
    }, 0);
  }

  function onMessageCtx(e) {
    var m = e.target && e.target.closest ? e.target.closest("#msgs .m") : null;
    if (!m || !m.dataset.mid) return;
    var id = m.dataset.mid;
    if (!logStore.find(id)) return;
    var items = [];
    if (m.dataset.ycGhost === "1") {
      items.push({
        label: "Toggle deleted highlight",
        fn: function () {
          var now = togglePlain(id);
          if (now != null) YC.ui.toast(now ? "Deleted highlight is off for that message." : "Deleted highlight is back on.");
        }
      });
      items.push("-");
    }
    items.push({
      label: "Clear message log",
      fn: function () {
        clearedToast(forgetMessage(id) ? { count: 1 } : null, "That message is not in the log.");
      }
    });
    withPageMenu(e.clientX, e.clientY, items);
  }

  function onServerCtx(e) {
    var el = e.target && e.target.closest ? e.target.closest("[data-srv]") : null;
    if (!el) return;
    var id = el.dataset.srv;
    withPageMenu(e.clientX, e.clientY, [{
      label: "Clear message log",
      fn: function () {
        if (id === "home") clearedToast(clearDmLogs(), "Nothing logged in your DMs yet.");
        else clearedToast(clearServerLog(id), "Nothing logged for that server yet.");
      }
    }]);
  }

  function onChannelCtx(e) {
    var el = e.target && e.target.closest ? e.target.closest("[data-ch]") : null;
    if (!el) return;
    e.preventDefault();
    var key = "c:" + el.dataset.ch;
    YC.ui.menu(e.clientX, e.clientY, [{
      label: "Clear message log",
      fn: function () { clearedToast(clearConversation(key), "Nothing logged in that channel yet."); }
    }]);
  }

  function wireContextMenus(ctx) {
    document.addEventListener("contextmenu", onMessageCtx, true);
    document.addEventListener("contextmenu", onServerCtx, true);
    document.addEventListener("contextmenu", onChannelCtx, true);
    ctx.onDispose(function () {
      document.removeEventListener("contextmenu", onMessageCtx, true);
      document.removeEventListener("contextmenu", onServerCtx, true);
      document.removeEventListener("contextmenu", onChannelCtx, true);
      YC.ui.closeMenu();
    });
  }


  function ingestList(kind, convId, messages) {
    if (!logStore.loaded || !messages || !messages.length || convId == null) return;
    var key = (kind === "channel" ? "c:" : "d:") + convId;
    var dom = convKeyFromDOM();
    var meta = (dom && dom.key === key)
      ? dom.meta
      : { label: (kind === "channel" ? "# " : "@ ") + convId, kind: kind === "channel" ? "channel" : "dm" };

    var touched = false;
    messages.forEach(function (m) {
      var r = logStore.upsert(key, meta, m);
      if (r && r.edited) {
        touched = true;
        if (YC.store.plugin("message-logger").markEdited) markInDom(m.id, "edited");
        note((m.username || "Someone") + " edited a message in " + meta.label);
      }
    });
    if (touched) YC.bus.emit("log-changed", { kind: "edited" });
  }

  function markInDom(id, kind) {
    var el = findNode(id);
    if (!el) return;
    var inner = el.querySelector("div");
    if (!inner) return;
    if (inner.querySelector(".yc-badge-" + kind)) return;
    inner.insertBefore(badge(kind, kind), inner.firstChild);
  }

  function note(text) {
    YC.notes.add(text, "edit");
    if (YC.store.get("notify.toast", true)) YC.ui.toast(text, "info");
  }

  function handleDeleteRequest(id) {
    id = String(id);
    var el = findNode(id);
    var found = logStore.find(id);
    var conf = YC.store.plugin("message-logger");

    if (!found) {
      if (el) {
        var domMeta = convKeyFromDOM();
        if (domMeta) {
          logStore.upsert(domMeta.key, domMeta.meta, recordFromEl(el));
          found = logStore.find(id);
        }
      }
    }

    var alreadyDeleted = !!(found && found.rec.deleted);
    if (found) logStore.markDeleted(found.key, id);
    if (conf.ghost !== false && el && el.dataset.ycGhost !== "1") ghostNode(el);

    if (found && !alreadyDeleted) {
      var text = (found.rec.username || "Someone") + " deleted a message in " + found.conv.label;
      YC.notes.add(text, "delete");
      if (YC.store.get("notify.toast", true)) YC.ui.toast(text, "info");
    }
  }

  async function scanConversation() {
    var conv = YC.page.conversation();
    if (conv.kind === "none") { YC.ui.toast("Open a channel or DM first.", "warn"); return; }
    var key = conv.kind === "channel" ? "c:" + conv.id : "d:" + conv.id;
    var c = logStore.data.convs[key];
    if (!c) { YC.ui.toast("Nothing logged for this conversation yet.", "warn"); return; }

    YC.ui.toast("Scanning " + (conv.label || "conversation") + " for deletions…");
    var live = await YC.api.fetchHistory({ kind: conv.kind, id: conv.id, maxPages: 120, delay: 40 });
    var liveIds = {};
    live.forEach(function (m) { liveIds[String(m.id)] = true; });

    var removed = 0;
    Object.keys(c.msgs).forEach(function (id) {
      if (liveIds[id]) return;
      var rec = c.msgs[id];
      if (rec.deleted) return;
      rec.deleted = Date.now();
      removed++;
      var el = findNode(id);
      if (YC.store.plugin("message-logger").ghost !== false && el) ghostNode(el);
    });
    logStore._save();
    YC.bus.emit("log-changed", { kind: "deleted" });
    YC.ui.toast(removed ? removed + " deleted message" + (removed === 1 ? "" : "s") + " found." : "No hidden deletions; the log is clean.");
  }


  var filter = { type: "all", q: "", conv: "all" };
  var headerBtn = null, headerCount = null;

  function updateHeaderButton() {
    if (!headerBtn || !headerCount) return;
    var s = logStore.stats();
    headerCount.textContent = s.deleted ? String(s.deleted) : "";
    headerBtn.classList.toggle("has-count", !!s.deleted);
  }

  function open() {
    var off = null;
    var modal = YC.ui.openModal({
      title: "YapCord: message log",
      onClose: function () { if (off) off(); }
    });
    off = YC.bus.on("log-changed", function () {
      if (!modal.el.isConnected) return;
      if (modal.el.contains(document.activeElement)) return;
      renderBody(modal);
    });
    renderBody(modal);
    return modal;
  }

  function renderBody(modal) {
    var body = modal.body;
    body.innerHTML = "";

    var stats = logStore.stats();
    body.appendChild(h("div", { class: "yc-stats" },
      stat(stats.messages, "kept"), stat(stats.deleted, "deleted"), stat(stats.edited, "edited"),
      stat(stats.convs, "conversations")));

    var chips = h("div", { class: "yc-chips" });
    [["all", "Everything"], ["deleted", "Deleted"], ["edited", "Edited"]].forEach(function (t) {
      chips.appendChild(h("button", {
        type: "button", class: "yc-chip" + (filter.type === t[0] ? " on" : ""), text: t[1],
        onclick: function () { filter.type = t[0]; renderBody(modal); }
      }));
    });

    var search = h("input", {
      class: "yc-input", type: "search", placeholder: "Filter by text, author or channel…", value: filter.q,
      oninput: function (e) { filter.q = e.target.value; renderRows(listEl, modal); }
    });

    var convSel = h("select", { class: "yc-input", onchange: function (e) { filter.conv = e.target.value; renderRows(listEl, modal); } });
    convSel.appendChild(h("option", { value: "all", text: "All conversations" }));
    Object.keys(logStore.data.convs).sort().forEach(function (k) {
      var c = logStore.data.convs[k];
      convSel.appendChild(h("option", { value: k, text: c.label + " (" + Object.keys(c.msgs).length + ")", selected: filter.conv === k ? true : null }));
    });
    if (filter.conv !== "all" && !logStore.data.convs[filter.conv]) filter.conv = "all";
    convSel.value = filter.conv;

    body.appendChild(h("div", { class: "yc-toolbar" }, chips, search, convSel));

    var listEl = h("div", { class: "yc-loglist" });
    body.appendChild(listEl);
    renderRows(listEl, modal);

    body.appendChild(h("div", { class: "yc-row yc-foot" },
      h("button", { type: "button", class: "yc-btn ghost", text: "Scan for deletions", onclick: function () { scanConversation().then(function () { renderBody(modal); }); } }),
      h("button", { type: "button", class: "yc-btn ghost", text: "Export", onclick: function () { YC.download("yapcord-message-log.json", JSON.stringify(logStore.exportJSON(), null, 2)); } }),
      h("button", {
        type: "button", class: "yc-btn danger", text: "Clear log",
        onclick: function () {
          YC.ui.confirm("Delete every recorded message?", { ok: "Clear it" }).then(function (yes) {
            if (yes) { logStore.clear(); renderBody(modal); }
          });
        }
      })));
  }

  function stat(n, label) {
    return h("div", { class: "yc-stat" }, h("b", { text: String(n) }), h("small", { text: label }));
  }

  function renderRows(listEl, modal) {
    listEl.innerHTML = "";
    var q = filter.q.trim().toLowerCase();
    var rows = logStore.rows().filter(function (row) {
      if (filter.type === "deleted" && !row.rec.deleted) return false;
      if (filter.type === "edited" && !row.rec.edited) return false;
      if (filter.conv !== "all" && row.key !== filter.conv) return false;
      if (q) {
        var hay = (row.rec.body + " " + row.rec.username + " " + row.conv.label).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });

    if (!rows.length) {
      listEl.appendChild(h("p", { class: "yc-muted", text: rows.length === 0 && !logStore.rows().length
        ? "Nothing recorded yet. Deleted and edited messages will show up here."
        : "No messages match those filters." }));
      return;
    }

    rows.slice(0, 300).forEach(function (row) {
      var r = row.rec;
      var item = h("div", { class: "yc-logrow" + (r.deleted ? " is-deleted" : "") + (r.edited ? " is-edited" : "") },
        h("div", { class: "yc-loghead" },
          h("b", { text: r.username || "unknown" }),
          h("span", { class: "yc-muted", text: row.conv.label }),
          h("small", { class: "yc-muted", text: YC.api.fmtWhen(r.created, r.captured) }),
          r.deleted ? badge("deleted " + timeAgo(r.deleted), "del") : null,
          r.edited ? badge("edited " + timeAgo(r.edited), "edit") : null),
        h("p", { text: r.body }),
        r.orig ? h("p", { class: "yc-orig", text: "was: " + r.orig }) : null,
        h("div", { class: "yc-logacts" },
          h("button", { type: "button", class: "yc-linkbtn", text: "Copy", onclick: function () { YC.ui.copy(r.body); } }),
          h("button", { type: "button", class: "yc-linkbtn", text: "Quote", onclick: function () { quoteIntoComposer(r); } }),
          h("button", { type: "button", class: "yc-linkbtn", text: r.deleted ? "Re-show" : "Hide", onclick: function () {
            if (r.deleted) { showAgain(r.id); r.deleted = 0; } else { r.deleted = Date.now(); YC.ghostMessage(r.id); }
            logStore._save(); renderBody(modal);
          } }),
          h("button", { type: "button", class: "yc-linkbtn danger", text: "Forget", onclick: function () { forgetMessage(r.id); renderRows(listEl, modal); } })));
      listEl.appendChild(item);

      item.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        e.stopPropagation();
        YC.ui.menu(e.clientX, e.clientY, [{
          label: "Clear message log", fn: function () {
            logStore.remove(row.key, r.id);
            dropGhosts([r.id]);
            renderRows(listEl, modal);
            YC.ui.toast("Removed that message from the log.");
          }
        }]);
      });
    });

    if (rows.length > 300) listEl.appendChild(h("p", { class: "yc-muted", text: "Showing 300 of " + rows.length + "; filter to narrow it down." }));
  }

  function timeAgo(ts) {
    var s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.round(s / 60) + "m ago";
    if (s < 86400) return Math.round(s / 3600) + "h ago";
    return Math.round(s / 86400) + "d ago";
  }

  function quoteIntoComposer(rec) {
    var input = YC.page.composer();
    if (!input) { YC.ui.toast("Open a conversation to quote into.", "warn"); return; }
    if (YC.replyTo) YC.replyTo(rec);
    else { input.value = (input.value ? input.value.replace(/\s*$/, " ") : "") + rec.body; input.focus(); }
  }


  YC.messageLogger = {
    open: open,
    scan: scanConversation,
    show: showAgain,
    ghost: ghostNode,
    forget: forgetMessage,
    clearConv: clearConversation,
    clearServerLog: clearServerLog
  };

  YC.registerPlugin({
    id: "message-logger",
    name: "MessageLogger",
    description: "Shows deleted and edited messages in chat and keeps a copy so you can read them later.",
    settings: [
      { id: "ghost", type: "toggle", label: "Keep deleted messages on screen", default: true, desc: "Deleted messages stay visible with a strike-through instead of vanishing." },
      { id: "markEdited", type: "toggle", label: "Flag edited messages", default: true },
      { id: "limit", type: "range", label: "Messages kept per conversation", min: 50, max: 2000, step: 50, unit: "", default: 400 },
      { id: "convLimit", type: "range", label: "Conversations kept", min: 5, max: 200, step: 5, unit: "", default: 60 },
      { id: "actions", type: "buttons", label: "Maintenance", actions: [
        { label: "Scan this conversation", fn: function () { return scanConversation(); } },
        { label: "Open the log", fn: function () { open(); } }
      ], desc: "A scan re-reads the conversation's history and marks anything that disappeared from the server." }
    ],

    start: function (ctx) {
      ctx.css([
        "#msgs .m.yc-deleted{opacity:.9}",
        "#msgs .m.yc-deleted p{color:var(--yc-del,#E8412C)}",
        "#msgs .m.yc-deleted .yc-badge{background:var(--yc-red-deep,#C9312A);color:#fff}",
        "#msgs .m.yc-deleted.yc-plain{opacity:1}",
        "#msgs .m.yc-deleted.yc-plain p{color:inherit}",
        "#msgs .m.yc-deleted.yc-plain .yc-badge{display:none}",
        "#msgs .m.yc-deleted.yc-plain .av{filter:none}",
        ".yc-badge{display:inline-block;font-size:.62rem;line-height:1;padding:.24rem .45rem;border:2px solid var(--ink,#000);",
        "border-radius:6px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;vertical-align:middle;margin:0 .3rem .2rem 0}",
        ".yc-badge-del{background:var(--yc-red-deep,#C9312A);color:#fff}",
        ".yc-badge-edit{background:var(--yc-yellow,#FFC800);color:#141210}",
        "body.yc-hide-ghosts #msgs .m.yc-deleted{display:none}"
      ].join("\n"));

      ctx.on("api:messages", function (e) { ingestList("channel", e.req && e.req.channel, e.res && e.res.messages); });
      ctx.on("api:dm", function (e) { ingestList("dm", e.req && e.req.with, e.res && e.res.messages); });

      ctx.on("main:deleq", function (e) { handleDeleteRequest(e.id); });
      ctx.on("api:message_delete", function (e) { handleDeleteRequest(e.id != null ? e.id : (e.req && e.req.id)); });

      var root = null, shadow = [];

      ctx.observe(document.documentElement, function (muts) {
        var msgs = document.querySelector("#msgs");
        if (!msgs) { root = null; shadow = []; return; }
        if (root !== msgs) { root = msgs; shadow = Array.prototype.slice.call(msgs.querySelectorAll(".m")); return; }

        muts.forEach(function (m) {
          if (m.type === "attributes" && m.attributeName === "data-body") {
            var el = m.target;
            if (!el.classList || !el.classList.contains("m")) return;
            var now = el.dataset.body || "";
            var found = logStore.find(el.dataset.mid);
            if (found && found.rec.body && found.rec.body !== now) {
              var old = found.rec.body;
              found.rec.orig = old;
              found.rec.body = now;
              found.rec.edited = Date.now();
              logStore._save();
              markInDom(el.dataset.mid, "edited");
              YC.bus.emit("log-changed", { kind: "edited" });
            }
            return;
          }
          if (m.type !== "childList" || m.target !== root) return;

          Array.prototype.forEach.call(m.removedNodes, function (n) {
            if (!n.classList || !n.classList.contains("m")) return;
            if (n.dataset.ycSwap === "1") return;
            if (n.dataset.ycGhost === "1") return;
            var idx = shadow.indexOf(n);
            var next = null;
            for (var i = idx + 1; i < shadow.length; i++) {
              if (shadow[i].parentNode === root) { next = shadow[i]; break; }
            }
            if (YC.store.plugin("message-logger").ghost !== false) {
              var ghost = ghostNode(n);
              if (ghost) { if (next) root.insertBefore(ghost, next); else root.appendChild(ghost); }
            }
            handleDeleteRequest(n.dataset.mid);
          });
        });

        shadow = Array.prototype.slice.call(root.querySelectorAll(".m"));
      }, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-body"] });

      YC.ui.headerButton("message-logger", function () {
        var b = h("button", {
          type: "button", class: "ghost sm yc-hbtn", title: "YapCord message log",
          onclick: function (e) { e.stopPropagation(); open(); }
        });
        headerCount = h("b", { text: "" });
        b.appendChild(document.createTextNode("Log "));
        b.appendChild(headerCount);
        headerBtn = b;
        updateHeaderButton();
        return b;
      });
      ctx.on("log-changed", updateHeaderButton);

      wireContextMenus(ctx);
    },

    stop: function () {
      YC.ui.removeHeaderButton("message-logger");
      headerBtn = headerCount = null;
    }
  });
})(window.YapCord);
