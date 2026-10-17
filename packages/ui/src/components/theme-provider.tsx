"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function systemTheme(): ResolvedTheme {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStored(key: string, fallback: Theme): Theme {
  try {
    const value = window.localStorage.getItem(key);
    return value === "light" || value === "dark" || value === "system" ? value : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Adds `light` or `dark` to <html>, remembers the choice and follows the OS when set to "system".
 * Preface tokens switch on the `.dark` class.
 */
function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "preface-theme",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = React.useState<Theme>(() =>
    typeof window === "undefined" ? defaultTheme : readStored(storageKey, defaultTheme),
  );
  const [system, setSystem] = React.useState<ResolvedTheme>(systemTheme);
  const resolvedTheme = theme === "system" ? system : theme;

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystem(query.matches ? "dark" : "light");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = React.useCallback(
    (next: Theme) => {
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        // Storage can be unavailable (private mode); the choice still applies for this session.
      }
      setThemeState(next);
    },
    [storageKey],
  );

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return context;
}

/** Like useTheme, but returns null outside a ThemeProvider instead of throwing. */
function useOptionalTheme() {
  return React.useContext(ThemeContext);
}

export { ThemeProvider, useOptionalTheme, useTheme };
