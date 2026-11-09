import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'assets/build',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/admin/main.tsx',
      output: {
        entryFileNames: 'nogna-admin.js',
        assetFileNames: 'nogna-admin.[ext]'
      }
    }
  }
});
