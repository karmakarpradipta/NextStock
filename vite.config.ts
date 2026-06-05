import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiPort = env.VITE_API_PORT || '3000';
  const apiUrl = env.VITE_API_URL;

  let target = `http://localhost:${apiPort}`;

  if (apiUrl && apiUrl !== '/' && !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1')) {
    target = apiUrl.startsWith('http') ? apiUrl : `https://${apiUrl}`;
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
        },
      },
    },
  };
})