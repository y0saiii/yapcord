window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var h = YC.ui.h;


  function onOver(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var m = t.closest("#msgs .m[data-mid]");
    var prev = document.querySelector(".m[data-yc-hover='1']");
    if (prev && prev !== m) prev.removeAttribute("data-yc-hover");
    if (m && m.dataset.ycHover !== "1") m.dataset.ycHover = "1";
  }
  function onOut(e) {
    var m = e.target && e.target.closest ? e.target.closest("#msgs .m[data-mid]") : null;
    if (m && !m.contains(e.relatedTarget)) m.removeAttribute("data-yc-hover");
  }

  function hoveredRec() {
    var el = YC.page.hovered();
    if (!el) return null;
    var nameEl = el.querySelector("b");
    return {
      id: el.dataset.mid,
      uid: Number(el.dataset.uid),
      username: nameEl ? nameEl.textContent.trim() : "",
      body: el.dataset.body || ""
    };
  }

  function needMessage() {
    var rec = hoveredRec();
    if (!rec) YC.ui.toast("Hover a message first.", "warn");
    return rec;
  }

  function clip(s, n) {
    s = String(s == null ? "" : s);
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }


  YC.replyTo = function (rec) {
    if (!rec) return;
    YC.send({ cmd: "setReply", id: rec.id });
    YC.ui.toast("Replying to @" + (rec.username || "someone") + ".");
  };


  function actionReply() { var rec = needMessage(); if (rec) YC.replyTo(rec); }

  function actionDelete() {
    var rec = needMessage();
    if (!rec) return;
    var conf = YC.store.plugin("quick-keybinds");
    var go = function () {
      YC.api("message_delete", { id: Number(rec.id) }).then(function () {
        if (YC.logStore) {
          var found = YC.logStore.find(rec.id);
          if (found) YC.logStore.markDeleted(found.key, rec.id);
        }
        if (YC.ghostMessage) YC.ghostMessage(rec.id);
        YC.ui.toast("Message deleted.");
      }, function (err) {
        YC.ui.toast("Delete failed: " + (err && err.message || err), "error");
      });
    };
    if (conf.confirmDelete === false) go();
    else YC.ui.confirm("Delete “" + clip(rec.body, 70) + "”?", { ok: "Delete", danger: true }).then(function (yes) { if (yes) go(); });
  }

  function actionEdit() {
    var rec = needMessage();
    if (!rec) return;
    var inp = YC.page.composer();
    if (!inp) { YC.ui.toast("Open a conversation first.", "warn"); return; }
    inp.value = rec.body;
    inp.focus();
    inp.setSelectionRange(inp.value.length, inp.value.length);
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    YC.ui.toast("Yapit can't edit messages yet; the original is loaded in the composer.", "warn");
  }

  function actionCopy() {
    var rec = needMessage();
    if (rec) YC.ui.copy(rec.body);
  }

  function actionEmoji() { if (YC.openEmojiPicker) YC.openEmojiPicker(); }

  function actionSearch() {
    if (YC.messageSearch && YC.messageSearch.open) YC.messageSearch.open();
    else YC.ui.toast("Message Search is disabled.", "warn");
  }

  function actionLog() {
    if (YC.messageLogger && YC.messageLogger.open) YC.messageLogger.open();
    else YC.ui.toast("MessageLogger is disabled.", "warn");
  }

  function actionSettings() { YC.settingsPanel.open(); }

  function actionFocusComposer() {
    var inp = YC.page.composer();
    if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    else YC.ui.toast("Open a conversation first.", "warn");
  }

  function actionJumpLatest() {
    var root = YC.page.messagesRoot();
    if (root) root.scrollTop = root.scrollHeight;
    else YC.ui.toast("No messages on screen.", "warn");
  }

  function actionToggleGhosts() {
    var off = document.body.classList.toggle("yc-hide-ghosts");
    YC.ui.toast(off ? "Deleted messages hidden." : "Deleted messages visible.");
  }

  function actionJumpChannel(n) {
    return function () {
      var chans = YC.page.channels();
      var target = chans[n - 1];
      if (!target) { YC.ui.toast("No channel #" + n + " in this server.", "warn"); return; }
      if (!YC.page.openChannel(target.id)) YC.ui.toast("Couldn't open #" + target.name + ".", "warn");
    };
  }

  function actionScroll(dir) {
    return function () {
      var root = YC.page.messagesRoot();
      if (root) root.scrollTop += dir * Math.round(root.clientHeight * 0.85);
    };
  }


  var defs = [
    { id: "yk.reply", name: "Reply to hovered message", default: "alt+r", run: actionReply, requires: function () { return !!YC.page.hovered(); }, hint: "Hover a message first.", desc: "Quotes the message when you send yours." },
    { id: "yk.delete", name: "Delete hovered message", default: "alt+d", run: actionDelete, requires: function () { return !!YC.page.hovered(); }, hint: "Hover a message first." },
    { id: "yk.edit", name: "Edit hovered message", default: "alt+e", run: actionEdit, requires: function () { return !!YC.page.hovered(); }, hint: "Hover a message first." },
    { id: "yk.copy", name: "Copy hovered message", default: "alt+c", run: actionCopy, requires: function () { return !!YC.page.hovered(); }, hint: "Hover a message first." },
    { id: "yk.emoji", name: "Toggle emoji picker", default: "alt+o", run: actionEmoji },
    { id: "yk.search", name: "Search messages", default: "alt+m", run: actionSearch },
    { id: "yk.log", name: "Open the message log", default: "alt+l", run: actionLog },
    { id: "yk.settings", name: "Open YapCord settings", default: "alt+y", run: actionSettings },
    { id: "yk.composer", name: "Focus the composer", default: "alt+n", run: actionFocusComposer },
    { id: "yk.latest", name: "Jump to latest message", default: "alt+j", run: actionJumpLatest },
    { id: "yk.ghosts", name: "Toggle deleted-message ghosts", default: "alt+g", run: actionToggleGhosts },
    { id: "yk.up", name: "Scroll messages up", default: "alt+arrowup", run: actionScroll(-1) },
    { id: "yk.down", name: "Scroll messages down", default: "alt+arrowdown", run: actionScroll(1) }
  ];
  for (var n = 1; n <= 9; n++) {
    defs.push({
      id: "yk.ch" + n, name: "Jump to channel #" + n, default: "alt+" + n,
      run: actionJumpChannel(n), desc: "Opens the " + n + "th channel of the current server."
    });
  }

  defs.forEach(function (d) { YC.keybinds.define(d); });


  YC.registerPlugin({
    id: "quick-keybinds",
    name: "QuickKeybinds",
    description: "Reply, delete, edit, copy and jump around without touching the mouse.",
    settings: [
      { id: "confirmDelete", type: "toggle", label: "Confirm before deleting", default: true, desc: "Ask first when a keybind is used to delete a message." }
    ],

    start: function (ctx) {
      ctx.css([
        ".m[data-yc-hover='1']{box-shadow:inset 0 0 0 2px rgba(255,128,32,.55);border-radius:8px}"
      ].join("\n"));

      document.addEventListener("mouseover", onOver, true);
      document.addEventListener("mouseout", onOut, true);
      ctx.onDispose(function () {
        document.removeEventListener("mouseover", onOver, true);
        document.removeEventListener("mouseout", onOut, true);
      });
    },

    stop: function () {}
  });
})(window.YapCord);
