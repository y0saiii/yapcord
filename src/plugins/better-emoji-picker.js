window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var h = YC.ui.h;
  var EMOJI_KEY = "yapcord.emoji";

  var custom = [];
  var bag = { recent: [], favs: [] };
  var bagLoaded = false;
  var panel = null;
  var sgEl = null;
  var data = null;


  function loadBag() {
    if (bagLoaded) return Promise.resolve(bag);
    return YC.storage.get(EMOJI_KEY, { recent: [], favs: [] }).then(function (saved) {
      bag = saved && typeof saved === "object" ? saved : { recent: [], favs: [] };
      if (!Array.isArray(bag.recent)) bag.recent = [];
      if (!Array.isArray(bag.favs)) bag.favs = [];
      bagLoaded = true;
      return bag;
    });
  }

  var bagTimer = 0;
  function saveBag() {
    clearTimeout(bagTimer);
    bagTimer = setTimeout(function () { YC.storage.set(EMOJI_KEY, bag); }, 300);
  }

  function touch(token) {
    if (!bagLoaded) return;
    var i = bag.recent.indexOf(token);
    if (i >= 0) bag.recent.splice(i, 1);
    bag.recent.unshift(token);
    if (bag.recent.length > 48) bag.recent.length = 48;
    saveBag();
  }

  function isFav(token) { return bag.favs.indexOf(token) >= 0; }
  function toggleFav(token) {
    var i = bag.favs.indexOf(token);
    if (i >= 0) bag.favs.splice(i, 1); else bag.favs.unshift(token);
    saveBag();
  }


  async function loadCustom() {
    try {
      var res = await YC.api("emoji_list");
      custom = (res && res.emojis) || [];
    } catch (e) { custom = []; }
    return custom;
  }

  function displayFor(entry) {
    if (entry.file) return h("img", { class: "yc-e-img", src: "icons/" + entry.file, alt: entry.label, title: entry.label });
    return h("span", { class: "yc-e-ch", text: entry.char || entry.token });
  }

  function customEntries() {
    return custom.map(function (e) {
      return { token: ":" + e.name + ":", file: e.file, label: ":" + e.name + ":", name: e.name };
    });
  }

  function unicodeIn(cat) {
    if (!data) return [];
    if (!cat) {
      var all = [];
      data.categories.forEach(function (c) { all = all.concat(c[1]); });
      return all;
    }
    for (var i = 0; i < data.categories.length; i++) if (data.categories[i][0] === cat) return data.categories[i][1];
    return [];
  }

  function entriesFor(catId) {
    if (catId === "recent") {
      return bag.recent.map(function (token) {
        if (token.charAt(0) === ":") {
          var m = custom.find(function (c) { return ":" + c.name + ":" === token; });
          return m ? { token: token, file: m.file, label: token, name: m.name } : null;
        }
        var info = data && data.byChar[token];
        return { token: token, char: token, label: token + (info && info.sc ? " :" + info.sc + ":" : ""), name: info ? info.sc || info.kw : token };
      }).filter(Boolean);
    }
    if (catId === "favs") {
      return bag.favs.map(function (token) {
        if (token.charAt(0) === ":") {
          var m = custom.find(function (c) { return ":" + c.name + ":" === token; });
          return m ? { token: token, file: m.file, label: token, name: m.name } : null;
        }
        var info = data && data.byChar[token];
        return { token: token, char: token, label: token + (info && info.sc ? " :" + info.sc + ":" : ""), name: info ? info.sc || info.kw : token };
      }).filter(Boolean);
    }
    if (catId === "custom") return customEntries();
    return unicodeIn(catId).map(function (row) {
      var info = data && data.byChar[row[0]];
      return { token: row[0], char: row[0], label: row[0] + (row[2] ? " :" + row[2] + ":" : ""), name: row[2] || row[1] || row[0] };
    });
  }


  function composer() { return YC.page.composer(); }

  function insert(token) {
    var inp = composer();
    if (!inp) { YC.ui.toast("Open a conversation first.", "warn"); return; }
    var a = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
    var b = inp.selectionEnd == null ? a : inp.selectionEnd;
    var text = token + " ";
    inp.value = inp.value.slice(0, a) + text + inp.value.slice(b);
    inp.focus();
    inp.selectionStart = inp.selectionEnd = a + text.length;
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    touch(token);
  }
  YC.emojiInsert = insert;


  function search(q) {
    q = String(q || "").trim().toLowerCase().replace(/^:+|:+$/g, "");
    if (!q) return [];
    var out = [];

    custom.forEach(function (e) {
      var name = String(e.name || "").toLowerCase();
      if (name.indexOf(q) >= 0) {
        out.push({ token: ":" + e.name + ":", file: e.file, label: ":" + e.name + ":", name: e.name, score: name.indexOf(q) === 0 ? 0 : 1 });
      }
    });

    if (data) {
      data.categories.forEach(function (c) {
        c[1].forEach(function (row) {
          var ch = row[0], kw = row[1] || "", sc = row[2] || "";
          var score = -1;
          if (sc && sc.indexOf(q) === 0) score = 0;
          else if (ch === q) score = 0;
          else if (sc && sc.indexOf(q) >= 0) score = 1;
          else if (kw.indexOf(q) >= 0) score = 2;
          if (score >= 0) out.push({ token: ch, char: ch, label: ch + (sc ? " :" + sc + ":" : ""), name: sc || kw.split(" ")[0] || ch, score: score + 10 });
        });
      });
    }

    out.sort(function (a, b) { return a.score - b.score; });
    return out.slice(0, 24);
  }


  function closePicker() {
    if (panel) { panel.remove(); panel = null; }
    document.removeEventListener("click", outside, true);
  }

  function outside(e) {
    if (panel && !panel.contains(e.target)) closePicker();
  }

  function emojiButton(entry) {
    var b = h("button", { type: "button", class: "yc-e", title: entry.label });
    b.appendChild(displayFor(entry));
    var star = h("span", {
      class: "yc-star" + (isFav(entry.token) ? " on" : ""), text: "★",
      title: "Favourite",
      onclick: function (e) { e.stopPropagation(); toggleFav(entry.token); star.classList.toggle("on"); }
    });
    b.appendChild(star);
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      insert(entry.token);
    });
    return b;
  }

  function openPicker() {
    if (panel) { closePicker(); return; }
    var form = YC.page.composerForm();
    if (!form) { YC.ui.toast("Open a conversation first.", "warn"); return; }
    closeSuggest();

    data = window.YapCordEmojiData || data;
    if (!custom.length) loadCustom();

    var cat = "recent";
    var q = "";

    var grid = h("div", { class: "yc-e-grid" });
    var tabs = h("div", { class: "yc-e-tabs" });
    var searchBox = h("input", {
      class: "yc-input yc-e-search", type: "search", placeholder: "Search " + ((data && data.count) || 0) + " emoji…",
      oninput: function (e) { q = e.target.value; draw(); }
    });
    var empty = h("p", { class: "yc-muted yc-e-empty", hidden: true });

    function categories() {
      var list = [["recent", "🕘"], ["favs", "★"], ["custom", "🧩"]];
      if (data) data.categories.forEach(function (c) { list.push([c[0], catIcon(c[0])]); });
      return list;
    }

    function catIcon(name) {
      if (/smile/i.test(name)) return "🙂";
      if (/people|body|gesture/i.test(name)) return "👋";
      if (/animal|nature/i.test(name)) return "🦊";
      if (/food/i.test(name)) return "🍔";
      if (/travel|place/i.test(name)) return "✈️";
      if (/activ/i.test(name)) return "🏆";
      if (/object/i.test(name)) return "💡";
      if (/symbol/i.test(name)) return "💛";
      return "•";
    }

    function drawTabs() {
      tabs.innerHTML = "";
      categories().forEach(function (c) {
        tabs.appendChild(h("button", {
          type: "button", class: "yc-e-tab" + (cat === c[0] ? " on" : ""), title: c[0], text: c[1],
          onclick: function () { cat = c[0]; q = ""; searchBox.value = ""; draw(); }
        }));
      });
    }

    function draw() {
      drawTabs();
      grid.innerHTML = "";
      var list = q ? search(q) : entriesFor(cat);
      if (q && cat !== "recent" && cat !== "favs" && cat !== "custom" && list.length) {
      }
      empty.hidden = !!list.length;
      if (!list.length) empty.textContent = q ? "No emoji matches “" + q + "”." : "Nothing here yet; use ★ to favourite emoji.";
      list.forEach(function (entry) { grid.appendChild(emojiButton(entry)); });
    }

    panel = h("div", { class: "yc-e-panel", id: "yc-ep" },
      h("div", { class: "yc-e-head" }, searchBox),
      tabs, grid, empty,
      h("div", { class: "yc-e-foot" },
        h("small", { class: "yc-muted", text: "Click to insert · ★ to favourite · right-click for options" })));

    form.appendChild(panel);
    draw();
    searchBox.focus();
    setTimeout(function () { document.addEventListener("click", outside, true); }, 0);
  }
  YC.openEmojiPicker = openPicker;
  YC.closeEmojiPicker = closePicker;


  function nativeSG() {
    var form = YC.page.composerForm();
    return form ? form.querySelector("#sg") : null;
  }

  function closeSuggest() {
    if (sgEl) { sgEl.remove(); sgEl = null; }
  }

  function tokenAt(inp) {
    var a = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
    var m = /(^|\s):([a-z0-9_]{1,24})$/i.exec(inp.value.slice(0, a));
    return m ? { q: m[2].toLowerCase(), start: a - m[2].length - 1, end: a } : null;
  }

  function showSuggest(inp) {
    var tok = tokenAt(inp);
    if (!tok) { closeSuggest(); return; }
    var conf = YC.store.plugin("better-emoji-picker");
    var max = Number(conf.sugCount) || 8;
    var list = search(tok.q).slice(0, max);
    if (!list.length) { closeSuggest(); return; }

    if (!sgEl) {
      var form = YC.page.composerForm();
      if (!form) return;
      sgEl = h("div", { class: "yc-sg", id: "yc-sg" });
      form.appendChild(sgEl);
    }

    sgEl.innerHTML = "";
    list.forEach(function (entry, i) {
      var row = h("button", {
        type: "button", class: "yc-sg-row" + (i === 0 ? " on" : ""),
        onclick: function (e) { e.stopPropagation(); pick(tok, entry); }
      });
      row.appendChild(displayFor(entry));
      var name = entry.label.charAt(0) === ":" ? entry.label : ":" + (entry.name || "") + ":";
      row.appendChild(h("span", { class: "yc-sg-name", text: name }));
      sgEl.appendChild(row);
    });
    sgEl.dataset.n = String(list.length);
    sgEl._list = list;
    sgEl._tok = tok;
    sgEl.hidden = false;
  }

  function pick(tok, entry) {
    var inp = composer();
    if (!inp || !tok) return;
    inp.value = inp.value.slice(0, tok.start) + entry.token + " " + inp.value.slice(tok.end);
    inp.focus();
    inp.selectionStart = inp.selectionEnd = tok.start + entry.token.length + 1;
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    touch(entry.token);
    closeSuggest();
  }


  var onInput = null, onKey = null;

  YC.registerPlugin({
    id: "better-emoji-picker",
    name: "Better Emoji Picker",
    description: "A proper emoji picker: recents, favourites, all server emoji and 798 unicode emoji with search.",
    settings: [
      { id: "showSuggest", type: "toggle", label: "Enhanced :shortcode: suggestions", default: true, desc: "Replaces Yapit's tiny suggestion box with a searchable one." },
      { id: "sugCount", type: "select", label: "Suggestions shown", default: "8", options: [["5", "5"], ["8", "8"], ["12", "12"]] }
    ],

    start: function (ctx) {
      data = window.YapCordEmojiData || null;
      loadBag();
      loadCustom();

      ctx.css([
        "body.yc-emoji #cf .sg,body.yc-emoji #cf .ep{display:none !important}",
        ".yc-e-panel{position:absolute;bottom:100%;left:1.4rem;width:min(430px,94vw);margin-bottom:.6rem;",
        "background:var(--paper);color:var(--ink);border:var(--line);border-radius:16px;box-shadow:var(--hard);z-index:40;padding:.6rem;display:grid;gap:.5rem}",
        ".yc-e-search{width:100%}",
        ".yc-e-tabs{display:flex;gap:.25rem;flex-wrap:wrap;border-bottom:2px solid var(--ink);padding-bottom:.4rem}",
        ".yc-e-tab{border:2px solid transparent;background:none;font-size:1rem;cursor:pointer;border-radius:8px;padding:.16rem .38rem;line-height:1}",
        ".yc-e-tab:hover{background:rgba(255,128,32,.18)}",
        ".yc-e-tab.on{background:var(--yap);border-color:var(--ink);color:#141210}",
        ".yc-e-grid{display:flex;flex-wrap:wrap;gap:.18rem;max-height:250px;overflow:auto;padding:.15rem}",
        ".yc-e{position:relative;border:0;background:none;font-size:1.6rem;line-height:1;cursor:pointer;padding:.22rem;border-radius:9px;filter:grayscale(0)}",
        ".yc-e:hover{background:rgba(255,128,32,.25);transform:scale(1.12)}",
        ".yc-e-img{width:1.7rem;height:1.7rem;object-fit:contain;vertical-align:middle}",
        ".yc-e-ch{vertical-align:middle}",
        ".yc-star{position:absolute;top:-2px;right:-2px;font-size:.6rem;color:var(--mute);opacity:0;transition:opacity .1s}",
        ".yc-e:hover .yc-star,.yc-star.on{opacity:1}",
        ".yc-star.on{color:var(--yc-yellow,#FFC800);text-shadow:0 0 2px #000}",
        ".yc-e-foot{font-size:.72rem;color:var(--mute)}",
        ".yc-e-empty{padding:.6rem .2rem;margin:0}",
        ".yc-sg{position:absolute;bottom:100%;left:1.4rem;margin-bottom:.5rem;min-width:250px;max-width:min(360px,92vw);",
        "background:var(--paper);border:var(--line);border-radius:14px;box-shadow:var(--hard);z-index:41;padding:.3rem;overflow:auto;max-height:260px}",
        ".yc-sg-row{display:flex;align-items:center;gap:.5rem;width:100%;border:0;background:none;color:inherit;",
        "padding:.32rem .5rem;border-radius:9px;cursor:pointer;text-align:left;font-size:.92rem}",
        ".yc-sg-row:hover,.yc-sg-row.on{background:var(--yap);color:#141210}",
        ".yc-sg-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
        ".yc-e-img.yc-e-img{width:1.35rem;height:1.35rem}"
      ].join("\n"));

      var markBody = function () {
        if (!document.body) { ctx.timeout(markBody, 60); return; }
        document.body.classList.add("yc-emoji");
      };
      markBody();

      var onClickCapture = function (e) {
        var t = e.target;
        if (!t || !t.closest) return;
        if (t.closest("#eb")) {
          e.preventDefault();
          e.stopPropagation();
          openPicker();
        }
      };
      document.addEventListener("click", onClickCapture, true);
      ctx.onDispose(function () { document.removeEventListener("click", onClickCapture, true); });

      var hookComposer = function () {
        var inp = composer();
        if (!inp || inp.dataset.ycHooked === "1") return;
        inp.dataset.ycHooked = "1";

        onInput = function () {
          var nat = nativeSG();
          if (nat) nat.hidden = true;
          if (ctx.get("showSuggest", true) !== false) showSuggest(inp);
          else closeSuggest();
        };
        onKey = function (e) {
          if (!sgEl || sgEl.hidden) return;
          var rows = Array.prototype.slice.call(sgEl.querySelectorAll(".yc-sg-row"));
          var idx = rows.findIndex(function (r) { return r.classList.contains("on"); });
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault(); e.stopPropagation();
            if (idx >= 0) rows[idx].classList.remove("on");
            var next = (idx + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length;
            rows[next].classList.add("on");
            rows[next].scrollIntoView({ block: "nearest" });
          } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault(); e.stopPropagation();
            var i = idx < 0 ? 0 : idx;
            if (sgEl._list && sgEl._list[i]) pick(sgEl._tok, sgEl._list[i]);
          } else if (e.key === "Escape") {
            e.preventDefault(); e.stopPropagation();
            closeSuggest();
          }
        };
        inp.addEventListener("input", onInput, false);
        inp.addEventListener("keydown", onKey, false);
        ctx.onDispose(function () {
          try { inp.removeEventListener("input", onInput); inp.removeEventListener("keydown", onKey); } catch (e) {}
          delete inp.dataset.ycHooked;
        });
      };

      hookComposer();
      ctx.observe(document.documentElement, function () {
        hookComposer();
        if (!composer()) closeSuggest();
      }, { childList: true, subtree: true });

      ctx.on("api:emoji_list", function (e) {
        if (e.res && Array.isArray(e.res.emojis)) custom = e.res.emojis;
        if (panel) { closePicker(); }
      });

      ctx.onDispose(function () { closePicker(); closeSuggest(); });
    },

    stop: function () {
      if (document.body) document.body.classList.remove("yc-emoji");
      closePicker();
      closeSuggest();
    }
  });
})(window.YapCord);
