import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import VueDevTools from "vite-plugin-vue-devtools";

// Add cross-platform CLI path for VS Code (or use env override)
const editorCli = process.platform === "win32"
  ? process.env.VSCODE_CLI_PATH ?? "code"
  : "code";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(), 
    tailwindcss(), 
    VueDevTools({
      componentInspector: true,
      launchEditor: editorCli
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
