import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F5F1EC",
        card: "#FFFFFF",
        dourado: "#C8A46A",
        marrom: "#4D443D",
        cinza: "#E6DDD2",
        texto: "#3F3A35",
        sucesso: "#2E7D32",
        alerta: "#F9A825",
        erro: "#D32F2F",
        border: "#E6DDD2",
        ring: "#C8A46A",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(77, 68, 61, 0.08)",
        softHover: "0 4px 20px rgba(77, 68, 61, 0.12)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
