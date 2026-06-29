import 'dotenv/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { handleApiRequest } from './src/lib/stamp-handlers';

export default defineConfig(() => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-plugin',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.startsWith('/api')) {
            const handled = await handleApiRequest(req, res);
            if (!handled) next();
          } else {
            next();
          }
        });
      },
    },
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
