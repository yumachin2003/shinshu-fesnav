import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import FestivalPage from "./FestivalPage";
import AccountPage from "./AccountPage";
import ItemManagementPage from "./ItemManagementPage"; // 新しいコンポーネントをインポート

export const UserContext = React.createContext();

const safeParse = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

export default function App() {
  const [user, setUser] = useState(() => safeParse("loggedInUser"));

  useEffect(() => {
    if (user) localStorage.setItem("loggedInUser", JSON.stringify(user));
    else localStorage.removeItem("loggedInUser");
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Router>
        <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
          <Link to="/festivals" style={{ marginRight: "1rem" }}>お祭り</Link>
          <Link to="/items" style={{ marginRight: "1rem" }}>アイテム管理</Link> {/* 新しいページへのリンクを追加 */}
          <Link to="/account">アカウント</Link>
        </nav>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/festivals" element={<FestivalPage />} />
          <Route path="/items" element={<ItemManagementPage />} /> {/* 新しいページのルートを追加 */}
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </Router>
    </UserContext.Provider>
  );
}
