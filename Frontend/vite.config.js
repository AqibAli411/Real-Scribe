import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Get environment variable - use process.env for config file
  // import.meta.env is only available in application code, not in config files
  const apiUrl = process.env.VITE_API_URL || "http://localhost:8080";
  
  return {
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
  };
});
