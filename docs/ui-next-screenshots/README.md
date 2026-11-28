# New interface (opt-in) - design notes, parity and comparison

The New interface lives in `module/webroot/next/`. The Classic interface (`index.html`,
`styles.css`) is unchanged and stays the default. Switch in **Settings > Interface**
(both interfaces) or **More > Switch to the classic interface** (New). The choice is
stored as `ui` in the module config (`config-set` merges it) and mirrored in
localStorage so the right interface opens on the first frame.

## Architecture (why it merges cleanly)

- `next/index.html` keeps **every element id** of the classic markup (checked by script:
  0 missing, 0 duplicates) and loads the **same engine**: `lang/en.js`, `i18n.js`,
  `vdlu.js`, `scripts.js`. No backend or helper logic is duplicated, every action still
  goes through `helper(verb, args)`, with the same confirmations and audit log. A fix to
  `scripts.js` on another branch applies to both interfaces at once.
- `<base href="../">` makes `lang/*.json`, `vdlu-i18n/` and `assets/` resolve exactly as
  in the classic page.
- New files: `next/index.html`, `next/css/{tokens,base,components,screens}.css`,
  `next/js/shell.js` (navigation, app bar, Backups sections), `next/js/home.js`
  (Home summary + recent activity, read-only `log-read`), `ui-switch.js` (shared switch).
- Touched existing files: `index.html` (+1 script tag, +1 Settings field),
  `scripts.js` (+1 line: `VDB_UI.sync(CFG)` after config-get), 29 new keys appended
  to `lang/en.js`, `lang/en.json` and every `lang/<code>.json` (Arabic translated, others
  English fallback), `docs/FILE-STRUCTURE.md`.
- `shell.js` extends the engine by wrapping `switchTab` and `I18N.apply` (title, back
  button, nav highlight); `home.js` wraps `renderStorage` to add the large figure.

## Design rationale

- **Navigation (Material 3 navigation bar, 3 to 5 destinations).** Classic has 7 tabs in
  the bottom bar (the last one is cut off on a 412 dp phone). New: Home, Apps, Backups,
  Schedule, More. Destinations, Settings, Activity log, Updates and About are one tap
  away in More; Settings also has a gear in the app bar. Sub-pages show a back arrow and
  the Android back gesture keeps working (same history stack).
