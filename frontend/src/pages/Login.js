import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TextInput, PasswordInput, Button, Container, Title, Paper, Text, Anchor, Alert } from '@mantine/core';
import { UserContext } from "../App";
import { loginUser } from "../utils/apiService";
import { initGoogleTranslate } from "../utils/translate";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setUser } = useContext(UserContext);

  // ✅ 翻訳機能 初期化（左下に表示）
  useEffect(() => {
    initGoogleTranslate();
  }, []);

  // Googleログインから戻ったとき token を受け取って処理
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // トークン保存
      localStorage.setItem("authToken", token);

      // JWT を decode
      const payload = JSON.parse(atob(token.split(".")[1]));

      const userData = {
        id: payload.user_id,
        username: payload.email ?? payload.user_id,
        display_name: payload.display_name,
        isGoogle: true,
      };

      // 保存
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      // クエリを消して遷移（重要）
      const targetPath = userData.username === 'root' ? '/admin/dashboard' : '/festivals';
      window.location.href = targetPath;
    }
  }, [navigate, setUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // バックエンドのログインAPIにリクエストを送信
      const response = await loginUser({ username, password });

      // レスポンスからトークンとユーザー情報を取得
      // バックエンドのレスポンス形式に合わせてキー名（token, user）を調整してください。
      const { token, user } = response.data;

      // ★'authToken' というキーでトークンをlocalStorageに保存
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user)); // ユーザー情報も保存
      setUser(user); // Appコンテキストのユーザー情報を更新
      const targetPath = user.username === 'root' ? '/admin/dashboard' : '/festivals';
      window.location.href = targetPath; // ログイン成功後、リロードを伴って遷移
    } catch (error) {
      console.error("ログインに失敗しました:", error.response?.data?.error || error.message);
      setError("ユーザー名またはパスワードが違います。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      {/* 🌐 左下に翻訳ウィジェット */}
      <div id="google_translate_element" style={{ position: "fixed", bottom: 10, left: 10, zIndex: 9999 }}></div>

      <Title ta="center">
        ログイン
      </Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {error && <Alert color="red" title="ログインエラー" mb="md">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextInput label="ユーザー名" placeholder="ユーザー名を入力" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <PasswordInput label="パスワード" placeholder="パスワードを入力" value={password} onChange={(e) => setPassword(e.target.value)} required mt="md" />
          <Button fullWidth mt="xl" type="submit" loading={loading}>ログイン</Button>
        </form>
      </Paper>
      <Button
        fullWidth
        mt="md"
        variant="outline"
        color="gray"
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
          style={{ width: 20, height: 20, marginRight: 10 }}
        />
        Googleでログイン
      </Button>
      <Button
        fullWidth
        mt="md"
        color="green"
        onClick={() => {
          window.location.href = "http://localhost:5051/api/auth/line";
        }}
      >
        LINEでログイン
      </Button>
      <form
        action="https://appleid.apple.com/auth/authorize"
        method="POST"
      >
        <input type="hidden" name="response_type" value="code id_token" />
        <input type="hidden" name="client_id" value="com.example.app" />
        <input type="hidden" name="redirect_uri" value="http://localhost:5051/api/auth/apple/callback" />
        <input type="hidden" name="scope" value="name email" />
        <input type="hidden" name="response_mode" value="form_post" />
        <Button fullWidth mt="md" color="dark">
          🍎 Appleでログイン
        </Button>
      </form>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        アカウントをお持ちでないですか？{' '}
        <Anchor size="sm" href="/register">新規登録</Anchor>
      </Text>
    </Container>
  );
}
