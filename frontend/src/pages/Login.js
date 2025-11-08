import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../App";
import { loginUser } from "../utils/apiService";
import { initGoogleTranslate } from "../utils/translate";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  // ✅ 翻訳機能 初期化（左下に表示）
  useEffect(() => {
    initGoogleTranslate();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // バックエンドのログインAPIにリクエストを送信
      const response = await loginUser({ username, password });

      // レスポンスからトークンとユーザー情報を取得
      // バックエンドのレスポンス形式に合わせてキー名（token, user）を調整してください。
      const { token, user } = response.data;

      // ★'authToken' というキーでトークンをlocalStorageに保存
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user)); // ユーザー情報も保存
      setUser(user); // Appコンテキストのユーザー情報を更新
      navigate("/festivals"); // ログイン成功後、お祭り一覧ページに遷移
    } catch (error) {
      console.error("ログインに失敗しました:", error);
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
