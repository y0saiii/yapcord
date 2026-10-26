window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var PLUGIN = "copy-assets";

  function absolute(src) {
    try { return new URL(src, location.href).href; } catch (e) { return null; }
  }

  function imageOf(target) {
    if (!target || !target.closest) return null;
    var host = target.closest(".av") || target.closest("[data-srv]");
    if (!host) return null;
    var img = host.querySelector("img");
    if (!img) return null;
    var src = img.currentSrc || img.getAttribute("src") || "";
    if (src.indexOf("blob:") === 0) src = img.getAttribute("data-yc-orig") || "";
    var abs = absolute(src);
    if (!abs || abs.indexOf("/icons/") < 0) return null;
    return abs;
  }

  function nameOf(url) {
    var part = url.split("?")[0].split("#")[0];
    part = part.slice(part.lastIndexOf("/") + 1);
    return part || "yapit-picture.webp";
  }

  function save(url) {
    var name = nameOf(url);
    fetch(url, { credentials: "same-origin" }).then(function (res) {
      if (!res.ok) throw new Error("the server said " + res.status);
      return res.blob();
    }).then(function (blob) {
      var u = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = u;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
      YC.ui.toast("Saved " + name + ".");
    }).catch(function (e) {
      YC.ui.toast("Could not download that picture: " + String(e && e.message || e), "error");
    });
  }

  function itemsFor(url) {
    return [
      { label: "Copy image link", fn: function () { YC.ui.copy(url); } },
      { label: "Download image", fn: function () { save(url); } }
    ];
  }

  function findMenu() {
    var menus = document.querySelectorAll(".cm");
    var site = null;
    for (var i = 0; i < menus.length; i++) {
      var m = menus[i];
      if (!m.isConnected) continue;
      if (m.classList.contains("yc-menu")) return m;
      site = m;
    }
    return site;
  }

  function place(menu, x, y) {
    setTimeout(function () {
      if (!menu || !menu.isConnected) return;
      var w = menu.offsetWidth, hgt = menu.offsetHeight;
      menu.style.left = Math.max(8, Math.min(x, window.innerWidth - w - 8)) + "px";
      menu.style.top = Math.max(8, Math.min(y, window.innerHeight - hgt - 8)) + "px";
    }, 0);
  }

  function mergeOrOpen(x, y, url) {
    var items = itemsFor(url);
    var menu = findMenu();
    if (!menu) { YC.ui.menu(x, y, items); return; }
    if (menu.querySelector("[data-yc-assets]")) return;
    menu.appendChild(document.createElement("hr"));
    items.forEach(function (it) {
      var b = YC.ui.h("button", {
        type: "button", role: "menuitem", text: it.label,
        onclick: function (e) {
          e.stopPropagation();
          menu.remove();
          it.fn();
        }
      });
      b.setAttribute("data-yc-assets", "1");
      menu.appendChild(b);
    });
    place(menu, x, y);
  }

  function onCtx(e) {
    var url = imageOf(e.target);
    if (!url) return;
    e.preventDefault();
    var x = e.clientX, y = e.clientY;
    setTimeout(function () { mergeOrOpen(x, y, url); }, 0);
  }

  YC.registerPlugin({
    id: PLUGIN,
    name: "Copy Assets",
    description: "Right click a server icon or anyone's avatar and get two choices: copy the link to that picture, or download it. YapCord joins Yapit's own right click menu, so Server Settings and Copy Server ID stay where they are.",
    defaultEnabled: true,
    settings: [],

    start: function (ctx) {
      document.addEventListener("contextmenu", onCtx, true);
      ctx.onDispose(function () {
        document.removeEventListener("contextmenu", onCtx, true);
        YC.ui.closeMenu();
      });
    },

    stop: function () {}
  });
})(window.YapCord);
