import React, { useState, useEffect } from "react";
import { AppShell, Group, Title, Button, ActionIcon, MantineProvider, useMantineColorScheme, Tooltip } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Notifications, notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { useMediaQuery } from '@mantine/hooks';
import { IconSun, IconMoonStars, IconMap, IconCalendar, IconList } from '@tabler/icons-react';
import AuthModal from "./components/AuthModal";
import Festival from "./pages/Festival";
import Account from "./pages/Account";
import AccountFavorites from "./pages/AccountFavorites";
import AccountLogs from "./pages/AccountLogs";
import AccountSettings from "./pages/AccountSettings";
import Calendar from "./pages/Calendar";
import Map from "./pages/Map";
import FestivalDetail from "./components/FestivalDetail";
import ItemManagement from "./pages/ItemManagement";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import './css/App.css'; 
import './css/GlassStyle.css';
import { getAccountData } from "./utils/apiService";
import AccountHoverCard from "./components/AccountHoverCard";
import InformationDashboard from "./pages/InformationDashboard";
import { UserContext } from "./UserContext";
import LoginCallback from "./pages/LoginCallback";
import AddAdminUser from "./components/AddAdminUser";

const safeParse = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

// セッションストレージを使用するカラーテーママネージャー
const sessionStorageColorSchemeManager = {
  get: (defaultValue) => {
    try {
      return window.sessionStorage.getItem('mantine-color-scheme') || defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (value) => {
    try {
      window.sessionStorage.setItem('mantine-color-scheme', value);
    } catch {}
  },
  subscribe: () => {},
  unsubscribe: () => {},
  clear: () => {},
};

function AppContent({ 
  user, 
  loginOpened, 
  setLoginOpened, 
  registerOpened, 
  setRegisterOpened,
  isMobile
}) {
  const location = useLocation();
  const { colorScheme, toggleColorScheme, setColorScheme } = useMantineColorScheme();
  
  const isMapPage = location.pathname === '/map';
  const isLoginCallback = location.pathname === '/login/callback';
  const isAdmin = user?.is_admin || user?.username === "root";

  // 初回アクセス時にデバイスの外観モードを取得・適用・保存
  useEffect(() => {
    // ローカルストレージのMantineデフォルト設定を削除（競合回避）
    localStorage.removeItem('mantine-color-scheme');
    localStorage.removeItem('mantine-color-scheme-value');
    // 旧キーを削除（統合）
    sessionStorage.removeItem('fesnav-color-scheme');

    const storedScheme = sessionStorage.getItem('mantine-color-scheme');
    if (!storedScheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setColorScheme(prefersDark ? 'dark' : 'light');
    }
  }, [setColorScheme]);

  // マップページ遷移時にダークモードに切り替え、離脱時に元に戻す
  useEffect(() => {
    if (isMapPage) {
      if (colorScheme !== 'dark') {
        sessionStorage.setItem('pre-map-theme', colorScheme);
        setColorScheme('dark');
      }
    } else {
      const preMapTheme = sessionStorage.getItem('pre-map-theme');
      if (preMapTheme) {
        setColorScheme(preMapTheme);
        sessionStorage.removeItem('pre-map-theme');
      }
    }
  }, [isMapPage, colorScheme, setColorScheme]);
  
  const headerColorScheme = isMapPage ? 'dark' : colorScheme;
  const iconColor = headerColorScheme === 'dark' ? 'white' : 'dark';
  const isActive = (path) => location.pathname === path;

  // ボタンの共通スタイル定義
  const getButtonProps = (path) => ({
    component: "a",
    href: path,
    variant: isActive(path) ? "light" : "subtle",
    color: "blue", // ★ ここで青色を指定
    px: isMobile ? 8 : undefined,
    styles: { section: { marginRight: isMobile ? 0 : 8 } }
  });

  // 画面読み込み完了後に通知を表示する
  useEffect(() => {
    const pendingNotification = localStorage.getItem('pendingNotification');
    if (pendingNotification) {
      try {
        const notification = JSON.parse(pendingNotification);
        notifications.show(notification);
      } catch (e) {
        console.error("Failed to parse pending notification", e);
      }
      localStorage.removeItem('pendingNotification');
    }
  }, []);

  return (
    <AppShell 
      header={!isLoginCallback ? { height: 60 } : undefined} 
      padding="md"
    >
      {!isLoginCallback && (
      <AppShell.Header zIndex={2000} className="glass-header">
        <Group h="100%" px="xs" justify="space-between" wrap="nowrap">
          <Title order={1} size={isMobile ? "1.1rem" : "h3"} c={iconColor} style={{ flexShrink: 0 }}>
            信州おまつりナビ
          </Title>

          <Group gap={isMobile ? 4 : "xs"} wrap="nowrap">
            {!isAdmin && (
              <>
                <Button {...getButtonProps("/festivals")} leftSection={<IconList size={18} />}>
                  {!isMobile && "おまつり"}
                </Button>
                <Button {...getButtonProps("/calendar")} leftSection={<IconCalendar size={18} />}>
                  {!isMobile && "カレンダー"}
                </Button>
                <Button {...getButtonProps("/map")} leftSection={<IconMap size={18} />}>
                  {!isMobile && "マップ"}
                </Button>
              </>
            )}

            <AccountHoverCard />
            
            <Tooltip 
              label="マップビューでは切替できません" 
              disabled={!isMapPage}
              withArrow
              zIndex={2100}
            >
              <div style={{ display: 'inline-block' }}>
                <ActionIcon
                  onClick={() => toggleColorScheme()}
                  disabled={isMapPage}
                  variant="default"
                  size={isMobile ? "sm" : "lg"}
                  aria-label="Toggle color scheme"
                  c={isMapPage ? "gray" : iconColor}
                  style={isMapPage ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
                >
                  {isMapPage ? <IconMoonStars size={18} /> : (colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoonStars size={18} />)}
                </ActionIcon>
              </div>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>
      )}

      <AppShell.Main>
        <AuthModal opened={loginOpened} onClose={() => setLoginOpened(false)} isRegister={false} />
        <AuthModal opened={registerOpened} onClose={() => setRegisterOpened(false)} isRegister={true} />

        <Routes>
          {isAdmin ? (
            <>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/items" element={<ItemManagement />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/users/add" element={<AddAdminUser />} />
              <Route path="/admin/info" element={<InformationDashboard />} />
              <Route path="/account" element={<Account />} />
              <Route path="/account/favorites" element={<AccountFavorites />} />
              <Route path="/account/logs" element={<AccountLogs />} />
              <Route path="/account/settings" element={<AccountSettings />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Festival />} />
              <Route path="/festivals" element={<Festival />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/map" element={<Map />} />
              <Route path="/festivals/:id" element={<Festival />} />
              <Route path="/account" element={user ? <Account /> : <Navigate to="/festivals" />} />
              <Route path="/account/favorites" element={user ? <AccountFavorites /> : <Navigate to="/festivals" />} />
              <Route path="/account/logs" element={user ? <AccountLogs /> : <Navigate to="/festivals" />} />
              <Route path="/account/settings" element={user ? <AccountSettings /> : <Navigate to="/festivals" />} />
              <Route path="/login/callback" element={<LoginCallback />} />
              <Route path="/admin/*" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </>
          )}
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

function AppInner() {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [user, setUser] = useState(() => safeParse("user"));
  const [loginOpened, setLoginOpened] = useState(false);
  const [registerOpened, setRegisterOpened] = useState(false);

  useEffect(() => {
    // 認証トークン処理 (変更なし)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      localStorage.setItem("authToken", urlToken);
      try {
        const payload = JSON.parse(atob(urlToken.split(".")[1]));
        const userData = { id: payload.user_id, username: payload.email ?? payload.user_id, email: payload.email, display_name: payload.display_name, isGoogle: true };
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        window.history.replaceState({}, document.title, userData.username === 'root' ? '/admin/dashboard' : '/festivals');
      } catch (e) { console.error("Token decode error:", e); }
    }
    const token = localStorage.getItem('authToken');
    if (!token) { setUser(null); return; }
    getAccountData().then(res => {
      setUser(prev => { const updated = { ...(prev || {}), ...res.data }; localStorage.setItem("user", JSON.stringify(updated)); return updated; });
    }).catch(() => { localStorage.removeItem('authToken'); localStorage.removeItem('user'); setUser(null); });
  }, []);

  // ポップアップログインからのメッセージを受け取る
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'LOGIN_SUCCESS') {
        const { user: newUser, token } = event.data;
        if (token) localStorage.setItem('authToken', token);
        if (newUser) localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        setLoginOpened(false);
        setRegisterOpened(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ★ テーマ設定 (すりガラスはCSSクラスで管理)
  const theme = {
    defaultRadius: 'md',
    components: {
      Modal: {
        classNames: { content: 'glass-modal', header: 'glass-modal-header' }
      },
      Drawer: {
        classNames: { content: 'glass-drawer', header: 'glass-drawer-header' }
      },
      Tooltip: {
        classNames: { tooltip: 'glass-tooltip' }
      },
      Input: {
        classNames: { input: 'glass-input' }
      },
      Notification: {
        classNames: { root: 'glass-notification' }
      }
    }
  };

  return (
    <MantineProvider defaultColorScheme="auto" theme={theme} colorSchemeManager={sessionStorageColorSchemeManager}>
      <Notifications position="bottom-right" zIndex={9999} />
      <ModalsProvider>
        <UserContext.Provider value={{ user, setUser, loginOpened, registerOpened, openLogin: () => { setRegisterOpened(false); setLoginOpened(true); }, closeLogin: () => setLoginOpened(false), openRegister: () => { setLoginOpened(false); setRegisterOpened(true); }, closeRegister: () => setRegisterOpened(false) }}>
          <AppContent user={user} loginOpened={loginOpened} setLoginOpened={setLoginOpened} registerOpened={registerOpened} setRegisterOpened={setRegisterOpened} isMobile={isMobile} />
        </UserContext.Provider>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppInner />
    </Router>
  );
}