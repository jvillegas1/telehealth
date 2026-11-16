import type { Config } from "tailwindcss";

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        calm: {
          50: "#f6f7f4",
          100: "#e8ebe3",
          800: "#3d4438",
          900: "#2a2f27",
        },
      },
    },
  },
};

export default preset;