import axios from 'axios';

// axiosのインスタンスを作成
const apiClient = axios.create({
  // バックエンドサーバーのIPアドレスを直接指定します。
  baseURL: 'http://127.0.0.1:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプターを追加
// これにより、このapiClientインスタンスからのすべてのリクエストに自動的に認証トークンが付与されます。
apiClient.interceptors.request.use(
  (config) => {
    // localStorageから認証トークンを取得します。トークンのキー名は実際のキーに合わせてください。
    const token = localStorage.getItem('authToken');
    // トークンが存在する場合、リクエストヘッダーにAuthorization情報を追加します。
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Festival API
export const getFestivals = () => {
  // baseURLが 'http://localhost:5000/api' なので、ここでは '/festivals' を指定します。
  return apiClient.get('/festivals');
};

export const createFestival = (festival) => {
  // バックエンドが必要とするフィールドのみを抽出して送信する
  const { name, date, location } = festival;
  return apiClient.post('/festivals', { name, date, location });
};

// Auth API
export const loginUser = (credentials) => {
  return apiClient.post('/login', credentials);
};

export const registerUser = (userData) => {
  return apiClient.post('/register', userData);
};