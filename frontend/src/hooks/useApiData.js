import { useState, useEffect } from 'react';

/**
 * APIからデータを非同期に取得するためのカスタムフック
 * @param {Function} apiFunc - データを取得するためのAPI関数 (例: getFestivals)
 * @param {Array} deps - useEffectの依存配列 (デフォルトは空配列)
 * @returns {Object} { data, loading, error, refetch }
 */
const useApiData = (apiFunc, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunc();
      setData(response.data);
    } catch (err) {
      console.error("API Error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: fetchData };
};

export default useApiData;