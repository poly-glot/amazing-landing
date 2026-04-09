import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';

/**
 * Vite dev-server middleware that serves mock JSON for API routes.
 * Only active during `vite dev` (apply: 'serve') — never touches
 * production builds. Replaces the old client-side fetch monkey-patch.
 */
function mockApi() {
  const ROUTES = [
    { match: '/api/v1/survey/stores',      file: 'mock-api/api/v1/survey/stores.json' },
    { match: '/api/v1/survey/promotion',   file: 'mock-api/api/v1/survey/promotion.json' },
    { match: '/api/v1/survey/customer',    file: 'mock-api/api/v1/survey/customer.json' },
    { match: '/api/v1/survey/updatestore', file: 'mock-api/api/v1/survey/updatestore.json' },
    { match: '/api/v1/survey/email',       file: 'mock-api/api/v1/survey/email.json' },
    { match: '/api/v1/survey/products',    file: 'mock-api/api/v1/survey/products.json' },
    { match: '/api/v1/survey/questions',   file: 'mock-api/api/v1/survey/questions.json' },
  ];

  return {
    name: 'mock-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const route = ROUTES.find(r => req.url.startsWith(r.match));
        if (!route) return next();

        const filePath = resolve(__dirname, route.file);
        try {
          const data = readFileSync(filePath, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(data);
        } catch {
          next();
        }
      });
    },
  };
}

/**
 * Minimal Vite plugin: resolves <!--@include: ./path --> directives in HTML.
 * Supports nested includes. Paths are relative to the file containing the directive.
 */
function htmlInclude() {
  const INCLUDE_RE = /<!--\s*@include:\s*(.+?)\s*-->/g;

  function processIncludes(html, baseDir) {
    return html.replace(INCLUDE_RE, (_, filePath) => {
      const abs = resolve(baseDir, filePath.trim());
      const content = readFileSync(abs, 'utf-8');
      return processIncludes(content, resolve(abs, '..'));
    });
  }

  return {
    name: 'html-include',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const dir = resolve(ctx.filename, '..');
        return processIncludes(html, dir);
      },
    },
  };
}

export default defineConfig({
  root: '.',
  publicDir: false,
  plugins: [htmlInclude(), mockApi()],
  server: {
    port: 3000,
    open: '/2026/desktop/index.html',
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        '2026-desktop': resolve(__dirname, '2026/desktop/index.html'),
        '2026-mobile': resolve(__dirname, '2026/mobile/index.html'),
        '2015-desktop': resolve(__dirname, '2015/desktop/index.html'),
        '2015-mobile': resolve(__dirname, '2015/mobile/index.html'),
      },
    },
  },
});
