/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: {
          DEFAULT: "#1e1e2e",
          border: "#313244",
          muted: "#181825",
          accent: "#89b4fa",
        },
      },
    },
  },
  plugins: [],
};
