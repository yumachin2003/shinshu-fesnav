// FestivalPage.js
import React, { useState, useEffect } from "react";
import StarRating from "./StarRating";
import Favorite from "./Favorite";
import { Link } from "react-router-dom";

// 長野県のお祭りリスト
const festivals = [
  { id: 1, name: "安曇野花火" },
  { id: 2, name: "上田わっしょい" },
  { id: 3, name: "信州上田大花火大会" },
  { id: 4, name: "夏まつり松本ぼんぼん" },
  { id: 5, name: "真田まつり" }
];

export default function FestivalPage() {
  // 星評価
  const [ratings, setRatings] = useState(() => {
    const saved = localStorage.getItem("festivalRatings");
    if (saved) return JSON.parse(saved);
    return festivals.reduce((acc, f) => ({ ...acc, [f.id]: 0 }), {});
  });

  useEffect(() => {
    localStorage.setItem("festivalRatings", JSON.stringify(ratings));
  }, [ratings]);

  const handleRate = (id, rating) => {
    setRatings(prev => ({ ...prev, [id]: Number(rating) }));
  };

  // お気に入り
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("festivalFavorites");
    if (saved) return JSON.parse(saved);
    return festivals.reduce((acc, f) => ({ ...acc, [f.id]: false }), {});
  });

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem("festivalFavorites", JSON.stringify(updated));
      return updated;
    });
  };

  // コメント
  const [comments, setComments] = useState(() => {
    const saved = localStorage.getItem("festivalComments");
    if (saved) return JSON.parse(saved);
    return festivals.reduce((acc, f) => ({ ...acc, [f.id]: [] }), {});
  });

  const handleAddComment = (id, name, text) => {
    const newComment = {
      name: name || "名無し",
      text,
      date: new Date().toLocaleString()
    };
    setComments(prev => {
      const updated = { ...prev, [id]: [...prev[id], newComment] };
      localStorage.setItem("festivalComments", JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteComment = (festivalId, index) => {
    setComments(prev => {
      const updated = { ...prev, [festivalId]: prev[festivalId].filter((_, i) => i !== index) };
      localStorage.setItem("festivalComments", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>長野県のお祭り</h1>

      {/* アカウントページへのリンク */}
      <div style={{ marginBottom: "1rem" }}>
        <Link to="/account">アカウントページへ</Link>
      </div>

      {festivals.map(festival => (
        <div
          key={festival.id}
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            maxWidth: "500px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2>{festival.name}</h2>
            <Favorite selected={favorites[festival.id]} onToggle={() => toggleFavorite(festival.id)} />
          </div>

          {/* 星評価 */}
          <StarRating
            count={5}
            value={ratings[festival.id] ?? 0}
            onRate={rate => handleRate(festival.id, rate)}
          />

          {/* コメント */}
          <div style={{ marginTop: "1rem" }}>
            <input
              type="text"
              placeholder="名前"
              id={`name-${festival.id}`}
              style={{ width: "48%", padding: "0.5rem", marginRight: "4%" }}
            />
            <input
              type="text"
              placeholder="コメントを追加（Enterで送信）"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  const nameInput = document.getElementById(`name-${festival.id}`);
                  handleAddComment(festival.id, nameInput.value, e.target.value);
                  e.target.value = "";
                }
              }}
              style={{ width: "48%", padding: "0.5rem" }}
            />
            <ul style={{ listStyle: "none", paddingLeft: 0, marginTop: "0.5rem" }}>
              {comments[festival.id]?.map((c, i) => (
                <li
                  key={i}
                  style={{
                    marginBottom: "0.3rem",
                    padding: "0.3rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #eee"
                  }}
                >
                  <div>
                    <strong>{c.name}</strong> ({c.date}): {c.text}
                  </div>
                  <button
                    onClick={() => handleDeleteComment(festival.id, i)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "red",
                      cursor: "pointer"
                    }}
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
