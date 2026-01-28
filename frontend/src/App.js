// 必要なモジュールやコンポーネントのインポート
import React, { useState, useEffect } from "react";
import { AppShell, Group, Title, Button, ActionIcon, Box, MantineProvider } from '@mantine/core';
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
import FestivalDetail from "./pages/FestivalDetail";
import ItemManagement from "./pages/ItemManagement";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import './App.css'; 
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
  const isAdmin = user?.username === "root";
  
  // マップページの場合はヘッダーのデザインをダークに寄せるが、全体のProviderは汚さない
  const headerColorScheme = isMapPage ? 'dark' : colorScheme;
  const iconColor = headerColorScheme === 'dark' ? 'white' : 'dark';

  // 現在のパスがアクティブか判定する関数
  const isActive = (path) => location.pathname === path;

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
        <Group h="100%" px="xs" justify="space-between" wrap="nowrap">
          <Title 
            order={1} 
            size={isMobile ? "1.1rem" : "h3"} 
            c={iconColor}
            style={{ flexShrink: 0 }}
          >
            信州おまつりナビ
          </Title>

          <Group gap={isMobile ? 4 : "xs"} wrap="nowrap">
            {/* 管理者ログイン中は一般メニューを非表示 */}
            {!isAdmin && (
              <>
                <Button 
                  component={Link} to="/festivals" 
                  variant={isActive("/festivals") || isActive("/") ? "light" : "subtle"}
                  leftSection={<IconList size={18} />} 
                  px={isMobile ? 8 : undefined}
                  styles={{ section: { marginRight: isMobile ? 0 : 8 } }}
                >
                  {!isMobile && "おまつり"}
                </Button>
                <Button 
                  component={Link} to="/calendar" 
                  variant={isActive("/calendar") ? "light" : "subtle"}
                  leftSection={<IconCalendar size={18} />} 
                  px={isMobile ? 8 : undefined}
                  styles={{ section: { marginRight: isMobile ? 0 : 8 } }}
                >
                  {!isMobile && "カレンダー"}
                </Button>
                <Button 
                  component={Link} to="/map" 
                  variant={isActive("/map") ? "light" : "subtle"}
                  leftSection={<IconMap size={18} />} 
                  px={isMobile ? 8 : undefined}
                  styles={{ section: { marginRight: isMobile ? 0 : 8 } }}
                >
                  {!isMobile && "マップ"}
                </Button>
              </>
            )}

            {/* 管理者ログイン中のみ表示 */}
            {isAdmin && (
              <Button 
                component={Link} to="/admin/dashboard" 
                variant={location.pathname.startsWith("/admin") ? "light" : "subtle"}
                leftSection={<IconLayoutDashboard size={18} />} 
                px={isMobile ? 8 : undefined}
                styles={{ section: { marginRight: isMobile ? 0 : 8 } }}
              >
                {!isMobile && "管理"}
              </Button>
            )}

            <AccountHoverCard />
            
            <ActionIcon
              onClick={toggleColorScheme}
              variant="default"
              size={isMobile ? "sm" : "lg"}
              aria-label="Toggle color scheme"
              c={iconColor}
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoonStars size={18} />}
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Login opened={loginOpened} onClose={() => setLoginOpened(false)} />
        <Register opened={registerOpened} onClose={() => setRegisterOpened(false)} />

        <Routes>
          {/* 管理者ログイン中のルート設定 */}
          {isAdmin ? (
            <>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/items" element={<ItemManagement />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/info" element={<InformationDashboard />} />
              <Route path="/account" element={<Account />} />
              {/* 指定パス以外は全て管理者ダッシュボードへリダイレクト */}
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </>
          ) : (
            <>
              {/* 一般ユーザー・未ログイン時のルート設定 */}
              <Route path="/" element={<Festival />} />
              <Route path="/festivals" element={<Festival />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/map" element={<Map />} />
              <Route path="/festivals/:id" element={<FestivalDetail />} />
              <Route path="/account" element={user ? <Account /> : <Navigate to="/festivals" />} />
              {/* 管理者ページへ直接行こうとした場合はトップへ */}
              <Route path="/admin/*" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </>
          )}
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default function App() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [user, setUser] = useState(() => safeParse("user"));
  const [loginOpened, setLoginOpened] = useState(false);
  const [registerOpened, setRegisterOpened] = useState(false);
  
  const [colorScheme, setColorScheme] = useLocalStorage({
    key: 'mantine-color-scheme',
    defaultValue: 'light',
    getInitialValueInEffect: true,
  });

  const toggleColorScheme = () => {
    setColorScheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
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
          localStorage.setItem("user", JSON.stringify(updated));
          return updated;
        });
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      });
  }, []);

  return (
    <MantineProvider theme={{ colorScheme }} defaultColorScheme={colorScheme}>
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