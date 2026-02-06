const qrcode = require('qrcode-terminal');
const { networkInterfaces } = require('os');

// ローカルIPアドレスを取得する関数
function getLocalIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // IPv4 で内部接続用(127.0.0.1)ではないものを探す
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const ip = getLocalIp();
const port = 3000; // フロントエンドのポート番号
const url = `https://${ip}:${port}`;

console.log('\nスマホ実機確認用QRコード:');
console.log(`URL: ${url}`);
qrcode.generate(url, { small: true });