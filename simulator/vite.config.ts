import { defineConfig } from 'vite';
import { resolve } from 'path';
import cesium from 'vite-plugin-cesium';

export default defineConfig({
  base: '/simulator/',
  plugins: [cesium()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    dedupe: ['cesium'],
  },
  server: {
    host: true,
    port: 3001,
    strictPort: true,
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
    include: [
      'cesium',
      // jsts deep CJS imports — pre-bundle so Vite can serve them as ESM
      'jsts/org/locationtech/jts/algorithm/Angle.js',
      'jsts/org/locationtech/jts/algorithm/Centroid.js',
      'jsts/org/locationtech/jts/algorithm/MinimumDiameter.js',
      'jsts/org/locationtech/jts/algorithm/ConvexHull.js',
      'jsts/org/locationtech/jts/geom/Coordinate.js',
      'jsts/org/locationtech/jts/geom/Envelope.js',
      'jsts/org/locationtech/jts/geom/Geometry.js',
      'jsts/org/locationtech/jts/geom/GeometryFactory.js',
      'jsts/org/locationtech/jts/geom/LineSegment.js',
      'jsts/org/locationtech/jts/geom/Polygon.js',
      'jsts/org/locationtech/jts/geom/util/AffineTransformation.js',
      'jsts/org/locationtech/jts/linearref/LengthIndexedLine.js',
      'jsts/org/locationtech/jts/operation/buffer/BufferOp.js',
      'jsts/org/locationtech/jts/operation/buffer/BufferParameters.js',
      'jsts/org/locationtech/jts/operation/overlay/OverlayOp.js',
      'jsts/org/locationtech/jts/operation/relate/RelateOp.js',
      'ramda',
    ],
    esbuildOptions: {
      target: 'es2020',
    },
    extensions: ['.js', '.mjs'],
    force: true,
  },
  define: {
    // Fix for Cesium CommonJS modules
    'process.env': {},
  },
});

