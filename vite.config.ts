import { defineConfig } from 'vite';
import { vitePlugin as remix } from '@remix-run/dev';
import path from 'path';

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
      '~': path.resolve(__dirname, 'app'),
    },
  },
  server: { port: 3000 },
});
