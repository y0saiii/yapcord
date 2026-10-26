(function () {
  "use strict";
  var YC = window.YapCord;
  if (!YC || YC._booted) return;
  YC._booted = true;

  YC.pageState = null;
  YC.bus.on("main:state", function (d) { YC.pageState = d; });
  YC.bus.on("main:ready", function () { YC.send({ cmd: "state" }); });

  async function boot() {
    try {
      await YC.store.load();
    } catch (e) {
      console.warn("[YapCord] config failed to load", e);
    }

    YC.seedPlugins();

    try { if (YC.logStore && YC.logStore.init) await YC.logStore.init(); } catch (e) {}
    try { if (YC.notes && YC.notes.init) await YC.notes.init(); } catch (e) {}

    YC.applyTheme();
    YC.syncPlugins();
    YC.settingsPanel.mount();

    try { if (YC.pfp) YC.pfp.start(); } catch (e) { console.warn("[YapCord] profile picture", e); }

    YC.store.onChange(function () {
      try {
        YC.applyTheme();
        YC.syncPlugins();
      } catch (e) { console.warn("[YapCord] config change", e); }
    });

    if (!YC.messageSearch) YC.messageSearch = { open: function () { YC.ui.toast("Message Search is disabled.", "warn"); } };

    welcome();
  }

  async function welcome() {
    if (YC.store.get("seenWelcome")) return;
    var wait = function () {
      if (!document.body) { return void setTimeout(wait, 400); }
      YC.ui.toast("YapCord is running; press " + YC.keybinds.pretty(YC.keybinds.combo("yk.settings")) + " for its settings.", "info");
      YC.store.set("seenWelcome", true, { now: true });
    };
    setTimeout(wait, 1200);
  }

  boot();
})();
