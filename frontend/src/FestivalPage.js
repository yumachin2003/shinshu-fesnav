// src/FestivalPage.js
import React, { useState, useEffect, useContext } from "react";
import StarRating from "./StarRating";
import Favorite from "./Favorite";
import { UserContext } from "./App";
import { getFestivals } from "./apiService"; // APIサービスをインポート
import { initGoogleTranslate } from "./utils/translate";
import { addEditLog } from "./utils/editLog";

// localStorageから安全にデータを取得する
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

  const [festivals, setFestivals] = useState([]); // APIから取得したお祭りデータ
  const [isLoading, setIsLoading] = useState(true); // ローディング状態
  const [error, setError] = useState(null); // エラー状態
  // 翻訳機能の初期化
  useEffect(() => {
    initGoogleTranslate();
  }, []);

  const [ratings, setRatings] = useState({});
  const [favorites, setFavorites] = useState({});
  const [diaries, setDiaries] = useState({});
  const [newDiary, setNewDiary] = useState({});
  const [newImage, setNewImage] = useState({});
  const [editing, setEditing] = useState({});

  // APIからお祭りデータを取得する
  useEffect(() => {
    const fetchFestivals = async () => {
      try {
        const response = await getFestivals();
        setFestivals(response.data);
      } catch (err) {
        console.error("データ取得エラー:", err);
        setError("お祭り情報を読み込めませんでした。");
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchFestivals();
    }
  }, [username]);

  // ユーザーごとのデータをロード
  useEffect(() => {
    if (!username) return;
    setRatings(safeParse(`festivalRatings_${username}`, {}));
    setFavorites(safeParse(`festivalFavorites_${username}`, {}));
    setDiaries(safeParse(`festivalDiaries_${username}`, {}));
  }, [username]);

  const saveData = (key, data) => {
    try {
      localStorage.setItem(`${key}_${username}`, JSON.stringify(data));
    } catch (error) {
      alert("保存できません：容量制限を超えています。不要な日記を削除してください。");
    }
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

  // 日記保存（新規・編集共通）
  const handleSaveDiary = (id) => {
    const text = newDiary[id]?.trim();
    if (!text && !newImage[id]) return;

    const updated = { ...diaries };
    const now = new Date().toLocaleString();

    const editTimestamp = editing[id];
    if (editTimestamp) {
      updated[id] = updated[id].map((d) =>
        d.timestamp === editTimestamp
          ? { ...d, text, image: newImage[id] ?? d.image, date: now }
          : d
      );
      addEditLog(username, id, `日記を編集しました: ${text}`);
      setEditing((prev) => ({ ...prev, [id]: null }));
    } else {
      const newEntry = {
        text: text || "",
        image: newImage[id] || null,
        timestamp: Date.now(),
        date: now,
      };
      updated[id] = [...(updated[id] || []), newEntry];
      addEditLog(username, id, `新しい日記を投稿しました: ${text}`);
    }

    saveDiaries(updated);
    setNewDiary((prev) => ({ ...prev, [id]: "" }));
    setNewImage((prev) => ({ ...prev, [id]: null }));
  };

  // 日記削除
  const handleDeleteDiary = (id, timestamp) => {
    if (!window.confirm("この日記を削除しますか？")) return;
    const updated = {
      ...diaries,
      [id]: diaries[id].filter((entry) => entry.timestamp !== timestamp),
    };
    saveDiaries(updated);
    addEditLog(username, id, "日記を削除しました。");
  };

  // 日記編集開始
  const handleEditDiary = (id, entry) => {
    setNewDiary((prev) => ({ ...prev, [id]: entry.text }));
    setNewImage((prev) => ({ ...prev, [id]: entry.image || null }));
    setEditing((prev) => ({ ...prev, [id]: entry.timestamp }));
  };

  // 編集キャンセル
  const handleCancelEdit = (id) => {
    if (!window.confirm("編集をキャンセルしますか？\n変更内容は保存されません。")) return;
    setNewDiary((prev) => ({ ...prev, [id]: "" }));
    setNewImage((prev) => ({ ...prev, [id]: null }));
    setEditing((prev) => ({ ...prev, [id]: null }));
  };

  // 画像アップロード
  const handleImageUpload = (e, id) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewImage((prev) => ({ ...prev, [id]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  if (!username)
    return (
      <div style={{ padding: "2rem" }}>
        <h2>ログインが必要です。</h2>
        <a href="/">ログインページへ</a>
      </div>
    );

  // ローディング中の表示
  if (isLoading) {
    return <div style={{ padding: "2rem" }}>読み込み中...</div>;
  }

  // エラー発生時の表示
  if (error) {
    return <div style={{ padding: "2rem", color: 'red' }}>🚨 {error}</div>;
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      {/* 翻訳ウィジェット */}
      <div id="google_translate_element" style={{ position: "fixed", bottom: 10, left: 10, zIndex: 9999 }}></div>

      <h1>長野県のお祭り</h1>

      {festivals.map((f) => (
        <div
          key={f.id}
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            maxWidth: "600px",
          }}
        >
          <h2>{f.name}</h2>

          {/* お気に入り */}
          <Favorite
            selected={favorites[f.id]}
            onToggle={() => {
              const updated = { ...favorites, [f.id]: !favorites[f.id] };
              saveFavorites(updated);
            }}
          />

          {/* 評価 */}
          <StarRating
            count={5}
            value={ratings[f.id] || 0}
            onRate={(r) => {
              const updated = { ...ratings, [f.id]: r };
              saveRatings(updated);
            }}
          />

          {/* 日記入力欄 */}
          <div style={{ marginTop: "1rem" }}>
            <textarea
              placeholder="今日の日記を書こう！"
              value={newDiary[f.id] || ""}
              onChange={(e) =>
                setNewDiary((prev) => ({ ...prev, [f.id]: e.target.value }))
              }
              style={{ width: "100%", height: "80px", padding: "0.5rem" }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, f.id)}
              style={{ marginTop: "0.5rem" }}
            />
            {newImage[f.id] && (
              <img
                src={newImage[f.id]}
                alt="プレビュー"
                style={{ width: "100%", marginTop: "0.5rem", borderRadius: "8px" }}
              />
            )}
            <div style={{ marginTop: "0.5rem" }}>
              <button
                onClick={() => handleSaveDiary(f.id)}
                style={{
                  backgroundColor: editing[f.id] ? "#4caf50" : "#ffb74d",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  padding: "0.4rem 0.8rem",
                  cursor: "pointer",
                  marginRight: "0.5rem",
                }}
              >
                {editing[f.id] ? "更新する" : "日記を保存"}
              </button>
              {editing[f.id] && (
                <button
                  onClick={() => handleCancelEdit(f.id)}
                  style={{
                    backgroundColor: "#9e9e9e",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    padding: "0.4rem 0.8rem",
                    cursor: "pointer",
                  }}
                >
                  キャンセル
                </button>
              )}
            </div>
          </div>

          {/* 日記一覧 */}
          {diaries[f.id] && diaries[f.id].length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <h3>📔 自分の日記一覧</h3>
              {diaries[f.id].map((entry) => (
                <div
                  key={entry.timestamp}
                  style={{
                    borderTop: "1px solid #ddd",
                    paddingTop: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <p style={{ fontSize: "0.9rem", color: "#555" }}>{entry.date}</p>
                  {entry.image && (
                    <img
                      src={entry.image}
                      alt="投稿写真"
                      style={{ width: "100%", maxWidth: "400px", borderRadius: "8px", marginBottom: "0.5rem" }}
                    />
                  )}
                  <p>{entry.text}</p>
                  <div style={{ marginTop: "0.5rem" }}>
                    <button
                      onClick={() => handleEditDiary(f.id, entry)}
                      style={{
                        marginRight: "0.5rem",
                        backgroundColor: "#64b5f6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "3px 8px",
                        cursor: "pointer",
                      }}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteDiary(f.id, entry.timestamp)}
                      style={{
                        backgroundColor: "#ef5350",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "3px 8px",
                        cursor: "pointer",
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
