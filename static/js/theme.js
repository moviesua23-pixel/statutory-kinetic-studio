// -*- coding: utf-8 -*-
// static/js/theme.js
// Statutory Kinetic Studio - Design Tokens & Theme System
// Restrained, consistent, broadcast-quality design system (Stripe / Linear / Kurzgesagt inspired).

(function() {
  const THEME = {
    // 1. Stage Dimensions (Strictly locked to 1280x720 16:9 everywhere)
    STAGE_WIDTH: 1280,
    STAGE_HEIGHT: 720,
    SAFE_MARGIN_X: 48,
    SAFE_MARGIN_Y: 32,
    GRID_UNIT: 8,

    // 2. Palette: Slate Neutrals + Semantic Accents
    colors: {
      // Light Mode (Default)
      light: {
        bg: "#F8FAFC",              // Slate-50 clean canvas
        bgCard: "#FFFFFF",          // Pure white surface
        bgMuted: "#F1F5F9",         // Slate-100 container
        bgSubtle: "#E2E8F0",        // Slate-200 subtle fill
        border: "#CBD5E1",          // Slate-300 clean outline
        borderStrong: "#94A3B8",    // Slate-400
        textPrimary: "#0F172A",     // Slate-900 high contrast
        textSecondary: "#475569",   // Slate-600 readable body
        textMuted: "#64748B",       // Slate-500 secondary meta
        headerBg: "#FFFFFF",
        captionBg: "#FFFFFF",
      },
      // Dark Mode Variant
      dark: {
        bg: "#0B0F19",              // Deep slate black
        bgCard: "#131B2E",          // Dark slate card
        bgMuted: "#1E293B",         // Slate-800
        bgSubtle: "#334155",        // Slate-700
        border: "#334155",          // Slate-700 outline
        borderStrong: "#475569",    // Slate-600
        textPrimary: "#F8FAFC",     // Slate-50
        textSecondary: "#CBD5E1",   // Slate-300
        textMuted: "#94A3B8",       // Slate-400
        headerBg: "#131B2E",
        captionBg: "#131B2E",
      },
      // Semantic Accents (Max 2 accent colors per scene)
      accent: {
        indigo: {
          main: "#4F46E5",
          dark: "#312E81",
          light: "#EEF2FF",
          border: "#C7D2FE",
          label: "Parties & Contracts"
        },
        emerald: {
          main: "#059669",
          dark: "#064E3B",
          light: "#ECFDF5",
          border: "#A7F3D0",
          label: "Valid, Compliant & Recovered"
        },
        amber: {
          main: "#D97706",
          dark: "#78350F",
          light: "#FFFBEB",
          border: "#FDE68A",
          label: "Time, Limitation & Currency"
        },
        crimson: {
          main: "#DC2626",
          dark: "#7F1D1D",
          light: "#FEF2F2",
          border: "#FECACA",
          label: "Breach, Penalty & Exclusion"
        }
      }
    },

    // Current Mode ('light' | 'dark')
    mode: "light",

    // 3. One Light Source & Two-Layer Shadow Recipe
    // Top-left light source: dx=0, dy=2 to 8
    shadows: {
      card: [
        { x: 0, y: 1, blur: 3, color: "rgba(15, 23, 42, 0.04)" },  // Ambient
        { x: 0, y: 4, blur: 12, color: "rgba(15, 23, 42, 0.08)" }  // Direct
      ],
      hover: [
        { x: 0, y: 2, blur: 6, color: "rgba(15, 23, 42, 0.06)" },
        { x: 0, y: 8, blur: 20, color: "rgba(15, 23, 42, 0.12)" }
      ],
      modal: [
        { x: 0, y: 4, blur: 16, color: "rgba(15, 23, 42, 0.08)" },
        { x: 0, y: 16, blur: 32, color: "rgba(15, 23, 42, 0.16)" }
      ]
    },

    // 4. One Corner Radius Scale: 4 / 8 / 12px
    radii: {
      sm: 4,    // Small badge, status pill, tag
      md: 8,    // Cards, inputs, buttons, tokens
      lg: 12    // Stage frames, modal dialogs, parchments
    },

    // 5. One Stroke Width: 1.5px
    strokeWidth: 1.5,

    // 6. Typography Scale (11 / 13 / 16 / 22 / 32px)
    typography: {
      caption: "500 11px 'Plus Jakarta Sans', 'Noto Sans Malayalam', sans-serif",
      captionBold: "700 11px 'Plus Jakarta Sans', 'Noto Sans Malayalam', sans-serif",
      body: "500 13px 'Plus Jakarta Sans', 'Noto Sans Malayalam', sans-serif",
      bodyBold: "700 13px 'Plus Jakarta Sans', 'Noto Sans Malayalam', sans-serif",
      title: "600 16px 'Plus Jakarta Sans', 'Noto Sans Malayalam', sans-serif",
      titleBold: "800 16px 'Plus Jakarta Sans', 'Noto Sans Malayalam', sans-serif",
      headline: "700 22px 'Plus Jakarta Sans', 'Noto Sans Malayalam', sans-serif",
      hero: "800 32px 'Plus Jakarta Sans', 'Noto Sans Malayalam', sans-serif",
      monoBadge: "700 11px 'JetBrains Mono', monospace",
      monoStat: "700 16px 'JetBrains Mono', monospace",
      monoHero: "800 28px 'JetBrains Mono', monospace"
    },

    // Get current color palette
    getThemeColors() {
      return this.colors[this.mode];
    },

    // Toggle Dark/Light Mode
    setMode(mode) {
      if (mode === "dark" || mode === "light") {
        this.mode = mode;
      }
    },

    // Check prefers-reduced-motion
    prefersReducedMotion() {
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      }
      return false;
    },

    // Ensure all critical fonts are preloaded before rendering the first frame
    async ensureFontsLoaded() {
      if (typeof document !== "undefined" && document.fonts && document.fonts.load) {
        try {
          await Promise.all([
            document.fonts.load("600 16px 'Plus Jakarta Sans'"),
            document.fonts.load("700 16px 'JetBrains Mono'"),
            document.fonts.load("500 13px 'Noto Sans Malayalam'")
          ]);
          return true;
        } catch (e) {
          console.warn("[THEME] Font load warning, falling back to system fonts:", e);
          return false;
        }
      }
      return true;
    }
  };

  // Expose to window
  window.THEME = THEME;
})();
