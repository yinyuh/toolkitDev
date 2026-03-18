import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  getNextTheme,
  normalizeTheme,
  shouldDebounceSwitch,
  themeBootstrapScript,
} from "../src/scripts/theme-runtime.js";

test("normalizeTheme returns valid themes only", () => {
  assert.equal(normalizeTheme("light"), "light");
  assert.equal(normalizeTheme("dark"), "dark");
  assert.equal(normalizeTheme("unknown"), "light");
});

test("getNextTheme toggles between light and dark", () => {
  assert.equal(getNextTheme("light"), "dark");
  assert.equal(getNextTheme("dark"), "light");
});

test("shouldDebounceSwitch throttles rapid toggles", () => {
  assert.equal(shouldDebounceSwitch(100, 150, 120), true);
  assert.equal(shouldDebounceSwitch(100, 260, 120), false);
});

test("theme bootstrap initializes and applies atomic update", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
    runScripts: "outside-only",
    url: "https://www.toolkit.ren",
  });
  dom.window.requestAnimationFrame = (callback) => {
    callback();
    return 1;
  };
  dom.window.localStorage.setItem("theme", "dark");
  dom.window.eval(themeBootstrapScript);

  const root = dom.window.document.documentElement;
  const store = dom.window.__THEME_STORE__;
  assert.ok(store);
  assert.equal(root.getAttribute("data-theme"), "dark");
  assert.equal(root.classList.contains("dark"), true);

  const result = store.setTheme("light", {
    source: "user",
    minInterval: 0,
    atomic: true,
  });
  assert.equal(result.throttled, false);
  assert.equal(root.getAttribute("data-theme"), "light");
  assert.equal(root.classList.contains("dark"), false);

  const benchmark = store.benchmarkThemeSwitch(6);
  assert.equal(benchmark.rounds, 6);
  assert.equal(typeof benchmark.averageDuration, "number");
  assert.equal(typeof benchmark.totalDuration, "number");
});
