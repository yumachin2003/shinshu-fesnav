import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import { getFestivals, getAccountData, updateFavorites, updateDiaries, getEditLogs, addEditLogToBackend } from "../utils/apiService";
import useApiData from '../hooks/useApiData';
import { initGoogleTranslate } from "../utils/translate";

export default function Account() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  // --- APIからデータを取得 ---
  // useApiDataフックを使って、お祭りデータとアカウントデータを取得
  const { data: festivals, loading: festivalsLoading, error: festivalsError } = useApiData(getFestivals);
  const { data: accountData, loading: accountLoading, error: accountError } = useApiData(getAccountData, [user?.id]); // user.idを依存配列に追加
  const { data: fetchedEditLogs, loading: editLogsLoading, error: editLogsError, refetch: refetchEditLogs } = useApiData(getEditLogs, [user?.id]); // 編集履歴もAPIから取得

  // --- Stateの定義 ---
  const [favorites, setFavorites] = useState({});
  const [diaries, setDiaries] = useState({});
  const [editLogs, setEditLogs] = useState([]); // 編集履歴のStateは残す
  const [showAllLogs, setShowAllLogs] = useState(false);

  // Google翻訳初期化
  useEffect(() => initGoogleTranslate(), []);

  // APIから取得したアカウントデータでStateを更新
  useEffect(() => {
    if (accountData) {
      setFavorites(accountData.favorites || {});
      setDiaries(accountData.diaries || {});
    }
  }, [accountData]);

  // APIから取得した編集履歴でStateを更新
  useEffect(() => {
    if (fetchedEditLogs) {
      setEditLogs(fetchedEditLogs);
    }
  }, [fetchedEditLogs]);
  
  // --- データ保存関数 (API呼び出し) ---
  const saveFavorites = async (updated) => {
    setFavorites(updated);
    await updateFavorites(updated).catch(err => console.error("お気に入りの更新に失敗", err));
  };

  const saveDiaries = async (updated) => {
    setDiaries(updated);
    await updateDiaries(updated).catch(err => console.error("日記の更新に失敗", err));
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    navigate("/");
  };

  // 編集履歴追加
  const logEditAction = async (festival, content) => {
    if (!user || !festival) return;

    const newLogData = {
      festival_id: festival.id,
      festival_name: festival.name,
      content: content,
      date: new Date().toISOString(), // ISO形式でバックエンドに送信
    };

    try {
      await addEditLogToBackend(newLogData);
      refetchEditLogs(); // 履歴を再取得してUIを更新
    } catch (error) {
      console.error("編集履歴の保存に失敗しました:", error);
    }
  };

  // すべての写真をフラット配列で取得
  const allPhotos = Object.values(diaries).flat(1).filter((e) => e.image);

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

  // ローディングとエラーの状態管理 (編集履歴のローディングも追加)
  const isLoading = festivalsLoading || accountLoading || editLogsLoading;
  if (isLoading) {
    return <p>データを読み込み中...</p>;
  }
  if (!user || festivalsError || accountError || editLogsError) {
    // ログインページにリダイレクトするか、エラーメッセージを表示
    return <p style={{ color: 'red' }}>データの読み込みに失敗しました: {festivalsError?.message || accountError?.message || editLogsError?.message || '不明なエラー'}</p>;
  }

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

      {editLogs && editLogs.length === 0 ? (
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
