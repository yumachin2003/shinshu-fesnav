// 必要なモジュールやコンポーネントのインポート
import React, { useState, useEffect } from "react";
import { AppShell, Group, Title, Button, MantineProvider, ActionIcon, Box } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useLocalStorage, useMediaQuery } from '@mantine/hooks';
import { IconSun, IconMoonStars, IconMap, IconCalendar, IconLayoutDashboard, IconList } from '@tabler/icons-react';
import Login from "./components/Login";
import Register from "./components/Register";
import Festival from "./pages/Festival";
import Account from "./pages/Account";
import Calendar from "./pages/Calendar";
import Map from "./pages/Map";
import FestivalDetail from "./pages/FestivalDetail"; // 詳細ページコンポーネントをインポート
import ItemManagement from "./pages/ItemManagement";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import './App.css'; // アプリケーション全体のスタイルをインポート
import { getAccountData } from "./utils/apiService";
import AccountHoverCard from "./components/AccountHoverCard";
import InformationDashboard from "./pages/InformationDashboard";
import { UserContext } from "./UserContext";

const safeParse = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

// ルートに応じてヘッダーのスタイルを切り替えるためのコンポーネント
function AppContent({ 
  user, 
  loginOpened, 
  setLoginOpened, 
  registerOpened, 
  setRegisterOpened,
  colorScheme,
  toggleColorScheme,
  isMobile
}) {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';
  
  // マップページの場合はヘッダーもダークモードのスタイルを強制する
  const headerColorScheme = isMapPage ? 'dark' : colorScheme;

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header zIndex={2000} style={{
        backgroundColor: headerColorScheme === 'dark' ? 'rgba(26, 27, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${headerColorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      }}>
        <MantineProvider forceColorScheme={headerColorScheme}>
          <Group h="100%" px="xs" justify="space-between" wrap="nowrap">
            <Title 
              order={1} 
              size={isMobile ? "1.1rem" : "h3"} // モバイル時はさらに小さく
              c={headerColorScheme === 'dark' ? 'white' : 'dark'}
              style={{ flexShrink: 0 }} // タイトルが潰れないように固定
            >
              信州おまつりナビ
            </Title>
            <Group h="100%" px="xs" justify="space-between" wrap="nowrap">
              <Button component={Link} to="/festivals" variant="subtle" leftSection={<IconList size={18} />} px={isMobile ? 8 : undefined} styles={{ section: { marginRight: isMobile ? 0 : 8 } }}>
                {!isMobile && "おまつり"}
              </Button>
              <Button component={Link} to="/calendar" variant="subtle" leftSection={<IconCalendar size={18} />} px={isMobile ? 8 : undefined}>
                {!isMobile && "カレンダー"}
              </Button>
              <Button component={Link} to="/map" variant="subtle" leftSection={<IconMap size={18} />} px={isMobile ? 8 : undefined}>
                {!isMobile && "マップ"}
              </Button>
              {user?.username === "root" && (
                <Button component={Link} to="/admin/dashboard" variant="subtle" leftSection={<IconLayoutDashboard size={18} />} px={isMobile ? 8 : undefined}>
                  {!isMobile && "管理"}
                </Button>
              )}
              <AccountHoverCard />
              <ActionIcon
                onClick={toggleColorScheme}
                variant="default"
                size={isMobile ? "sm" : "lg"} // アイコン自体も少し小さく
                aria-label="Toggle color scheme"
              >
                {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoonStars size={18} />}
              </ActionIcon>
            </Group>
          </Group>
        </MantineProvider>
      </AppShell.Header>

      <AppShell.Main>
        <Login opened={loginOpened} onClose={() => setLoginOpened(false)} />
        <Register opened={registerOpened} onClose={() => setRegisterOpened(false)} />

        <Routes>
          <Route path="/" element={<Festival />} />
          <Route path="/festivals" element={<Festival />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/map" element={<Map />} />
          <Route path="/festivals/:id" element={<FestivalDetail />} />
          <Route path="/account" element={user ? <Account /> : <Navigate to="/festivals" />} />
          <Route path="/admin/dashboard" element={user?.username === "root" ? <AdminDashboard /> : <Navigate to="/" />} />
          <Route path="/admin/items" element={user?.username === "root" ? <ItemManagement /> : <Navigate to="/" />} />
          <Route path="/admin/users" element={user?.username === "root" ? <UserManagement /> : <Navigate to="/" />} />
          <Route path="/admin/info" element={user?.username === "root" ? <InformationDashboard /> : <Navigate to="/" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

// アプリケーションのメインコンポーネント
export default function App() {
  // ユーザー情報の状態管理。初期値はlocalStorageから読み込み
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [user, setUser] = useState(() => safeParse("user"));
  const [loginOpened, setLoginOpened] = useState(false);
  const [registerOpened, setRegisterOpened] = useState(false);
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
    // Googleログインから戻ったときの処理
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      localStorage.setItem("authToken", urlToken);
      try {
        const payload = JSON.parse(atob(urlToken.split(".")[1]));
        const userData = {
          id: payload.user_id,
          username: payload.email ?? payload.user_id,
          email: payload.email,
          display_name: payload.display_name,
          isGoogle: true,
        };
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        
        // URLからクエリを消去してリダイレクト
        const targetPath = userData.username === 'root' ? '/admin/dashboard' : '/festivals';
        window.history.replaceState({}, document.title, targetPath);
      } catch (e) {
        console.error("Token decode error:", e);
      }
    }

    const token = localStorage.getItem('authToken');

    if (!token) {
      setUser(null);
      return;
    }

    getAccountData()
      .then(res => {
        const latestData = res.data;
        setUser(prev => {
          const base = prev || safeParse("user") || {};
          const updated = { ...base, ...latestData };
          // localStorage も同期
          localStorage.setItem("user", JSON.stringify(updated));
          return updated;
        });
      })
      .catch(err => {
        // 401 (Unauthorized) の場合のみログアウトさせる
        // ネットワークエラーなどで一時的に取得できない場合は、既存の状態を維持する
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUser(null);
        }
        console.error("Failed to refresh account data:", err);
      });
  }, []);

  return (
    <MantineProvider theme={{ colorScheme }} forceColorScheme={colorScheme}>
      <ModalsProvider>
      <UserContext.Provider value={{ 
        user, 
        setUser, 
        loginOpened,
        registerOpened,
        openLogin: () => { setRegisterOpened(false); setLoginOpened(true); },
        closeLogin: () => setLoginOpened(false),
        openRegister: () => { setLoginOpened(false); setRegisterOpened(true); },
        closeRegister: () => setRegisterOpened(false)
      }}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent 
            user={user}
            loginOpened={loginOpened}
            setLoginOpened={setLoginOpened}
            registerOpened={registerOpened}
            setRegisterOpened={setRegisterOpened}
            colorScheme={colorScheme}
            toggleColorScheme={toggleColorScheme}
            isMobile={isMobile}
          />
        </Router>
      </UserContext.Provider>
      </ModalsProvider>
    </MantineProvider>
  );
}
