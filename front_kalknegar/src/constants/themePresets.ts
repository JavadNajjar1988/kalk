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
    label: "O�O\"UO",
    accent: "#2563eb",
    preview: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    vars: createThemeVars({
      background: "#f0f4f8",
      foreground: "#111111",
      primary: "#1565c0",
      secondary: "#1976d2",
      accent: "#0d47a1",
      muted: "#e1e8ed",
      mutedForeground: "#475569",
      border: "#cbd5e0",
    }),
  },
  green: {
    label: "O3O\"O�",
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
    label: "U,O�U.O�",
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
    label: "O\"U+U?O''",
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
    label: "U+OO�U+O�UO",
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
  const primary = preset.vars["--color-primary"] ?? preset.accent;
  root.style.setProperty("--surface-glass", hexToRgba(primary, 0.12));
  root.style.setProperty("--surface-border", hexToRgba(primary, 0.45));
  root.style.setProperty("--surface-shadow", hexToRgba(primary, 0.25));
  root.dataset.kalkTheme = themeKey;
  if (body) body.dataset.kalkTheme = themeKey;
};

export const initializeTheme = (fallback: ThemeKey = DEFAULT_THEME): ThemeKey => {
  const saved = getStoredTheme();
  const nextTheme = saved ?? fallback;
  applyThemePreset(nextTheme);
  return nextTheme;
};
