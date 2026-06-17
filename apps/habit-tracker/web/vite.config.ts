import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:5087",
      "/auth": "http://127.0.0.1:5087",
      "/signin-google": "http://127.0.0.1:5087",
    },
  },
});
