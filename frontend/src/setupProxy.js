const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    createProxyMiddleware({
      target: 'https://127.0.0.1:5052',
      changeOrigin: true,
      secure: false, // 自己署名証明書(adhoc)を許可する場合
      xfwd: true,    // X-Forwarded-Host ヘッダーを有効化
      pathFilter: '/api', // /api で始まるリクエストを対象にし、パスを維持する
    })
  );
};