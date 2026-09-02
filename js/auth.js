/*
 * GWAuth — session handling and login logic against the static users database.
 * Session is stored only in localStorage (gw_session), never on a server.
 */
(function (global) {
  var SESSION_KEY = "gw_session";

  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function setSession(user) {
    var session = {
      userId: user.id,
      name: user.name,
      email: user.email,
      loginAt: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  async function login(email, password) {
    var result = await GWApi.fetchUsers();
    var normalizedEmail = String(email || "").trim().toLowerCase();
    var user = result.users.find(function (u) {
      return String(u.email).toLowerCase() === normalizedEmail && u.password === password;
    });
    if (!user) {
      return { ok: false, message: "Invalid email or password." };
    }
    setSession(user);
    return { ok: true, user: user };
  }

  function logout() {
    clearSession();
    window.location.href = "login.html";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var emailInput = document.getElementById("email");
      var passwordInput = document.getElementById("password");
      var errorEl = document.getElementById("loginError");
      var submitBtn = document.getElementById("loginSubmit");

      errorEl.hidden = true;
      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");

      var result = await login(emailInput.value, passwordInput.value);

      submitBtn.disabled = false;
      submitBtn.classList.remove("is-loading");

      if (!result.ok) {
        errorEl.textContent = result.message;
        errorEl.hidden = false;
        if (window.GWToast) GWToast.show(result.message, "error");
        return;
      }

      if (window.GWToast) GWToast.show("Welcome back, " + result.user.name.split(" ")[0] + ".", "success");
      window.location.href = "dashboard.html";
    });
  });

  global.GWAuth = {
    getSession: getSession,
    setSession: setSession,
    clearSession: clearSession,
    login: login,
    logout: logout
  };
})(window);
