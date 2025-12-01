import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
      navigate("/festivals"); // ログイン成功後、お祭り一覧ページに遷移
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
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        アカウントをお持ちでないですか？{' '}
        <Anchor size="sm" component={Link} to="/register">新規登録</Anchor>
      </Text>
    </Container>
  );
}
