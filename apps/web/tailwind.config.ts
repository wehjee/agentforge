import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-newsreader)", "Georgia", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Sprout Design System: Warm Slate palette
        slate: {
          50: "#F5F0EB",
          100: "#EFEBE9",
          150: "#E8E0D8",
          200: "#E0D6C9",
          300: "#BCAAA4",
          400: "#A1887F",
          500: "#737373",
          600: "#6D4C41",
          700: "#5D4037",
          800: "#4E342E",
          900: "#3E2723",
          950: "#1C2A1F",
        },
        // Sprout Design System: Sage green accent
        sage: {
          50: "#E8F5E9",
          100: "#C8E6CA",
          400: "#4CAF52",
          500: "#34D25C",
          600: "#2E7D33",
        },
        // Sprout Design System: Gold
        gold: {
          100: "#FDF8E8",
          400: "#D4AD2E",
          500: "#B8941F",
        },
        // Sprout Design System: Red (error)
        "sprout-red": {
          100: "#FFEBEE",
          500: "#AA0008",
        },
        warmWhite: "#FAF6F2",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(62,39,35,0.04)",
        "card-hover":
          "0 2px 8px rgba(62,39,35,0.06), 0 1px 2px rgba(62,39,35,0.04)",
        "warm-sm": "0 1px 2px rgba(62,39,35,0.04)",
        "warm-md":
          "0 2px 8px rgba(62,39,35,0.06), 0 1px 2px rgba(62,39,35,0.04)",
        "warm-lg":
          "0 8px 24px rgba(62,39,35,0.08), 0 2px 8px rgba(62,39,35,0.04)",
        "warm-xl":
          "0 16px 48px rgba(62,39,35,0.1), 0 4px 12px rgba(62,39,35,0.05)",
        "sage-ring": "0 0 0 3px rgba(46,125,51,0.12)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
        fast: "150ms",
        normal: "250ms",
        slow: "400ms",
      },
      transitionTimingFunction: {
        "sprout-out": "cubic-bezier(0.16, 1, 0.3, 1)",
        "sprout-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        messageIn: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        modalSlideUp: {
          from: {
            opacity: "0",
            transform: "scale(0.97) translateY(20px)",
          },
          to: {
            opacity: "1",
            transform: "scale(1) translateY(0)",
          },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        messageIn: "messageIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        slideUp: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        modalSlideUp: "modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [tailwindAnimate],
};

export default config;
