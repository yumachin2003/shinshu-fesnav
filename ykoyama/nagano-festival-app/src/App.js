import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import FestivalPage from "./FestivalPage";
import AccountPage from "./AccountPage";

// Context 作成
export const UserContext = React.createContext();

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("loggedInUser");
    return saved ? JSON.parse(saved) : null;
  });

  // userが変わったら localStorage にも保存
  useEffect(() => {
    if (user) {
      localStorage.setItem("loggedInUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("loggedInUser");
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Router>
        <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
          <Link to="/festivals" style={{ marginRight: "1rem" }}>お祭り</Link>
          <Link to="/account">アカウント</Link>
        </nav>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/festivals" element={<FestivalPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </Router>
    </UserContext.Provider>
  );
}
