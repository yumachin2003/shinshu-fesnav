import React, { useState, useContext } from "react";
import { TextInput, PasswordInput, Button, Stack, Text, Divider, Anchor, Alert } from '@mantine/core';
import { IconKeyFilled } from '@tabler/icons-react';
import { startAuthentication } from '@simplewebauthn/browser';
import { Link } from "react-router-dom";
import { UserContext } from "../App";
import { loginUser } from "./apiService";
import lineLogo from "../img/line_88.png";

export default function LoginForm({ isPopup = false, onSuccess }) {
  const { setUser } = useContext(UserContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const API_BASE = "http://localhost:5000/api";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await loginUser({ username, password });
      const { token, user: loggedInUser } = response.data;
      
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      
      if (onSuccess) onSuccess();

      const targetPath = loggedInUser.username === 'root' ? '/admin/dashboard' : '/festivals';
      window.location.href = targetPath;
    } catch (err) {
      console.error("ログインに失敗しました:", err.response?.data?.error || err.message);
      setError("ユーザー名またはパスワードが違います。");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!username) {
      setError("パスキーでログインするにはユーザー名を入力してください。");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_BASE}/login/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const options = await resp.json();
      const authResp = await startAuthentication(options);
      const verifyResp = await fetch(`${API_BASE}/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authResp),
      });

      if (verifyResp.ok) {
        const responseData = await verifyResp.json();
        const { token, user: loggedInUser } = responseData;
        
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        
        if (onSuccess) onSuccess();
        const targetPath = loggedInUser.username === 'root' ? '/admin/dashboard' : '/festivals';
        window.location.href = targetPath;
      } else {
        throw new Error('認証に失敗しました');
      }
    } catch (err) {
      console.error(err);
      setError('パスキーログイン失敗: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const size = isPopup ? "xs" : "sm";

  return (
    <form onSubmit={handleLogin}>
      <Stack gap="xs">
        {isPopup && <Text size="sm" fw={500}>ログイン</Text>}
        
        {error && (
          isPopup 
            ? <Text c="red" size="xs">{error}</Text>
            : <Alert color="red" title="ログインエラー" mb="md">{error}</Alert>
        )}

        <TextInput 
          label={!isPopup ? "ユーザー名" : null}
          placeholder="ユーザー名を入力" 
          size={size} 
          value={username} 
          onChange={(e) => setUsername(e.currentTarget.value)}
          required 
        />
        <PasswordInput 
          label={!isPopup ? "パスワード" : null}
          placeholder="パスワードを入力" 
          size={size} 
          value={password} 
          onChange={(e) => setPassword(e.currentTarget.value)}
          visible={showPassword}
          onVisibilityChange={setShowPassword}
          required 
          mt={!isPopup ? "md" : 0}
        />
        <Button type="submit" size={size} fullWidth loading={loading} mt={!isPopup ? "xl" : 0}>
          ログイン
        </Button>

        <Divider label="または" labelPosition="center" size="xs" />

        <Button
          fullWidth
          variant="outline"
          color="gray"
          size={size}
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
            style={{ width: isPopup ? 14 : 20, height: isPopup ? 14 : 20, marginRight: 8 }}
          />
          Googleでログイン
        </Button>

        <Button fullWidth color="green" size={size} onClick={() => window.location.href = "http://localhost:5051/api/auth/line"}>
          <img src={lineLogo} alt="LINE Logo" style={{ width: isPopup ? 14 : 20, height: isPopup ? 14 : 20, marginRight: 8 }} />
          LINEでログイン
        </Button>

        <Button 
          fullWidth 
          variant="filled" 
          color="blue" 
          size={size} 
          onClick={handlePasskeyLogin} 
          loading={loading}
          leftSection={<IconKeyFilled size={isPopup ? 16 : 20} />}
        >
          パスキーでログイン
        </Button>

        <Text size="xs" ta="center" mt={!isPopup ? 5 : 0}>
          アカウントをお持ちでないですか？{' '}
          <Anchor component={Link} to="/register" state={{ fromLoginPage: !isPopup }} size="xs">新規登録</Anchor>
        </Text>
      </Stack>
    </form>
  );
}