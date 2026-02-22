/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        sans: ["Poppins", "system-ui", "sans-serif"],
      },

      // ============================================
      // BRAND COLORS - Primary Brand Palette
      // ============================================
      colors: {
        // Primary Blue - Main brand color
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
          DEFAULT: "#2563eb",
        },

        // Secondary Rose - Accent color
        secondary: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
          950: "#500724",
          DEFAULT: "#e11d48",
        },

        // Deep Blue - Darker brand variant
        deepBlue: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1c4e80",
          900: "#1e3a8a",
          DEFAULT: "#1c4e80",
        },

        // ============================================
        // SEMANTIC COLORS - Light Mode
        // ============================================
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          DEFAULT: "#22c55e",
        },

        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          DEFAULT: "#f59e0b",
        },

        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          DEFAULT: "#ef4444",
        },

        info: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          DEFAULT: "#0ea5e9",
        },

        // ============================================
        // GRAY SCALE - Enhanced for dark mode
        // ============================================
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712",
        },

        // ============================================
        // STATUS COLORS - For UI states
        // ============================================
        status: {
          active: "#22c55e",
          pending: "#f59e0b",
          completed: "#3b82f6",
          cancelled: "#ef4444",
          onHold: "#6b7280",
          suspended: "#f97316",
        },

        // ============================================
        // PRIORITY COLORS
        // ============================================
        priority: {
          urgent: "#ef4444",
          high: "#f97316",
          medium: "#f59e0b",
          low: "#22c55e",
          normal: "#6b7280",
        },

        // ============================================
        // MATTER TYPE COLORS
        // ============================================
        matter: {
          litigation: "#3b82f6",
          advisory: "#8b5cf6",
          retainer: "#22c55e",
          corporate: "#f59e0b",
          property: "#ef4444",
          general: "#6b7280",
        },

        // ============================================
        // SURFACE COLORS - For cards, backgrounds
        // ============================================
        surface: {
          light: "#ffffff",
          dark: "#111827",
          card: {
            light: "#ffffff",
            dark: "#1f2937",
          },
          overlay: {
            light: "rgba(0, 0, 0, 0.5)",
            dark: "rgba(0, 0, 0, 0.7)",
          },
        },
      },

      // ============================================
      // SPACING
      // ============================================
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
        144: "36rem",
      },

      // ============================================
      // ANIMATIONS
      // ============================================
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "slide-left": "slideLeft 0.3s ease-out",
        "slide-right": "slideRight 0.3s ease-out",
        "pulse-slow": "pulse 3s infinite",
        "bounce-slow": "bounce 2s infinite",
        "spin-slow": "spin 2s linear infinite",
        "shimmer": "shimmer 2s linear infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideLeft: {
          "0%": { transform: "translateX(10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideRight: {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      // ============================================
      // SHADOWS
      // ============================================
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        hard: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "inner-lg": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        glow: "0 0 20px rgba(59, 130, 246, 0.5)",
        "glow-success": "0 0 20px rgba(34, 197, 94, 0.5)",
        "glow-warning": "0 0 20px rgba(245, 158, 11, 0.5)",
        "glow-error": "0 0 20px rgba(239, 68, 68, 0.5)",
      },

      // ============================================
      // BORDER RADIUS
      // ============================================
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "4xl": "2.5rem",
      },

      // ============================================
      // TRANSITIONS
      // ============================================
      transitionDuration: {
        200: "200ms",
        300: "300ms",
        400: "400ms",
        500: "500ms",
        600: "600ms",
        800: "800ms",
      },

      // ============================================
      // Z-INDEX
      // ============================================
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },

      // ============================================
      // CUSTOM BACKGROUNDS FOR DARK MODE CARDS
      // ============================================
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mesh-gradient": "radial-gradient(at 40% 20%, hsla(218,95%,50%,0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.3) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(341,100%,85%,0.3) 0px, transparent 50%)",
      },
    },
  },

  // ============================================
  // PLUGINS
  // ============================================
  plugins: [
    // require("@tailwindcss/forms"),
    // require("@tailwindcss/typography"),
    // require("@tailwindcss/aspect-ratio"),
  ],

  corePlugins: {
    preflight: true,
  },
};
