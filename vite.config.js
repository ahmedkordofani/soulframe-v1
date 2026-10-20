import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Same-origin browser calls to /api are forwarded to the local Node process.
    // This is a development proxy, not a deployed production API.
    proxy: {
      "/api": "http://127.0.0.1:8787",
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Vite 8 / Rolldown native splitting. Other chunks are split automatically.
        // Splitting improves caching but does not erase the cost of React itself.
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
});
