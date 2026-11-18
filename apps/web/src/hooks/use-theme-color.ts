"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  applyThemeColor,
  DEFAULT_THEME_COLOR,
  isThemeColor,
  THEME_COLOR_KEY,
  type ThemeColor,
} from "@/lib/theme-color";

const listeners = new Set<() => void>();

function read(): ThemeColor {
  try {
    const value = localStorage.getItem(THEME_COLOR_KEY);
    return isThemeColor(value) ? value : DEFAULT_THEME_COLOR;
  } catch {
    return DEFAULT_THEME_COLOR;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The browser's chosen theme colour and a setter that applies and remembers it. */
export function useThemeColor() {
  const color = useSyncExternalStore(subscribe, read, () => DEFAULT_THEME_COLOR);
  const setColor = useCallback((next: ThemeColor) => {
    try {
      localStorage.setItem(THEME_COLOR_KEY, next);
    } catch {
      // Private mode: still apply for this page view.
    }
    applyThemeColor(next);
    listeners.forEach((l) => l());
  }, []);
  return [color, setColor] as const;
}
