/*
 * Dashboard page logic — wallet summary cards + recent activity feed.
 */
(function () {
  function formatCurrency(n) {
    return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch (err) {
      return iso;
    }
  }

  function getWithdrawalAttempts(userId) {
    try {
      var raw = localStorage.getItem("gw_withdrawal_attempts");
      if (!raw) return [];
      var all = JSON.parse(raw);
      return (all || []).filter(function (a) {
        return a.userId === userId;
      });
    } catch (err) {
      return [];
    }
  }

  function showSkeleton() {
    var summary = document.getElementById("summaryCards");
    var activity = document.getElementById("activityList");
    if (summary) {
      var cardHtml = "";
      for (var i = 0; i < 3; i++) {
        cardHtml += '<div class="card metric-card skeleton-card">' +
          '<div class="skeleton-line short"></div><div class="skeleton-line long"></div></div>';
      }
      summary.innerHTML = cardHtml;
    }
    if (activity) {
      var rowHtml = "";
      for (var j = 0; j < 4; j++) {
        rowHtml += '<div class="activity-item"><div class="skeleton-line long"></div></div>';
      }
      activity.innerHTML = rowHtml;
    }
  }

  function statusBadge(approved) {
    var label = window.GWTranslator ? GWTranslator.t(approved ? "status.approved" : "status.notApproved") : approved ? "Approved" : "Not approved";
    return approved
      ? '<span class="badge badge-success"><img src="assets/icons/check.svg" class="icon icon-xs" alt="">' + label + "</span>"
      : '<span class="badge badge-warning"><img src="assets/icons/clock.svg" class="icon icon-xs" alt="">' + label + "</span>";
  }

  function renderSummary(wallet) {
    var el = document.getElementById("summaryCards");
    if (!el) return;

    var withdrawCta = wallet.balance > 0
      ? '<a href="withdraw.html" class="btn btn-primary btn-sm metric-cta" data-i18n="dashboard.withdrawCta">Withdraw to bank account</a>'
      : '<div class="metric-hint" data-i18n="dashboard.noBalanceHint">No funds available yet</div>';

    el.innerHTML =
      '<div class="card metric-card">' +
      '<div class="metric-label" data-i18n="dashboard.balance">Available balance</div>' +
      '<div class="metric-value" data-no-translate="true">' + formatCurrency(wallet.balance) + "</div>" +
      withdrawCta +
      "</div>" +
      '<div class="card metric-card">' +
      '<div class="metric-label" data-i18n="dashboard.taxWithheld">Tax withheld</div>' +
      '<div class="metric-value" data-no-translate="true">' + formatCurrency(wallet.taxWithheld) + "</div>" +
      '<div class="metric-hint" data-i18n="dashboard.taxWithheldHint">Across all approved grants</div>' +
      "</div>" +
      '<div class="card metric-card">' +
      '<div class="metric-label" data-i18n="dashboard.pending">Pending requests</div>' +
      '<div class="metric-value" data-no-translate="true">' + wallet.pendingCount + "</div>" +
      '<div class="metric-hint" data-no-translate="true">' + formatCurrency(wallet.pendingAmount) +
      ' <span data-i18n="dashboard.pendingHint">requested</span></div>' +
      "</div>";

    if (window.GWTranslator) GWTranslator.apply();
  }

  function grantActivityRow(g) {
    return (
      '<div class="activity-item">' +
      '<img src="assets/icons/bank.svg" class="icon activity-icon" alt="">' +
      '<div class="activity-body">' +
      '<div class="activity-title" data-no-translate="true">' + g.program + "</div>" +
      '<div class="activity-meta" data-no-translate="true">' + formatDate(g.date) + " &middot; " + formatCurrency(g.net_amount) + " net</div>" +
      "</div>" +
      statusBadge(g.approved) +
      "</div>"
    );
  }

  function withdrawalActivityRow(a) {
    return (
      '<div class="activity-item">' +
      '<img src="assets/icons/withdraw.svg" class="icon activity-icon" alt="">' +
      '<div class="activity-body">' +
      '<div class="activity-title" data-i18n="withdraw.attemptTitle">Withdrawal request</div>' +
      '<div class="activity-meta" data-no-translate="true">' + formatDate(a.createdAt) + " &middot; " + formatCurrency(a.amount) + "</div>" +
      "</div>" +
      '<span class="badge badge-neutral" data-i18n="withdraw.attemptStatus">Conversion required</span>' +
      "</div>"
    );
  }

  function renderActivity(user, wallet) {
    var el = document.getElementById("activityList");
    if (!el) return;

    var attempts = getWithdrawalAttempts(user.id);
    var items = [];

    wallet.grants.forEach(function (g) {
      items.push({ date: g.date, node: grantActivityRow(g) });
    });
    attempts.forEach(function (a) {
      items.push({ date: a.createdAt, node: withdrawalActivityRow(a) });
    });

    items.sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    if (!items.length) {
      el.innerHTML = '<div class="empty-state" data-i18n="dashboard.noActivity">No activity yet.</div>';
      if (window.GWTranslator) GWTranslator.apply();
      return;
    }

    el.innerHTML = items.map(function (i) { return i.node; }).join("");
    if (window.GWTranslator) GWTranslator.apply();
  }

  function renderLastUpdated(cachedAt, source) {
    var el = document.getElementById("lastUpdated");
    if (!el) return;
    var label = window.GWTranslator ? GWTranslator.t("common.lastUpdated") : "Last updated";
    var time = cachedAt ? new Date(cachedAt).toLocaleTimeString("en-US") : "--";
    el.textContent = label + ": " + time + (source === "cache" ? " (cached)" : "");
  }

  async function load() {
    showSkeleton();
    var session = GWAuth.getSession();
    if (!session) return;

    var result = await GWApi.fetchUsers();
    var user = result.users.find(function (u) { return u.id === session.userId; });

    if (!user) {
      if (window.GWToast) GWToast.show("We could not find your account. Please log in again.", "error");
      GWAuth.logout();
      return;
    }

    var wallet = GWApi.computeWallet(user);
    renderSummary(wallet);
    renderActivity(user, wallet);
    renderLastUpdated(result.cachedAt, result.source);
  }

  document.addEventListener("gw:ready", function () {
    if (document.body.dataset.page !== "dashboard") return;
    load();
    var refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", load);
  });
})();
