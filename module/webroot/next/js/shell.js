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
 *  New interface shell: navigation, app bar, Backups sections. The engine
 *  (../scripts.js) is shared with the classic interface and does all the
 *  work through helper(verb, args); this file only arranges the screens.
 */
"use strict";

var NX = (function () {
  var SUB = { dests: 1, settings: 1, updates: 1, about: 1, log: 1 };
  var TITLE = { apps: "tab_apps", backups: "tab_backups", schedule: "tab_schedule", more: "nx_more",
                dests: "tab_dests", settings: "tab_settings", updates: "tab_updates", about: "tab_about", log: "ui_log_title" };
  var seg = "apps";

  function updateBar(name) {
    var t = document.getElementById("nx-title");
    if (t) t.textContent = TITLE[name] ? I18N.t(TITLE[name]) : "VDBackup";
    document.body.classList.toggle("nx-in-sub", !!SUB[name]);
    document.querySelectorAll(".nx-nav .tab").forEach(function (b) {
      b.classList.toggle("nx-parent", !!SUB[name] && b.dataset.tab === "more");
      b.setAttribute("aria-selected", b.classList.contains("active") ? "true" : "false");
    });
  }

  function setSeg(name) {
    if (!name) return;
    seg = name;
    document.querySelectorAll(".nx-seg-b").forEach(function (b) {
      var on = b.dataset.seg === name;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      if (on && b.scrollIntoView) b.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    document.querySelectorAll(".nx-pane").forEach(function (p) { p.hidden = p.dataset.pane !== name; });
  }

  // "tab" or "tab:section" (a Backups section)
  function go(target) {
    var p = String(target || "").split(":");
    if (typeof navTab === "function") navTab(p[0]);
    if (p[0] === "backups" && p[1]) setSeg(p[1]);
  }

  function wrapEngine() {
    if (typeof _tabStack !== "undefined" && _tabStack.length === 1) _tabStack[0] = "home";
    var orig = window.switchTab;
    window.switchTab = function (name) {
      orig(name);
      updateBar(name);
      window.scrollTo(0, 0);
      if (name === "home" && window.NX_HOME) NX_HOME.show();
    };
    var apply = I18N.apply;
    I18N.apply = function (root) {
      apply(root);
      var cur = document.querySelector(".panel.active");
      updateBar(cur ? cur.id : "home");
    };
  }

  function bind() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-go]");
      if (t) { e.preventDefault(); go(t.getAttribute("data-go")); return; }
      var s = e.target.closest && e.target.closest(".nx-seg-b");
      if (s) setSeg(s.dataset.seg);
    });
    var back = document.getElementById("nx-back");
    if (back) back.onclick = function () { history.back(); };
    var gear = document.getElementById("nx-settings-btn");
    if (gear) {
      gear.setAttribute("aria-label", I18N.t("tab_settings"));
      gear.onclick = function () { navTab("settings"); };
    }
    var bar = document.querySelector(".nx-top"), ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { ticking = false; bar.classList.toggle("scrolled", window.scrollY > 4); });
    }, { passive: true });
    setSeg(seg);
    updateBar("home");
  }

  // escape hatch: if the engine fails to come up, offer the classic interface
  var errs = 0;
  window.addEventListener("error", function () { errs++; });
  function watchBoot() {
    setTimeout(function () {
      var cfgEmpty = typeof CFG !== "object" || !CFG || !Object.keys(CFG).length;
      var noApps = !document.querySelector("#applist li");
      if (errs && (cfgEmpty || noApps)) { var b = document.getElementById("nx-boot-err"); if (b) b.hidden = false; }
    }, 8000);
  }

  wrapEngine();
  document.addEventListener("DOMContentLoaded", function () { bind(); watchBoot(); });
  return { go: go, setSeg: setSeg };
})();
