import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // 既存ユーザー一覧を読み込み
    const users = JSON.parse(localStorage.getItem("users")) || [];

    // 同名ユーザーの存在確認
    if (users.some((u) => u.username === username)) {
      alert("このユーザー名は既に使われています。");
      return;
    }

    // 新規ユーザーを追加
    const newUser = { username, password };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    alert("登録が完了しました！");
    navigate("/");
  };

  return (
    <div style={{ padding: "2rem" }}>
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
        すでにアカウントをお持ちですか？ <Link to="/">ログイン</Link>
      </p>
    </div>
  );
}
