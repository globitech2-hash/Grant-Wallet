/*
 * Profile page logic — read-only user details and computed grant summary.
 */
(function () {
  function formatCurrency(n) {
    return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDateTime(iso) {
    if (!iso) return window.GWTranslator ? GWTranslator.t("profile.notAvailable") : "Not available";
    try {
      return new Date(iso).toLocaleString("en-US");
    } catch (err) {
      return iso;
    }
  }

  function item(labelKey, value, noTranslate) {
    return (
      '<div class="profile-item">' +
      '<div class="profile-label" data-i18n="' + labelKey + '"></div>' +
      '<div class="profile-value"' + (noTranslate ? ' data-no-translate="true"' : "") + ">" + value + "</div>" +
      "</div>"
    );
  }

  async function load() {
    var session = GWAuth.getSession();
    if (!session) return;

    var result = await GWApi.fetchUsers();
    var user = result.users.find(function (u) { return u.id === session.userId; });
    if (!user) {
      GWAuth.logout();
      return;
    }

    var wallet = GWApi.computeWallet(user);
    var approvedCount = wallet.grants.filter(function (g) { return g.approved; }).length;
    var grid = document.getElementById("profileGrid");
    if (!grid) return;

    grid.innerHTML = [
      item("profile.fullName", user.name, true),
      item("profile.email", user.email, true),
      item("profile.userId", user.id, true),
      item("profile.lastLogin", formatDateTime(session.loginAt), true),
      item("profile.grantsTotal", String(wallet.grants.length), true),
      item("profile.grantsApproved", String(approvedCount), true),
      item("profile.balance", formatCurrency(wallet.balance), true),
      item("profile.taxWithheld", formatCurrency(wallet.taxWithheld), true),
      item("profile.pending", String(wallet.pendingCount), true)
    ].join("");

    if (window.GWTranslator) GWTranslator.apply();
  }

  document.addEventListener("gw:ready", function () {
    if (document.body.dataset.page !== "profile") return;
    load();
  });
})();