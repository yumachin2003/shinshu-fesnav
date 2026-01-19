import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Container, Title, Paper } from '@mantine/core';
import { initGoogleTranslate } from "../utils/translate";
import BackButton from "../utils/BackButton";
import AccountForm from "../utils/AccountForm";

export default function Register() {
  const location = useLocation();
  const backSteps = location.state?.fromLoginPage ? -2 : -1;

  // ✅ 翻訳機能 初期化（左下に表示）
  useEffect(() => {
    initGoogleTranslate();
  }, []);

  return (
    <Container size={420} my={40}>
      {/* 🌐 左下に翻訳ウィジェット */}
      <div id="google_translate_element" style={{ position: "fixed", bottom: 10, left: 10, zIndex: 9999 }}></div>

      <BackButton to={backSteps} />

      <Title ta="center">新規登録</Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <AccountForm isRegister={true} />
      </Paper>
    </Container>
  );
}
