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
        background: "#090d16", // Deep space navy
        surface: "#0f172a",    // Slate dark card
        primary: "#6366f1",    // Indigo
        secondary: "#a855f7",  // Violet
        accent: "#3b82f6",     // Blue
        text: "#f8fafc",       // Off white
        muted: "#94a3b8",      // Slate gray
        border: "#1e293b",     // Border dark slate
      },
    },
  },
  plugins: [],
};
