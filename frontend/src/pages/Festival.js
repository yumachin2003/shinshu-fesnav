// src/FestivalPage.js
import React, { useState, useEffect, useContext } from "react";
import Favorite from "../utils/Favorite";
import { UserContext } from "../App";
import { getFestivals, getAccountData, updateFavorites, updateDiaries, addEditLogToBackend } from "../utils/apiService";
import useApiData from '../hooks/useApiData';
import { initGoogleTranslate } from "../utils/translate";
import FestivalCalendar from '../components/FestivalCalendar'; // パスを修正
import FestivalMap from '../components/FestivalMap'; // パスを修正
import AddToGoogleCalendarButton from "../components/AddToGoogleCalendarButton";
import AddToICalendarButton from "../components/AddToICalendarButton";

export default function Festival() {
  const { user } = useContext(UserContext);

  // --- APIからデータを取得 ---
  const { data: festivals, loading: festivalsLoading, error: festivalsError } = useApiData(getFestivals);
  const { data: accountData, loading: accountLoading, error: accountError, refetch: refetchAccountData } = useApiData(getAccountData, [user?.id]);

  // --- Stateの定義 ---
  const [favorites, setFavorites] = useState({});
  const [diaries, setDiaries] = useState({});
  const [newDiary, setNewDiary] = useState({});
  const [newImage, setNewImage] = useState({});
  const [editing, setEditing] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', 'map'

  // --- useEffectフック ---
  useEffect(() => {
    initGoogleTranslate();
  }, []);

  // APIから取得したアカウントデータでStateを更新
  useEffect(() => {
    if (accountData) {
      setFavorites(accountData.favorites || {});
      setDiaries(accountData.diaries || {});
    }
  }, [accountData]);

  // --- データ保存関数 (API呼び出し) ---
  const saveFavorites = async (updated) => {
    setFavorites(updated);
    await updateFavorites(updated).catch(err => console.error("お気に入りの更新に失敗", err));
  };

  const saveDiaries = async (updated) => {
    setDiaries(updated);
    await updateDiaries(updated).catch(err => console.error("日記の更新に失敗", err));
  };

  // 編集履歴追加
  const logEditAction = async (festival, content) => {
    if (!user || !festival) return;

    const newLogData = {
      festival_id: festival.id,
      festival_name: festival.name,
      content: content,
      date: new Date().toISOString(),
    };

    try {
      await addEditLogToBackend(newLogData);
      // Accountページにいるわけではないので、ここでは再取得は不要
    } catch (error) {
      console.error("編集履歴の保存に失敗しました:", error);
    }
  };

  // 日記保存（新規・編集共通）
  const handleSaveDiary = async (id) => {
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
      const festival = festivals.find(f => f.id === id);
      logEditAction(festival, `日記を編集しました: ${text}`);
      setEditing((prev) => ({ ...prev, [id]: null }));
    } else {
      const newEntry = {
        text: text || "",
        image: newImage[id] || null,
        timestamp: Date.now(),
        date: now,
      };
      updated[id] = [...(updated[id] || []), newEntry];
      const festival = festivals.find(f => f.id === id);
      logEditAction(festival, `新しい日記を投稿しました: ${text}`);
    }

    await saveDiaries(updated);
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
    const festival = festivals.find(f => f.id === id);
    logEditAction(festival, "日記を削除しました。");
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

  const isLoading = festivalsLoading || (user && accountLoading);
  const error = festivalsError || (user && accountError);

  if (!user) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>ログインが必要です。</h2>
        <a href="/">ログインページへ</a>
      </div>
    );
  }

  if (isLoading) {
    return <div style={{ padding: "2rem" }}>読み込み中...</div>;
  }

  if (error) { // errorオブジェクトを直接描画しないように修正
    return <div style={{ padding: "2rem", color: 'red' }}>🚨 {error.message || 'データの読み込み中にエラーが発生しました。'}</div>;
  }

  // 表示するコンテンツをviewModeに応じて切り替える
  const renderContent = () => {
    if (!festivals) return null;

    switch (viewMode) {
      case 'calendar':
        return <FestivalCalendar festivals={festivals} />;
      case 'map':
        return <FestivalMap festivals={festivals} />;
      case 'list':
      default:
        return festivals.map((f) => (
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
            <AddToGoogleCalendarButton name={f.name} location={f.location} date={f.date} />
            <AddToICalendarButton name={f.name} location={f.location} date={f.date} />


            {/* お気に入り */}
            <Favorite
              selected={favorites[f.id]}
              onToggle={() => {
                const updated = { ...favorites, [f.id]: !favorites[f.id] };
                saveFavorites(updated);
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
                      <button onClick={() => handleEditDiary(f.id, entry)} style={{ marginRight: "0.5rem", backgroundColor: "#64b5f6", color: "white", border: "none", borderRadius: "4px", padding: "3px 8px", cursor: "pointer" }}>編集</button>
                      <button onClick={() => handleDeleteDiary(f.id, entry.timestamp)} style={{ backgroundColor: "#ef5350", color: "white", border: "none", borderRadius: "4px", padding: "3px 8px", cursor: "pointer" }}>削除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ));
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      {/* 翻訳ウィジェット */}
      <div id="google_translate_element" style={{ position: "fixed", bottom: 10, left: 10, zIndex: 9999 }}></div>
      
      <h1>長野県のお祭り</h1>

      {/* 表示モード切り替えボタン */}
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setViewMode('list')} disabled={viewMode === 'list'}>リスト</button>
        <button onClick={() => setViewMode('calendar')} disabled={viewMode === 'calendar'}>カレンダー</button>
        <button onClick={() => setViewMode('map')} disabled={viewMode === 'map'}>地図</button>
      </div>

      {/* コンテンツの描画 */}
      {renderContent()}
    </div>
  );
}
