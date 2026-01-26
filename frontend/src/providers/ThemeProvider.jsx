import React, { createContext, useContext, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const dispatch = useDispatch();

  // Try to get theme from Redux first, then localStorage, then system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      return JSON.parse(saved);
    }

    // Check system preference
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    return systemPrefersDark;
  });

  // Save to localStorage and update HTML class
  useEffect(() => {
    // Update class on html element
    const root = document.documentElement;

    if (isDarkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }

    // Save to localStorage
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));

    // Update Ant Design theme variables
    updateAntdTheme(isDarkMode);

    // Optional: Dispatch to Redux if you want to store theme in Redux
    // dispatch(setTheme(isDarkMode));
  }, [isDarkMode, dispatch]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const updateAntdTheme = (dark) => {
    // Update CSS variables for custom styling
    const root = document.documentElement;

    if (dark) {
      // Dark mode CSS variables
      root.style.setProperty("--primary-color", "#3b82f6");
      root.style.setProperty("--secondary-color", "#e11d48");
      root.style.setProperty("--background-color", "#111827");
      root.style.setProperty("--surface-color", "#1f2937");
      root.style.setProperty("--text-primary", "#f9fafb");
      root.style.setProperty("--text-secondary", "#d1d5db");
      root.style.setProperty("--border-color", "#374151");
    } else {
      // Light mode CSS variables
      root.style.setProperty("--primary-color", "#2563eb");
      root.style.setProperty("--secondary-color", "#dc2626");
      root.style.setProperty("--background-color", "#f9fafb");
      root.style.setProperty("--surface-color", "#ffffff");
      root.style.setProperty("--text-primary", "#111827");
      root.style.setProperty("--text-secondary", "#6b7280");
      root.style.setProperty("--border-color", "#e5e7eb");
    }
  };

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      // Only update if user hasn't manually set a preference
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

  // Provide theme context as a render prop
  const contextValue = { isDarkMode, toggleTheme, setIsDarkMode };

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
