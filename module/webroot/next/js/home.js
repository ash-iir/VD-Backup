/*
 * ======================================================================
 *  VD BACKUP  ::  root backup & restore, no grant prompt
 *  Full app/data backup & restore as root: KernelSU/APatch/Magisk WebUI.
 *
 *  Copyright (C) 2026  VD171
 *  SPDX-License-Identifier: AGPL-3.0-or-later
 *
 *  Free software under the GNU AGPL v3 or later. NETWORK COPYLEFT: run a
 *  modified version, even as a service, and you MUST offer its source.
 *
 *  Site           : https://vd171.ru
 *  Site           : https://vd.priv8.ru
 *  Source         : https://github.com/VD171/VD-Backup
 *  GitHub         : @VD171 https://github.com/VD171
 *  XDA-Developers : @VD171 https://xdaforums.com/m/vd171.4699873/
 *  XDA thread     : https://xdaforums.com/t/VD-Backup.4807267/
 *  Telegram       : @VD_Priv8 https://t.me/VD_Priv8
 *  Channel        : @Priv8_VD https://t.me/Priv8_VD
 *  Discord        : @VD.Priv8 https://discord.com/users/1296831918989639721
 *  E-mail         : vd.priv8@pm.me
 * ======================================================================
 *
 *  New interface Home: storage summary (filled by the engine's overview)
 *  and the latest activity-log entries (read-only, helper "log-read").
 */
"use strict";

var NX_HOME = (function () {
  var last = 0;
  var SVG = "http://www.w3.org/2000/svg";

  function icon(id) {
    var s = document.createElementNS(SVG, "svg"); s.setAttribute("class", "i");
    var u = document.createElementNS(SVG, "use"); u.setAttribute("href", "#" + id);
    s.appendChild(u); return s;
  }
  function kind(op) {
    op = String(op || "");
    if (/delete|prune|wipe|clear|reset/.test(op)) return ["del", "i-archive"];
    if (/restore|import|pull/.test(op)) return ["rs", "i-restore"];
    if (/backup|scheduler/.test(op)) return ["ok", "i-up"];
    return ["", "i-list"];
  }

  function renderRecent(entries) {
    var ul = document.getElementById("nx-recent"), empty = document.getElementById("nx-recent-empty");
    if (!ul) return;
    ul.innerHTML = "";
    entries.forEach(function (e) {
      var li = el("li", "row tappable"), k = kind(e.op);
      var dot = el("span", "nx-dot " + k[0]); dot.appendChild(icon(k[1]));
      var grow = el("div", "grow");
      grow.appendChild(el("div", "name", logLabel(e)));
      var detail = e.detail || e.ref || e.id || e.package || "";
      if (detail) grow.appendChild(el("div", "pkg", detail));
      li.appendChild(dot); li.appendChild(grow); li.appendChild(el("span", "when", shortDate(e.ts)));
      li.onclick = function () { navTab("log"); };
      ul.appendChild(li);
    });
    if (empty) empty.hidden = entries.length > 0;
  }

  function refresh(force) {
    var now = Date.now();
    if (!force && now - last < 15000) return;
    last = now;
    helper("log-read", { limit: 4 }).then(function (r) {
      renderRecent((r && r.entries) ? r.entries.slice(0, 4) : []);
    }).catch(function () {});
  }

  // the engine draws the bar and the line; Home adds the large "used" figure
  if (typeof renderStorage === "function") {
    var draw = renderStorage;
    window.renderStorage = function (used, free, total) {
      draw(used, free, total);
      var n = document.getElementById("nx-used");
      if (n) n.textContent = fmtSize(Number(used) || 0);
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    // queued behind the boot calls (the bridge runs one exec at a time)
    setTimeout(function () { refresh(true); }, 1200);
  });

  return { show: function () { if (typeof loadOverview === "function") loadOverview(); refresh(false); }, refresh: refresh };
})();
