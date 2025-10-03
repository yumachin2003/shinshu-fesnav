// FestivalPage.js
import React, { useState, useEffect } from "react";
import StarRating from "./StarRating";
import Favorite from "./Favorite";
import { festivals } from "./FestivalData";

export default function FestivalPage() {
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

  // 新規：お気に入り削除専用ボタン
  const removeFavorite = (id) => {
    setFavorites(prev => {
      const updated = { ...prev, [id]: false };
      localStorage.setItem("festivalFavorites", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>長野県のお祭り</h1>
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

          <StarRating
            count={5}
            value={ratings[festival.id] ?? 0}
            onRate={rate => handleRate(festival.id, rate)}
          />

          {/* お気に入り削除ボタン */}
          {favorites[festival.id] && (
            <button
              onClick={() => removeFavorite(festival.id)}
              style={{ marginTop: "0.5rem", color: "red", cursor: "pointer" }}
            >
              お気に入りから削除
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