- **Home dashboard** (like Swift Backup's overview): storage used as a large figure with
  the bar, the four counters as tappable tiles, quick actions to every area, and the last
  four activity-log entries.
- **Apps** (like Neo Backup's main list): one rounded search field with refresh and Select,
  filters and sort as chips, tag chips, list rows inside one card with dividers, the
  per-row Back up button is tonal instead of a solid block, so the list reads calmer.
- **Backups** was one long page (list, cloud restore, import, special, folder, /data/adb).
  New splits it into section chips: Apps, System data, Files, /data/adb, Import.
- **Settings** grouped under headings (Appearance, Backup defaults, Encryption,
  Automation, Per-app rules, Restore options, Settings data and reset); each switch row
  carries its hint text; the destructive group is last, reset is red.
- **Dialogs** are bottom sheets with a drag handle and a sticky action bar (centered cards
  from 640 dp up).
- **Visual system:** neutral tonal surfaces, one accent (the user's accent color is
  honored), green = back up, blue = restore, red = delete. Light theme uses a darkened
  accent for text so contrast stays readable; muted text is about 6:1 or better.
- **Performance:** no backdrop-filter, no web fonts, inline SVG sprite (no icon requests),
  app icons still lazy via the engine's IntersectionObserver, no extra boot calls
  (one `log-read` is queued 1.2 s after boot for Home).
- **RTL:** logical properties throughout, chevrons and back arrow mirror, package names
  and sizes stay LTR (classic shows `sdcard/VDBackup/` reversed in Arabic; New shows
  `/sdcard/VDBackup`), two-line nav labels for long translations.
- **Escape hatch:** `?ui=classic` forces Classic; if the engine fails to boot, Home shows
  a "Switch to the classic interface" link.

## Parity checklist

Automated: every `button`/`a`/`select`/`input` with an id in the classic markup (198
controls) was triggered in both interfaces under the mock bridge; the helper verbs sent
and the dialogs opened were compared. Result: **identical for all 198** (the only flagged
control, `adb-ok`, throws the same error in both when pressed with no dialog open, a test
artifact).

| Area | Classic | New |
|---|---|---|
| Overview counters + storage | Apps tab top | Home |
| App list, search, user/system/all, sort, show excluded, tags, refresh, user picker | Apps | Apps |
| Single backup dialog (items, preset, verify, dry run, destination, passphrase) | yes | yes |
| Batch select / select all / none / back up selected / back up tag | yes | yes |
| App sheet (history, restore, delete, items and tags, mount as system) | yes | yes |
| Backup list, search, info, note/tags/pin, restore, delete, batch restore/delete, uninstalled | Backups | Backups > Apps |
| Restore from Telegram / cloud remote | Backups | Backups > Apps |
| Special backups + restore (system settings opt-in, ack) | Backups | Backups > System data |
| Folder/file backup + restore + browse | Backups | Backups > Files |
| /data/adb tree backup + restore | Backups | Backups > /data/adb |
| Import Neo Backup / DataBackup | Backups | Backups > Import |
| Destinations add/test/delete, folder picker, volumes, rclone remotes, OAuth authorize, custom params, Drive companion, HMA notice | Destinations | More > Destinations |
| Scheduled jobs list/add/delete, gates (Wi-Fi, charging, battery, days) | Schedule | Schedule |
| Activity log, export, clear | Schedule > log | Home, Schedule, More |
| All Settings (theme, scale, language, accent, defaults, staging, encryption, passphrase, auto backup, thermal, preflight, relaunch, excluded apps, per-app items, presets, spoof, SSAID, network policy, export/import/wipe/reset) | Settings | Settings |
| Updates (VDLU panel, check, banner) | Updates | More > Updates |
| About, links, provenance manifest | About | More > About |
| Running operations card, cancel, batch failures | yes | yes |
| Swipe between tabs, Android back | yes | yes (over the 5 nav tabs) |

Missing: nothing found. Not device-tested yet (mock harness only).

## Screenshots

Regenerate: `python3 tools/screenshots/shoot_ui_next.py` (both interfaces, en+ar,
dark+light, `--dialogs` for the backup and app dialogs). The sheets here put Classic
(top row) over New (bottom row).

## Round 2 (device feedback on v1.19-next)

- **Backup and Restore tabs.** Nav is Home, Backup, Restore, Schedule, More. Backup has
  Apps / System data / Files / /data/adb chips with the backup forms; Restore has the
  same chips plus Import and holds every list and restore action.
- **Every backup in one list.** Restore > Apps shows local, Telegram, rclone, Google Drive,
  restic (Snapshot) and remote Mirror backups together (`next/js/sources.js`,
  `next/js/restore.js`). Remote sources load lazily one after another, are cached, and
  show their own loading or error state (with Retry, or Sign in for Telegram). Chips filter
  by source, type, encrypted, pinned and tag; sort by newest, oldest, name or size. A
  remote backup restores through the verbs the Telegram/cloud dialogs use (pull, then
  the normal restore; restic by snapshot id; Mirror by dest + package). A backup that is
  both local and remote is one row with both badges. New helper verbs: `restic-list`,
  `rclone-list {mirrors:true}`; `list-backups` now carries `size`.
- **Home counts every source** (apps backed up, backups) and lists where they are with
  size; a row or counter opens Restore pre-filtered. "Apps" means apps that have a backup.
- **Segmented controls wrap** instead of squeezing; destination kinds are cards (icon,
  title, subtitle), two per row.
- **Running operations** are a one-line bar above the nav; a tap opens the full sheet.
  Optional progress notification (Settings, off by default) via `cmd notification post`.
- **Dialogs are one stack** (`next/js/modals.js`): the newest is on top with its own
  backdrop and focus; Back, Escape and a backdrop tap close only the top one, through its
  own Cancel/Close so the engine's promise settles; page scroll is locked meanwhile.
- **Fast start** (`next/js/boot.js`): the seven small boot calls are one `bootstrap` exec;
  the app, backup and schedule lists render from the last good copy and are redrawn only
  if the fresh data differs; Home paints the last numbers on the first frame; skeletons
  only on the very first open.
