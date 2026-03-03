import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

const lightTheme = {
  // Brand Colors
  "--color-primary": "#2563eb",
  "--color-secondary": "#e11d48",
  "--color-accent": "#8b5cf6",
  
  // Surface Colors
  "--color-surface": "#ffffff",
  "--color-surface-elevated": "#ffffff",
  "--color-surface-subtle": "#f9fafb",
  "--color-surface-hover": "#f3f4f6",
  
  // Background Colors
  "--color-background": "#f9fafb",
  "--color-background-subtle": "#f3f4f6",
  
  // Text Colors
  "--color-text-primary": "#111827",
  "--color-text-secondary": "#4b5563",
  "--color-text-tertiary": "#9ca3af",
  "--color-text-inverse": "#ffffff",
  
  // Border Colors
  "--color-border": "#e5e7eb",
  "--color-border-hover": "#d1d5db",
  "--color-border-subtle": "#f3f4f6",
  
  // Semantic Colors
  "--color-success": "#22c55e",
  "--color-warning": "#f59e0b",
  "--color-error": "#ef4444",
  "--color-info": "#0ea5e9",
  
  // Status Colors
  "--color-status-active": "#22c55e",
  "--color-status-pending": "#f59e0b",
  "--color-status-completed": "#3b82f6",
  "--color-status-cancelled": "#ef4444",
  "--color-status-onhold": "#6b7280",
  "--color-status-suspended": "#f97316",
  
  // Priority Colors
  "--color-priority-urgent": "#ef4444",
  "--color-priority-high": "#f97316",
  "--color-priority-medium": "#f59e0b",
  "--color-priority-low": "#22c55e",
  "--color-priority-normal": "#6b7280",
  
  // Gray Scale
  "--color-gray-50": "#f9fafb",
  "--color-gray-100": "#f3f4f6",
  "--color-gray-200": "#e5e7eb",
  "--color-gray-300": "#d1d5db",
  "--color-gray-400": "#9ca3af",
  "--color-gray-500": "#6b7280",
  "--color-gray-600": "#4b5563",
  "--color-gray-700": "#374151",
  "--color-gray-800": "#1f2937",
  "--color-gray-900": "#111827",
  "--color-gray-950": "#030712",
  
  // Shadows
  "--shadow-color": "0, 0, 0",
};

const darkTheme = {
  // Brand Colors
  "--color-primary": "#3b82f6",
  "--color-secondary": "#f43f5e",
  "--color-accent": "#a78bfa",
  
  // Surface Colors
  "--color-surface": "#1f2937",
  "--color-surface-elevated": "#374151",
  "--color-surface-subtle": "#111827",
  "--color-surface-hover": "#374151",
  
  // Background Colors
  "--color-background": "#111827",
  "--color-background-subtle": "#0f172a",
  
  // Text Colors
  "--color-text-primary": "#f9fafb",
  "--color-text-secondary": "#d1d5db",
  "--color-text-tertiary": "#6b7280",
  "--color-text-inverse": "#111827",
  
  // Border Colors
  "--color-border": "#374151",
  "--color-border-hover": "#4b5563",
  "--color-border-subtle": "#1f2937",
  
  // Semantic Colors
  "--color-success": "#4ade80",
  "--color-warning": "#fbbf24",
  "--color-error": "#f87171",
  "--color-info": "#38bdf8",
  
  // Status Colors
  "--color-status-active": "#4ade80",
  "--color-status-pending": "#fbbf24",
  "--color-status-completed": "#60a5fa",
  "--color-status-cancelled": "#f87171",
  "--color-status-onhold": "#9ca3af",
  "--color-status-suspended": "#fb923c",
  
  // Priority Colors
  "--color-priority-urgent": "#f87171",
  "--color-priority-high": "#fb923c",
  "--color-priority-medium": "#fbbf24",
  "--color-priority-low": "#4ade80",
  "--color-priority-normal": "#9ca3af",
  
  // Gray Scale
  "--color-gray-50": "#f9fafb",
  "--color-gray-100": "#f3f4f6",
  "--color-gray-200": "#e5e7eb",
  "--color-gray-300": "#d1d5db",
  "--color-gray-400": "#9ca3af",
  "--color-gray-500": "#6b7280",
  "--color-gray-600": "#4b5563",
  "--color-gray-700": "#374151",
  "--color-gray-800": "#1f2937",
  "--color-gray-900": "#111827",
  "--color-gray-950": "#030712",
  
  // Shadows
  "--shadow-color": "0, 0, 0",
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      return JSON.parse(saved);
    }
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    return systemPrefersDark;
  });

  useEffect(() => {
    const root = document.documentElement;
    const theme = isDarkMode ? darkTheme : lightTheme;

    if (isDarkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }

    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      const saved = localStorage.getItem("darkMode");
      if (saved === null) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setIsDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
