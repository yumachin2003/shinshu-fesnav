import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Title, Paper } from '@mantine/core';
import { UserContext } from "../UserContext";
import { initGoogleTranslate } from "../utils/translate";
import AccountForm from "../utils/AccountForm";
import BackButton from "../utils/BackButton";


export default function Login() {
  const navigate = useNavigate();
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
        email: payload.email,
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

  return (
    <Container size={420} my={40}>
      {/* 🌐 左下に翻訳ウィジェット */}
      <div id="google_translate_element" style={{ position: "fixed", bottom: 10, left: 10, zIndex: 9999 }}></div>

      <BackButton />

      <Title ta="center">
        ログイン
      </Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <AccountForm />
      </Paper>
    </Container>
  );
}
