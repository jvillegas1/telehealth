import type { Config } from "tailwindcss";
import uiPreset from "@telehealth/ui/tailwind.preset";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [uiPreset],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;