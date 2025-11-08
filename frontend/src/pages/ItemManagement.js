import React, { useState } from 'react';
// API通信ロジックを分離したモジュールをインポート
import { getFestivals, createFestival } from '../utils/apiService';
import useApiData from '../hooks/useApiData';

const INITIAL_STATE = {
  name: '',
  date: '',
  location: '',
};

function ItemManagement() {
  // useApiDataフックを使ってお祭りデータを取得
  const { data: festivals, loading, error, refetch } = useApiData(getFestivals);
  const [newFestival, setNewFestival] = useState(INITIAL_STATE);
  const [submitError, setSubmitError] = useState(null);

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
      refetch(); // データを再取得
    } catch (error) {
      console.error("Error adding festival:", error);
      setSubmitError("お祭りの追加に失敗しました。");
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
        {/* フォーム送信時のエラーメッセージ */}
        {submitError && <p style={{ color: 'red' }}>{submitError}</p>}
        {/* データ取得時のエラーメッセージ */}
        {error && <p style={{ color: 'red' }}>お祭りデータの読み込みに失敗しました。</p>}
        {/* ローディング表示 */}
        {loading ? (
          <p>読み込み中...</p>
        ) : festivals && (
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

export default ItemManagement;
