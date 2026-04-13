const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api', // 第1引数にパスを指定
    createProxyMiddleware({
      target: 'http://127.0.0.1:5052', // デフォルトはローカルのバックエンド
      changeOrigin: true,
      secure: false,
      xfwd: true,
      logLevel: 'debug',
      router: function(req) {
        // 画像アップロード、画像削除、画像ファイルの取得だけを本番サーバーへ振り分ける
        if (
          req.path.match(/^\/api\/festivals\/\d+\/photos/) || // アップロード
          req.path.match(/^\/api\/photos\/\d+/) ||            // 削除
          req.path.match(/^\/api\/uploads\//)                 // 画像の取得
        ) {
          return 'https://shinshu-fesnav.sekilab.org';
        }
        return 'http://127.0.0.1:5052'; // それ以外はローカルへ
      },
      onProxyReq: (proxyReq, req, res) => {
        if (proxyReq.protocol === 'https:') {
          proxyReq.setHeader('X-Forwarded-Proto', 'https');
        }
      },
    })
  );
};