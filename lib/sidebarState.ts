"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the admin sidebar is collapsed to its icon rail - kept as a
 * plain module-level variable (not a useState in AdminShell) for the
 * same reason lib/theme.ts keeps theme outside React: PageTransition
 * (components/PageTransition.tsx) keys its wrapper on `pathname`, which
 * remounts everything under it - AdminShell included - on every
 * navigation. A useState there would reset to its initial value on
 * every route change; a plain module variable survives, since the JS
 * module itself isn't what's remounting, only the React tree reading it.
 *
 * Deliberately NOT synced to localStorage (unlike theme) - per feedback,
 * the ask was "stay closed across navigation", not "across a browser
 * reload"; this app otherwise holds no client storage of its own (see
 * lib/theme.ts's own comment on why theme is the one scoped exception),
 * so a real page reload still starts expanded.
 */
let collapsed = false;
const listeners = new Set<() => void>();

function getSnapshot() {
  return collapsed;
}

function getServerSnapshot() {
  return false;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function setCollapsed(next: boolean) {
  collapsed = next;
  listeners.forEach((listener) => listener());
}

export function useSidebarCollapsed() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = () => setCollapsed(!collapsed);
  return [value, toggle] as const;
}
