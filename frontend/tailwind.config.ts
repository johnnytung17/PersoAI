import type { Config } from "tailwindcss";

// Token theo phong cách Coursera: xanh #0056D2, chữ #0D0F12, viền #C1CBDB, nền nhạt #F0F6FF, bo góc 8px.
// indigo/violet/cyan được ánh xạ về cùng thang xanh để các màn cũ tự đổi sang một màu thương hiệu.
const blue = {
  50: "#F0F6FF",
  100: "#E3EEFF",
  200: "#C2D9FF",
  300: "#8FB8F5",
  400: "#4D8EF0",
  500: "#0060EB",
  600: "#0056D2",
  700: "#00419E",
  800: "#002E70",
  900: "#001F4D",
};

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Source Sans 3"', '"Source Sans Pro"', '"Be Vietnam Pro"', "Arial", "sans-serif"],
      },
      colors: {
        canvas: "#ffffff",
        muted: "#F5F7FA",
        line: { DEFAULT: "#DAE1ED", strong: "#C1CBDB" },
        ink: {
          900: "#0D0F12",
          700: "#333A47",
          500: "#48546E",
          400: "#636D85",
        },
        indigo: blue,
        violet: blue,
        cyan: blue,
        slate: {
          50: "#F5F7FA",
          100: "#E9EEF7",
          200: "#DAE1ED",
          300: "#C1CBDB",
        },
      },
      borderRadius: {
        xl: "8px",
        "2xl": "8px",
        "3xl": "12px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(13,15,18,0.06)",
        lift: "0 4px 12px rgba(13,15,18,0.12)",
        glow: "none",
      },
      backgroundImage: {
        brand: "linear-gradient(#0056D2, #0056D2)",
        "brand-soft": "linear-gradient(#F0F6FF, #F0F6FF)",
      },
      maxWidth: {
        page: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
