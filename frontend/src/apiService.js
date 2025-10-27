import axios from 'axios';

// axiosのインスタンスを作成
const apiClient = axios.create({
  // baseURLを設定することで、リクエストのたびにURLの基本部分を記述する必要がなくなります。
  // package.jsonのproxy設定は開発用のため、本番環境も考慮してbaseURLを指定するのが一般的です。
  baseURL: '/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// API関数をエクスポート
export const getItems = () => {
  return apiClient.get('/items');
};

export const createItem = (item) => {
  return apiClient.post('/items', item);
};

// Festival API
export const getFestivals = () => {
  return apiClient.get('/festivals');
};

export const createFestival = (festival) => {
  return apiClient.post('/festivals', festival);
};