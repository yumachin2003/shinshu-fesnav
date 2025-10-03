import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "./App";

const safeParse = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const storedUser = safeParse("user");
    if (!storedUser) {
      alert("まだ登録されていません。");
      return;
    }
    if (storedUser.username === username && storedUser.password === password) {
      setUser(storedUser);          // Context に保存
      navigate("/festivals");       // お祭りページへ
    } else {
      alert("ユーザー名またはパスワードが違います");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>ログイン</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="ユーザー名" value={username} onChange={e => setUsername(e.target.value)} required />
        <br />
        <input type="password" placeholder="パスワード" value={password} onChange={e => setPassword(e.target.value)} required />
        <br />
        <button type="submit">ログイン</button>
      </form>
      <p>
        新規登録は <Link to="/register">こちら</Link>
      </p>
    </div>
  );
}
