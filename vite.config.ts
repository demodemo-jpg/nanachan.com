
import { defineConfig } from 'vite';

export default defineConfig({
  // Vercelデプロイ時のルートパス設定
  base: '/',
  define: {
    // クライアントサイドでprocess.env.API_KEYを使用可能にする
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  server: {
    port: 3000,
    host: true
  }
});
