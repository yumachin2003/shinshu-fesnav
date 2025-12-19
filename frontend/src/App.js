// 必要なモジュールやコンポーネントのインポート
import React, { useState, useEffect } from "react";
import { AppShell, Group, Title, Button, MantineProvider, ActionIcon } from '@mantine/core';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { useLocalStorage } from '@mantine/hooks';
import { IconSun, IconMoonStars } from '@tabler/icons-react';
import Login from "./pages/Login";
import Register from "./pages/Register";
import Festival from "./pages/Festival";
import Account from "./pages/Account";
import FestivalDetail from "./pages/FestivalDetail"; // 詳細ページコンポーネントをインポート
import ItemManagement from "./pages/ItemManagement";
import './App.css'; // アプリケーション全体のスタイルをインポート
import { getAccountData } from "./utils/apiService";
import axios from "axios";
import InformationDashboard from "./pages/InformationDashboard";


// axiosの設定
axios.defaults.baseURL = "http://localhost:5000";

axios.defaults.headers.common["Authorization"] =
  `Bearer ${localStorage.getItem("authToken")}`;

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
  // ダークモードの状態管理。初期値は'light'
  const [colorScheme, setColorScheme] = useLocalStorage({
    key: 'mantine-color-scheme',
    defaultValue: 'light',
    getInitialValueInEffect: true,
  });

  const toggleColorScheme = () => {
    setColorScheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      setUser(null);
      return;
    }

    getAccountData()
      .then(res => {
        setUser(prev => ({
          ...prev,     // ← localStorage の user（display_name 含む）
          ...res.data, // ← API の最新情報
        }));

        // 念のため localStorage も同期
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...safeParse("user"),
            ...res.data,
          })
        );
      })
      .catch(() => setUser(null));
  }, []);

  return (
    <MantineProvider theme={{ colorScheme }} forceColorScheme={colorScheme}>
      {/* UserContext.Providerで、userとsetUserを子コンポーネントに提供 */}
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
                  {user ? (
                    <>
                      <Button component={Link} to="/items" variant="subtle">アイテム管理</Button>
                      {user?.username === "root" && (
                        <Button component={Link} to="/information" variant="subtle">
                          情報提供
                        </Button>
                      )}
                      <Button component={Link} to="/account" variant="subtle">アカウント</Button>
                    </>
                  ) : (
                    <>
                      <Button component={Link} to="/login" variant="subtle">ログイン</Button>
                      <Button component={Link} to="/register" variant="subtle">新規登録</Button>
                    </>
                  )}
                  {/* --- ダークモード切り替えボタン --- */}
                  <ActionIcon
                    onClick={toggleColorScheme}
                    variant="default"
                    size="lg"
                    aria-label="Toggle color scheme"
                  >
                    {colorScheme === 'dark' ? <IconSun stroke={1.5} /> : <IconMoonStars stroke={1.5} />}
                  </ActionIcon>
                </Group>
              </Group>
            </AppShell.Header>

            <AppShell.Main>
              {/* ルーティング設定 */}
              <Routes>
                <Route path="/" element={<Festival />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/festivals" element={<Festival />} />
                <Route path="/festivals/:id" element={<FestivalDetail />} />
                <Route path="/items" element={user ? <ItemManagement /> : <Navigate to="/login" />} />
                <Route path="/account" element={user ? <Account /> : <Navigate to="/login" />} />

                {/* ★ root 専用 */}
                <Route
                  path="/information"
                  element={
                    user?.username === "root"
                    ? <InformationDashboard />
                    : <Navigate to="/" />
                  }
                />
              </Routes>

            </AppShell.Main>
          </AppShell>
        </Router>
      </UserContext.Provider>
    </MantineProvider>
  );
}
