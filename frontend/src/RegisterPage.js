import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { initGoogleTranslate } from "./utils/translate"; // ✅ 翻訳機能を追加
import { registerUser } from "./utils/apiService"; // 修正

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // ✅ 翻訳機能 初期化（左下に表示）
  useEffect(() => {
    initGoogleTranslate();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // バックエンドの/api/registerエンドポイントにデータを送信
      await registerUser({ username, password });

      alert("登録が完了しました！ログインページに移動します。");
      navigate("/"); // 登録成功後、ログインページに遷移
    } catch (error) {
      // バックエンドから返されたエラーメッセージを表示
      if (error.response && error.response.data && error.response.data.error) {
        alert(error.response.data.error);
      } else {
        console.error("Registration failed:", error);
        alert("登録に失敗しました。後ほどもう一度お試しください。");
      }
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      {/* 🌐 左下に翻訳ウィジェット */}
      <div id="google_translate_element"></div>

      <h1>新規登録</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="ユーザー名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <br />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <button type="submit">登録</button>
      </form>
      <p>
        すでにアカウントをお持ちですか？{" "}
        <Link to="/">ログイン</Link>
      </p>
    </div>
  );
}
