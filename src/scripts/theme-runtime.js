export const THEME_STORAGE_KEY = "theme";
export const THEME_SWITCH_MIN_INTERVAL = 120;
export const THEME_SET = ["light", "dark"];

export function normalizeTheme(theme) {
  return THEME_SET.includes(theme) ? theme : "light";
}

export function shouldDebounceSwitch(lastSwitchAt, now, minInterval = THEME_SWITCH_MIN_INTERVAL) {
  return now - lastSwitchAt < minInterval;
}

export function getNextTheme(currentTheme) {
  return normalizeTheme(currentTheme) === "dark" ? "light" : "dark";
}

export const themeBootstrapScript = `(function(){
  if (window.__THEME_STORE__) return;
  var THEME_KEY = "theme";
  var THEMES = ["light","dark"];
  var MIN_INTERVAL = 120;
  var root = document.documentElement;
  var listeners = new Set();
  var currentTheme = "light";
  var lastSwitchAt = 0;

  var normalize = function(theme){
    return THEMES.indexOf(theme) >= 0 ? theme : "light";
  };

  var now = function(){
    return (window.performance && typeof window.performance.now === "function")
      ? window.performance.now()
      : Date.now();
  };

  var readStoredTheme = function(){
    try {
      var stored = localStorage.getItem(THEME_KEY);
      if (stored) return normalize(stored);
    } catch (error) {}
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  var notify = function(detail){
    listeners.forEach(function(handler){
      try { handler(detail); } catch (error) {}
    });
    window.dispatchEvent(new CustomEvent("theme:change", { detail: detail }));
  };

  var applyTheme = function(theme, options){
    var opts = options || {};
    var nextTheme = normalize(theme);
    root.setAttribute("data-theme", nextTheme);
    root.classList.toggle("dark", nextTheme === "dark");
    root.style.colorScheme = nextTheme;
    root.dataset.themeReady = "1";
    if (opts.persist !== false) {
      try { localStorage.setItem(THEME_KEY, nextTheme); } catch (error) {}
    }
    currentTheme = nextTheme;
    return nextTheme;
  };

  var setTheme = function(theme, options){
    var opts = options || {};
    var currentNow = now();
    var minInterval = typeof opts.minInterval === "number" ? opts.minInterval : MIN_INTERVAL;
    if (!opts.force && (currentNow - lastSwitchAt) < minInterval) {
      return { changed: false, throttled: true, duration: 0, theme: currentTheme };
    }
    lastSwitchAt = currentNow;
    var previous = currentTheme;
    if (opts.atomic !== false) root.classList.add("theme-switching");
    var start = now();
    var next = applyTheme(theme, { persist: opts.persist !== false });
    var duration = now() - start;
    if (opts.atomic !== false) {
      requestAnimationFrame(function(){ root.classList.remove("theme-switching"); });
    }
    notify({ theme: next, source: opts.source || "runtime", duration: duration, changed: previous !== next });
    return { changed: previous !== next, throttled: false, duration: duration, theme: next };
  };

  var toggleTheme = function(options){
    return setTheme(currentTheme === "dark" ? "light" : "dark", options || {});
  };

  var preloadTheme = function(theme){
    var next = normalize(theme);
    root.setAttribute("data-theme", next);
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
    root.dataset.themeReady = "1";
  };

  var subscribe = function(handler){
    listeners.add(handler);
    return function(){ listeners.delete(handler); };
  };

  window.__THEME_STORE__ = {
    getTheme: function(){ return currentTheme; },
    setTheme: setTheme,
    toggleTheme: toggleTheme,
    preloadTheme: preloadTheme,
    subscribe: subscribe,
    getMetrics: function(){ return { minInterval: MIN_INTERVAL, lastSwitchAt: lastSwitchAt }; },
    benchmarkThemeSwitch: function(iterations){
      var rounds = typeof iterations === "number" && iterations > 0 ? Math.floor(iterations) : 12;
      var initialTheme = currentTheme;
      var totalDuration = 0;
      for (var i = 0; i < rounds; i += 1) {
        var target = currentTheme === "dark" ? "light" : "dark";
        var result = setTheme(target, { force: true, persist: false, atomic: false, source: "benchmark" });
        totalDuration += result.duration;
      }
      setTheme(initialTheme, { force: true, persist: false, atomic: false, source: "benchmark-reset" });
      return {
        rounds: rounds,
        averageDuration: totalDuration / rounds,
        totalDuration: totalDuration
      };
    }
  };

  applyTheme(readStoredTheme(), { persist: false });

  window.addEventListener("storage", function(event){
    if (event.key !== THEME_KEY) return;
    setTheme(event.newValue, { force: true, persist: false, atomic: false, source: "storage" });
  });

  window.addEventListener("pageshow", function(){
    setTheme(readStoredTheme(), { force: true, persist: false, atomic: false, source: "pageshow" });
  });

  document.addEventListener("astro:before-preparation", function(){
    preloadTheme(currentTheme);
  });

  document.addEventListener("astro:before-swap", function(){
    preloadTheme(currentTheme);
  });
})();`;
