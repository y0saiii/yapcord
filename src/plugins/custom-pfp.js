window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var PLUGIN = "custom-pfp";
  var ACCEPT = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
  var MAX_BYTES = 5 * 1024 * 1024;
  var MAX_SIDE = 3000;
  var KEEP_SIDE = 1024;

  var urls = {};
  var live = false;
  var me = null;

  function cfg() {
    try { return YC.store.plugin(PLUGIN); } catch (e) { return {}; }
  }

  function entries() {
    var p = YC.store.cfg.pfps;
    return p && typeof p === "object" ? p : {};
  }

  function loadMe() {
    if (me) return Promise.resolve(me);
    return YC.api("me").then(function (res) {
      me = res && res.user ? res.user : null;
      return me;
    }).catch(function () { return null; });
  }

  function needle(uid) {
    return "icons/" + uid + ".webp";
  }

  function rebuildUrl(uid, data) {
    if (urls[uid]) { URL.revokeObjectURL(urls[uid]); delete urls[uid]; }
    return fetch(data).then(function (r) { return r.blob(); }).then(function (blob) {
      urls[uid] = URL.createObjectURL(blob);
    }).catch(function () {});
  }

  function patchAll() {
    Object.keys(urls).forEach(function (uid) {
      var sel = '.av img[src*="' + needle(uid) + '"]';
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (im) {
        if (im.getAttribute("data-yc-pfp") === uid) return;
        im.setAttribute("data-yc-orig", im.getAttribute("src") || "");
        im.setAttribute("data-yc-pfp", uid);
        im.src = urls[uid];
      });
    });
  }

  function unpatchAll() {
    Array.prototype.forEach.call(document.querySelectorAll("img[data-yc-pfp]"), function (im) {
      var orig = im.getAttribute("data-yc-orig");
      if (orig) im.src = orig;
      im.removeAttribute("data-yc-pfp");
      im.removeAttribute("data-yc-orig");
    });
  }

  function clearLocal(uid) {
    if (urls[uid]) { URL.revokeObjectURL(urls[uid]); delete urls[uid]; }
    if (YC.store.cfg.pfps) delete YC.store.cfg.pfps[uid];
    YC.store.save(true);
  }

  function cropCanvas(img) {
    var w = img.naturalWidth, h = img.naturalHeight;
    var side = Math.min(w, h);
    var out = Math.min(side, KEEP_SIDE);
    var c = document.createElement("canvas");
    c.width = out;
    c.height = out;
    var g = c.getContext("2d");
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, out, out);
    return c;
  }

  function refreshVisible(icon) {
    return loadMe().then(function (u) {
      if (!u) return;
      var hit = needle(u.id);
      Array.prototype.forEach.call(document.querySelectorAll(".av img"), function (im) {
        var s = im.getAttribute("src") || "";
        if (s.indexOf(hit) === 0) im.src = "icons/" + icon;
      });
    });
  }

  function sendUpload(dataUrl, gifFile) {
    return YC.api("icon_upload", { data: dataUrl }).then(function (res) {
      if (!res || !res.icon) throw new Error("Yapit did not take that image.");
      return refreshVisible(res.icon).then(function () {
        if (!gifFile) return;
        return loadMe().then(function (u) {
          if (!u) return;
          return new Promise(function (resolve) {
            var fr = new FileReader();
            fr.onload = function () {
              var data = String(fr.result);
              if (data.length > 3000000) {
                YC.ui.toast("That GIF is too big to keep the moving copy of; everyone sees the still picture.", "warn");
                resolve();
                return;
              }
              YC.store.cfg.pfps = YC.store.cfg.pfps || {};
              YC.store.cfg.pfps[String(u.id)] = data;
              YC.store.save(true);
              rebuildUrl(String(u.id), data).then(function () {
                patchAll();
                resolve();
              });
            };
            fr.onerror = function () { resolve(); };
            fr.readAsDataURL(gifFile);
          });
        });
      }).then(function () {
        YC.ui.toast("Profile picture updated.");
      });
    });
  }

  function upload(file) {
    var type = String(file.type || "").toLowerCase();
    if (ACCEPT.indexOf(type) < 0) {
      YC.ui.toast("Use a PNG, JPG, GIF or WebP image.", "error");
      return;
    }
    if (file.size > MAX_BYTES) {
      YC.ui.toast("That image is " + (file.size / 1048576).toFixed(1) + " MB. Yapit takes up to 5 MB.", "error");
      return;
    }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth, h = img.naturalHeight;
      URL.revokeObjectURL(url);
      if (!w || !h || w > MAX_SIDE || h > MAX_SIDE) {
        YC.ui.toast("Yapit takes images up to " + MAX_SIDE + " x " + MAX_SIDE + ". Yours is " + w + " x " + h + ".", "error");
        return;
      }
      var dataUrl;
      try { dataUrl = cropCanvas(img).toDataURL("image/webp", 0.92); }
      catch (e) { YC.ui.toast("Could not read that image.", "error"); return; }
      var gif = cfg().animateGif !== false && type === "image/gif" ? file : null;
      sendUpload(dataUrl, gif).catch(function (e) {
        YC.ui.toast(String(e && e.message || e), "error");
      });
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      YC.ui.toast("That file is not a readable image.", "error");
    };
    img.src = url;
  }

  function pick() {
    var inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/png,image/jpeg,image/gif,image/webp";
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (f) upload(f);
    };
    inp.click();
  }

  function removeIcon() {
    return YC.ui.confirm("Remove your Yapit profile picture?", { ok: "Remove it", danger: true }).then(function (yes) {
      if (!yes) return;
      return YC.api("icon_remove").then(function () {
        return loadMe();
      }).then(function () {
        unpatchAll();
        if (me) {
          clearLocal(String(me.id));
          var letter = me.username ? String(me.username[0]).toUpperCase() : "";
          var hit = needle(me.id);
          Array.prototype.forEach.call(document.querySelectorAll(".av img"), function (im) {
            var s = im.getAttribute("src") || "";
            if (s.indexOf(hit) !== 0) return;
            var host = im.parentNode;
            if (!host) return;
            host.removeChild(im);
            host.appendChild(document.createTextNode(letter));
          });
        }
        YC.ui.toast("Profile picture removed.");
      }).catch(function (e) {
        YC.ui.toast(String(e && e.message || e), "error");
      });
    });
  }


  YC.registerPlugin({
    id: PLUGIN,
    name: "Custom PFP",
    description: "Use any image you like as your Yapit profile picture, cropped and uploaded at full quality. GIFs keep moving on YapCord.",
    defaultEnabled: true,

    settings: [
      {
        id: "picture", type: "buttons", label: "Profile picture", actions: [
          { label: "Choose image", fn: pick },
          { label: "Remove picture", danger: true, fn: removeIcon }
        ],
        desc: "Any PNG, JPG, GIF or WebP up to 3000 x 3000 and 5 MB. YapCord crops it square itself and uploads it at full quality, then refreshes every picture already on screen."
      },
      { id: "animateGif", type: "toggle", label: "Keep GIFs moving", default: true,
        desc: "Yapit flattens every upload into one still picture, so GIFs freeze for everyone. This keeps the original GIF as well, so it still moves on your screen and for friends who import your config file." }
    ],

    start: function (ctx) {
      var list = entries();
      var keys = Object.keys(list);
      var ready = Promise.all(keys.map(function (uid) {
        return rebuildUrl(uid, list[uid]);
      })).then(function () {
        live = true;
        patchAll();
      });
      ctx.observe(document.body || document.documentElement, function () {
        if (live) patchAll();
      }, { childList: true, subtree: true });
      void ready;
    },

    stop: function () {
      live = false;
      unpatchAll();
      Object.keys(urls).forEach(function (uid) { URL.revokeObjectURL(urls[uid]); });
      urls = {};
      me = null;
    }
  });
})(window.YapCord);
