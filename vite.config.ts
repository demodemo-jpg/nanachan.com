
import { defineConfig } from 'vite';

export default defineConfig({
  // Vercelデプロイ時のルートパス設定
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // manifest.jsonやsw.jsをルートに維持するための設定
    rollupOptions: {
      input: {
        main: './index.html',
      }
    }
  },
  server: {
    port: 3000
  }
});
