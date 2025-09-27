import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['test/**/*.{test,spec}.{js,ts}'],
    exclude: ['test/test-bundle.js', 'test/towns.json'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*', 'index.js', '*.js'],
      exclude: [
        'node_modules/**',
        'test/**',
        'dev/**',
        'dist/**',
        '*.config.js',
        'coverage/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    setupFiles: ['test/setup.js']
  }
})