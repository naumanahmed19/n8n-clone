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
      entry: resolve(__dirname, "src/widgets/form/index.tsx"),
      name: "N8nFormWidget",
      fileName: (format) => `n8n-form-widget.${format}.js`,
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
    outDir: "widgets/form/dist",
    emptyOutDir: true,
    sourcemap: true,
    minify: false, // Disable minification for now (terser not installed)
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
