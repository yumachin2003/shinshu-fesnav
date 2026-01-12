import React, { useState, useContext } from "react";
import { HoverCard, Button, Stack, Text, TextInput, PasswordInput, Divider, Anchor } from '@mantine/core';
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../App";
import { loginUser } from "../utils/apiService";

export default function AccountHoverCard() {
  const { user, setUser } = useContext(UserContext);
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  // ポップアップログイン用の状態管理
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await loginUser({ username, password });
      const { token, user: loggedInUser } = response.data;
      localStorage.setItem("authToken", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setOpened(false);
      const targetPath = loggedInUser.username === 'root' ? '/admin/dashboard' : '/festivals';
      window.location.href = targetPath;
    } catch (err) {
      setError("ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("本当にログアウトしますか？")) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      setOpened(false);
      window.location.href = "/";
    }
  };

  if (user) {
    return (
      <HoverCard 
        width={220} 
        shadow="md" 
        withArrow 
        openDelay={200} 
        closeDelay={200}
        opened={opened}
        onChange={setOpened}
        disabled={isLoginPage}
      >
        <HoverCard.Target>
          <Button component={Link} to="/account" variant="subtle" onClick={() => setOpened(false)}>
            アカウント
          </Button>
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
    );
  }

  return (
    <HoverCard 
      width={300} 
      shadow="md" 
      withArrow 
      openDelay={200} 
      closeDelay={200}
      opened={opened}
      onChange={setOpened}
      disabled={isLoginPage}
    >
      <HoverCard.Target>
        <Button component={Link} to="/login" variant="subtle" onClick={() => setOpened(false)}>
          アカウント
        </Button>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <form onSubmit={handleLogin}>
          <Stack gap="xs">
            <Text size="sm" fw={500}>ログイン</Text>
            {error && <Text c="red" size="xs">{error}</Text>}
            <TextInput 
              placeholder="ユーザー名" 
              size="xs" 
              value={username} 
              onChange={(e) => setUsername(e.currentTarget.value)}
              required 
            />
            <PasswordInput 
              placeholder="パスワード" 
              size="xs" 
              value={password} 
              onChange={(e) => setPassword(e.currentTarget.value)}
              visible={showPassword}
              onVisibilityChange={setShowPassword}
              required 
            />
            <Button type="submit" size="xs" fullWidth loading={loading}>
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
  );
}