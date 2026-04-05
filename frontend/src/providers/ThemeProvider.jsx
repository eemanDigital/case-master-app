import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Always use light mode - dark mode disabled
  const [isDarkMode] = useState(false);

  // Always set light mode
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("light");
    root.classList.remove("dark");
    localStorage.setItem("darkMode", "false");
    updateAntdTheme(false);
  }, []);

  const updateAntdTheme = (dark) => {
    const root = document.documentElement;
    // Always use light mode CSS variables
    root.style.setProperty("--primary-color", "#2563eb");
    root.style.setProperty("--secondary-color", "#dc2626");
    root.style.setProperty("--background-color", "#f9fafb");
    root.style.setProperty("--surface-color", "#ffffff");
    root.style.setProperty("--text-primary", "#111827");
    root.style.setProperty("--text-secondary", "#6b7280");
    root.style.setProperty("--border-color", "#e5e7eb");
  };

  // Provide theme context - toggleTheme and setIsDarkMode are no-ops
  const contextValue = { isDarkMode, toggleTheme: () => {}, setIsDarkMode: () => {} };

  return (
    <ThemeContext.Provider value={contextValue}>
      {typeof children === "function" ? children(contextValue) : children}
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
