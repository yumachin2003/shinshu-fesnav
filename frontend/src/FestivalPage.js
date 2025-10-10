import React, { useState, useEffect, useContext } from "react";
import { festivals } from "./FestivalData";
import StarRating from "./StarRating";
import Favorite from "./Favorite";
import { UserContext } from "./App";

const safeParse = (key, fallback = {}) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

export default function FestivalPage() {
  const { user } = useContext(UserContext);
  const username = user?.username || null;

  const [ratings, setRatings] = useState({});
  const [favorites, setFavorites] = useState({});
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  // 初期ロード
  useEffect(() => {
    if (!username) return;

    // 個別データ（評価・お気に入り）
    const ratingsData = safeParse(`festivalRatings_${username}`, {});
    const favoritesData = safeParse(`festivalFavorites_${username}`, {});
    setRatings(ratingsData);
    setFavorites(favoritesData);

    // コメントは全員分
    const commentsData = safeParse("festivalComments", {});
    setComments(commentsData);
  }, [username]);

  // 保存
  const saveComments = (updated) => {
    setComments(updated);
    localStorage.setItem("festivalComments", JSON.stringify(updated));
  };

  const handleRate = (id, value) => {
    const updated = { ...ratings, [id]: Number(value) };
    setRatings(updated);
    localStorage.setItem(`festivalRatings_${username}`, JSON.stringify(updated));
  };

  const toggleFavorite = (id) => {
    const updated = { ...favorites, [id]: !favorites[id] };
    setFavorites(updated);
    localStorage.setItem(`festivalFavorites_${username}`, JSON.stringify(updated));
  };

  const handleAddComment = (id) => {
    const text = commentInputs[id];
    if (!text?.trim()) return;
    const newComment = {
      user: username,
      text,
      timestamp: Date.now(),
      date: new Date().toLocaleString(),
    };
    const updated = { ...comments, [id]: [...(comments[id] || []), newComment] };
    setCommentInputs((prev) => ({ ...prev, [id]: "" }));
    saveComments(updated);
  };

  const handleDeleteComment = (id, timestamp) => {
    const updated = { ...comments, [id]: comments[id].filter((c) => c.timestamp !== timestamp) };
    saveComments(updated);
  };

  const handleEditComment = (id, timestamp) => {
    setEditId(`${id}-${timestamp}`);
    const target = comments[id].find((c) => c.timestamp === timestamp);
    setEditText(target.text);
  };

  const handleSaveEdit = (id, timestamp) => {
    if (!editText.trim()) return;
    const updated = {
      ...comments,
      [id]: comments[id].map((c) =>
        c.timestamp === timestamp ? { ...c, text: editText, date: new Date().toLocaleString() } : c
      ),
    };
    setEditId(null);
    setEditText("");
    saveComments(updated);
  };

  if (!username)
    return (
      <div style={{ padding: "2rem" }}>
        <h2>ログインが必要です。</h2>
        <p>
          <a href="/" style={{ color: "#007bff" }}>ログインページへ</a> または{" "}
          <a href="/register" style={{ color: "#007bff" }}>新規登録</a> に進んでください。
        </p>
      </div>
    );

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>長野県のお祭り</h1>

      {festivals.map((f) => (
        <div key={f.id} style={{ marginBottom: "2rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px", maxWidth: "500px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>{f.name}</h2>
            <Favorite selected={favorites[f.id]} onToggle={() => toggleFavorite(f.id)} />
            {favorites[f.id] && (
              <button
                onClick={() => toggleFavorite(f.id)}
                style={{ marginLeft: "0.5rem", color: "red", cursor: "pointer", border: "none", background: "transparent" }}
              >
                お気に入り解除
              </button>
            )}
          </div>

          <StarRating count={5} value={ratings[f.id] || 0} onRate={(rate) => handleRate(f.id, rate)} />

          <div style={{ marginTop: "1rem" }}>
            <input
              type="text"
              placeholder="コメントを追加"
              value={commentInputs[f.id] || ""}
              onChange={(e) => setCommentInputs((prev) => ({ ...prev, [f.id]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(f.id); }}
              style={{ width: "100%", padding: "0.5rem" }}
            />
            <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem" }}>
              {(comments[f.id] || []).map((c) => {
                const isEditing = editId === `${f.id}-${c.timestamp}`;
                return (
                  <li key={c.timestamp} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", padding: "0.3rem 0" }}>
                    <div>
                      <strong>{c.user}</strong>（{c.date}）:
                      {isEditing ? (
                        <input value={editText} onChange={(e) => setEditText(e.target.value)} />
                      ) : (
                        <> {c.text}</>
                      )}
                    </div>
                    {c.user === username && (
                      <div>
                        {isEditing ? (
                          <button onClick={() => handleSaveEdit(f.id, c.timestamp)}>保存</button>
                        ) : (
                          <>
                            <button onClick={() => handleEditComment(f.id, c.timestamp)}>編集</button>
                            <button onClick={() => handleDeleteComment(f.id, c.timestamp)} style={{ marginLeft: "0.3rem", color: "red" }}>削除</button>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
