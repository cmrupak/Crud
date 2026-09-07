import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, '../..');

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Monorepo + React Native workspaces can otherwise pull two React copies
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(dirname, 'src'),
      '@nexora/shared': path.resolve(dirname, '../../packages/shared/src/index.ts'),
      react: path.resolve(repoRoot, 'node_modules/react'),
      'react-dom': path.resolve(repoRoot, 'node_modules/react-dom'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    port: 5173,
  },
});
