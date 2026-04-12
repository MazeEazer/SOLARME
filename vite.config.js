// vite.config.js
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        devOptions: { enabled: true },
        manifest: {
          name: "SÓLAR ME",
          short_name: "SolarMe",
          description: "Трекер настроения, биохаков и аналитики",
          theme_color: "#000000",
          background_color: "#000000",
          display: "standalone",
          scope: "/",
          start_url: "/",
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          ],
        },
      }),
    ],
    server: {
      proxy: {
        "/api/yandex": {
          target: "https://ai.api.cloud.yandex.net", // ✅ Убрали пробелы!
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/yandex/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader(
                "Authorization",
                `Api-Key ${env.VITE_YANDEX_AI_KEY}`, // ✅ Используем VITE_ префикс
              )
              proxyReq.setHeader("Content-Type", "application/json")
            })
          },
        },
      },
    },
  }
})
