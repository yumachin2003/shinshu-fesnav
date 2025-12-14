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
    const token = localStorage.getItem('authToken'); // Login.jsでの保存キー 'authToken' に合わせる
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

// Review API
export const getReviewsForFestival = (festivalId) => {
  return apiClient.get(`/festivals/${festivalId}/reviews`);
};

export const postReview = async (festivalId, reviewData) => {
  // FestivalDetail.js でレスポンスデータ本体を直接扱えるように、
  // async/await を使って response.data を返す
  const response = await apiClient.post(`/festivals/${festivalId}/reviews`, reviewData);
  return response.data;
};

// Account API
export const getAccountData = () => {
  return apiClient.get('/account/data');
};

export const updateFavorites = (favorites) => {
  return apiClient.post('/account/favorites', { favorites });
};

export async function updateDiaries(diaries) {
  try {
    const res = await apiClient.post("/account/diaries", { diaries });
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 401) {
      alert("ログインしてください");
      window.location.href = "/login";
    }
    throw err;
  }
}

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