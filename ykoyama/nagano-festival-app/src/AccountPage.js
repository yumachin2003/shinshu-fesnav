// AccountPage.js
import React, { useState, useEffect } from "react";
import StarRating from "./StarRating";
import Favorite from "./Favorite";
import { festivals } from "./FestivalData";

export default function AccountPage() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [ratings, setRatings] = useState(() => {
    const saved = localStorage.getItem("festivalRatings");
    return saved ? JSON.parse(saved) : {};
  });

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("festivalFavorites");
    return saved ? JSON.parse(saved) : {};
  });

  const [comments, setComments] = useState(() => {
    const saved = localStorage.getItem("festivalComments");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("festivalRatings", JSON.stringify(ratings));
  }, [ratings]);

  useEffect(() => {
    localStorage.setItem("festivalFavorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("festivalComments", JSON.stringify(comments));
  }, [comments]);

  if (!user) {
    return <p>ログインしてください</p>;
  }

  const handleRate = (id, rating) => {
    setRatings(prev => ({ ...prev, [id]: Number(rating) }));
  };

  const removeFavorite = (id) => {
    setFavorites(prev => ({ ...prev, [id]: false }));
  };

  const handleDeleteComment = (festivalId, index) => {
    setComments(prev => {
      const updated = { ...prev, [festivalId]: prev[festivalId].filter((_, i) => i !== index) };
      return updated;
    });
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>{user.username} さんのアカウント</h1>

      {/* お気に入り一覧 */}
      <section>
        <h2>お気に入りのお祭り</h2>
        {festivals.filter(f => favorites[f.id]).length === 0 && <p>お気に入りはありません</p>}
        {festivals.map(festival =>
          favorites[festival.id] ? (
            <div key={festival.id} style={{ marginBottom: "1rem" }}>
              <span>{festival.name}</span>
              <Favorite selected={true} onToggle={() => removeFavorite(festival.id)} />
              <button
                onClick={() => removeFavorite(festival.id)}
                style={{ marginLeft: "0.5rem", color: "red" }}
              >
                削除
              </button>
            </div>
          ) : null
        )}
      </section>

      {/* 評価一覧 */}
      <section style={{ marginTop: "2rem" }}>
        <h2>評価したお祭り</h2>
        {festivals.filter(f => ratings[f.id] > 0).length === 0 && <p>まだ評価していません</p>}
        {festivals.map(festival =>
          ratings[festival.id] > 0 ? (
            <div key={festival.id} style={{ marginBottom: "1rem" }}>
              <span>{festival.name}</span>
              <StarRating
                count={5}
                value={ratings[festival.id]}
                onRate={(rate) => handleRate(festival.id, rate)}
              />
            </div>
          ) : null
        )}
      </section>

      {/* コメント一覧 */}
      <section style={{ marginTop: "2rem" }}>
        <h2>コメントしたお祭り</h2>
        {festivals.filter(f => comments[f.id]?.length > 0).length === 0 && <p>まだコメントしていません</p>}
        {festivals.map(festival =>
          comments[festival.id]?.length > 0 ? (
            <div key={festival.id} style={{ marginBottom: "1rem" }}>
              <strong>{festival.name}</strong>
              <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                {comments[festival.id].map((c, i) => (
                  <li key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{c.name}: {c.text} ({c.date})</span>
                    <button
                      onClick={() => handleDeleteComment(festival.id, i)}
                      style={{ color: "red", cursor: "pointer" }}
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null
        )}
      </section>
    </div>
  );
}
