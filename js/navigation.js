/*
 * GWNavigation — renders the topbar and sidebar, wires the mobile drawer
 * and the user menu dropdown. No-ops safely on pages without these elements.
 */
(function (global) {
  var NAV_ITEMS = [
    { href: "dashboard.html", key: "nav.dashboard", label: "Dashboard", icon: "assets/icons/dashboard.svg" },
    { href: "history.html", key: "nav.history", label: "History", icon: "assets/icons/history.svg" },
    { href: "withdraw.html", key: "nav.withdraw", label: "Withdraw", icon: "assets/icons/withdraw.svg" },
    { href: "profile.html", key: "nav.profile", label: "Profile", icon: "assets/icons/profile.svg" }
  ];

  function render() {
    renderTopbar();
    renderSidebar();
    bindMobileDrawer();
    bindUserMenu();
  }

  function initials(name) {
    return String(name || "")
      .split(" ")
      .filter(Boolean)
      .map(function (p) {
        return p[0];
      })
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function renderTopbar() {
    var el = document.getElementById("topbar");
    if (!el) return;
    var session = GWAuth.getSession();

    var html =
      '<button class="icon-btn hamburger" id="hamburgerBtn" aria-label="Open menu" aria-expanded="false">' +
      '<span class="hamburger-lines" aria-hidden="true"><span></span><span></span><span></span></span></button>' +
      '<a href="dashboard.html" class="brand" data-no-translate="true">' +
      '<img src="assets/icons/bank.svg" class="icon brand-icon" alt="">' +
      "<span>Grant Wallet</span></a>" +
      '<div class="topbar-spacer"></div>' +
      '<button class="lang-toggle" id="langToggle" type="button" aria-label="Toggle language">' +
      '<img src="assets/icons/globe.svg" class="icon" alt="">' +
      '<span id="langToggleLabel">EN</span></button>';

    if (session) {
      html +=
        '<div class="user-menu" id="userMenu">' +
        '<button class="user-menu-trigger" id="userMenuTrigger" aria-haspopup="true" aria-expanded="false">' +
        '<span class="avatar" data-no-translate="true">' +
        initials(session.name) +
        "</span>" +
        '<span class="user-name" data-no-translate="true">' +
        session.name +
        "</span>" +
        '<img src="assets/icons/chevron-down.svg" class="icon icon-sm" alt="">' +
        "</button>" +
        '<div class="user-menu-panel" id="userMenuPanel" role="menu" hidden>' +
        '<div class="user-menu-email" data-no-translate="true">' +
        session.email +
        "</div>" +
        '<button class="user-menu-item" id="logoutBtn" role="menuitem" type="button">' +
        '<img src="assets/icons/logout.svg" class="icon icon-sm" alt="">' +
        '<span data-i18n="nav.logout">Log out</span></button>' +
        "</div></div>";
    }

    el.innerHTML = html;

    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", GWAuth.logout);
  }

  function renderSidebar() {
    var el = document.getElementById("sidebar");
    if (!el) return;
    var path = window.location.pathname;
    var currentPage = path.substring(path.lastIndexOf("/") + 1) || "index.html";
    var html = '<nav class="sidebar-nav" aria-label="Primary">';
    NAV_ITEMS.forEach(function (item) {
      var active = currentPage === item.href;
      html +=
        '<a href="' +
        item.href +
        '" class="sidebar-link' +
        (active ? " is-active" : "") +
        '"' +
        (active ? ' aria-current="page"' : "") +
        ">" +
        '<img src="' +
        item.icon +
        '" class="icon" alt="">' +
        '<span data-i18n="' +
        item.key +
        '">' +
        item.label +
        "</span></a>";
    });
    html += "</nav>";
    el.innerHTML = html;
  }

  function bindMobileDrawer() {
    var btn = document.getElementById("hamburgerBtn");
    var sidebar = document.getElementById("sidebar");
    var backdrop = document.getElementById("sidebarBackdrop");
    if (!btn || !sidebar) return;

    function close() {
      sidebar.classList.remove("is-open");
      if (backdrop) backdrop.classList.remove("is-visible");
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", function () {
      var open = sidebar.classList.toggle("is-open");
      if (backdrop) backdrop.classList.toggle("is-visible", open);
      btn.setAttribute("aria-expanded", String(open));
    });

    if (backdrop) backdrop.addEventListener("click", close);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    sidebar.querySelectorAll(".sidebar-link").forEach(function (link) {
      link.addEventListener("click", close);
    });
  }

  function bindUserMenu() {
    var trigger = document.getElementById("userMenuTrigger");
    var panel = document.getElementById("userMenuPanel");
    if (!trigger || !panel) return;

    trigger.addEventListener("click", function () {
      var isHidden = panel.hasAttribute("hidden");
      if (isHidden) {
        panel.removeAttribute("hidden");
        trigger.setAttribute("aria-expanded", "true");
      } else {
        panel.setAttribute("hidden", "");
        trigger.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("click", function (e) {
      if (!panel.contains(e.target) && !trigger.contains(e.target)) {
        panel.setAttribute("hidden", "");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  global.GWNavigation = { render: render };
})(window);
