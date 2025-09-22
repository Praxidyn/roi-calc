import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  server: {
    port: 5199,
    host: "localhost",
  },
  plugins: [tailwindcss()],
});
