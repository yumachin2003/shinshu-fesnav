import React, { useState, useEffect } from 'react';
// API通信ロジックを分離したモジュールをインポート
import { getFestivals, createFestival } from './apiService';

const INITIAL_STATE = {
  name: '',
  date: '',
  location: '',
};

function ItemManagementPage() {
  const [festivals, setFestivals] = useState([]);
  const [newFestival, setNewFestival] = useState(INITIAL_STATE);
  // ローディング状態とエラー状態を管理するstateを追加
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFestivals();
  }, []);

  const fetchFestivals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getFestivals();
      setFestivals(response.data);
    } catch (error) {
      console.error("Error fetching festivals:", error);
      setError("お祭りデータの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFestival({ ...newFestival, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newFestival.name.trim() || !newFestival.date.trim() || !newFestival.location.trim()) {
      alert('すべての項目を入力してください。');
      return;
    }
    try {
      await createFestival(newFestival);
      setNewFestival(INITIAL_STATE); // フォームをリセット
      // 成功したらリストを再読み込み
      fetchFestivals();
    } catch (error) {
      console.error("Error adding festival:", error);
      setError("お祭りの追加に失敗しました。");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>お祭り管理</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={newFestival.name}
            onChange={handleInputChange}
            placeholder="お祭り名"
            disabled={loading}
          />
          <input
            type="date"
            name="date"
            value={newFestival.date}
            onChange={handleInputChange}
            placeholder="開催日"
            disabled={loading}
          />
          <input
            type="text"
            name="location"
            value={newFestival.location}
            onChange={handleInputChange}
            placeholder="開催場所"
            disabled={loading} // ローディング中は入力を無効化
          />
          <button type="submit" disabled={loading}>
            {loading ? '処理中...' : 'お祭りを追加'}
          </button>
        </form>

        <h2>登録済みのお祭り</h2>
        {/* エラーメッセージの表示 */}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {/* ローディング表示 */}
        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <table>
            <thead>
              <tr><th>名前</th><th>開催日</th><th>場所</th></tr>
            </thead>
            <tbody>
              {festivals.map((festival) => (
                <tr key={festival.id}>
                  <td>{festival.name}</td>
                  <td>{festival.date}</td>
                  <td>{festival.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ItemManagementPage;
