// src/AccountPage.js
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./App";
import { getFestivals } from "./utils/apiService"; // APIサービスをインポート
import StarRating from "./StarRating";
import { initGoogleTranslate } from "./utils/translate"; // 翻訳機能
import { addEditLog, getAllEditLogs } from "./utils/editLog"; // 履歴機能

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
  const [festivals, setFestivals] = useState([]); // お祭りデータを保持するstate
  const [showAllLogs, setShowAllLogs] = useState(false); // UIトグルのみ

  // Google翻訳初期化
  useEffect(() => initGoogleTranslate(), []);

  useEffect(() => {
    // コンポーネントがマウントされたら、一度だけお祭りデータを取得する
    // APIからお祭りデータを取得
    const fetchFestivals = async () => {
      try {
        const response = await getFestivals();
        setFestivals(response.data);
      } catch (error) {
        console.error("お祭りデータの読み込みに失敗しました。", error);
      }
    };
    fetchFestivals();
  }, []); // 依存配列を空にすることで、初回レンダリング時に一度だけ実行される

  // ユーザーデータ読み込み
  useEffect(() => {
    if (!user) return;

    setFavorites(safeParse(`festivalFavorites_${user.username}`, {}));
    setRatings(safeParse(`festivalRatings_${user.username}`, {}));
    setDiaries(safeParse(`festivalDiaries_${user.username}`, {}));

    // 履歴取得（初回のみ）
    const logs = getAllEditLogs(user.username, false);
    setEditLogs(logs);
  }, [user]);

  const saveData = (key, data) =>
    localStorage.setItem(`${key}_${user.username}`, JSON.stringify(data));

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

  // すべての写真をフラット配列で取得
  const allPhotos = Object.values(diaries).flat(1).filter((e) => e.image);

  // 編集履歴追加
  const logEditAction = (festival, content) => {
    addEditLog(user.username, festival.id, festival.name, content); // localStorage 更新

    const newLog = {
      festival: festival.name,
      content,
      date: new Date().toLocaleString(),
    };

    setEditLogs((prev) => [...prev, newLog]); // ⚠ 無限ループ回避
  };

  // 写真操作: 追加
  const handleAddPhoto = (fid, file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const updated = { ...diaries };
      if (!updated[fid]) updated[fid] = [];
      updated[fid].push({
        text: "",
        image: reader.result,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now(),
      });
      saveDiaries(updated);
      logEditAction(festivals.find(f => f.id === fid), "写真を追加しました");
    };
    reader.readAsDataURL(file);
  };

  // 写真操作: 削除
  const handleDeletePhoto = (fid, timestamp) => {
    const updated = { ...diaries };
    updated[fid] = updated[fid].filter((x) => x.timestamp !== timestamp);
    saveDiaries(updated);
    logEditAction(festivals.find(f => f.id === fid), "写真を削除しました");
  };

  // 写真操作: 差し替え
  const handleChangePhoto = (fid, timestamp, file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const updated = { ...diaries };
      const idx = updated[fid].findIndex((x) => x.timestamp === timestamp);
      if (idx !== -1) {
        updated[fid][idx].image = reader.result;
        saveDiaries(updated);
        logEditAction(festivals.find(f => f.id === fid), "写真を変更しました");
      }
    };
    reader.readAsDataURL(file);
  };

  // CSV出力
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
    a.download = `festivalEditLogs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return <p>ログインが必要です。</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      {/* Google翻訳ウィジェット */}
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

      {/* 上部固定ログアウトバー */}
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

      {/* ⭐ 星の評価 */}
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
              logEditAction(f, `星評価を ${r} に変更しました`);
            }}
          />
        </div>
      ))}

      {/* ❤️ お気に入り */}
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
                    logEditAction(f, "お気に入りを解除しました");
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

      {/* 日記 */}
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
                    logEditAction(f, "日記内容を編集しました");
                  }}
                  style={{ width: "100%", height: "60px" }}
                />
                {entry.image && (
                  <>
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
                    <div style={{ marginTop: "5px" }}>
                      <button
                        onClick={() => handleDeletePhoto(fid, entry.timestamp)}
                        style={{
                          background: "#ff4444",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          padding: "4px 8px",
                          cursor: "pointer",
                          marginRight: "5px",
                        }}
                      >
                        削除
                      </button>
                      <label
                        style={{
                          background: "#2196f3",
                          color: "white",
                          borderRadius: "5px",
                          padding: "4px 8px",
                          cursor: "pointer",
                        }}
                      >
                        変更
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) =>
                            handleChangePhoto(fid, entry.timestamp, e.target.files[0])
                          }
                        />
                      </label>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )
      )}

      {/* 写真追加 */}
      <h3>📸 写真を追加</h3>
      {festivals.map((f) => (
        <div key={f.id} style={{ marginBottom: "1rem" }}>
          <strong>{f.name}</strong>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleAddPhoto(f.id, e.target.files[0])}
          />
        </div>
      ))}

      {/* アップロード写真アルバム */}
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

      {/* 編集履歴ログ */}
      <h2 style={{ marginTop: "2rem" }}>🕒 編集履歴ログ</h2>
      <button
        onClick={() => setShowAllLogs((prev) => !prev)}
        style={{
          marginBottom: "1rem",
          backgroundColor: "#2196f3",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "8px 12px",
          cursor: "pointer",
        }}
      >
        {showAllLogs ? "自分の履歴に戻す" : "全期間の履歴を見る"}
      </button>
      <button
        onClick={handleExportCSV}
        style={{
          marginLeft: "10px",
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

      {editLogs.length === 0 ? (
        <p>まだ編集履歴はありません。</p>
      ) : (
        <ul>
          {editLogs.map((log, i) => (
            <li key={i} style={{ marginBottom: "0.5rem" }}>
              <strong>{log.festival}</strong> — {log.date}
              <br />
              <span style={{ color: "#555" }}>{log.content}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
