export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        noir: "#1C1C2E",
        gold: "#C9933A",
        ivory: "#F8F6F1",
        surface: "#FFFFFF",
        edge: "#E2DDD6",
        muted: "#6B6B7B",
        success: "#2D7A4F",
        danger: "#C0392B",
        "success-tint": "#EDF5EF",
        "danger-tint": "#FCEFED",
      },
      fontFamily: { sans: ["Inter", "sans-serif"] },
      fontWeight: { normal: "400", medium: "500" },
      borderWidth: { DEFAULT: "0.5px" },
      borderRadius: { DEFAULT: "6px", xl: "10px" },
      fontSize: {
        xs: "9px",
        sm: "10px",
        base: "11px",
        lg: "13px",
        xl: "18px",
        "2xl": "22px",
      },
    },
  },
  plugins: [],
};
