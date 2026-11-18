/**
 * Carbon's theme colours: each swaps the primary action colour (buttons,
 * focus ring, checked controls) and the `--theme` accent (progress bars).
 * The default, Team-Ops, keeps black buttons with an emerald accent. Stored per browser; applied before first
 * paint by THEME_COLOR_SCRIPT so there is no flash.
 */
export const THEME_COLORS = [
  { value: "zinc", label: "Team-Ops", swatch: { light: "hsl(160 84% 39%)", dark: "hsl(158 64% 52%)" } },
  { value: "neutral", label: "Brutal", swatch: { light: "hsl(0 0% 45.1%)", dark: "hsl(0 0% 32.2%)" } },
  { value: "red", label: "Cherry", swatch: { light: "hsl(0 72.2% 50.6%)", dark: "hsl(0 72.2% 50.6%)" } },
  { value: "orange", label: "Apricot", swatch: { light: "hsl(17 96% 57%)", dark: "hsl(17 96% 57%)" } },
  { value: "yellow", label: "Lemon", swatch: { light: "hsl(47.9 95.8% 53.1%)", dark: "hsl(61 100% 50%)" } },
  { value: "green", label: "Mint", swatch: { light: "hsl(171 62% 41%)", dark: "hsl(171 98% 59%)" } },
  { value: "blue", label: "Blueberry", swatch: { light: "hsl(237 57% 30%)", dark: "hsl(216 98% 52%)" } },
  { value: "violet", label: "Lavender", swatch: { light: "hsl(238 57% 50%)", dark: "hsl(253.4 70% 40.4%)" } },
] as const;

export type ThemeColor = (typeof THEME_COLORS)[number]["value"];

export const THEME_COLOR_KEY = "team-ops-theme-color";
export const DEFAULT_THEME_COLOR: ThemeColor = "zinc";

export function isThemeColor(value: unknown): value is ThemeColor {
  return THEME_COLORS.some((t) => t.value === value);
}

export function applyThemeColor(color: ThemeColor) {
  const root = document.documentElement;
  if (color === DEFAULT_THEME_COLOR) root.removeAttribute("data-theme-color");
  else root.setAttribute("data-theme-color", color);
}

/** Inline, runs before React: sets data-theme-color from localStorage. */
export const THEME_COLOR_SCRIPT = `try{var c=localStorage.getItem("${THEME_COLOR_KEY}");if(c&&c!=="${DEFAULT_THEME_COLOR}")document.documentElement.setAttribute("data-theme-color",c)}catch(e){}`;
