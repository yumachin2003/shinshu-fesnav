import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { initGoogleTranslate } from "./utils/translate"; // ✅ 翻訳機能を追加

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // ✅ 翻訳機能 初期化（左下に表示）
  useEffect(() => {
    initGoogleTranslate();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.some((u) => u.username === username)) {
      alert("このユーザー名は既に使われています。");
      return;
    }

    const newUser = { username, password };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    alert("登録が完了しました！");
    navigate("/");
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
