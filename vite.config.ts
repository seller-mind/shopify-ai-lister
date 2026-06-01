import { defineConfig } from 'vite';
import { vitePlugin as remix } from '@remix-run/dev';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    remix({
      ignoredRouteFiles: ['**/.*'],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  server: { port: 3000 },
});
