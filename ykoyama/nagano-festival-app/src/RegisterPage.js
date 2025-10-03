import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // ← これだけでOK

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    if (username && password) {
      // localStorage に保存（実際はサーバーに送信する想定）
      localStorage.setItem("user", JSON.stringify({ username, password }));
      alert("アカウントを作成しました！");
      navigate("/"); // 登録完了後にログインページへ
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ textAlign: "center" }}>
        <h1>新規登録</h1>
        <form onSubmit={handleRegister}>
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
          <Link to="/">ログインへ</Link>
        </p>
      </div>
    </div>
  );
}
