import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

import tailwindcss from "@tailwindcss/vite";

const apiUrl = import.meta.env.VITE_API_URL;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/features/TextEditor/"),
    },
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["sockjs-client", "@stomp/stompjs"],
  },
  server: {
    proxy: {
      "/ws": {
        target: apiUrl,
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
