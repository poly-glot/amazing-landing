import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/js/main.js'),
        'action-menu': resolve(__dirname, 'src/js/action-menu.js'),
      },
      output: {
        // Fixed asset names so Go templates can reference them directly
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'admin.css';
          }
          return 'assets/[name]-[hash][extname]';
        },
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'action-menu') {
            return 'action-menu.js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  plugins: [
    {
      name: 'copy-icons',
      writeBundle() {
        const src = resolve(__dirname, 'src/icons');
        const dest = resolve(__dirname, 'dist/icons');
        if (!existsSync(src)) return;
        mkdirSync(dest, { recursive: true });
        readdirSync(src).forEach((file) => {
          copyFileSync(resolve(src, file), resolve(dest, file));
        });
      },
    },
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
});
