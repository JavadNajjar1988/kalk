import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

// Polyfill Node built-ins for browser deps.
const nodePolyfills = {
  buffer: require.resolve('buffer/'),
  crypto: require.resolve('crypto-browserify'),
  events: require.resolve('events/'),
  process: require.resolve('process/browser'),
  stream: require.resolve('stream-browserify'),
  util: require.resolve('util/'),
  vm: require.resolve('vm-browserify')
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'epsg': resolve(__dirname, './src/epsg/index.js'),
      ...nodePolyfills
    },
    extensions: ['.js', '.json', '.vue']
  },
  define: {
    'process.env': {},
    'global': 'globalThis'
  },
  optimizeDeps: {
    include: [
      'ol', 
      'ramda', 
      '@syncpoint/signal', 
      '@syncpoint/signs',
      'fastpriorityqueue',
      'buffer',
      'events',
      'process'
    ],
    exclude: ['jsts'] // jsts imports are direct paths, not package entry
  },
  build: {
    commonjsOptions: {
      include: [/fastpriorityqueue/, /node_modules/],
      transformMixedEsModules: true
    }
  },
  server: {
    port: 5173,
    open: true
  }
})

