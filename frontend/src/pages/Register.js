import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { TextInput, PasswordInput, Button, Container, Title, Paper, Text, Anchor, Alert } from '@mantine/core';
import { initGoogleTranslate } from "../utils/translate";
import { registerUser } from "../utils/apiService";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // ✅ 翻訳機能 初期化（左下に表示）
  useEffect(() => {
    initGoogleTranslate();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // バックエンドの/api/registerエンドポイントにデータを送信
      await registerUser({ username, password });

      alert("登録が完了しました！ログインページに移動します。");
      navigate("/"); // 登録成功後、ログインページに遷移
    } catch (error) {
      // バックエンドから返されたエラーメッセージを表示
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        console.error("Registration failed:", error);
        setError("登録に失敗しました。後ほどもう一度お試しください。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      {/* 🌐 左下に翻訳ウィジェット */}
      <div id="google_translate_element" style={{ position: "fixed", bottom: 10, left: 10, zIndex: 9999 }}></div>

      <Title ta="center">新規登録</Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {error && <Alert color="red" title="登録エラー" mb="md">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextInput label="ユーザー名" placeholder="ユーザー名を入力" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <PasswordInput label="パスワード" placeholder="パスワードを入力" value={password} onChange={(e) => setPassword(e.target.value)} required mt="md" />
          <Button fullWidth mt="xl" type="submit" loading={loading}>登録</Button>
        </form>
      </Paper>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        すでにアカウントをお持ちですか？{' '}
        <Anchor size="sm" component={Link} to="/">ログイン</Anchor>
      </Text>
    </Container>
  );
}
