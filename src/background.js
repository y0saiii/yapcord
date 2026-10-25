
const YC_VERSION = chrome.runtime.getManifest().version;
const SETTINGS_URL = "https://yapit.online/#/settings";

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.local.get("yapcord.config", (res) => {
      if (!res["yapcord.config"]) {
        chrome.storage.local.set({
          "yapcord.config": {
            master: true,
            installedAt: Date.now(),
            version: YC_VERSION
          }
        });
      }
    });
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.query({ url: "https://yapit.online/*" }, (tabs) => {
    const existing = tabs && tabs[0];
    if (existing && existing.id != null) {
      chrome.tabs.update(existing.id, { active: true });
      if (existing.windowId != null) chrome.windows.update(existing.windowId, { focused: true });
    } else {
      chrome.tabs.create({ url: SETTINGS_URL });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "yapcord-notify") return;
  const id = "yapcord-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon128.png"),
    title: msg.title || "YapCord",
    message: String(msg.message || ""),
    priority: 1
  }).catch((e) => {
    console.warn("[YapCord] notification could not be shown:", e && e.message);
  });
  sendResponse({ ok: true });
  return false;
});
