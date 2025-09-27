import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      exclude: ['test/**/*', 'dev/**/*']
    })
  ],

  build: {
    lib: {
      entry: resolve(__dirname, 'index.js'),
      name: 'geopouch',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        const formatMap = {
          es: 'geopouch.esm.js',
          cjs: 'geopouch.cjs.js',
          umd: 'geopouch.umd.js'
        }
        return formatMap[format]
      }
    },
    rollupOptions: {
      // Externalize peer dependencies
      external: ['pouchdb'],
      output: {
        globals: {
          pouchdb: 'PouchDB'
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    },
    sourcemap: true,
    target: 'es2020'
  },

  // Test configuration
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/**',
        'test/**',
        'dev/**',
        'dist/**',
        '*.config.js'
      ]
    }
  },

  // Development server
  server: {
    port: 3000,
    open: '/dev/index.html'
  }
})