/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172b4d",
        muted: "#718096",
        brand: "#087e8b",
        "brand-dark": "#086a75",
        canvas: "#f4f7fa",
      },
      boxShadow: {
        card: "0 8px 24px rgba(24, 45, 75, 0.06)",
      },
    },
  },
  plugins: [],
};
