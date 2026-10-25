# YapCord

**A client mod for [Yapit](https://yapit.online).**

YapCord gives Yapit themes, plugins, keyboard shortcuts, a message log and
in-chat search. Everything runs in your own browser and nothing is uploaded
anywhere.

![YapCord](logo.png)

---

## Install

YapCord is installed from a zip file, no build step needed:

1. Download the repository zip (green **Code** button on GitHub, then
   **Download ZIP**).
2. Extract the zip somewhere it can stay. Every time you update, extract the
   new zip over the same folder.
3. Open `chrome://extensions` (in Chrome: menu > **Manage extensions**).
4. Turn on **Developer mode** with the switch in the top right.
5. Click **Load unpacked** and pick the extracted YapCord folder.
6. Done. Open [yapit.online](https://yapit.online), press **Alt + Y** (or click
   the toolbar icon) to open **Settings**, then the **YapCord** tab.

If you update later, hit the refresh arrow on the YapCord card in
`chrome://extensions` (or load the folder again) so the new version loads.

---

## What you get

| Plugin | What it does |
| --- | --- |
| **MessageLogger** | Deleted messages stay on screen in red so you can still read them, and a copy is saved to your log. Edited messages keep their original text too. Right-click a message, channel or server to clear that part of the log, or right-click a deleted message to toggle its highlight. The log can be searched, exported or wiped. |
| **ThemeManager** | Seven themes: the YapCord logo colours, Discord's palette, Yapit's own look, and a custom CSS editor with your own accent colour. Themes load before the page does, so nothing flashes. Font size and motion controls are here too. |
| **Better Emoji Picker** | A proper emoji picker with recents, favourites, every server emoji and hundreds of unicode emoji with search. The `:shortcode:` box gets search and arrow keys as well. |
| **QuickKeybinds** | Reply, delete, copy, edit, emoji, search, log, settings, jump to latest and jump to channel `#1` to `#9` from the keyboard. Change any of them to whatever you like. |
| **Message Search** | A search bar in the chat header. Search by text, who sent it and date, and search deleted messages still in your log. Press Enter to jump to a match. |
| **RelationshipNotifier** | A toast, a desktop notification and a history entry when someone unfriends you or you get removed from a server, and when things go the other way. |
| **Improve Yapit UI** | Makes Yapit look and feel like Discord: the rail, sidebar, channels, messages, composer and menus reshaped to Discord's layout, plus a fast mode that drops unused fonts and stops animations. It keeps whatever colours your theme uses. A compact message mode is in there too. |
| **MultiLine** | Shift + Enter starts a new line so one message can span as many lines as you like, while Enter still sends it the usual way. The box grows as you type. Off until you switch it on, so nobody's Enter key changes without asking. |
| **Custom PFP** | Use any PNG, JPG, GIF or WebP as your Yapit profile picture. A crop box opens with a circle in it, so you pick exactly which part becomes your picture, then it uploads at full quality instead of the site's squashed version. GIFs keep moving on your screen and for friends who import your config file, since Yapit itself freezes them to one frame. |
| **Notification Sounds** | A soft two tone note when someone pings you and a different one for a direct message, with a volume slider and test buttons. Off by default. |
| **Custom Font** | Give the whole site any font you like, from the presets (Verdana, Tahoma, Georgia and friends) or a font name you type yourself. Off by default. |
| **Character Counter** | A small chip above the composer showing how much of Yapit's 2000 character limit you have used, turning red near the end. Off by default. |

Your whole setup (plugins, theme, keybinds, saved GIFs) lives in the **Data**
tab. Hit **Export settings** to download it as one file you can share with a
friend or carry to another computer, and **Import settings** to load one.

### Default keybinds

All Alt-based so the browser never steals them:

| Keys | Action | Keys | Action |
| --- | --- | --- | --- |
| `Alt + R` | Reply to hovered message | `Alt + N` | Focus the composer |
| `Alt + D` | Delete hovered message | `Alt + J` | Jump to latest message |
| `Alt + E` | Edit hovered message* | `Alt + G` | Toggle deleted-message ghosts |
| `Alt + C` | Copy hovered message | `Alt + Up / Down` | Scroll messages |
| `Alt + O` | Toggle emoji picker | `Alt + 1` to `Alt + 9` | Jump to channel #n |
| `Alt + M` | Search messages | `Alt + L` | Open the message log |
| `Alt + Y` | YapCord settings | | |

\* Yapit has no edit button of its own, so "edit" puts the original text in
your composer for you to send again. Edits are still saved to your log.

Message actions work on whatever message your mouse is hovering.

---

## Privacy

YapCord has no backend. It only ever talks to `yapit.online`, the same way the
site does, and only shows you things you could already see in the page.
Nothing is uploaded, tracked or shared. Delete the extension and everything
goes with it, or use **Reset YapCord** in the Data tab to do it from inside.

## License

MIT, fork it, break it, send PRs.
