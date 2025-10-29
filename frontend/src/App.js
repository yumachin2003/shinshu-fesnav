// 必要なモジュールやコンポーネントのインポート
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import FestivalPage from "./FestivalPage";
import AccountPage from "./AccountPage";
import ItemManagementPage from "./ItemManagementPage";

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
  const [user, setUser] = useState(() => safeParse("loggedInUser"));

  // userの状態変更時にlocalStorageを更新
  useEffect(() => {
    // ユーザー情報があればlocalStorageに保存
    if (user) localStorage.setItem("loggedInUser", JSON.stringify(user));
    // ユーザー情報がなければlocalStorageから削除
    else localStorage.removeItem("loggedInUser");
  }, [user]);

  return (
    // UserContext.Providerで、userとsetUserを子コンポーネントに提供
    <UserContext.Provider value={{ user, setUser }}>
      <Router>
        {/* ナビゲーションバー */}
        <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
          <Link to="/festivals" style={{ marginRight: "1rem" }}>お祭り</Link>
          <Link to="/items" style={{ marginRight: "1rem" }}>アイテム管理</Link> {/* 新しいページへのリンクを追加 */}
          <Link to="/account">アカウント</Link>
        </nav>
        {/* ルーティング設定 */}
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/festivals" element={<FestivalPage />} />
          <Route path="/items" element={<ItemManagementPage />} /> {/* 新しいページのルートを追加 */}
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </Router>
    </UserContext.Provider>
  );
}
