import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { festivals } from "./FestivalData";
import { UserContext } from "./App";
import StarRating from "./StarRating";
import { initGoogleTranslate } from "./utils/translate"; // ✅ 翻訳機能の初期化関数をインポート

const safeParse = (key, fallback = {}) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

export default function AccountPage() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState({});
  const [ratings, setRatings] = useState({});
  const [diaries, setDiaries] = useState({});
  const [editLogs, setEditLogs] = useState([]);

  // ✅ 翻訳機能の初期化（右下に配置）
  useEffect(() => {
    initGoogleTranslate();
  }, []);

  useEffect(() => {
    if (!user) return;
    setFavorites(safeParse(`festivalFavorites_${user.username}`, {}));
    setRatings(safeParse(`festivalRatings_${user.username}`, {}));
    setDiaries(safeParse(`festivalDiaries_${user.username}`, {}));
    setEditLogs(safeParse(`festivalEditLogs_${user.username}`, []));
  }, [user]);

  const saveData = (key, data) => {
    localStorage.setItem(`${key}_${user.username}`, JSON.stringify(data));
  };

  const saveFavorites = (updated) => {
    setFavorites(updated);
    saveData("festivalFavorites", updated);
  };

  const saveRatings = (updated) => {
    setRatings(updated);
    saveData("festivalRatings", updated);
  };

  const saveDiaries = (updated) => {
    setDiaries(updated);
    saveData("festivalDiaries", updated);
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  const allPhotos = Object.values(diaries).flat().filter((e) => e.image);

  const handleExportCSV = () => {
    if (editLogs.length === 0) {
      alert("出力する編集履歴がありません。");
      return;
    }

    const headers = ["お祭り名", "編集内容", "日時"];
    const rows = editLogs.map((log) => [
      `"${log.festival}"`,
      `"${log.content.replace(/"/g, '""')}"`,
      `"${log.date}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `festivalEditLogs_${user.username}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return <p>ログインが必要です。</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      {/* 🌐 Google翻訳ウィジェット（右下固定） */}
      <div
        id="google_translate_element"
        style={{
          position: "fixed",
          bottom: 10,
          right: 10,
          zIndex: 9999,
          background: "white",
          borderRadius: "6px",
          padding: "4px",
          boxShadow: "0 0 6px rgba(0,0,0,0.1)",
        }}
      ></div>

      {/* 上部固定ログアウト */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "#fff8e1",
          padding: "10px 20px",
          borderBottom: "2px solid #ffd54f",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 100,
        }}
      >
        <h1 style={{ margin: 0 }}>{user.username}さんのマイページ</h1>
        <button
          onClick={handleLogout}
          style={{
            background: "#ff6666",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "6px 12px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ログアウト
        </button>
      </div>

      <h2>⭐ 星の評価</h2>
      {festivals.map((f) => (
        <div key={f.id}>
          <strong>{f.name}</strong>
          <StarRating
            count={5}
            value={ratings[f.id] || 0}
            onRate={(r) => {
              const updated = { ...ratings, [f.id]: r };
              saveRatings(updated);
            }}
          />
        </div>
      ))}

      <h2>❤️ お気に入りのお祭り</h2>
      <ul>
        {Object.entries(favorites)
          .filter(([_, v]) => v)
          .map(([fid]) => {
            const f = festivals.find((x) => x.id === Number(fid));
            return (
              <li key={fid}>
                {f?.name}
                <button
                  onClick={() => {
                    const updated = { ...favorites, [fid]: false };
                    saveFavorites(updated);
                  }}
                  style={{
                    marginLeft: "10px",
                    color: "red",
                    border: "1px solid red",
                    borderRadius: "5px",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  お気に入り解除
                </button>
              </li>
            );
          })}
      </ul>

      <h2>📔 自分の日記</h2>
      {Object.entries(diaries).length === 0 ? (
        <p>まだ日記はありません。</p>
      ) : (
        Object.entries(diaries).map(([fid, entries]) =>
          entries.map((entry) => {
            const f = festivals.find((x) => x.id === Number(fid));
            return (
              <div key={entry.timestamp} style={{ marginBottom: "1rem" }}>
                <strong>{f?.name}</strong> — {entry.date}
                <br />
                <textarea
                  value={entry.text}
                  onChange={(e) => {
                    const updated = { ...diaries };
                    const idx = updated[fid].findIndex(
                      (x) => x.timestamp === entry.timestamp
                    );
                    updated[fid][idx].text = e.target.value;
                    saveDiaries(updated);
                  }}
                  style={{ width: "100%", height: "60px" }}
                />
                {entry.image && (
                  <img
                    src={entry.image}
                    alt=""
                    style={{
                      width: "100%",
                      maxWidth: "400px",
                      borderRadius: "8px",
                      marginTop: "0.5rem",
                    }}
                  />
                )}
              </div>
            );
          })
        )
      )}

      <h2>📷 アップロード写真アルバム</h2>
      {allPhotos.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "10px",
          }}
        >
          {allPhotos.map((e, i) => (
            <img
              key={i}
              src={e.image}
              alt=""
              style={{
                width: "100%",
                height: "150px",
                objectFit: "cover",
                borderRadius: "10px",
              }}
            />
          ))}
        </div>
      ) : (
        <p>まだ写真がありません。</p>
      )}

      <h2 style={{ marginTop: "2rem" }}>🕒 編集履歴ログ</h2>

      {editLogs.length > 0 && (
        <button
          onClick={handleExportCSV}
          style={{
            marginBottom: "1rem",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          CSV形式で出力
        </button>
      )}

      {editLogs.length ? (
        <ul>
          {editLogs.map((log, i) => (
            <li key={i} style={{ marginBottom: "0.5rem" }}>
              <strong>{log.festival}</strong> — {log.date}
              <br />
              <span style={{ color: "#555" }}>{log.content}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>まだ編集履歴はありません。</p>
      )}
    </div>
  );
}
