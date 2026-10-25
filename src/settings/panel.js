window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var h = YC.ui.h, esc = YC.ui.esc;

  var ICONS = {
    "message-logger": '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6"/>',
    "theme-manager": '<path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 1.4-3.4 2 2 0 0 1 1.4-3.4H19a5 5 0 0 0 5-5c0-4.7-5.6-6.2-12-6.2z"/><circle cx="7.5" cy="12" r="1.2"/><circle cx="10" cy="8" r="1.2"/><circle cx="15" cy="8" r="1.2"/>',
    "better-emoji-picker": '<circle cx="12" cy="12" r="9"/><path d="M8 14.5s1.6 2 4 2 4-2 4-2"/><circle cx="9" cy="9.5" r="1"/><circle cx="15" cy="9.5" r="1"/>',
    "quick-keybinds": '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>',
    "message-search": '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5L16 16"/>',
    "relationship-notifier": '<path d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8-2.5 8h17s-2.5-1.5-2.5-8"/><path d="M10.3 20.5a2 2 0 0 0 3.4 0"/>',
    "multi-line": '<path d="M4 7h16M4 12h10M4 17h16"/><path d="M17 15l2 2 2-2"/>',
    "custom-pfp": '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c0-3.6 3.4-5.5 7.5-5.5s7.5 1.9 7.5 5.5"/>',
    "notification-sounds": '<path d="M11 5 6.5 9H3v6h3.5L11 19z"/><path d="M15 9.5a4 4 0 0 1 0 5"/><path d="M17.8 6.8a8 8 0 0 1 0 10.4"/>',
    "character-counter": '<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M7.5 10.5v3M7.5 13.5h.01M11 10.5v3M13.5 10.5v3M11 13.5h2.5M16 10.5v3M16 13.5h.01"/>',
    "custom-font": '<path d="M4 19 11 5l7 14"/><path d="M7 14.5h8"/>'
  };

  function icon(id) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[id] || ICONS["message-search"]) + "</svg>";
  }

  var TABS = [
    ["plugins", "Plugins"],
    ["themes", "Themes"],
    ["keybinds", "Keybinds"],
    ["data", "Data"],
    ["about", "About"]
  ];

  var active = false;
  var tab = "plugins";
  var panel = null;
  var mounted = false;
  var scheduled = false;
  var retrying = 0;
  var observer = null;


  function mount() {
    if (mounted) return;
    mounted = true;
    document.addEventListener("click", onClickCapture, true);
    window.addEventListener("hashchange", schedule);
    observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    schedule();
  }

  function schedule() {
    if (scheduled) return;
    if (!/^#\/settings/.test(location.hash || "")) return;
    scheduled = true;
    var done = false;
    var run = function () {
      if (done) return;
      done = true;
      scheduled = false;
      sync();
    };
    requestAnimationFrame(run);
    setTimeout(run, 120);
  }

  function retry() {
    if (retrying >= 40) return;
    retrying++;
    setTimeout(function () { if (!scheduled) schedule(); }, 250);
  }

  function onClickCapture(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var b = t.closest("[data-t]");
    if (b && b.id !== "yc-tab" && b.closest("#v .tabs")) {
      active = false;
      schedule();
    }
  }

  function activate() {
    active = true;
    YC.send({ cmd: "settingsTab" });
    schedule();
  }


  function sync() {
    var wrap = document.querySelector("#v .wrap");
    if (!wrap) return retry();
    var tabs = null;
    for (var i = 0; i < wrap.children.length; i++) {
      var c = wrap.children[i];
      if (c.classList && c.classList.contains("tabs")) { tabs = c; break; }
    }
    if (!tabs) return retry();
    retrying = 0;

    var btn = tabs.querySelector("#yc-tab");
    if (!btn) {
      btn = h("button", {
        id: "yc-tab", class: "ghost sm", "data-t": "yapcord", type: "button", text: "YapCord",
        onclick: function (e) { e.stopPropagation(); activate(); }
      });
      tabs.appendChild(btn);
    }

    if (!panel) panel = buildPanel();
    if (panel.parentNode !== wrap) wrap.appendChild(panel);

    btn.classList.toggle("on", active);
    if (active) {
      Array.prototype.forEach.call(tabs.children, function (b) { if (b !== btn) b.classList.remove("on"); });
    }

    Array.prototype.forEach.call(wrap.children, function (child) {
      if (child === panel) return;
      var keepHeader = child === tabs || child.tagName === "H1";
      var next = (active && !keepHeader) ? "none" : "";
      if (child.style.display !== next) child.style.display = next;
    });
    panel.style.display = active ? "" : "none";
  }


  function buildPanel() {
    var root = h("div", { id: "yc-panel", class: "yc-panel" });
    render(root);
    YC.bus.on("plugin-toggled", function () { if (tab === "plugins") refresh(root); });
    YC.bus.on("keybinds-changed", function () { if (tab === "keybinds") refresh(root); });
    return root;
  }

  function refresh(root) {
    if (!root || !root.isConnected && root !== panel) return;
    render(root);
  }

  function render(root) {
    root.innerHTML = "";

    var master = h("input", {
      type: "checkbox", class: "yc-switch-input", checked: YC.store.get("master", true) ? true : null,
      onchange: function (e) {
        YC.store.set("master", e.target.checked, { now: true });
        YC.applyTheme();
        YC.syncPlugins();
        YC.ui.toast(e.target.checked ? "YapCord enabled." : "YapCord disabled.", e.target.checked ? "info" : "warn");
      }
    });
    root.appendChild(h("div", { class: "yc-panel-head" },
      h("img", { class: "yc-logo", src: YC.runtimeURL("logo.png"), alt: "YapCord" }),
      h("div", { class: "yc-panel-title" },
        h("b", { text: "YapCord" }),
        h("small", { text: "v" + YC.VERSION + ", client mod for Yapit" })),
      h("label", { class: "yc-switch", title: "Enable YapCord" }, master, h("span"))
    ));

    var bar = h("div", { class: "yc-panel-tabs" });
    TABS.forEach(function (t) {
      bar.appendChild(h("button", {
        type: "button", class: "yc-ptab" + (tab === t[0] ? " on" : ""), text: t[1],
        onclick: function () { tab = t[0]; refresh(root); }
      }));
    });
    root.appendChild(bar);

    var body = h("div", { class: "yc-panel-body" });
    root.appendChild(body);

    if (tab === "plugins") renderPlugins(body);
    else if (tab === "themes") renderThemes(body);
    else if (tab === "keybinds") renderKeybinds(body);
    else if (tab === "data") renderData(body);
    else renderAbout(body);
  }


  function renderPlugins(body) {
    var order = ["message-logger", "theme-manager", "better-emoji-picker", "quick-keybinds", "message-search", "relationship-notifier"];
    var list = Array.from(YC.plugins.values()).sort(function (a, b) {
      var ia = order.indexOf(a.id), ib = order.indexOf(b.id);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

    body.appendChild(h("p", { class: "yc-muted yc-lead", text: "Toggle a plugin to turn it on or off. Every plugin has its own options." }));

    list.forEach(function (spec) {
      var card = h("div", { class: "yc-plugin" + (YC.enabled(spec.id) ? " on" : "") });

      var enabled = YC.enabled(spec.id);
      var sw = h("input", {
        type: "checkbox", class: "yc-switch-input", checked: enabled ? true : null,
        onchange: function (e) {
          YC.store.set("plugins." + spec.id, e.target.checked, { now: true });
          YC.applyTheme();
          YC.syncPlugins();
          card.classList.toggle("on", e.target.checked);
          YC.ui.toast(spec.name + (e.target.checked ? " enabled." : " disabled."));
        }
      });

      var hasSettings = !!(spec.settings && spec.settings.length);
      var head = h("div", { class: "yc-plugin-head" },
        h("span", { class: "yc-plugin-icon", html: icon(spec.id) }),
        h("div", { class: "yc-plugin-text" },
          h("b", { text: spec.name }),
          h("small", { text: spec.description || "" })),
        h("label", { class: "yc-switch" }, sw, h("span"))
      );
      card.appendChild(head);

      if (hasSettings) {
        var box = h("div", { class: "yc-plugin-settings", hidden: true });
        var toggle = h("button", {
          type: "button", class: "yc-linkbtn", text: "Configure ▾",
          onclick: function () {
            var show = box.hidden;
            box.hidden = !show;
            toggle.textContent = show ? "Configure ▴" : "Configure ▾";
          }
        });
        spec.settings.forEach(function (s) {
          box.appendChild(renderSetting(spec, s));
        });
        card.appendChild(toggle);
        card.appendChild(box);
      } else {
        card.appendChild(h("small", { class: "yc-muted", text: "No options; it just works." }));
      }

      body.appendChild(card);
    });
  }

  function renderSetting(spec, s) {
    var wrap = h("div", { class: "yc-field" });
    var label = h("label", { class: "yc-field-label", text: s.label + (s.required ? " *" : "") });
    var current = function () { return YC.store.plugin(spec.id)[s.id]; };
    var commit = function (value) {
      YC.store.plugin(spec.id)[s.id] = value;
      YC.store.save();
      YC.bus.emit("plugin-settings", { id: spec.id, key: s.id, value: value });
    };

    var input;
    switch (s.type) {
      case "toggle":
        wrap.className = "yc-field yc-field-inline";
        input = h("input", {
          type: "checkbox", class: "yc-switch-input", checked: current() ? true : null,
          onchange: function (e) { commit(e.target.checked); }
        });
        wrap.appendChild(h("label", { class: "yc-switch" }, input, h("span")));
        wrap.appendChild(h("div", null, h("b", { text: s.label }), s.desc ? h("small", { class: "yc-muted", text: s.desc }) : null));
        return wrap;

      case "select":
        input = h("select", { class: "yc-input", onchange: function (e) { commit(coerce(e.target.value, s)); } });
        (s.options || []).forEach(function (o) {
          var val = Array.isArray(o) ? o[0] : o.value;
          var lab = Array.isArray(o) ? o[1] : o.label;
          input.appendChild(h("option", { value: String(val), text: lab, selected: String(val) === String(current()) ? true : null }));
        });
        break;

      case "range":
        var readout = h("b", { class: "yc-readout", text: String(current()) + (s.unit || "") });
        input = h("input", {
          type: "range", class: "yc-range", min: s.min, max: s.max, step: s.step || 1, value: String(current()),
          oninput: function (e) { readout.textContent = e.target.value + (s.unit || ""); commit(Number(e.target.value)); }
        });
        wrap.appendChild(h("div", { class: "yc-field-inline" }, label, readout));
        wrap.appendChild(input);
        if (s.desc) wrap.appendChild(h("small", { class: "yc-muted", text: s.desc }));
        return wrap;

      case "textarea":
        input = h("textarea", {
          class: "yc-input yc-textarea", rows: s.rows || 4, placeholder: s.placeholder || "",
          oninput: function (e) { commit(e.target.value); }
        });
        input.value = current() == null ? "" : String(current());
        break;

      case "color":
        input = h("input", {
          type: "color", class: "yc-color", value: current() || "#ff8020",
          oninput: function (e) { commit(e.target.value); hex.textContent = e.target.value; }
        });
        var hex = h("code", { class: "yc-readout", text: current() || "#ff8020" });
        wrap.appendChild(h("div", { class: "yc-field-inline" }, label, hex));
        wrap.appendChild(input);
        return wrap;

      case "buttons":
        var row = h("div", { class: "yc-row" });
        (s.actions || []).forEach(function (a) {
          row.appendChild(h("button", {
            type: "button", class: "yc-btn " + (a.danger ? "danger" : "ghost"), text: a.label,
            onclick: function () { Promise.resolve(a.fn()).catch(function (e) { YC.ui.toast(String(e && e.message || e), "error"); }); }
          }));
        });
        wrap.appendChild(label);
        wrap.appendChild(row);
        if (s.desc) wrap.appendChild(h("small", { class: "yc-muted", text: s.desc }));
        return wrap;

      case "number":
        input = h("input", {
          type: "number", class: "yc-input", min: s.min, max: s.max, value: String(current()),
          onchange: function (e) { commit(Number(e.target.value)); }
        });
        break;

      default:
        input = h("input", {
          type: "text", class: "yc-input", placeholder: s.placeholder || "",
          oninput: function (e) { commit(e.target.value); }
        });
        input.value = current() == null ? "" : String(current());
    }

    wrap.appendChild(label);
    wrap.appendChild(input);
    if (s.desc) wrap.appendChild(h("small", { class: "yc-muted", text: s.desc }));
    return wrap;
  }

  function coerce(value, s) {
    if (s && s.coerce === "number") return Number(value);
    return value;
  }


  function renderThemes(body) {
    body.appendChild(h("p", { class: "yc-muted yc-lead", text: "Pick a look for Yapit, or write your own CSS below." }));

    var grid = h("div", { class: "yc-themes" });
    YC.themes.forEach(function (t) {
      var selected = YC.store.get("theme.id", "yapcord-orange") === t.id;
      var card = h("button", {
        type: "button", class: "yc-theme" + (selected ? " on" : ""),
        onclick: function () {
          YC.store.set("theme.id", t.id, { now: true });
          YC.applyTheme();
          refresh(panel);
        }
      },
        h("span", { class: "yc-theme-swatch " + t.id }),
        h("b", { text: t.name }),
        h("small", { class: "yc-muted", text: t.desc })
      );
      grid.appendChild(card);
    });
    body.appendChild(grid);

    var accent = YC.store.get("theme.accent", "");
    var accentInput = h("input", {
      type: "color", class: "yc-color", value: accent || "#ff8020",
      oninput: function (e) { YC.store.set("theme.accent", e.target.value, { now: true }); YC.applyTheme(); }
    });
    body.appendChild(h("div", { class: "yc-field" },
      h("div", { class: "yc-field-inline" }, h("label", { class: "yc-field-label", text: "Accent override" }),
        h("button", {
          type: "button", class: "yc-linkbtn", text: "Reset",
          onclick: function () { YC.store.set("theme.accent", "", { now: true }); YC.applyTheme(); refresh(panel); }
        })),
      h("div", { class: "yc-row" }, accentInput, h("code", { class: "yc-readout", text: accent || "theme default" })),
      h("small", { class: "yc-muted", text: "Changes Yapit's accent colour while a YapCord theme is on." })));

    var ta = h("textarea", { class: "yc-input yc-textarea yc-code", rows: 12, spellcheck: "false" });
    ta.value = YC.store.get("theme.custom", "");
    var status = h("small", { class: "yc-muted", text: "Autosaved. Select the Custom CSS theme above to apply." });
    var saveBtn = h("button", {
      type: "button", class: "yc-btn primary", text: "Save & apply",
      onclick: function () {
        YC.store.set("theme.custom", ta.value, { now: true });
        YC.store.set("theme.id", "custom", { now: true });
        YC.applyTheme();
        status.textContent = "Applied at " + new Date().toLocaleTimeString() + ".";
        refresh(panel);
      }
    });

    body.appendChild(h("div", { class: "yc-field" },
      h("label", { class: "yc-field-label", text: "Custom CSS" }),
      ta,
      h("div", { class: "yc-row" }, saveBtn, status)));
  }


  function renderKeybinds(body) {
    body.appendChild(h("p", { class: "yc-muted yc-lead", text: "Click a key, then press the combo you want. Esc cancels." }));

    var defs = YC.keybinds.list();
    if (!defs.length) { body.appendChild(h("p", { text: "No keybinds registered yet." })); return; }

    var groups = {};
    defs.forEach(function (d) {
      var g = d.group || d.plugin || "general";
      (groups[g] = groups[g] || []).push(d);
    });

    Object.keys(groups).forEach(function (g) {
      var spec = YC.plugins.get(g);
      body.appendChild(h("h4", { class: "yc-group", text: spec ? spec.name : g }));
      groups[g].forEach(function (d) {
        var combo = YC.keybinds.combo(d.id);
        var warn = combo ? YC.keybinds.warnFor(combo) : "";
        var btn = h("button", {
          type: "button", class: "yc-key" + (combo ? "" : " unset"), text: YC.keybinds.pretty(combo),
          onclick: function () {
            btn.classList.add("recording");
            btn.textContent = "Press keys…";
            YC.keybinds.record(function (result) {
              btn.classList.remove("recording");
              if (result === null) { btn.textContent = YC.keybinds.pretty(YC.keybinds.combo(d.id)); return; }
              YC.keybinds.setCombo(d.id, result);
              btn.textContent = YC.keybinds.pretty(result);
              var w = YC.keybinds.warnFor(result);
              if (w) YC.ui.toast(w, "warn");
              renderKeybinds(body);
            });
          }
        });
        var row = h("div", { class: "yc-kbrow" },
          h("div", { class: "yc-kbinfo" },
            h("b", { text: d.name }),
            d.desc ? h("small", { class: "yc-muted", text: d.desc }) : null,
            warn ? h("small", { class: "yc-warn", text: warn }) : null),
          h("div", { class: "yc-kbkeys" },
            btn,
            h("button", { type: "button", class: "yc-linkbtn", text: "Clear", onclick: function () { YC.keybinds.setCombo(d.id, null); renderKeybinds(body); } }),
            d.default ? h("button", { type: "button", class: "yc-linkbtn", text: "Default", onclick: function () { YC.keybinds.reset(d.id); renderKeybinds(body); } }) : null));
        body.appendChild(row);
      });
    });

    body.appendChild(h("div", { class: "yc-row" },
      h("button", {
        type: "button", class: "yc-btn ghost", text: "Reset all keybinds",
        onclick: function () { YC.keybinds.resetAll(); renderKeybinds(body); }
      })));
  }


  function renderData(body) {
    body.appendChild(h("p", { class: "yc-muted yc-lead", text: "Everything YapCord stores stays in your browser. Nothing is uploaded anywhere." }));

    var logStats = YC.logStore && YC.logStore.stats ? YC.logStore.stats() : null;
    body.appendChild(h("div", { class: "yc-card" },
      h("b", { text: "Message log" }),
      h("p", { class: "yc-muted", text: logStats
        ? logStats.messages + " messages kept across " + logStats.convs + " conversations, " +
          logStats.deleted + " deleted, " + logStats.edited + " edited."
        : "MessageLogger is off, so nothing is being recorded." }),
      h("div", { class: "yc-row" },
        h("button", {
          type: "button", class: "yc-btn ghost", text: "Export log (.json)",
          onclick: function () {
            if (!YC.logStore) return YC.ui.toast("MessageLogger is off.", "warn");
            YC.download("yapcord-message-log.json", JSON.stringify(YC.logStore.exportJSON(), null, 2));
          }
        }),
        h("button", {
          type: "button", class: "yc-btn danger", text: "Clear log",
          onclick: function () {
            YC.ui.confirm("Delete every recorded message from YapCord's log?", { ok: "Clear it" }).then(function (yes) {
              if (!yes || !YC.logStore) return;
              YC.logStore.clear();
              YC.ui.toast("Message log cleared.");
              refresh(panel);
            });
          }
        }))));

    var notes = YC.notes ? YC.notes.list() : [];
    var box = h("div", { class: "yc-card" }, h("b", { text: "Notification history" }));
    if (!notes.length) box.appendChild(h("p", { class: "yc-muted", text: "No notifications yet." }));
    else {
      var listEl = h("div", { class: "yc-notes" });
      notes.slice(0, 25).forEach(function (n) {
        listEl.appendChild(h("div", { class: "yc-note-row" },
          h("span", { class: "yc-note-kind " + (n.kind || "info"), text: n.kind || "info" }),
          h("span", { text: n.text }),
          h("small", { class: "yc-muted", text: new Date(n.t).toLocaleString() })));
      });
      box.appendChild(listEl);
    }
    box.appendChild(h("div", { class: "yc-row" },
      h("button", {
        type: "button", class: "yc-btn ghost", text: "Clear history",
        onclick: function () { if (YC.notes) YC.notes.clear(); refresh(panel); }
      }),
      h("label", { class: "yc-check" },
        h("input", {
          type: "checkbox", checked: YC.store.get("notify.browser", true) ? true : null,
          onchange: function (e) { YC.store.set("notify.browser", e.target.checked, { now: true }); }
        }),
        h("span", { text: " also show desktop notifications" })),
      h("label", { class: "yc-check" },
        h("input", {
          type: "checkbox", checked: YC.store.get("notify.toast", true) ? true : null,
          onchange: function (e) { YC.store.set("notify.toast", e.target.checked, { now: true }); }
        }),
        h("span", { text: " show in-page toasts" }))));
    body.appendChild(box);

    body.appendChild(h("div", { class: "yc-card" },
      h("b", { text: "Settings" }),
      h("p", { class: "yc-muted", text: "Back up everything as a single file: plugins, theme, keybinds." }),
      h("div", { class: "yc-row" },
        h("button", {
          type: "button", class: "yc-btn ghost", text: "Export settings",
          onclick: function () { YC.download("yapcord-settings.json", JSON.stringify(YC.store.cfg, null, 2)); }
        }),
        h("button", {
          type: "button", class: "yc-btn ghost", text: "Import settings",
          onclick: function () { importSettings(); }
        }),
        h("button", {
          type: "button", class: "yc-btn danger", text: "Reset YapCord",
          onclick: function () {
            YC.ui.confirm("Reset every YapCord setting, theme, keybind and saved log?", { ok: "Reset everything" }).then(function (yes) {
              if (!yes) return;
              YC.store.wipe().then(function () { location.reload(); });
            });
          }
        }))));
  }

  function importSettings() {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = function () {
      var f = input.files && input.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(String(reader.result));
          if (!data || typeof data !== "object") throw new Error("not a settings file");
          chrome.storage.local.set({ "yapcord.config": data }, function () { location.reload(); });
        } catch (e) { YC.ui.toast("Import failed: " + e.message, "error"); }
      };
      reader.readAsText(f);
    };
    input.click();
  }


  function renderAbout(body) {
    body.appendChild(h("div", { class: "yc-about" },
      h("img", { class: "yc-logo big", src: YC.runtimeURL("logo.png"), alt: "YapCord" }),
      h("h3", { text: "YapCord v" + YC.VERSION }),
      h("p", { class: "yc-muted", text: "YapCord adds themes, plugins, keybinds and a message log to Yapit. It runs in your browser as an extension and keeps everything it saves on your own device." }),
      h("p", { class: "yc-muted", text: "It only ever touches yapit.online, and only shows you things you could already see in the page." })
    ));

    body.appendChild(h("div", { class: "yc-card" },
      h("b", { text: "Included plugins" }),
      h("ul", { class: "yc-list" },
        Array.from(YC.plugins.values()).map(function (p) {
          return h("li", null, h("b", { text: p.name }), h("span", { class: "yc-muted", text: ": " + (p.description || "") }));
        }))));

    body.appendChild(h("div", { class: "yc-card" },
      h("b", { text: "Source" }),
      h("p", { class: "yc-muted", text: "MIT licensed. Fork it, break it, send PRs." }),
      h("a", { class: "yc-btn primary", href: "https://github.com/y0saiii/yapcord", target: "_blank", rel: "noopener", text: "github.com/y0saiii/yapcord" })));
  }

  YC.settingsPanel = {
    mount: mount,
    open: function () { if (!/^#\/settings/.test(location.hash || "")) location.hash = "#/settings"; activate(); },
    isActive: function () { return active; },
    resync: schedule
  };
})(window.YapCord);
