import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "neon-cyan": "#00E5FF",
        "deep-purple": "#7C3AED",
        "neon-cyan-dim": "#00B8CC",
        "deep-purple-dim": "#5B21B6",
        "surface-0": "#08090D",
        "surface-1": "#0F1117",
        "surface-2": "#161820",
        "surface-3": "#1E2030",
        "glass-border": "rgba(255, 255, 255, 0.08)",
        "glass-bg": "rgba(255, 255, 255, 0.04)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["SF Mono", "Fira Code", "Fira Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-gradient":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124, 58, 237, 0.3) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(0, 229, 255, 0.15) 0%, transparent 60%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        "cyan-glow":
          "radial-gradient(ellipse at center, rgba(0, 229, 255, 0.2) 0%, transparent 70%)",
        "purple-glow":
          "radial-gradient(ellipse at center, rgba(124, 58, 237, 0.2) 0%, transparent 70%)",
        "neon-border-gradient":
          "linear-gradient(135deg, #00E5FF 0%, #7C3AED 100%)",
      },
      boxShadow: {
        "glass-sm":
          "0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        glass:
          "0 4px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        "glass-lg":
          "0 8px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.10)",
        "neon-cyan":
          "0 0 12px rgba(0, 229, 255, 0.5), 0 0 40px rgba(0, 229, 255, 0.2)",
        "neon-cyan-sm":
          "0 0 6px rgba(0, 229, 255, 0.4), 0 0 20px rgba(0, 229, 255, 0.15)",
        "neon-purple":
          "0 0 12px rgba(124, 58, 237, 0.5), 0 0 40px rgba(124, 58, 237, 0.2)",
        "neon-purple-sm":
          "0 0 6px rgba(124, 58, 237, 0.4), 0 0 20px rgba(124, 58, 237, 0.15)",
        "elevation-1": "0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.6)",
        "elevation-2":
          "0 4px 6px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.5)",
        "elevation-3":
          "0 10px 20px rgba(0,0,0,0.4), 0 6px 6px rgba(0,0,0,0.5)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      backdropBlur: {
        xs: "2px",
        "2xl": "40px",
        "3xl": "60px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-scale": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-glow-cyan": {
          "0%, 100%": {
            boxShadow:
              "0 0 8px rgba(0, 229, 255, 0.4), 0 0 24px rgba(0, 229, 255, 0.15)",
          },
          "50%": {
            boxShadow:
              "0 0 16px rgba(0, 229, 255, 0.7), 0 0 48px rgba(0, 229, 255, 0.3)",
          },
        },
        "pulse-glow-purple": {
          "0%, 100%": {
            boxShadow:
              "0 0 8px rgba(124, 58, 237, 0.4), 0 0 24px rgba(124, 58, 237, 0.15)",
          },
          "50%": {
            boxShadow:
              "0 0 16px rgba(124, 58, 237, 0.7), 0 0 48px rgba(124, 58, 237, 0.3)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "border-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "scanner-line": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "dot-bounce": {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out forwards",
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
        "fade-in-scale": "fade-in-scale 0.3s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        "slide-in-left": "slide-in-left 0.3s ease-out forwards",
        "pulse-glow-cyan": "pulse-glow-cyan 2s ease-in-out infinite",
        "pulse-glow-purple": "pulse-glow-purple 2s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        float: "float 4s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        "border-spin": "border-spin 3s linear infinite",
        "scanner-line": "scanner-line 3s ease-in-out infinite",
        "count-up": "count-up 0.5s ease-out forwards",
        "dot-bounce": "dot-bounce 1.2s ease-in-out infinite",
        "gradient-shift": "gradient-shift 6s ease infinite",
      },
      transitionTimingFunction: {
        "ios-spring": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "ios-ease": "cubic-bezier(0.4, 0.0, 0.2, 1)",
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
    },
  },
  plugins: [],
};

export default config;
