import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "SOLAR PRO",
        short_name: "SOLAR PRO",
        description: "Diseña, calcula y gestiona proyectos de energía solar.",
        theme_color: "#071629",
        background_color: "#eef3f9",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        icons: [
  {
    src: "/solar-icon.svg",
    sizes: "any",
    type: "image/svg+xml",
    purpose: "any"
  }
]
      }
    })
  ]
});