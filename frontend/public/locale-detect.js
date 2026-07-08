/**
 * Detección de idioma en la primera visita.
 * - Default: español (/)
 * - Si el navegador no está en español → redirige a /en/
 * - Respeta preferencia guardada en localStorage (selector ES|EN)
 */
(function initLocaleDetect() {
  var STORAGE_KEY = "portfolio-locale";
  var CHOSEN_KEY = "portfolio-locale-chosen";

  function isSpanish(lang) {
    return (lang || "").toLowerCase().indexOf("es") === 0;
  }

  function pathLocale() {
    var path = window.location.pathname;
    if (path === "/en" || path.indexOf("/en/") === 0) return "en";
    return "es";
  }

  function localePath(locale, path) {
    if (locale === "en") {
      if (path === "/" || path === "") return "/en/";
      if (path === "/en" || path === "/en/") return "/en/";
      if (path.indexOf("/en/") === 0) return path;
      return "/en" + (path.charAt(0) === "/" ? path : "/" + path);
    }

    if (path === "/en" || path === "/en/") return "/";
    if (path.indexOf("/en/") === 0) {
      var stripped = path.slice(3);
      return stripped || "/";
    }
    return path;
  }

  function readStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_error) {
      /* ignore */
    }
  }

  var currentPath = window.location.pathname;
  var currentLocale = pathLocale();
  var stored = readStorage(STORAGE_KEY);
  var userChosen = readStorage(CHOSEN_KEY) === "true";

  if (!userChosen && stored === null) {
    var browserLang =
      navigator.language || (navigator.languages && navigator.languages[0]) || "es";

    if (!isSpanish(browserLang) && currentLocale === "es") {
      writeStorage(STORAGE_KEY, "en");
      var englishTarget = localePath("en", currentPath);
      window.location.replace(englishTarget + window.location.search + window.location.hash);
      return;
    }
  }

  if (userChosen && stored && (stored === "es" || stored === "en") && stored !== currentLocale) {
    var preferredTarget = localePath(stored, currentPath);
    if (preferredTarget !== currentPath) {
      window.location.replace(preferredTarget + window.location.search + window.location.hash);
      return;
    }
  }

  writeStorage(STORAGE_KEY, currentLocale);
})();
