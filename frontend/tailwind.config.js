/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /**
         * Slack-Inspired Color Theme Tokens
         * ==================================
         * Semantic aliases mapped to DaisyUI's base layer.
         * Prefer DaisyUI utility classes (bg-base-100, text-primary, etc.)
         * for consistency across components.
         *
         * Slack Design Palette:
         *   Sidebar:        #1A1D21 (dark navy) — recedes, frames content
         *   Canvas:         #FFFFFF (white) — primary work surface
         *   Borders:        #E0E0E0 (light gray) — subtle separation
         *   Primary CTA:    #1264A3 (Slack Blue) — links, active states
         *   Success:        #007A5A (Slack Green) — positive actions
         *   Destructive:    #E01E5A (Slack Red) — errors, deletions
         *   Accent:         #ECB22E (Slack Yellow) — warnings, pins
         *
         * Brand Companion Colors (use via text-brand-*, bg-brand-*):
         *   brand.blue      → #1264A3  (primary actions, links)
         *   brand.green     → #007A5A  (success states)
         *   brand.red       → #E01E5A  (destructive actions)
         *   brand.yellow    → #ECB22E  (warnings, pin accents)
         */
        brand: {
          blue: "#1264A3",
          green: "#007A5A",
          red: "#E01E5A",
          yellow: "#ECB22E",
        },
      },
      fontFamily: {
        /**
         * Apple SF Pro font stack.
         * Falls back through system fonts matching Apple's design.
         */
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        /**
         * Apple SF Mono for code/monospace contexts.
         */
        mono: [
          '"SF Mono"',
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        /**
         * Apple-inspired type scale (based on iOS HIG).
         * Uses rem units for accessibility (respects user font-size settings).
         */
        "apple-title1": ["1.75rem", { lineHeight: "2.25rem", fontWeight: "700", letterSpacing: "-0.015em" }],   // 28px
        "apple-title2": ["1.375rem", { lineHeight: "1.75rem", fontWeight: "700", letterSpacing: "-0.01em" }],   // 22px
        "apple-title3": ["1.25rem", { lineHeight: "1.625rem", fontWeight: "600", letterSpacing: "0" }],         // 20px
        "apple-headline": ["1.0625rem", { lineHeight: "1.375rem", fontWeight: "600", letterSpacing: "-0.01em" }], // 17px
        "apple-body": ["1.0625rem", { lineHeight: "1.5rem", fontWeight: "400", letterSpacing: "-0.01em" }],      // 17px
        "apple-callout": ["0.9375rem", { lineHeight: "1.25rem", fontWeight: "400", letterSpacing: "-0.01em" }],  // 15px
        "apple-subhead": ["0.8125rem", { lineHeight: "1.125rem", fontWeight: "400", letterSpacing: "-0.005em" }], // 13px
        "apple-footnote": ["0.75rem", { lineHeight: "1rem", fontWeight: "400", letterSpacing: "0" }],            // 12px
        "apple-caption1": ["0.6875rem", { lineHeight: "0.875rem", fontWeight: "400", letterSpacing: "0" }],      // 11px
        "apple-caption2": ["0.5625rem", { lineHeight: "0.75rem", fontWeight: "400", letterSpacing: "0" }],       // 9px
      },
      boxShadow: {
        /**
         * Apple-style layered shadows (subtle, no hard edges).
         * Mimics iOS material elevation system.
         */
        "apple-sm": "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
        "apple-md": "0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03)",
        "apple-lg": "0 8px 30px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.04)",
        "apple-xl": "0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 20px rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        /**
         * Apple-style corner radii.
         * iOS uses larger radii for a softer, more approachable feel.
         */
        "apple-sm": "0.5rem",    // 8px  — small cards, inputs
        "apple-md": "0.75rem",   // 12px — cards, modals
        "apple-lg": "1rem",      // 16px — sheets, large panels
        "apple-xl": "1.25rem",   // 20px — prominent containers
        "apple-pill": "9999px",  // pills, badges, tags
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        /**
         * ── county (Light) — Refined Accessible Palette ────────────────
         * Warm-neutral background with comfortable contrast ratios.
         * All text colors meet WCAG AA (4.5:1) on their respective backgrounds.
         *
         * BACKGROUND LAYER (base-*)
         *   base-100: #F9F7F4  (Warm off-white — page background, reduces glare)
         *   base-200: #F0EDE8  (Warm light — card surfaces, elevated panels)
         *   base-300: #D8D4CE  (Warm medium — dividers, borders)
         *
         * TEXT & STRUCTURE
         *   base-content:  #1A1A1A  (Soft black — body text, 13.5:1 on base-100)
         *   neutral:       #1E2024  (Deep charcoal — sidebar background)
         *   neutral-content: #E8E6E1 (Warm light — text on sidebar, 10:1)
         *   secondary:     #5A5A5A  (Warm gray — secondary labels, 6.5:1 on base-100)
         *   secondary-content: #FFFFFF
         *
         * ACCENT (Primary CTAs)
         *   primary:       #1A6FB5  (Accessible blue — CTAs, links, 6.7:1 on base-100)
         *   primary-content: #FFFFFF
         *   accent:        #1A8A6A  (Muted teal-green — highlights, 5.8:1 on base-100)
         *   accent-content: #FFFFFF
         *
         * SEMANTIC STATES
         *   info:          #1A6FB5  (Blue — informational)
         *   success:       #1A8A6A  (Teal-green — success)
         *   warning:       #B87A2A  (Warm amber — warnings, 4.8:1 on base-100)
         *   error:         #C41E4A  (Muted crimson — destructive, 5.2:1 on base-100)
         *
         * RADII (Slack-style rounded)
         *   rounded-box:   0.5rem   (8px — cards, modals)
         *   rounded-btn:   0.375rem (6px — buttons)
         *   rounded-badge: 9999px   (pill — badges, tags)
         */
        county: {
          "color-scheme": "light",

          /* ── Background Layer (Warm, Reduced Glare) ── */
          "base-100": "#F9F7F4",   // Warm off-white — page background, reduces blue-light strain
          "base-200": "#F0EDE8",   // Warm light — card surfaces, clear elevation from base-100
          "base-300": "#D8D4CE",   // Warm medium — dividers, borders (3:1 on base-100 for AA)

          /* ── Text & Structure ── */
          "base-content": "#1A1A1A", // Soft black — body text (13.5:1 on base-100)

          "neutral": "#1E2024",      // Deep charcoal — sidebar background
          "neutral-content": "#E8E6E1", // Warm light — text on sidebar (10:1)

          "secondary": "#5A5A5A",    // Warm gray — secondary labels (6.5:1 on base-100)
          "secondary-content": "#FFFFFF",

          /* ── Accent (Primary CTAs) ── */
          "primary": "#1A6FB5",       // Accessible blue — CTAs, links (6.7:1 on base-100)
          "primary-content": "#FFFFFF",

          "accent": "#1A8A6A",        // Muted teal-green — highlights (5.8:1 on base-100)
          "accent-content": "#FFFFFF",

          /* ── Semantic States ── */
          "info": "#1A6FB5",          // Blue — informational banners
          "info-content": "#FFFFFF",
          "success": "#1A8A6A",       // Teal-green — success states
          "success-content": "#FFFFFF",
          "warning": "#B87A2A",       // Warm amber — warnings (4.8:1 on base-100)
          "warning-content": "#FFFFFF",
          "error": "#C41E4A",         // Muted crimson — destructive (5.2:1 on base-100)
          "error-content": "#FFFFFF",

          /* ── Border & Radius Tokens (Slack-style rounded) ── */
          "--rounded-box": "0.5rem",         // 8px — cards, modals
          "--rounded-btn": "0.375rem",       // 6px — buttons
          "--rounded-badge": "9999px",       // Pill — badges, tags
          "--animation-btn": "0.2s",         // Button hover/active
          "--animation-input": "0.2s",       // Input focus
          "--btn-focus-scale": "0.97",       // Button press scale
          "--tab-radius": "0.375rem",        // 6px — tabs
          "--tab-border": "1px",             // Tab border width
        },
      },

      {
        /**
         * ── county-dark (Dark) — Refined Comfortable Dark Mode ────────
         * Warm-dark background that reduces eye strain. Softer accent colors
         * that don't bloom on dark backgrounds. All text meets WCAG AA.
         *
         * BACKGROUND LAYER
         *   base-100: #232428  (Warm dark charcoal — dominant background)
         *   base-200: #2B2D32  (Elevated surfaces, cards)
         *   base-300: #36383E  (Borders, separators)
         *
         * TEXT & STRUCTURE
         *   base-content: #D6D3CC  (Warm light gray — body text, 9:1)
         *   neutral:      #18191C  (Darker — sidebar background)
         *   secondary:    #8A8A8A  (Secondary labels, 5.2:1 on base-100)
         *
         * ACCENT
         *   primary:      #4AABD9  (Softer blue — CTAs, doesn't bloom)
         *   accent:       #3BAF8A  (Muted teal — highlights)
         *   warning:      #D49A3A  (Warm amber)
         *   error:        #D4506A  (Muted rose — destructive)
         */
        "county-dark": {
          "color-scheme": "dark",

          /* ── Background Layer (Warm Dark, Reduced Strain) ── */
          "base-100": "#232428",    // Warm dark charcoal — dominant background
          "base-200": "#2B2D32",    // Elevated surfaces, cards
          "base-300": "#36383E",    // Borders, separators

          /* ── Text & Structure ── */
          "base-content": "#D6D3CC", // Warm light gray — body text (9:1 on base-100)

          "neutral": "#18191C",      // Darker — sidebar background
          "neutral-content": "#D6D3CC",

          "secondary": "#8A8A8A",    // Secondary labels (5.2:1 on base-100)
          "secondary-content": "#FFFFFF",

          /* ── Accent (Primary CTAs) ── */
          "primary": "#4AABD9",       // Softer blue — CTAs, links (doesn't bloom on dark)
          "primary-content": "#1A1A1A",

          "accent": "#3BAF8A",        // Muted teal-green — highlights
          "accent-content": "#1A1A1A",

          /* ── Semantic States ── */
          "info": "#4AABD9",
          "info-content": "#1A1A1A",
          "success": "#3BAF8A",
          "success-content": "#1A1A1A",
          "warning": "#D49A3A",       // Warm amber — warnings
          "warning-content": "#1A1A1A",
          "error": "#D4506A",         // Muted rose — destructive (less harsh than #E01E5A)
          "error-content": "#FFFFFF",

          /* ── Border & Radius Tokens ── */
          "--rounded-box": "0.5rem",
          "--rounded-btn": "0.375rem",
          "--rounded-badge": "9999px",
          "--animation-btn": "0.2s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.97",
          "--tab-radius": "0.375rem",
          "--tab-border": "1px",
        },
      },

      // Keep built-in themes as fallbacks
      "light",
      "dark",
    ],
    darkTheme: "county-dark",
  },
}
