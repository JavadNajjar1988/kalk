import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import http from 'node:http'

const proxyKeepAliveAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 128,
  maxFreeSockets: 32,
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core dependencies
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@mui/lab', '@mui/x-date-pickers'],
          utils: ['axios', 'date-fns', 'i18next', 'i18next-browser-languagedetector'],
          dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          
          // Redux and state management
          redux: ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
          
          // Map and geospatial libraries
          maps: ['ol', 'milsymbol'],
          
          // Field Constructor system components (split for lazy loading)
          'field-constructor-core': [
            'src/modules/definition-editor/types/fieldConstructor',
            'src/modules/definition-editor/utils/universalFieldAdapter',
            'src/modules/definition-editor/utils/fieldCompatibilityLayer'
          ],
          'field-constructor-components': [
            'src/modules/definition-editor/components/input/ArrayInputComponent',
            'src/modules/definition-editor/components/input/CompositeInputComponent',
            'src/modules/definition-editor/components/input/HierarchicalInputComponent'
          ],
          'field-constructor-enhancement': [
            'src/modules/definition-editor/components/enhancement/ArrayFieldManager',
            'src/modules/definition-editor/components/enhancement/CompositeFieldManager',
            'src/modules/definition-editor/components/enhancement/HierarchicalFieldManager'
          ],
          'field-constructor-migration': [
            'src/modules/definition-editor/components/migration/MigrationWizard',
            'src/modules/definition-editor/utils/templateExporter',
            'src/modules/definition-editor/utils/templateImporter'
          ],
          
          // Performance optimization components
          'field-optimization': [
            'src/modules/definition-editor/components/optimization/VirtualizedFieldList',
            'src/modules/definition-editor/components/optimization/LazyFieldLoader',
            'src/modules/definition-editor/utils/memoizationUtils'
          ]
        },
        // Optimize chunk loading
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name!.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `img/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable compression
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      '@mui/material', 
      '@mui/icons-material',
      'react-window',
      'react-window-infinite-loader'
    ],
    exclude: [
      // Exclude Field Constructor components from pre-bundling for better lazy loading
      'src/modules/definition-editor/components/input/ArrayInputComponent',
      'src/modules/definition-editor/components/input/CompositeInputComponent',
      'src/modules/definition-editor/components/input/HierarchicalInputComponent'
    ]
  },
  server: {
    port: 3000,
    strictPort: true, // در صورت اشغال بودن پورت خطا می‌دهد تا تصادفی تغییر نکند
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
        secure: false,
        agent: proxyKeepAliveAgent,
      },
      '/tiles': {
        target: 'http://127.0.0.1:8480',
        changeOrigin: true,
        secure: false,
        agent: proxyKeepAliveAgent,
        rewrite: (path) => path.replace(/^\/tiles/, ''),
      },
      '/simulator': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
        agent: proxyKeepAliveAgent,
        rewrite: (path) => {
          if (path === '/simulator') {
            return '/simulator/';
          }
          return path.replace(/^\/simulator/, '/simulator');
        },
      },
      '/kalknegar': {
        // کالک‌نگار الان روی پورت 5180 اجرا می‌شود (نه 5173)
        target: 'http://127.0.0.1:5180',
        changeOrigin: true,
        secure: false,
        ws: false,
        agent: proxyKeepAliveAgent,
        rewrite: (path) => {
          if (path === '/kalknegar') {
            return '/kalknegar/';
          }
          return path.replace(/^\/kalknegar/, '/kalknegar');
        },
      },
    },
  },
}) 
