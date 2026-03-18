import { useEffect, useState } from "react";
import { getNextTheme, normalizeTheme } from "../../../scripts/theme-runtime";

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState("light");
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const store = window.__THEME_STORE__;
    if (!store) {
      const fallbackTheme = normalizeTheme(localStorage.getItem("theme"));
      setCurrentTheme(fallbackTheme);
      return;
    }

    setCurrentTheme(store.getTheme());
    const unsubscribe = store.subscribe((detail) => {
      setCurrentTheme(detail.theme);
      if (detail.source === "user") {
        setIsSwitching(false);
      }
    });

    return unsubscribe;
  }, []);

  const toggleTheme = () => {
    if (typeof window === "undefined" || isSwitching) return;
    const store = window.__THEME_STORE__;
    const nextTheme = getNextTheme(currentTheme);
    if (!store) {
      setCurrentTheme(nextTheme);
      document.documentElement.setAttribute("data-theme", nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      localStorage.setItem("theme", nextTheme);
      return;
    }

    setIsSwitching(true);
    const result = store.setTheme(nextTheme, { source: "user", atomic: true });
    if (result.throttled) {
      setIsSwitching(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleTheme}
        disabled={isSwitching}
        className="flex items-center justify-center p-2 rounded-lg text-theme-secondary hover:bg-theme-secondary/50 transition-transform duration-150 will-change-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        aria-label="切换主题"
        title={`切换到${currentTheme === "light" ? "暗黑" : "明亮"}模式`}
      >
        <span className="text-lg theme-toggle-icon">{currentTheme === "light" ? "☀️" : "🌙"}</span>
      </button>
    </div>
  );
}
