window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

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
  var observer = null;
  var listening = false;
  var saved = new WeakMap();

  function masterOn() {
    try { return YC.store.get("master", true) !== false; } catch (e) { return true; }
  }

  function entries() {
    var p = YC.store && YC.store.cfg ? YC.store.cfg.pfps : null;
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

  function loadMe(force) {
    if (me && !force) return Promise.resolve(me);
    return YC.api("me").then(function (res) {
      me = res && res.user ? res.user : null;
      return me;
    }).catch(function () { return me; });
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
      var sel = 'img[src^="' + needle(uid) + '"], img[data-yc-pfp="' + uid + '"]';
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (im) {
        if (im.getAttribute("data-yc-pfp") !== uid) {
          var own = im.getAttribute("src") || "";
          if (own.slice(0, 5) !== "blob:") im.setAttribute("data-yc-orig", own);
          im.setAttribute("data-yc-pfp", uid);
        }
        if (im.src !== urls[uid]) im.src = urls[uid];
        if (shift) {
          im.style.transform = "translate(" + shift.tx + "%," + shift.ty + "%) scale(" + shift.z + ")";
          im.style.transformOrigin = "50% 50%";
        } else {
          im.style.transform = "";
          im.style.transformOrigin = "";
        }
      });
    });
  }

  function unpatch(uid) {
    Array.prototype.forEach.call(document.querySelectorAll('img[data-yc-pfp="' + uid + '"]'), function (im) {
      restore(im);
    });
  }

  function restore(im) {
    var orig = im.getAttribute("data-yc-orig");
    if (orig) im.src = orig;
    im.style.transform = "";
    im.style.transformOrigin = "";
    im.removeAttribute("data-yc-pfp");
    im.removeAttribute("data-yc-orig");
  }

  function unpatchAll() {
    Array.prototype.forEach.call(document.querySelectorAll("img[data-yc-pfp]"), restore);
  }

  function dropLocal(uid) {
    if (urls[uid]) { URL.revokeObjectURL(urls[uid]); delete urls[uid]; }
    if (YC.store && YC.store.cfg && YC.store.cfg.pfps) delete YC.store.cfg.pfps[uid];
    try { YC.store.save(true); } catch (e) {}
    unpatch(uid);
  }

  function iconUrl(icon) {
    if (!icon) return "";
    if (/^https?:/i.test(icon) || icon.slice(0, 2) === "//" || icon.indexOf("data:") === 0 || icon.indexOf("icons/") === 0) return icon;
    return "icons/" + icon;
  }

  function refreshVisible(icon, uid) {
    if (!uid) return;
    var next = iconUrl(icon);
    if (!next) return;
    var sel = 'img[data-yc-pfp="' + uid + '"], img[src^="' + needle(uid) + '"]';
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (im) {
      if (im.getAttribute("data-yc-pfp") === uid) { im.setAttribute("data-yc-orig", next); return; }
      im.src = next;
    });
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

  function saveGif(uid, file, crop) {
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
        YC.store.cfg.pfps[uid] = { src: data, cx: crop.cx, cy: crop.cy, w: crop.w, h: crop.h, z: crop.z };
        YC.store.save(true);
        rebuildUrl(uid, YC.store.cfg.pfps[uid]).then(function () {
          patchAll();
          resolve();
        });
      };
      fr.onerror = function () { resolve(); };
      fr.readAsDataURL(file);
    });
  }

  function sendUpload(dataUrl, gifFile, crop) {
    return YC.api("icon_upload", { data: dataUrl }).then(function (res) {
      if (!res || !res.icon) throw new Error("Yapit did not take that image.");
      return loadMe(true).then(function (u) {
        if (!u) return;
        var uid = String(u.id);
        if (!gifFile) dropLocal(uid);
        refreshVisible(res.icon, uid);
        if (gifFile) return saveGif(uid, gifFile, crop);
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
        var gif = type === "image/gif" ? file : null;
        return loadMe().then(function () {
          return sendUpload(dataUrl, gif, crop);
        }).catch(function (e) {
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

  function onIconChange(e) {
    var input = e.target;
    var f = input && input.files ? input.files[0] : null;
    try { input.value = ""; } catch (err) {}
    if (f) upload(f);
  }

  function afterRemove() {
    return loadMe(true).then(function (u) {
      if (u && !u.icon) dropLocal(String(u.id));
    }).catch(function () {});
  }

  function wire() {
    var ic = document.getElementById("ic");
    if (ic && ic.onchange !== onIconChange) {
      if (!ic.hasAttribute("data-yc-ic")) {
        try { saved.set(ic, ic.onchange); } catch (e) {}
        ic.setAttribute("data-yc-ic", "1");
      }
      ic.onchange = onIconChange;
    }
    var icr = document.getElementById("icr");
    if (icr && icr.getAttribute("data-yc-icr") !== "1") {
      try { saved.set(icr, icr.onclick); } catch (e) {}
      icr.setAttribute("data-yc-icr", "1");
      var orig = icr.onclick;
      icr.onclick = function (e) {
        var r = orig ? orig.call(icr, e) : undefined;
        Promise.resolve(r).then(afterRemove, function () {});
        return r;
      };
    }
  }

  function unwire() {
    var ic = document.getElementById("ic");
    if (ic && ic.getAttribute("data-yc-ic") === "1") {
      ic.onchange = saved.has(ic) ? saved.get(ic) : null;
      ic.removeAttribute("data-yc-ic");
    }
    var icr = document.getElementById("icr");
    if (icr && icr.getAttribute("data-yc-icr") === "1") {
      icr.onclick = saved.has(icr) ? saved.get(icr) : null;
      icr.removeAttribute("data-yc-icr");
    }
  }

  function onMutate() {
    if (!masterOn()) return;
    wire();
    if (live) patchAll();
  }

  function ensureStyle() {
    if (document.getElementById("yc-pfp-style")) return;
    var el = document.createElement("style");
    el.id = "yc-pfp-style";
    el.textContent = CSS;
    (document.head || document.documentElement).appendChild(el);
  }

  function sync() {
    if (masterOn()) {
      wire();
      if (!live && Object.keys(urls).length) { live = true; patchAll(); }
    } else {
      unwire();
      unpatchAll();
      live = false;
    }
  }

  function start() {
    ensureStyle();
    if (!observer) {
      observer = new MutationObserver(onMutate);
      observer.observe(document.documentElement || document, { childList: true, subtree: true });
    }
    if (!listening && YC.store.onChange) {
      listening = true;
      YC.store.onChange(function () { sync(); });
    }
    var list = entries();
    Promise.all(Object.keys(list).map(function (uid) { return rebuildUrl(uid, list[uid]); })).then(function () {
      if (!masterOn()) return;
      live = true;
      patchAll();
    });
    sync();
  }

  YC.pfp = { start: start, sync: sync, upload: upload, patchAll: patchAll };
})(window.YapCord);
