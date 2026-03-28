/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        md: {
          primary: "var(--md-primary)",
          "on-primary": "var(--md-on-primary)",
          "primary-container": "var(--md-primary-container)",
          "on-primary-container": "var(--md-on-primary-container)",
          secondary: "var(--md-secondary)",
          "on-secondary": "var(--md-on-secondary)",
          "secondary-container": "var(--md-secondary-container)",
          "on-secondary-container": "var(--md-on-secondary-container)",
          tertiary: "var(--md-tertiary)",
          "on-tertiary": "var(--md-on-tertiary)",
          "tertiary-container": "var(--md-tertiary-container)",
          "on-tertiary-container": "var(--md-on-tertiary-container)",
          error: "var(--md-error)",
          "on-error": "var(--md-on-error)",
          "error-container": "var(--md-error-container)",
          "on-error-container": "var(--md-on-error-container)",
          surface: "var(--md-surface)",
          "surface-dim": "var(--md-surface-dim)",
          "surface-bright": "var(--md-surface-bright)",
          "surface-container-lowest": "var(--md-surface-container-lowest)",
          "surface-container-low": "var(--md-surface-container-low)",
          "surface-container": "var(--md-surface-container)",
          "surface-container-high": "var(--md-surface-container-high)",
          "surface-container-highest": "var(--md-surface-container-highest)",
          "on-surface": "var(--md-on-surface)",
          "on-surface-variant": "var(--md-on-surface-variant)",
          outline: "var(--md-outline)",
          "outline-variant": "var(--md-outline-variant)",
          "inverse-surface": "var(--md-inverse-surface)",
          "inverse-on-surface": "var(--md-inverse-on-surface)",
          "inverse-primary": "var(--md-inverse-primary)",
        },
      },
      boxShadow: {
        "md-card": "0 2px 12px rgba(0, 0, 0, 0.3)",
        "md-direction":
          "0 8px 40px rgba(0, 0, 0, 0.4), 0 0 60px var(--md-glow-primary)",
        "md-glow-primary": "0 0 30px var(--md-glow-primary)",
      },
      transitionTimingFunction: {
        "md-standard": "cubic-bezier(0.2, 0, 0, 1)",
        "md-emphasized": "cubic-bezier(0.05, 0.7, 0.1, 1)",
      },
    },
  },
  plugins: [],
};
