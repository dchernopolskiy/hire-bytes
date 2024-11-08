import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
    resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '#shared': path.resolve(__dirname, '../shared')
    }
  },
});