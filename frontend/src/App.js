// 必要なモジュールやコンポーネントのインポート
import React, { useState, useEffect } from "react";
import { AppShell, Group, Title, Button, MantineProvider, ActionIcon, HoverCard, TextInput, PasswordInput, Stack, Text, Anchor, Divider, Checkbox } from '@mantine/core';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { useLocalStorage } from '@mantine/hooks';
import { IconSun, IconMoonStars } from '@tabler/icons-react';
import Login from "./pages/Login";
import Register from "./pages/Register";
import Festival from "./pages/Festival";
import Account from "./pages/Account";
import FestivalDetail from "./pages/FestivalDetail"; // 詳細ページコンポーネントをインポート
import ItemManagement from "./pages/ItemManagement";
import AdminDashboard from "./pages/AdminDashboard";
import './App.css'; // アプリケーション全体のスタイルをインポート
import { getAccountData, loginUser } from "./utils/apiService";
import axios from "axios";
import InformationDashboard from "./pages/InformationDashboard";


// axiosの設定
// 開発環境では localhost:5051 を、本番環境（ビルド後）は同じドメインの相対パスを参照するようにします
axios.defaults.baseURL = process.env.NODE_ENV === 'production' ? "" : "http://localhost:5051";

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

  // アカウントポップアップの開閉状態管理
  const [accountOpened, setAccountOpened] = useState(false);

  // ポップアップログイン用の状態管理
  const [popupUsername, setPopupUsername] = useState("");
  const [popupPassword, setPopupPassword] = useState("");
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupError, setPopupError] = useState(null);

  // パスワード表示切替
  const [showPassword, setShowPassword] = useState(false);

  const handlePopupLogin = async (e) => {
    e.preventDefault();
    setPopupLoading(true);
    setPopupError(null);
    try {
      const response = await loginUser({ username: popupUsername, password: popupPassword });
      const { token, user: loggedInUser } = response.data;
      localStorage.setItem("authToken", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      const targetPath = loggedInUser.username === 'root' ? '/admin/dashboard' : '/festivals';
      window.location.href = targetPath;
    } catch (err) {
      setPopupError("ログインに失敗しました");
    } finally {
      setPopupLoading(false);
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm("本当にログアウトしますか？");
    if (confirmed) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = "/";
    }
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
                  {user?.username === "root" ? (
                    <Button component={Link} to="/admin/dashboard" variant="subtle">管理ダッシュボード</Button>
                  ) : (
                    <>
                      <Button component={Link} to="/festivals" variant="subtle">お祭り</Button>
                      {user ? (
                        <HoverCard 
                          width={220} 
                          shadow="md" 
                          withArrow 
                          openDelay={200} 
                          closeDelay={0}
                          opened={accountOpened}
                          onChange={setAccountOpened}
                        >
                          <HoverCard.Target>
                            <Button component={Link} to="/account" variant="subtle" onClick={() => setAccountOpened(false)}>アカウント</Button>
                          </HoverCard.Target>
                          <HoverCard.Dropdown>
                            <Stack gap="xs">
                              <Text size="sm" fw={500}>ログイン中</Text>
                              <Text size="xs" c="dimmed">ユーザー名: {user.display_name || user.username}</Text>
                              <Button variant="outline" color="red" size="xs" fullWidth onClick={handleLogout}>
                                ログアウト
                              </Button>
                            </Stack>
                          </HoverCard.Dropdown>
                        </HoverCard>
                      ) : (
                        <HoverCard 
                          width={300} 
                          shadow="md" 
                          withArrow 
                          openDelay={200} 
                          closeDelay={0}
                          opened={accountOpened}
                          onChange={setAccountOpened}
                        >
                          <HoverCard.Target>
                            <Button variant="subtle">アカウント</Button>
                          </HoverCard.Target>
                          <HoverCard.Dropdown>
                            <form onSubmit={handlePopupLogin}>
                              <Stack gap="xs">
                                <Text size="sm" fw={500}>ログイン</Text>
                                {popupError && <Text c="red" size="xs">{popupError}</Text>}
                                <TextInput 
                                  placeholder="ユーザー名" 
                                  size="xs" 
                                  value={popupUsername} 
                                  onChange={(e) => setPopupUsername(e.currentTarget.value)}
                                  required 
                                />
                                <PasswordInput 
                                  placeholder="パスワード" 
                                  size="xs" 
                                  value={popupPassword} 
                                  onChange={(e) => setPopupPassword(e.currentTarget.value)}
                                  visible={showPassword}
                                  onVisibilityChange={setShowPassword}
                                  required 
                                />
                                <Checkbox 
                                  label="パスワードを表示" 
                                  size="xs"
                                  checked={showPassword}
                                  onChange={(event) => setShowPassword(event.currentTarget.checked)}
                                />
                                <Button type="submit" size="xs" fullWidth loading={popupLoading}>
                                  ログイン
                                </Button>

                                <Divider label="または" labelPosition="center" size="xs" />

                                <Button
                                  fullWidth
                                  variant="outline"
                                  color="gray"
                                  size="xs"
                                  onClick={() => {
                                    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
                                    const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI;
                                    const scope = "openid email profile";
                                    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
                                    window.location.href = url;
                                  }}
                                >
                                  <img
                                    src="https://developers.google.com/identity/images/g-logo.png"
                                    alt="Google Logo"
                                    style={{ width: 14, height: 14, marginRight: 8 }}
                                  />
                                  Googleでログイン
                                </Button>

                                <Button
                                  fullWidth
                                  color="green"
                                  size="xs"
                                  onClick={() => {
                                    window.location.href = "http://localhost:5051/api/auth/line";
                                  }}
                                >
                                  LINEでログイン
                                </Button>

                                <Text size="xs" ta="center">
                                  アカウントをお持ちでないですか？{' '}
                                  <Anchor href="/register" size="xs">新規登録</Anchor>
                                </Text>
                              </Stack>
                            </form>
                          </HoverCard.Dropdown>
                        </HoverCard>
                      )}
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

                {/* 管理者用ルーティング */}
                <Route path="/admin/dashboard" element={user?.username === "root" ? <AdminDashboard /> : <Navigate to="/" />} />
                <Route path="/admin/items" element={user?.username === "root" ? <ItemManagement /> : <Navigate to="/" />} />
                <Route path="/admin/info" element={user?.username === "root" ? <InformationDashboard /> : <Navigate to="/" />} />
              </Routes>

            </AppShell.Main>
          </AppShell>
        </Router>
      </UserContext.Provider>
    </MantineProvider>
  );
}
