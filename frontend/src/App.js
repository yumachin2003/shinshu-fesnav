// 必要なモジュールやコンポーネントのインポート
import React, { useState, useEffect } from "react";
import { AppShell, Group, Title, Button } from '@mantine/core';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Festival from "./pages/Festival";
import Account from "./pages/Account";
import FestivalDetail from "./pages/FestivalDetail"; // 詳細ページコンポーネントをインポート
import ItemManagement from "./pages/ItemManagement";
import './App.css'; // アプリケーション全体のスタイルをインポート
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
        <AppShell
          header={{ height: 60 }}
          padding="md"
        >
          <AppShell.Header>
            <Group h="100%" px="md" justify="space-between">
              <Title order={1} size="h3">信州おまつりナビ</Title>
              <Group>
                <Button component={Link} to="/festivals" variant="subtle">お祭り</Button>
                <Button component={Link} to="/items" variant="subtle">アイテム管理</Button>
                <Button component={Link} to="/account" variant="subtle">アカウント</Button>
              </Group>
            </Group>
          </AppShell.Header>

          <AppShell.Main>
            {/* ルーティング設定 */}
            <Routes>
              <Route path="/" element={<Festival />} />
            <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/festivals" element={<Festival />} /> {/* お祭り一覧ページ */}
              <Route path="/festivals/:id" element={<FestivalDetail />} /> {/* お祭り詳細ページ */}
              <Route path="/items" element={<ItemManagement />} /> {/* 新しいページのルートを追加 */}
              <Route path="/account" element={<Account />} />
            </Routes>
          </AppShell.Main>
        </AppShell>
      </Router>
    </UserContext.Provider>
  );
}
