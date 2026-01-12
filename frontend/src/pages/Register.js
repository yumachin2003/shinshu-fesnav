import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { TextInput, PasswordInput, Button, Container, Title, Paper, Text, Anchor, Alert, Divider } from '@mantine/core';
import { startRegistration } from '@simplewebauthn/browser';
import { IconKeyFilled } from '@tabler/icons-react';
import { initGoogleTranslate } from "../utils/translate";
import { registerUser } from "../utils/apiService";
import BackButton from "../utils/BackButton";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const backSteps = location.state?.fromLoginPage ? -2 : -1;
  const API_BASE = "http://localhost:5000/api";

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
      navigate("/login"); // 登録成功後、ログインページに遷移
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

  const handlePasskeyRegister = async () => {
    if (!username) {
      setError("パスキーを登録するにはユーザー名を入力してください。");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_BASE}/register/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const options = await resp.json();
      const regResp = await startRegistration(options);
      const verifyResp = await fetch(`${API_BASE}/register/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regResp),
      });

      if (verifyResp.ok) {
        alert('パスキーの登録に成功しました！ログインページに移動します。');
        navigate("/login");
      } else {
        throw new Error('パスキーの検証に失敗しました。');
      }
    } catch (err) {
      console.error(err);
      setError('パスキー登録失敗: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      {/* 🌐 左下に翻訳ウィジェット */}
      <div id="google_translate_element" style={{ position: "fixed", bottom: 10, left: 10, zIndex: 9999 }}></div>

      <BackButton to={backSteps} />

      <Title ta="center">新規登録</Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {error && <Alert color="red" title="登録エラー" mb="md">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextInput label="ユーザー名" placeholder="ユーザー名を入力" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <PasswordInput label="パスワード" placeholder="パスワードを入力" value={password} onChange={(e) => setPassword(e.target.value)} required mt="md" />
          <Button fullWidth mt="xl" type="submit" loading={loading}>登録</Button>

          <Divider label="または" labelPosition="center" my="lg" />

          <Button 
            fullWidth 
            variant="outline" 
            color="blue" 
            onClick={handlePasskeyRegister} 
            loading={loading}
            leftSection={<IconKeyFilled size={20} />}
          >
            パスキーで登録 (生体認証)
          </Button>
        </form>
      </Paper>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        すでにアカウントをお持ちですか？{' '}
        <Anchor size="sm" component={Link} to="/login">ログイン</Anchor>
      </Text>
    </Container>
  );
}
