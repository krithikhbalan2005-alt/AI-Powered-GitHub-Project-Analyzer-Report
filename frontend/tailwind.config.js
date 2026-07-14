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
        background: "#050608", // Matte Obsidian Black
        surface: "#0c0d12",    // Premium Dark Titanium Card
        primary: "#e2b857",    // Champagne Gold
        secondary: "#10b981",  // Emerald Green
        accent: "#f59e0b",     // Amber Bronze
        text: "#fcfdfd",       // Pristine white
        muted: "#8e939e",      // Cool metallic gray
        border: "#171a22",     // Polished slate border
        
        // Override default colors so existing classes render with the new premium palette
        indigo: {
          50: '#fffdf5',
          100: '#fef7da',
          200: '#fde9ad',
          300: '#fbdb7b',
          400: '#f9ca4d',
          500: '#e2b857', // Primary Brand Gold
          600: '#c59d43', // Dark Gold
          700: '#a37e31',
          800: '#826122',
          900: '#614716',
          950: '#382806',
        },
        violet: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Emerald
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        purple: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Emerald
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        blue: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Amber Bronze
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        }
      },
    },
  },
  plugins: [],
};
