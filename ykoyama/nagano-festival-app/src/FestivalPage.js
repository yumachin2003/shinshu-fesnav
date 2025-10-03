import React, { useState, useEffect, useContext } from "react";
import { festivals } from "./FestivalData";
import StarRating from "./StarRating";
import Favorite from "./Favorite";
import { UserContext } from "./App";

const safeParse = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : {};
  } catch {
    return {};
  }
};

export default function FestivalPage() {
  const { user } = useContext(UserContext);
  const username = user?.username || "名無し";

  const [ratings, setRatings] = useState(() => safeParse("festivalRatings"));
  const [favorites, setFavorites] = useState(() => safeParse("festivalFavorites"));
  const [comments, setComments] = useState(() => safeParse("festivalComments"));
  const [commentInputs, setCommentInputs] = useState({});
  const [editId, setEditId] = useState(null); // 編集中のコメントID
  const [editText, setEditText] = useState("");

  useEffect(() => localStorage.setItem("festivalRatings", JSON.stringify(ratings)), [ratings]);
  useEffect(() => localStorage.setItem("festivalFavorites", JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem("festivalComments", JSON.stringify(comments)), [comments]);

  const handleRate = (id, value) => setRatings(prev => ({ ...prev, [id]: Number(value) }));  
  const toggleFavorite = (id) => setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  
  const handleAddComment = (id, text) => {
    if (!text.trim()) return;
    const newComment = { name: username, text, date: new Date().toLocaleString() };
    setComments(prev => ({ ...prev, [id]: [...(prev[id] || []), newComment] }));
    setCommentInputs(prev => ({ ...prev, [id]: "" }));
  };

  const handleDeleteComment = (id, index) => {
    setComments(prev => ({ ...prev, [id]: prev[id].filter((_, i) => i !== index) }));
  };

  const handleEditComment = (id, index) => {
    setEditId(`${id}-${index}`);
    setEditText(comments[id][index].text);
  };

  const handleSaveEdit = (id, index) => {
    if (!editText.trim()) return;
    setComments(prev => {
      const updated = [...prev[id]];
      updated[index] = { ...updated[index], text: editText, date: new Date().toLocaleString() };
      return { ...prev, [id]: updated };
    });
    setEditId(null);
    setEditText("");
  };

  if (!user) return <p>ログインしてください</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>長野県のお祭り</h1>
      {festivals.map(f => (
        <div key={f.id} style={{ marginBottom: "2rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px", maxWidth: "500px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>{f.name}</h2>
            <Favorite selected={favorites[f.id]} onToggle={() => toggleFavorite(f.id)} />
            {favorites[f.id] && (
              <button onClick={() => toggleFavorite(f.id)} style={{ marginLeft: "0.5rem", color: "red", cursor: "pointer" }}>お気に入り解除</button>
            )}
          </div>

          <StarRating count={5} value={ratings[f.id] || 0} onRate={rate => handleRate(f.id, rate)} />

          <div style={{ marginTop: "1rem" }}>
            <input
              type="text"
              placeholder="コメントを追加"
              value={commentInputs[f.id] || ""}
              onChange={e => setCommentInputs(prev => ({ ...prev, [f.id]: e.target.value }))}
              onKeyDown={e => {
                if (e.key === "Enter") handleAddComment(f.id, commentInputs[f.id] || "");
              }}
              style={{ width: "100%", padding: "0.5rem" }}
            />
            <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem" }}>
              {(comments[f.id] || []).map((c, i) => {
                const isEditing = editId === `${f.id}-${i}`;
                return (
                  <li key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", padding: "0.3rem 0" }}>
                    <div>
                      <strong>{c.name}</strong> ({c.date}):{" "}
                      {isEditing ? (
                        <input value={editText} onChange={e => setEditText(e.target.value)} />
                      ) : (
                        c.text
                      )}
                    </div>
                    {c.name === username && (
                      <div>
                        {isEditing ? (
                          <button onClick={() => handleSaveEdit(f.id, i)}>保存</button>
                        ) : (
                          <>
                            <button onClick={() => handleEditComment(f.id, i)}>編集</button>
                            <button onClick={() => handleDeleteComment(f.id, i)} style={{ marginLeft: "0.3rem", color: "red" }}>削除</button>
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
