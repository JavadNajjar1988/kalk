type ThemeToneConfig = {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  mutedForeground: string;
  border: string;
  card?: string;
  sidebar?: string;
  sidebarForeground?: string;
  heading?: string;
  subheading?: string;
};

const createThemeVars = (config: ThemeToneConfig) => {
  const cardColor = config.card ?? "#ffffff";
  const sidebarColor = config.sidebar ?? config.background;
  const sidebarForeground = config.sidebarForeground ?? config.foreground;
  return {
    "--background": config.background,
    "--color-background": config.background,
    "--foreground": config.foreground,
    "--color-foreground": config.foreground,
    "--card": cardColor,
    "--color-card": cardColor,
    "--card-foreground": config.foreground,
    "--popover": cardColor,
    "--color-popover": cardColor,
    "--popover-foreground": config.foreground,
    "--primary": config.primary,
    "--color-primary": config.primary,
    "--primary-foreground": "#ffffff",
    "--secondary": config.secondary,
    "--color-secondary": config.secondary,
    "--secondary-foreground": "#ffffff",
    "--accent": config.accent,
    "--color-accent": config.accent,
    "--accent-foreground": "#ffffff",
    "--muted": config.muted,
    "--color-muted": config.muted,
    "--muted-foreground": config.mutedForeground,
    "--border": config.border,
    "--color-border": config.border,
    "--input": config.border,
    "--color-input": config.border,
    "--ring": config.secondary,
    "--color-ring": config.secondary,
    "--chart-1": config.primary,
    "--chart-2": config.secondary,
    "--chart-3": config.accent,
    "--chart-4": config.muted,
    "--chart-5": config.foreground,
    "--sidebar": sidebarColor,
    "--color-sidebar": sidebarColor,
    "--sidebar-foreground": sidebarForeground,
    "--color-sidebar-foreground": sidebarForeground,
    "--sidebar-primary": config.primary,
    "--color-sidebar-primary": config.primary,
    "--sidebar-primary-foreground": "#ffffff",
    "--sidebar-accent": config.accent,
    "--color-sidebar-accent": config.accent,
    "--sidebar-accent-foreground": "#ffffff",
    "--sidebar-border": config.border,
    "--color-sidebar-border": config.border,
    "--sidebar-ring": config.secondary,
    "--color-sidebar-ring": config.secondary,
    "--heading": config.heading ?? config.foreground,
    "--subheading": config.subheading ?? config.foreground,
    "--mpanel": cardColor,
    "--color-mpanel": cardColor,
    "--destructive": "#dc2626",
    "--color-destructive": "#dc2626",
    "--destructive-foreground": "#ffffff",
    "--color-destructive-foreground": "#ffffff",
  };
};

export type ThemeKey = "blue" | "green" | "red" | "purple" | "orange";

export type ThemePreset = {
  label: string;
  accent: string;
  preview: string;
  vars: Record<string, string>;
};

export type ThemeOption = {
  key: ThemeKey;
  label: string;
  preview: string;
};

