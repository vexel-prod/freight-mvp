import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f1720",
        sand: "#f3efe6",
        copper: "#c66a3d",
        moss: "#305146",
        gold: "#d7a44b",
      },
      fontFamily: {
        display: ["Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Georgia", "serif"],
        body: ["Avenir Next", "Segoe UI", "Helvetica Neue", "sans-serif"],
      },
      boxShadow: {
        panel: "0 20px 80px rgba(13, 18, 23, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
