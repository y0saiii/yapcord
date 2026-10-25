window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var ORANGE = "#FF8020";
  var YELLOW = "#FFC800";
  var GOLD = "#FFE070";
  var DISCORD = "#5865F2";

  function onAccent(hex) {
    var s = String(hex || "").trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(s)) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    if (!/^[0-9a-f]{6}$/i.test(s)) return "#141210";
    var ch = [0, 2, 4].map(function (i) { return parseInt(s.slice(i, i + 2), 16) / 255; });
    var f = function (v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    var L = 0.2126 * f(ch[0]) + 0.7152 * f(ch[1]) + 0.0722 * f(ch[2]);
    var vsInk = (L + 0.05) / 0.05;
    var vsWhite = 1.05 / (L + 0.05);
    return vsInk >= vsWhite ? "#141210" : "#FFFFFF";
  }
  YC.onAccent = onAccent;

  YC.BASE_THEME = [
    ":root:root{",
    "--yc-orange:#FF8020;--yc-yellow:#FFC800;--yc-gold:#FFE070;",
    "--yc-red:#E8412C;--yc-green:#3FB950;--yc-shadow:4px 4px 0 #141210;",
    "--yc-on-accent:#141210;",
    "}",
    ".btn,.ghost.on,.it.on,.sv.on,.banner,.sgi.on{color:var(--yc-on-accent,#141210) !important}",
    ".ghost:not(.on){color:var(--ink,#141210) !important}"
  ].join("");

  function theme(id, name, desc, css) {
    return { id: id, name: name, desc: desc, css: css };
  }

  YC.themes = [
    theme("site-default", "Site default", "Yapit's own look, no YapCord theming.", ""),

    theme("yapcord-orange", "YapCord Orange", "The house theme: warm paper, fox orange, nap yellow.",
      ":root:root{\n" +
      "  --yap:" + ORANGE + " !important;\n" +
      "  --paper:#FFFDF6; --ink:#141210; --sky:#FFF1DC; --mute:#7C6E5C;\n" +
      "  --yc-accent:" + ORANGE + "; --yc-accent-2:" + YELLOW + ";\n" +
      "  --yc-on-accent:" + onAccent(ORANGE) + ";\n" +
      "  --hard:4px 4px 0 #141210;\n" +
      "}\n" +
      "[data-theme=dark]:root{\n" +
      "  --yap:" + ORANGE + " !important;\n" +
      "  --paper:#17130E; --ink:#FFF4E4; --sky:#241C13; --mute:#B39A7B;\n" +
      "  --yc-on-accent:" + onAccent(ORANGE) + ";\n" +
      "  --hard:4px 4px 0 #000000;\n" +
      "}\n" +
      ".rail{background:" + YELLOW + "}\n" +
      "[data-theme=dark] .rail{background:#100C08}\n" +
      ".nav{background:linear-gradient(180deg,#FFF8E9,transparent)}\n" +
      "[data-theme=dark] .nav{background:linear-gradient(180deg,#1D1710,transparent)}\n" +
      ".main>h3{background:linear-gradient(90deg,rgba(255,128,32,.16),transparent 70%)}\n" +
      ".card:hover{box-shadow:6px 6px 0 var(--yap)}\n" +
      ".m:hover{background:rgba(255,128,32,.07);border-radius:10px}\n" +
      "::-webkit-scrollbar-thumb{background:" + ORANGE + ";border:2px solid var(--paper);border-radius:99px}\n"),

    theme("yapcord-amber", "YapCord Amber", "Dark room, warm lamp: orange on near-black.",
      ":root:root{\n" +
      "  --yap:" + YELLOW + " !important;\n" +
      "  --paper:#12100D; --ink:#FFF6E7; --sky:#1E1913; --mute:#A8957C;\n" +
      "  --line:3px solid #2C241A; --hard:4px 4px 0 #000000;\n" +
      "  --yc-accent:" + ORANGE + "; --yc-accent-2:" + YELLOW + ";\n" +
      "  --yc-on-accent:" + onAccent(YELLOW) + ";\n" +
      "}\n" +
      "[data-theme=dark]:root{\n" +
      "  --yap:" + YELLOW + " !important;\n" +
      "  --paper:#12100D; --ink:#FFF6E7; --sky:#1E1913; --mute:#A8957C;\n" +
      "  --yc-on-accent:" + onAccent(YELLOW) + ";\n" +
      "}\n" +
      ".rail{background:#0B0906}\n" +
      ".m:hover{background:rgba(255,200,0,.07);border-radius:10px}\n" +
      "::-webkit-scrollbar-thumb{background:#4A3A24;border:2px solid var(--paper);border-radius:99px}\n"),

    theme("foxy-nap", "Foxy Nap", "The logo, exactly: white paper, yellow C, sleeping fox orange.",
      ":root:root{\n" +
      "  --yap:" + YELLOW + " !important;\n" +
      "  --paper:#FFFFFF; --ink:#000000; --sky:#FFF6D9; --mute:#5F5A50;\n" +
      "  --hard:5px 5px 0 #000000;\n" +
      "  --yc-accent:" + YELLOW + "; --yc-accent-2:" + ORANGE + ";\n" +
      "  --yc-on-accent:" + onAccent(YELLOW) + ";\n" +
      "}\n" +
      "[data-theme=dark]:root{\n" +
      "  --yap:" + YELLOW + " !important;\n" +
      "  --paper:#1A140B; --ink:#FFFFFF; --sky:#2A2110; --mute:#B9AE97;\n" +
      "  --yc-on-accent:" + onAccent(YELLOW) + ";\n" +
      "}\n" +
      ".rail{background:" + YELLOW + "}\n" +
      "[data-theme=dark] .rail{background:#000}\n" +
      ".main>h3{background:linear-gradient(90deg,rgba(255,200,0,.28),transparent 65%)}\n" +
      ".m:hover{background:rgba(255,128,32,.10);border-radius:10px}\n" +
      "::-webkit-scrollbar-thumb{background:" + ORANGE + ";border:2px solid var(--paper);border-radius:99px}\n"),

    theme("sunbeam", "Sunbeam", "Loud and yellow, for people who like the flash.",
      ":root:root{\n" +
      "  --yap:#FFB703 !important;\n" +
      "  --paper:#FFFBEB; --ink:#1B1400; --sky:#FFF0C2; --mute:#7A6600;\n" +
      "  --hard:4px 4px 0 #1B1400;\n" +
      "  --yc-accent:#FFB703; --yc-accent-2:" + ORANGE + ";\n" +
      "  --yc-on-accent:" + onAccent("#FFB703") + ";\n" +
      "}\n" +
      "[data-theme=dark]:root{\n" +
      "  --yap:#FFD166 !important;\n" +
      "  --paper:#191400; --ink:#FFEFC2; --sky:#241C00; --mute:#C9B77A;\n" +
      "  --yc-on-accent:" + onAccent("#FFD166") + ";\n" +
      "}\n" +
      ".rail{background:#FFD166}\n" +
      "[data-theme=dark] .rail{background:#0F0B00}\n" +
      "::-webkit-scrollbar-thumb{background:#FFB703;border:2px solid var(--paper);border-radius:99px}\n"),

    theme("discord", "Discord", "Discord's palette: blurple accent, slate grays, flat chrome.",
      ":root:root{\n" +
      "  --yap:" + DISCORD + " !important;\n" +
      "  --paper:#FFFFFF; --ink:#060607; --sky:#F2F3F5; --mute:#4E5058;\n" +
      "  --line:1px solid #E3E5E8; --hard:0 1px 2px rgba(0,0,0,.07);\n" +
      "  --yc-accent:" + DISCORD + "; --yc-accent-2:#4752C4;\n" +
      "  --yc-on-accent:#FFFFFF;\n" +
      "}\n" +
      "[data-theme=dark]:root{\n" +
      "  --yap:" + DISCORD + " !important;\n" +
      "  --paper:#313338; --ink:#DBDEE1; --sky:#2B2D31; --mute:#949BA4;\n" +
      "  --line:1px solid #26282C; --hard:0 1px 2px rgba(0,0,0,.35);\n" +
      "  --yc-accent:" + DISCORD + "; --yc-accent-2:#4752C4;\n" +
      "  --yc-on-accent:#FFFFFF;\n" +
      "}\n" +
      ".rail{background:#E3E5E8}\n" +
      "[data-theme=dark] .rail{background:#1E1F22}\n" +
      ".m:hover{background:#F2F3F5;border-radius:8px}\n" +
      "[data-theme=dark] .m:hover{background:#2E3035}\n" +
      "::-webkit-scrollbar-thumb{background:#C4C9CE;border:2px solid var(--paper);border-radius:99px}\n" +
      "[data-theme=dark] ::-webkit-scrollbar-thumb{background:#1A1A1C}\n"),

    theme("custom", "Custom CSS", "Write your own, the editor is right below.", "")
  ];

  YC.themeById = function (id) {
    for (var i = 0; i < YC.themes.length; i++) if (YC.themes[i].id === id) return YC.themes[i];
    return YC.themes[1];
  };

  YC.resolveTheme = function (cfg) {
    cfg = cfg || {};
    var t = YC.themeById(cfg.id);
    var css = YC.BASE_THEME;
    if (cfg.id === "custom") css += "\n" + (cfg.custom || "");
    else if (t) css += "\n" + (t.css || "");
    if (cfg.accent) {
      css += "\n:root:root{--yap:" + cfg.accent + " !important}\n";
      css += "[data-theme=dark]:root{--yap:" + cfg.accent + " !important}\n";
      css += ":root:root{--yc-accent:" + cfg.accent + " !important}\n";
      css += ":root:root{--yc-on-accent:" + onAccent(cfg.accent) + " !important}\n";
      css += "[data-theme=dark]:root{--yc-on-accent:" + onAccent(cfg.accent) + " !important}\n";
    }
    return css;
  };

  var themeEl = null;

  YC.applyTheme = function () {
    var on = YC.enabled ? YC.enabled("theme-manager") : true;
    var css = on ? YC.resolveTheme(YC.store && YC.store.cfg.theme) : "";
    if (!themeEl) {
      themeEl = document.getElementById("yapcord-theme") || document.createElement("style");
      themeEl.id = "yapcord-theme";
    }
    if (css) {
      if (!themeEl.isConnected) (document.head || document.documentElement).appendChild(themeEl);
      if (themeEl.textContent !== css) themeEl.textContent = css;
    } else if (themeEl.isConnected) {
      themeEl.remove();
    }
    if (YC.store) YC.store.writeCache();
  };
})(window.YapCord);
