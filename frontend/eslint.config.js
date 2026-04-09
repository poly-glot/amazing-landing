import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['2026/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Promise: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        AbortController: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        HTMLElement: 'readonly',
        NodeList: 'readonly',
        MutationObserver: 'readonly',
        google: 'readonly',
        FB: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        navigator: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['2015/**', 'dist/**', 'node_modules/**', 'mock-api/**'],
  },
];
