import { defineConfig } from 'vite';
import { resolve } from 'path';
import cesium from 'vite-plugin-cesium';

export default defineConfig({
  plugins: [cesium()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    dedupe: ['cesium'],
  },
  server: {
    port: 3001,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      defaultIsModuleExports: true,
    },
  },
  optimizeDeps: {
    include: ['cesium'],
    esbuildOptions: {
      target: 'es2020',
    },
    extensions: ['.js', '.mjs'],
    // Force pre-bundling of CommonJS modules
    force: true,
  },
  define: {
    // Fix for Cesium CommonJS modules
    'process.env': {},
  },
});

