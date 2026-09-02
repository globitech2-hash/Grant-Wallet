/*
 * GWApi — fetches the static "database" (data/users.json) with cache-busting,
 * keeps a localStorage fallback cache, and computes wallet figures.
 * The browser never writes back to users.json — it is read-only source of truth.
 */
(function (global) {
  var USERS_URL = "data/users.json";
  var CACHE_KEY = "gw_users_cache";

  function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function getCachedUsers() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.users)) return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  function setCachedUsers(users) {
    var payload = { users: users, cachedAt: new Date().toISOString() };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (err) {
      /* storage may be unavailable — non-fatal */
    }
    return payload;
  }

  async function fetchUsers() {
    try {
      var res = await fetch(USERS_URL + "?ts=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("Network response was not ok (" + res.status + ")");
      var text = await res.text();
      var data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error("users.json is not valid JSON");
      }
      if (!data || !Array.isArray(data.users)) {
        throw new Error("users.json is missing a users array");
      }
      var cached = setCachedUsers(data.users);
      return { users: data.users, source: "network", cachedAt: cached.cachedAt };
    } catch (err) {
      console.warn("GWApi.fetchUsers: falling back to cache —", err.message);
      var fallback = getCachedUsers();
      if (fallback) {
        return { users: fallback.users, source: "cache", cachedAt: fallback.cachedAt };
      }
      return { users: [], source: "none", cachedAt: null };
    }
  }

  function computeWallet(user) {
    var grants = Array.isArray(user.grants) ? user.grants : [];
    var balance = 0;
    var taxWithheld = 0;
    var pendingCount = 0;
    var pendingAmount = 0;

    var processed = grants.map(function (g) {
      var taxRate = typeof g.tax_rate === "number" ? g.tax_rate : 0;
      var amount = typeof g.approved_amount === "number" ? g.approved_amount : 0;
      var taxDeducted = round2(amount * taxRate);
      var netAmount = round2(amount - taxDeducted);

      if (g.approved) {
        balance = round2(balance + netAmount);
        taxWithheld = round2(taxWithheld + taxDeducted);
      } else {
        pendingCount += 1;
        pendingAmount = round2(pendingAmount + amount);
      }

      var copy = {};
      for (var key in g) {
        if (Object.prototype.hasOwnProperty.call(g, key)) copy[key] = g[key];
      }
      copy.tax_deducted = taxDeducted;
      copy.net_amount = netAmount;
      return copy;
    });

    return {
      grants: processed,
      balance: balance,
      taxWithheld: taxWithheld,
      pendingCount: pendingCount,
      pendingAmount: pendingAmount
    };
  }

  global.GWApi = {
    fetchUsers: fetchUsers,
    getCachedUsers: getCachedUsers,
    computeWallet: computeWallet,
    round2: round2
  };
})(window);
