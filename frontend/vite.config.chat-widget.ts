import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/widgets/chat/index.tsx"),
      name: "N8nChatWidget",
      fileName: (format) => `n8n-chat-widget.${format}.js`,
      formats: ["umd", "es"],
    },
    rollupOptions: {
      // Bundle everything for standalone widget
      external: [],
      output: {
        // Global vars for UMD build
        globals: {},
      },
    },
    outDir: "dist/chat",
    emptyOutDir: true,
    sourcemap: true,
    minify: false, // Disable minification for now (terser not installed)
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});