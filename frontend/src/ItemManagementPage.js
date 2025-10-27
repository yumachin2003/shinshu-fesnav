import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ItemManagementPage() {
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState('');

  // コンポーネントの初回レンダリング時にアイテムを取得
  useEffect(() => {
    fetchItems();
  }, []);

  // GETリクエストでアイテム一覧を取得する関数
  const fetchItems = async () => {
    try {
      // package.jsonのproxy設定により、'/api/items'は'http://localhost:5000/api/items'に転送される
      const response = await axios.get('/api/items');
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  // フォームの送信処理
  const handleSubmit = async (e) => {
    e.preventDefault(); // フォームのデフォルトの送信動作をキャンセル
    if (!itemName.trim()) {
      alert('アイテム名を入力してください。');
      return;
    }
    try {
      // POSTリクエストで新しいアイテムをバックエンドに送信
      await axios.post('/api/items', { name: itemName });
      setItemName(''); // 入力フィールドをクリア
      fetchItems(); // アイテム一覧を再取得して表示を更新
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>アイテム管理</h1>
        
        {/* アイテム追加フォーム */}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="新しいアイテム名"
          />
          <button type="submit">追加</button>
        </form>

        {/* アイテム一覧 */}
        <h2>登録済みアイテム</h2>
        <ul>
          {items.map((item) => (<li key={item.id}>{item.name}</li>))}
        </ul>
      </div>
    </div>
  );
}

export default ItemManagementPage;
