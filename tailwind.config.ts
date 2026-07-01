import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        azure: {
          DEFAULT: "#0078D4",
          dark: "#005A9E",
          light: "#50B0F0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
