"use client";

import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

// Own namespaced key, separate from the main site's "aurex-theme" - a
// different key isn't strictly required (this app runs on its own
// origin, so its localStorage is already isolated from the main site's),
// but keeps each app's stored preference clearly labeled if anyone ever
// inspects storage across both.
const STORAGE_KEY = "aurex-admin-theme";

/**
 * Imported from the main AUREX site's lib/theme.ts, adopted here as an
 * explicit, scoped exception to this app's own "no localStorage" rule -
 * a persistent light/dark preference genuinely needs to live outside
 * React state to survive a reload and to avoid a flash of the wrong
 * theme before first paint (see THEME_INIT_SCRIPT below and its use in
 * app/layout.tsx). Every other admin page still holds no client storage
 * of its own.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"){document.documentElement.setAttribute("data-theme","light");}}catch(e){}})();`;

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

// Always "dark" for the server (and the client's very first render,
// before it can subscribe) - matching the server-rendered markup, since
// the server has no access to localStorage. The head script above
// corrects the real DOM attribute before paint; this hook then picks
// that up on the client's first subscription tick.
function getServerSnapshot(): Theme {
  return "dark";
}

function subscribe(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/**
 * Reads/writes the current theme via a `data-theme` attribute on <html>,
 * same useSyncExternalStore-backed approach as the main site: the theme
 * lives outside React (mutated by the head script and by this hook's own
 * setTheme), so every component calling this hook stays in sync via one
 * shared MutationObserver subscription, no context provider needed.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = (next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage can throw in private-browsing/blocked-storage contexts;
      // the theme still applies for this page load, it just won't persist.
    }
  };

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return { theme, setTheme, toggleTheme };
}
