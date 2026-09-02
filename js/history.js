/*
 * History page logic — filters (all/approved/not approved), search, and
 * desktop table / mobile card rendering of grants.
 */
(function () {
  var allGrants = [];
  var currentFilter = "all";
  var currentSearch = "";

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

  function statusBadge(approved) {
    var label = window.GWTranslator ? GWTranslator.t(approved ? "status.approved" : "status.notApproved") : approved ? "Approved" : "Not approved";
    return approved
      ? '<span class="badge badge-success"><img src="assets/icons/check.svg" class="icon icon-xs" alt="">' + label + "</span>"
      : '<span class="badge badge-warning"><img src="assets/icons/clock.svg" class="icon icon-xs" alt="">' + label + "</span>";
  }

  function render() {
    var filtered = allGrants.filter(function (g) {
      if (currentFilter === "approved" && !g.approved) return false;
      if (currentFilter === "not-approved" && g.approved) return false;
      if (currentSearch && g.program.toLowerCase().indexOf(currentSearch.toLowerCase()) === -1) return false;
      return true;
    });

    renderTable(filtered);
    renderCards(filtered);

    var countEl = document.getElementById("resultCount");
    if (countEl) {
      var word = filtered.length === 1
        ? (window.GWTranslator ? GWTranslator.t("history.result") : "result")
        : (window.GWTranslator ? GWTranslator.t("history.results") : "results");
      countEl.textContent = filtered.length + " " + word;
    }
  }

  function renderTable(items) {
    var body = document.getElementById("historyTableBody");
    if (!body) return;

    if (!items.length) {
      body.innerHTML = '<tr><td colspan="5" class="empty-state" data-i18n="history.noResults">No grants match your filters.</td></tr>';
      if (window.GWTranslator) GWTranslator.apply();
      return;
    }

    body.innerHTML = items
      .map(function (g) {
        return (
          "<tr>" +
          '<td data-no-translate="true">' + g.program + "</td>" +
          '<td data-no-translate="true">' + formatDate(g.date) + "</td>" +
          '<td data-no-translate="true">' + formatCurrency(g.approved_amount) + "</td>" +
          '<td data-no-translate="true">' + formatCurrency(g.net_amount) + "</td>" +
          "<td>" + statusBadge(g.approved) + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function renderCards(items) {
    var el = document.getElementById("historyCards");
    if (!el) return;

    if (!items.length) {
      el.innerHTML = "";
      return;
    }

    el.innerHTML = items
      .map(function (g) {
        return (
          '<div class="card history-card">' +
          '<div class="history-card-top"><span class="history-card-title" data-no-translate="true">' + g.program + "</span>" + statusBadge(g.approved) + "</div>" +
          '<div class="history-card-row"><span data-i18n="history.date">Date</span><span data-no-translate="true">' + formatDate(g.date) + "</span></div>" +
          '<div class="history-card-row"><span data-i18n="history.amount">Amount</span><span data-no-translate="true">' + formatCurrency(g.approved_amount) + "</span></div>" +
          '<div class="history-card-row"><span data-i18n="history.net">Net</span><span data-no-translate="true">' + formatCurrency(g.net_amount) + "</span></div>" +
          "</div>"
        );
      })
      .join("");

    if (window.GWTranslator) GWTranslator.apply();
  }

  async function load() {
    var body = document.getElementById("historyTableBody");
    if (body) body.innerHTML = '<tr><td colspan="5"><div class="skeleton-line long"></div></td></tr>';

    var session = GWAuth.getSession();
    if (!session) return;

    var result = await GWApi.fetchUsers();
    var user = result.users.find(function (u) { return u.id === session.userId; });
    if (!user) {
      GWAuth.logout();
      return;
    }

    var wallet = GWApi.computeWallet(user);
    allGrants = wallet.grants.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
    render();
  }

  document.addEventListener("gw:ready", function () {
    if (document.body.dataset.page !== "history") return;
    load();

    document.querySelectorAll(".filter-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll(".filter-tab").forEach(function (t) { t.classList.remove("is-active"); });
        tab.classList.add("is-active");
        currentFilter = tab.dataset.filter;
        render();
      });
    });

    var searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", function (e) {
        currentSearch = e.target.value;
        render();
      });
    }
  });
})();
