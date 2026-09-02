/*
 * Withdraw page logic — mock bank-transfer form. Because this app has no
 * payment backend, every submission always resolves to a "conversion
 * required" notice. Attempts are stored locally for the recent activity feed.
 */
(function () {
  var focusBeforeModal = null;

  function formatCurrency(n) {
    return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function openConversionModal() {
    var modal = document.getElementById("conversionModal");
    var closeBtn = document.getElementById("conversionModalClose");
    if (!modal) return;
    focusBeforeModal = document.activeElement;
    modal.hidden = false;
    if (closeBtn) closeBtn.focus();
  }

  function closeConversionModal() {
    var modal = document.getElementById("conversionModal");
    if (!modal) return;
    modal.hidden = true;
    if (focusBeforeModal && typeof focusBeforeModal.focus === "function") {
      focusBeforeModal.focus();
    }
  }

  function bindModalEvents() {
    var closeBtn = document.getElementById("conversionModalClose");
    var backdrop = document.getElementById("conversionModalBackdrop");
    if (closeBtn) closeBtn.addEventListener("click", closeConversionModal);
    if (backdrop) backdrop.addEventListener("click", closeConversionModal);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeConversionModal();
    });
  }

  function saveAttempt(attempt) {
    try {
      var raw = localStorage.getItem("gw_withdrawal_attempts");
      var all = raw ? JSON.parse(raw) : [];
      all.push(attempt);
      localStorage.setItem("gw_withdrawal_attempts", JSON.stringify(all));
    } catch (err) {
      /* non-fatal */
    }
  }

  function getAttempts(userId) {
    try {
      var raw = localStorage.getItem("gw_withdrawal_attempts");
      var all = raw ? JSON.parse(raw) : [];
      return all
        .filter(function (a) { return a.userId === userId; })
        .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    } catch (err) {
      return [];
    }
  }

  function renderAttempts(userId) {
    var el = document.getElementById("recentAttempts");
    if (!el) return;
    var mine = getAttempts(userId);

    if (!mine.length) {
      el.innerHTML = '<div class="empty-state" data-i18n="withdraw.noAttempts">No withdrawal requests yet.</div>';
      if (window.GWTranslator) GWTranslator.apply();
      return;
    }

    el.innerHTML = mine
      .map(function (a) {
        return (
          '<div class="attempt-item">' +
          '<div data-no-translate="true">' + formatCurrency(a.amount) + " &rarr; " + a.bank + "</div>" +
          '<div class="activity-meta" data-no-translate="true">' + new Date(a.createdAt).toLocaleString("en-US") + "</div>" +
          "</div>"
        );
      })
      .join("");
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
    var balanceEl = document.getElementById("availableBalance");
    if (balanceEl) balanceEl.textContent = formatCurrency(wallet.balance);

    var amountInput = document.getElementById("amount");
    if (amountInput) amountInput.setAttribute("max", wallet.balance);

    var form = document.getElementById("withdrawForm");
    var submitBtn = document.getElementById("withdrawSubmit");

    if (submitBtn) submitBtn.disabled = wallet.balance <= 0;

    renderAttempts(user.id);

    if (form) {
      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        var fresh = await GWApi.fetchUsers();
        var freshUser = fresh.users.find(function (u) { return u.id === user.id; });
        if (!freshUser) {
          GWAuth.logout();
          return;
        }

        var freshWallet = GWApi.computeWallet(freshUser);
        wallet = freshWallet;
        if (balanceEl) balanceEl.textContent = formatCurrency(wallet.balance);
        if (amountInput) amountInput.setAttribute("max", wallet.balance);
        if (submitBtn) submitBtn.disabled = wallet.balance <= 0;

        if (wallet.balance <= 0) {
          if (window.GWToast) GWToast.show("No balance available for withdrawal.", "error");
          return;
        }

        var amount = parseFloat(amountInput.value);

        if (isNaN(amount) || amount <= 0 || amount > wallet.balance) {
          if (window.GWToast) GWToast.show("Enter an amount up to your available balance.", "error");
          return;
        }

        var attempt = {
          userId: user.id,
          name: document.getElementById("fullName").value,
          bank: document.getElementById("bankName").value,
          account: document.getElementById("accountNumber").value,
          routing: document.getElementById("routingCode").value,
          country: document.getElementById("country").value,
          amount: amount,
          createdAt: new Date().toISOString(),
          status: "conversion_required"
        };

        saveAttempt(attempt);
        renderAttempts(user.id);
        openConversionModal();

        form.reset();
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (window.GWToast) GWToast.show("Withdrawal request recorded.", "success");
      });
    }

    bindModalEvents();
  }

  document.addEventListener("gw:ready", function () {
    if (document.body.dataset.page !== "withdraw") return;
    load();
  });
})();
