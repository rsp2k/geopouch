module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script'
  },
  rules: {
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'warn',
    'no-var': 'warn'
  },
  overrides: [
    {
      files: ['*.config.js', 'vite.config.js', 'vitest.config.js', 'playwright.config.js'],
      parserOptions: {
        sourceType: 'module'
      },
      rules: {
        'no-console': 'off'
      }
    },
    {
      files: ['test/**/*', '*.test.js', '*test*.js', 'performance-*.js'],
      env: {
        mocha: true
      },
      globals: {
        emit: 'readonly'
      },
      rules: {
        'no-console': 'off',
        'no-undef': 'off',
        'prefer-const': 'off',
        'no-var': 'off'
      }
    },
    {
      files: ['test/test.js'],
      rules: {
        'no-unused-vars': 'off',
        'prefer-const': 'off',
        'no-var': 'off'
      }
    }
  ]
}