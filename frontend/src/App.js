// 必要なモジュールやコンポーネントのインポート
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Festival from "./pages/Festival";
import Account from "./pages/Account";
import ItemManagement from "./pages/ItemManagement";
import { getAccountData } from "./utils/apiService";
import axios from "axios";

// axiosの設定
axios.defaults.baseURL = "http://localhost:5000";

axios.defaults.headers.common["Authorization"] =
  `Bearer ${localStorage.getItem("Token")}`;

// ユーザー情報共有のためのContext作成
export const UserContext = React.createContext();

const safeParse = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

// アプリケーションのメインコンポーネント
export default function App() {
  // ユーザー情報の状態管理。初期値はlocalStorageから読み込み
  const [user, setUser] = useState(() => safeParse("user"));

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setUser(null);  // ← 未ログイン状態にする
      return;
    }

    getAccountData()
      .then(res => setUser(res.data))
      .catch(() => setUser(null));  // token が無効ならログアウト扱い
    }, []);

  return (
    // UserContext.Providerで、userとsetUserを子コンポーネントに提供
    <UserContext.Provider value={{ user, setUser }}>
      <Router>
        <div className="App">
          <header>
            <h1>信州お祭りナビ</h1>
            {/* ナビゲーションバー */}
            <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc", width: '100%', textAlign: 'center' }}>
              <Link to="/festivals" style={{ marginRight: "1rem" }}>お祭り</Link>
              <Link to="/items" style={{ marginRight: "1rem" }}>アイテム管理</Link> {/* 新しいページへのリンクを追加 */}
              <Link to="/account">アカウント</Link>
            </nav>
          </header>
          {/* ルーティング設定 */}
          <Routes>
            <Route path="/" element={<Festival />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/festivals" element={<Festival />} />
            <Route path="/items" element={<ItemManagement />} /> {/* 新しいページのルートを追加 */}
            <Route path="/account" element={<Account />} />
          </Routes>
        </div>
      </Router>
    </UserContext.Provider>
  );
}
