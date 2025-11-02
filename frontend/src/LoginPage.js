import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "./App";
import { initGoogleTranslate } from "./utils/translate"; // ✅ 翻訳機能を追加

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  // ✅ 翻訳機能 初期化（左下に表示）
  useEffect(() => {
    initGoogleTranslate();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const foundUser = users.find(
      (u) => u.username === username && u.password === password
    );

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("loggedInUser", JSON.stringify(foundUser));
      navigate("/festivals");
    } else {
      alert("ユーザー名またはパスワードが違います。");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      {/* 🌐 左下に翻訳ウィジェット */}
      <div id="google_translate_element"></div>

      <h1>ログイン</h1>
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
        <button type="submit">ログイン</button>
      </form>
      <p>
        アカウントをお持ちでないですか？{" "}
        <Link to="/register">新規登録</Link>
      </p>
    </div>
  );
}
