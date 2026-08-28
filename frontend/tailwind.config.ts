import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#7c3aed",
          indigo: "#6366f1",
          cyan: "#06b6d4",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        grotesk: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundOpacity: {
        "3": "0.03",
      },
    },
  },
  plugins: [],
};

export default config;
