import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { festivals } from "./FestivalData";

const safeParse = (key, fallback = {}) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [ratings, setRatings] = useState({});
  const [favorites, setFavorites] = useState({});
  const [comments, setComments] = useState({});
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const alertShown = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = safeParse("loggedInUser", null);
    if (!storedUser && !alertShown.current) {
      alert("ログインが必要です。");
      alertShown.current = true;
      navigate("/");
      return;
    }
    if (!storedUser) return;

    setUser(storedUser);

    setRatings(safeParse(`festivalRatings_${storedUser.username}`, {}));
    setFavorites(safeParse(`festivalFavorites_${storedUser.username}`, {}));

    const allComments = safeParse("festivalComments", {});
    // 自分のコメントだけ抽出
    const myComments = {};
    Object.entries(allComments).forEach(([fid, clist]) => {
      const filtered = clist.filter((c) => c.user === storedUser.username);
      if (filtered.length) myComments[fid] = filtered;
    });
    setComments(myComments);
  }, [navigate]);

  const saveComments = (updated) => {
    setComments(updated);
    const allComments = safeParse("festivalComments", {});
    // 自分のコメントだけ更新
    Object.entries(updated).forEach(([fid, clist]) => {
      allComments[fid] = [
        ...(allComments[fid]?.filter((c) => c.user !== user.username) || []),
        ...clist,
      ];
    });
    localStorage.setItem("festivalComments", JSON.stringify(allComments));
  };

  const changeRating = (id, value) => {
    const updated = { ...ratings, [id]: Number(value) };
    setRatings(updated);
    localStorage.setItem(`festivalRatings_${user.username}`, JSON.stringify(updated));
  };

  const removeFavorite = (id) => {
    const updated = { ...favorites, [id]: false };
    setFavorites(updated);
    localStorage.setItem(`festivalFavorites_${user.username}`, JSON.stringify(updated));
  };

  const deleteComment = (fid, ts) => {
    const updated = { ...comments, [fid]: comments[fid].filter((c) => c.timestamp !== ts) };
    saveComments(updated);
  };

  const editComment = (fid, ts) => {
    setEditId(`${fid}-${ts}`);
    const t = comments[fid].find((c) => c.timestamp === ts);
    setEditText(t.text);
  };

  const saveCommentEdit = (fid, ts) => {
    const updated = {
      ...comments,
      [fid]: comments[fid].map((c) =>
        c.timestamp === ts ? { ...c, text: editText, date: new Date().toLocaleString() } : c
      ),
    };
    setEditId(null);
    setEditText("");
    saveComments(updated);
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    alert("ログアウトしました。");
    navigate("/");
  };

  if (!user) return null;

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>マイページ</h1>
      <p>ログイン中: <strong>{user.username}</strong></p>

      <button
        onClick={handleLogout}
        style={{
          background: "#f55",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "8px",
          marginBottom: "1rem"
        }}
      >
        ログアウト
      </button>

      <h2>⭐ 評価済みのお祭り</h2>
      <ul>
        {Object.entries(ratings)
          .filter(([_, v]) => v > 0)
          .map(([fid, value]) => {
            const f = festivals.find((x) => x.id === Number(fid));
            return (
              <li key={fid}>
                {f?.name || `ID:${fid}`} — {value}★{" "}
                <button onClick={() => changeRating(fid, prompt("新しい星(1-5):", value))}>
                  変更
                </button>
              </li>
            );
          })}
      </ul>

      <h2>💖 お気に入りのお祭り</h2>
      <ul>
        {Object.entries(favorites)
          .filter(([_, v]) => v)
          .map(([fid]) => {
            const f = festivals.find((x) => x.id === Number(fid));
            return (
              <li key={fid}>
                {f?.name || `ID:${fid}`}{" "}
                <button onClick={() => removeFavorite(fid)} style={{ color: "red" }}>解除</button>
              </li>
            );
          })}
      </ul>

      <h2>💬 自分のコメント</h2>
      <ul>
        {Object.entries(comments).length > 0 ? (
          Object.entries(comments).flatMap(([fid, clist]) =>
            clist.map((c) => {
              const isEditing = editId === `${fid}-${c.timestamp}`;
              const fest = festivals.find((f) => f.id === Number(fid));
              return (
                <li key={c.timestamp}>
                  <strong>{fest?.name}</strong> — {c.date}
                  <br />
                  {isEditing ? (
                    <>
                      <input value={editText} onChange={(e) => setEditText(e.target.value)} />
                      <button onClick={() => saveCommentEdit(fid, c.timestamp)}>保存</button>
                    </>
                  ) : (
                    <>
                      {c.text}{" "}
                      <button onClick={() => editComment(fid, c.timestamp)}>編集</button>
                      <button
                        onClick={() => deleteComment(fid, c.timestamp)}
                        style={{ color: "red" }}
                      >
                        削除
                      </button>
                    </>
                  )}
                </li>
              );
            })
          )
        ) : (
          <p>コメントはまだありません。</p>
        )}
      </ul>
    </div>
  );
}
