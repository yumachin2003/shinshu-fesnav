const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api', // 第1引数にパスを指定
    createProxyMiddleware({
      target: 'http://127.0.0.1:5052',
      changeOrigin: true,
      secure: false,
      xfwd: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        // HTTPSからのリクエストであることを明示
        proxyReq.setHeader('X-Forwarded-Proto', 'https');
      },
    })
  );
};