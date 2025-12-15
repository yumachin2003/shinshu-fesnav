import { useState, useEffect } from 'react';

/**
 * APIからデータを非同期に取得するカスタムフック
 * skip=true の場合は fetch せずに待機
 */
const useApiData = (apiFunc, deps = [], skip = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (skip) return;
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