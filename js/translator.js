/*
 * GWTranslator — EN/ES toggle applied to elements with data-i18n /
 * data-i18n-placeholder, skipping anything marked data-no-translate="true".
 * Never translates numbers or currency values.
 */
(function (global) {
  var LANG_KEY = "gw_lang";

  function getLang() {
    return localStorage.getItem(LANG_KEY) || "en";
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    apply();
    updateToggleLabel();
  }

  function t(key) {
    var lang = getLang();
    var dict = (window.GW_TRANSLATIONS && window.GW_TRANSLATIONS[lang]) || {};
    var enDict = (window.GW_TRANSLATIONS && window.GW_TRANSLATIONS.en) || {};
    return dict[key] || enDict[key] || key;
  }

  function apply() {
    document.documentElement.setAttribute("lang", getLang());

    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      if (node.getAttribute("data-no-translate") === "true") return;
      var key = node.getAttribute("data-i18n");
      node.textContent = t(key);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) {
      var key = node.getAttribute("data-i18n-placeholder");
      node.setAttribute("placeholder", t(key));
    });
  }

  function updateToggleLabel() {
    var label = document.getElementById("langToggleLabel");
    if (label) label.textContent = getLang() === "en" ? "EN" : "ES";
  }

  function init() {
    apply();
    updateToggleLabel();

    document.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("#langToggle") : null;
      if (!btn) return;
      var next = getLang() === "en" ? "es" : "en";
      setLang(next);
    });
  }

  global.GWTranslator = { init: init, apply: apply, t: t, getLang: getLang, setLang: setLang };
})(window);