export const themePresets: Record<ThemeKey, ThemePreset> = {
  blue: {
    label: "ORBAT Classic",
    accent: "#8da53a",
    preview: "linear-gradient(135deg, #8da53a 0%, #788d31 100%)",
    vars: createThemeVars({
      background: "#f2f2f2",
      foreground: "#1f2933",
      primary: "#8da53a",
      secondary: "#5f6670",
      accent: "#6f7c33",
      muted: "#ebebeb",
      mutedForeground: "#4d5560",
      border: "#c9ced4",
      card: "#f5f5f5",
      sidebar: "#f0f0f0",
      heading: "#111827",
      subheading: "#1f2937",
    }),
  },
  green: {
    label: "Green",
    accent: "#1b7f5b",
    preview: "linear-gradient(135deg, #1b7f5b 0%, #0f4c3a 100%)",
    vars: createThemeVars({
      background: "#f0f5f3",
      foreground: "#111111",
      primary: "#1c684e",
      secondary: "#2e7d63",
      accent: "#0f4c3a",
      muted: "#d1e0d9",
      mutedForeground: "#355046",
      border: "#c7d6cc",
    }),
  },
  red: {
    label: "Red",
    accent: "#c53030",
    preview: "linear-gradient(135deg, #c53030 0%, #8b0000 100%)",
    vars: createThemeVars({
      background: "#faf0f0",
      foreground: "#111111",
      primary: "#8b0000",
      secondary: "#b71c1c",
      accent: "#590000",
      muted: "#f5e6e6",
      mutedForeground: "#5c2020",
      border: "#e0cccc",
    }),
  },
  purple: {
    label: "Purple",
    accent: "#7c3aed",
    preview: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    vars: createThemeVars({
      background: "#f5f2ff",
      foreground: "#111111",
      primary: "#7c3aed",
      secondary: "#a855f7",
      accent: "#6d28d9",
      muted: "#ede9fe",
      mutedForeground: "#4c1d95",
      border: "#ddd6fe",
      heading: "#2e1065",
      subheading: "#4c1d95",
    }),
  },
  orange: {
    label: "Orange",
    accent: "#f97316",
    preview: "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)",
    vars: createThemeVars({
      background: "#fff7ed",
      foreground: "#111111",
      primary: "#f97316",
      secondary: "#fb923c",
      accent: "#ea580c",
      muted: "#ffe7d3",
      mutedForeground: "#7c2d12",
      border: "#fed7aa",
      heading: "#431407",
      subheading: "#7c2d12",
    }),
  },
};
export const themeOptions: ThemeOption[] = Object.entries(themePresets).map(
  ([key, config]) => ({
    key: key as ThemeKey,
    label: config.label,
    preview: config.preview,
  }),
);

export const DEFAULT_THEME: ThemeKey = "blue";
export const THEME_STORAGE_KEY = "kalk-theme-selection";

const legacyThemeMap: Record<string, ThemeKey> = {
  "military-blue": "blue",
  "field-green": "green",
  "command-red": "red",
};

const resolveThemeKey = (candidate: string | null): ThemeKey | null => {
  if (!candidate) return null;
  const mapped = legacyThemeMap[candidate] ?? candidate;
  return mapped in themePresets ? (mapped as ThemeKey) : null;
};

export const getStoredTheme = (): ThemeKey | null => {
  if (typeof window === "undefined") return null;
  return resolveThemeKey(window.localStorage.getItem(THEME_STORAGE_KEY));
};

export const persistThemeSelection = (theme: ThemeKey) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
};

const hexToRgba = (hex: string, alpha: number) => {
  let normalized = hex.replace("#", "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const bigint = Number.parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const applyThemePreset = (themeKey: ThemeKey) => {
  const preset = themePresets[themeKey];
  if (!preset || typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;
  Object.entries(preset.vars).forEach(([token, value]) => {
    root.style.setProperty(token, value);
    body?.style.setProperty(token, value);
  });
  const card = preset.vars["--color-card"] ?? "#ffffff";
  const muted = preset.vars["--color-muted"] ?? "#f8fafc";
  const border = preset.vars["--color-border"] ?? "#cbd5e1";
  // Keep menu/panel surfaces opaque to avoid glass look in RTL localized UI.
  root.style.setProperty("--surface-glass", card);
  root.style.setProperty("--surface-panel", card);
  root.style.setProperty("--surface-panel-muted", muted);
  root.style.setProperty("--surface-border", border);
  root.style.setProperty("--surface-shadow", "rgba(15, 23, 42, 0.12)");
  root.dataset.kalkTheme = themeKey;
  if (body) body.dataset.kalkTheme = themeKey;
};

export const initializeTheme = (fallback: ThemeKey = DEFAULT_THEME): ThemeKey => {
  const saved = getStoredTheme();
  const nextTheme = saved ?? fallback;
  applyThemePreset(nextTheme);
  return nextTheme;
};

