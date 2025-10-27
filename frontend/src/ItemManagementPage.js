import React, { useState, useEffect } from 'react';
// API通信ロジックを分離したモジュールをインポート
import { getItems, createItem } from './apiService';

function ItemManagementPage() {
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState('');
  // ローディング状態とエラー状態を管理するstateを追加
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // コンポーネントの初回レンダリング時にアイテムを取得
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getItems();
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
      setError("アイテムの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) {
      alert('アイテム名を入力してください。');
      return;
    }
    try {
      await createItem({ name: itemName });
      setItemName('');
      // 成功したらリストを再読み込み
      fetchItems();
    } catch (error) {
      console.error("Error adding item:", error);
      setError("アイテムの追加に失敗しました。");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>アイテム管理</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="新しいアイテム名"
            disabled={loading} // ローディング中は入力を無効化
          />
          <button type="submit" disabled={loading}>
            {loading ? '追加中...' : '追加'}
          </button>
        </form>

        <h2>登録済みアイテム</h2>
        {/* エラーメッセージの表示 */}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {/* ローディング表示 */}
        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <ul>
            {items.map((item) => (<li key={item.id}>{item.name}</li>))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ItemManagementPage;
