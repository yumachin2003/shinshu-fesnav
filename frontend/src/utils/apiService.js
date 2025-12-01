import axios from 'axios';

// axiosのインスタンスを作成
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプターを追加
// これにより、このapiClientインスタンスからのすべてのリクエストに自動的に認証トークンが付与されます。
apiClient.interceptors.request.use(
  (config) => {
    // localStorageから認証トークンを取得します。トークンのキー名は実際のキーに合わせてください。
    const token = localStorage.getItem('token');
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
  return apiClient.get('/festivals');
};

export const createFestival = (festival) => {
  // バックエンドが必要とするフィールドのみを抽出して送信する
  const { name, date, location } = festival;
  return apiClient.post('/festivals', { name, date, location });
};

// Account API
export const getAccountData = () => {
  return apiClient.get('/account/data');
};

export const updateFavorites = (favorites) => {
  return apiClient.post('/account/favorites', { favorites });
};

export const updateDiaries = (diaries) => {
  return apiClient.post('/account/diaries', { diaries });
};

// Auth API
export const loginUser = (credentials) => {
  return apiClient.post('/login', credentials);
};

export const registerUser = (userData) => {
  return apiClient.post('/register', userData);
};

// EditLog API
export const getEditLogs = () => {
  return apiClient.get('/editlogs');
};
export const addEditLogToBackend = (logData) => {
  return apiClient.post('/editlogs', logData);
};