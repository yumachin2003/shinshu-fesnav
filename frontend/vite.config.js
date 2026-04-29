import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  // SSLプラグインをreact()の前に追加
  plugins: [basicSsl(), react()],
  define: {
    'process.env': {}
  },
  server: {
    open: true,
    port: 3000,
    https: true, // HTTPSを有効化
    // バックエンドへのプロキシ設定（URLは環境に合わせて変更してください）
    proxy: {
      // 画像（uploads）へのアクセスだけ本番サーバーへ向ける
      '/api/uploads': {
        target: 'https://shinshu-fesnav.sekilab.org',
        changeOrigin: true,
        secure: false,
        headers: {
          Host: 'shinshu-fesnav.sekilab.org'
        },
      },
      // それ以外の /api 通信はローカルのバックエンドへ向ける
      '/api': {
        target: 'http://127.0.0.1:5052',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
