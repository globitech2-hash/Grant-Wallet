/*
 * GWToast — lightweight, subtle toast notifications.
 */
(function (global) {
  function show(message, type) {
    var root = document.getElementById("toast-root");
    if (!root) return;
    var toast = document.createElement("div");
    toast.className = "toast" + (type ? " toast-" + type : "");
    toast.setAttribute("role", "status");
    toast.textContent = message;
    root.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add("is-visible");
    });
    setTimeout(function () {
      toast.classList.remove("is-visible");
      setTimeout(function () {
        toast.remove();
      }, 200);
    }, 3500);
  }

  global.GWToast = { show: show };
})(window);

/*
 * App bootstrap — route guard + common init, runs on every page.
 */
(function () {
  var PUBLIC_PAGES = ["login.html", "register.html", "index.html"];

  function getCurrentPage() {
    var path = window.location.pathname;
    var page = path.substring(path.lastIndexOf("/") + 1);
    return page || "index.html";
  }

  function isPublic(page) {
    return PUBLIC_PAGES.indexOf(page) !== -1;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var page = getCurrentPage();
    var session = GWAuth.getSession();

    if (!isPublic(page) && !session) {
      window.location.href = "login.html";
      return;
    }

    if (page === "login.html" && session) {
      window.location.href = "dashboard.html";
      return;
    }

    if (typeof GWNavigation !== "undefined") GWNavigation.render();
    if (typeof GWTranslator !== "undefined") GWTranslator.init();

    document.dispatchEvent(new CustomEvent("gw:ready", { detail: { session: session } }));
  });
})();
