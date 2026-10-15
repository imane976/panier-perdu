import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { encre: "#1c1a17", fond: "#fbf7f0", fond2: "#f2ebdd", trait: "#d9cfbc", accent: "#c2410c", accentfonce: "#9a3412" },
      fontFamily: { serif: ['"Iowan Old Style"', "Palatino", "Georgia", "serif"] },
    },
  },
  plugins: [],
} satisfies Config;
