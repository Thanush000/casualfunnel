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
        background: "#FFFFFF",
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F9FAFB",
          hover: "#F3F4F6",
        },
        border: {
          DEFAULT: "#E5E7EB",
          subtle: "#F3F4F6",
          active: "#DC2626",
        },
        brand: {
          red: "#DC2626",
          "red-hover": "#B91C1C",
          accent: "#EF4444",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};
