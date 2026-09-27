import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('../../', import.meta.url)), 'API_');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: { '/api': `http://127.0.0.1:${env.API_PORT ?? 3001}` },
    },
  };
});
