window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var PLUGIN = "custom-pfp";
  var ACCEPT = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
  var MAX_BYTES = 5 * 1024 * 1024;
  var MAX_SIDE = 3000;
  var KEEP_SIDE = 1024;
  var MIN_ZOOM = 1;
  var MAX_ZOOM = 4;

  var CSS = [
    ".yc-pfp-stage{position:relative;box-sizing:content-box;overflow:hidden;border:3px solid var(--ink,#141210);border-radius:14px;background:#141414;touch-action:none;cursor:grab;user-select:none;margin:0 auto}",
    ".yc-pfp-stage:active{cursor:grabbing}",
    ".yc-pfp-stage img{position:absolute;left:50%;top:50%;max-width:none;pointer-events:none}",
    ".yc-pfp-ring{position:absolute;left:0;top:0;right:0;bottom:0;border-radius:50%;box-shadow:0 0 0 9999px rgba(10,10,10,.6);border:2px solid rgba(255,255,255,.9);pointer-events:none}",
    ".yc-pfp-hint{font-size:.78rem;line-height:1.5;color:var(--mute,#8A7A68);text-align:center;margin:.7rem auto 0;max-width:34rem}",
    ".yc-pfp-zoom{display:flex;align-items:center;justify-content:center;gap:.75rem;margin:.9rem 0 0}",
    ".yc-pfp-zoom span{font-size:.75rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--mute,#8A7A68)}",
    ".yc-pfp-zoom input{flex:0 1 17rem;min-width:0;accent-color:var(--yap,#FF8020)}",
    ".yc-pfp-zoom b{font-size:.8rem;font-family:ui-monospace,Consolas,monospace;color:var(--ink,#141210);min-width:3.4rem;text-align:right}",
    ".yc-pfp-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:.7rem;margin-top:1rem}"
  ].join("\n");

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

  function meta(entry) {
    if (typeof entry === "string") return { src: entry };
    if (entry && typeof entry === "object" && entry.src) {
      return {
        src: String(entry.src),
        cx: Number(entry.cx),
        cy: Number(entry.cy),
        w: Number(entry.w),
        h: Number(entry.h),
        z: Number(entry.z) || 1
      };
    }
    return null;
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function cropShift(m) {
    if (!m || !m.w || !m.h || !isFinite(m.cx) || !isFinite(m.cy)) return null;
    var side = Math.min(m.w, m.h);
    if (!side) return null;
    var tx = (m.cx - m.w / 2) / side * 100;
    var ty = (m.cy - m.h / 2) / side * 100;
    var z = m.z || 1;
    if (Math.abs(tx) < 0.05 && Math.abs(ty) < 0.05 && Math.abs(z - 1) < 0.01) return null;
    return { tx: round2(tx), ty: round2(ty), z: round2(z) };
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

  function rebuildUrl(uid, entry) {
    var m = meta(entry);
    if (urls[uid]) { URL.revokeObjectURL(urls[uid]); delete urls[uid]; }
    if (!m) return Promise.resolve();
    return fetch(m.src).then(function (r) { return r.blob(); }).then(function (blob) {
      urls[uid] = URL.createObjectURL(blob);
    }).catch(function () {});
  }

  function patchAll() {
    var list = entries();
    Object.keys(urls).forEach(function (uid) {
      var shift = cropShift(meta(list[uid]));
      var sel = '.av img[src*="' + needle(uid) + '"]';
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (im) {
        if (im.getAttribute("data-yc-pfp") === uid) return;
        im.setAttribute("data-yc-orig", im.getAttribute("src") || "");
        im.setAttribute("data-yc-pfp", uid);
        im.src = urls[uid];
        if (shift) {
          im.style.transform = "translate(" + shift.tx + "%," + shift.ty + "%) scale(" + shift.z + ")";
          im.style.transformOrigin = "50% 50%";
        }
      });
    });
  }

  function unpatchAll() {
    Array.prototype.forEach.call(document.querySelectorAll("img[data-yc-pfp]"), function (im) {
      var orig = im.getAttribute("data-yc-orig");
      if (orig) im.src = orig;
      im.style.transform = "";
      im.style.transformOrigin = "";
      im.removeAttribute("data-yc-pfp");
      im.removeAttribute("data-yc-orig");
    });
  }

  function clearLocal(uid) {
    if (urls[uid]) { URL.revokeObjectURL(urls[uid]); delete urls[uid]; }
    if (YC.store.cfg.pfps) delete YC.store.cfg.pfps[uid];
    YC.store.save(true);
  }

  function drawCrop(img, c) {
    var out = Math.min(KEEP_SIDE, Math.max(1, Math.round(c.side)));
    var cv = document.createElement("canvas");
    cv.width = out;
    cv.height = out;
    var g = cv.getContext("2d");
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(img, c.sx, c.sy, c.side, c.side, 0, 0, out, out);
    return cv.toDataURL("image/webp", 0.92);
  }

  function openCropper(img) {
    return new Promise(function (resolve) {
      var w = img.naturalWidth, h = img.naturalHeight;
      var stage = Math.max(180, Math.min(360, Math.min(window.innerWidth - 96, window.innerHeight - 320)));
      var fit = stage / Math.min(w, h);
      var z = 1, dx = 0, dy = 0, settled = false, m = null;

      var pic = document.createElement("img");
      pic.src = img.src;
      pic.style.width = Math.round(w * fit) + "px";
      pic.style.height = Math.round(h * fit) + "px";

      var boxEl = document.createElement("div");
      boxEl.className = "yc-pfp-stage";
      boxEl.style.width = stage + "px";
      boxEl.style.height = stage + "px";
      boxEl.appendChild(pic);

      var ring = document.createElement("div");
      ring.className = "yc-pfp-ring";
      boxEl.appendChild(ring);

      function clamp() {
        var mx = Math.max(0, (w * fit * z - stage) / 2);
        var my = Math.max(0, (h * fit * z - stage) / 2);
        dx = Math.max(-mx, Math.min(mx, dx));
        dy = Math.max(-my, Math.min(my, dy));
      }

      function paint() {
        pic.style.transform = "translate(-50%,-50%) translate(" + round2(dx) + "px," + round2(dy) + "px) scale(" + round2(z) + ")";
      }

      function setZoom(next) {
        z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
        clamp();
        paint();
        if (zoomInput) zoomInput.value = String(Math.round(z * 100));
        if (zoomOut) zoomOut.textContent = Math.round(z * 100) + "%";
      }

      var dragging = false, lastX = 0, lastY = 0;
      boxEl.addEventListener("pointerdown", function (e) {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        try { boxEl.setPointerCapture(e.pointerId); } catch (err) {}
        e.preventDefault();
      });
      boxEl.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        dx += e.clientX - lastX;
        dy += e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        clamp();
        paint();
      });
      function endDrag() { dragging = false; }
      boxEl.addEventListener("pointerup", endDrag);
      boxEl.addEventListener("pointercancel", endDrag);
      boxEl.addEventListener("wheel", function (e) {
        e.preventDefault();
        setZoom(z * (e.deltaY > 0 ? 0.92 : 1.08));
      }, { passive: false });

      var zoomInput = null;
      var zoomOut = null;

      var zoomRow = document.createElement("div");
      zoomRow.className = "yc-pfp-zoom";
      var zoomLabel = document.createElement("span");
      zoomLabel.textContent = "Zoom";
      zoomInput = document.createElement("input");
      zoomInput.type = "range";
      zoomInput.min = String(MIN_ZOOM * 100);
      zoomInput.max = String(MAX_ZOOM * 100);
      zoomInput.step = "5";
      zoomInput.value = "100";
      zoomInput.setAttribute("aria-label", "Zoom");
      zoomOut = document.createElement("b");
      zoomOut.textContent = "100%";
      zoomInput.oninput = function () { setZoom(Number(zoomInput.value) / 100); };
      zoomRow.appendChild(zoomLabel);
      zoomRow.appendChild(zoomInput);
      zoomRow.appendChild(zoomOut);

      var hint = document.createElement("p");
      hint.className = "yc-pfp-hint";
      hint.textContent = "Drag the picture to move it and use the slider to zoom. Everything outside the circle is cut away. GIFs show their first frame while you pick.";

      var actions = document.createElement("div");
      actions.className = "yc-pfp-actions";

      function current() {
        var side = Math.min(w, h) / z;
        var cx = w / 2 - dx / (fit * z);
        var cy = h / 2 - dy / (fit * z);
        var sx = Math.max(0, Math.min(w - side, cx - side / 2));
        var sy = Math.max(0, Math.min(h - side, cy - side / 2));
        return { sx: sx, sy: sy, side: side, cx: sx + side / 2, cy: sy + side / 2, w: w, h: h, z: z };
      }

      function finish(crop) {
        if (settled) return;
        settled = true;
        resolve(crop);
        if (m) m.close();
      }

      var cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "yc-btn ghost";
      cancelBtn.textContent = "Cancel";
      cancelBtn.onclick = function () { finish(null); };

      var useBtn = document.createElement("button");
      useBtn.type = "button";
      useBtn.className = "yc-btn primary";
      useBtn.textContent = "Use this picture";
      useBtn.onclick = function () { finish(current()); };

      actions.appendChild(cancelBtn);
      actions.appendChild(useBtn);

      clamp();
      paint();

      m = YC.ui.openModal({
        title: "Crop your picture",
        render: function (body) {
          body.appendChild(boxEl);
          body.appendChild(zoomRow);
          body.appendChild(hint);
          body.appendChild(actions);
        },
        onClose: function () { finish(null); }
      });
    });
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

  function sendUpload(dataUrl, gifFile, crop) {
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
              YC.store.cfg.pfps[String(u.id)] = {
                src: data,
                cx: crop.cx,
                cy: crop.cy,
                w: crop.w,
                h: crop.h,
                z: crop.z
              };
              YC.store.save(true);
              rebuildUrl(String(u.id), YC.store.cfg.pfps[String(u.id)]).then(function () {
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
      if (!w || !h || w > MAX_SIDE || h > MAX_SIDE) {
        URL.revokeObjectURL(url);
        YC.ui.toast("Yapit takes images up to " + MAX_SIDE + " x " + MAX_SIDE + ". Yours is " + w + " x " + h + ".", "error");
        return;
      }
      openCropper(img).then(function (crop) {
        URL.revokeObjectURL(url);
        if (!crop) return;
        var dataUrl;
        try { dataUrl = drawCrop(img, crop); }
        catch (e) { YC.ui.toast("Could not read that image.", "error"); return; }
        var gif = cfg().animateGif !== false && type === "image/gif" ? file : null;
        return sendUpload(dataUrl, gif, crop).catch(function (e) {
          YC.ui.toast(String(e && e.message || e), "error");
        });
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
    description: "Use any image you like as your Yapit profile picture. Pick the part you want in a crop box, then it uploads at full quality. GIFs keep moving on YapCord.",
    defaultEnabled: true,

    settings: [
      {
        id: "picture", type: "buttons", label: "Profile picture", actions: [
          { label: "Choose image", fn: pick },
          { label: "Remove picture", danger: true, fn: removeIcon }
        ],
        desc: "Any PNG, JPG, GIF or WebP up to 3000 x 3000 and 5 MB. A crop box opens so you choose exactly which part becomes your picture, then YapCord uploads it at full quality and refreshes every picture already on screen."
      },
      { id: "animateGif", type: "toggle", label: "Keep GIFs moving", default: true,
        desc: "Yapit flattens every upload into one still picture, so GIFs freeze for everyone. This keeps the original GIF as well, cropped to match, so it still moves on your screen and for friends who import your config file." }
    ],

    start: function (ctx) {
      ctx.css(CSS);
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
