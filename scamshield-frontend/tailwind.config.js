/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        navy: "#0F172A",
        scam: "#DC2626",
        safe: "#16A34A",
        suspicious: "#D97706",
        primary: "#3B82F6"
      }
    }
  },
  plugins: []
};
