// src/components/Diary/useDiary.js
import { useState } from "react";
import { updateDiaries, addEditLogToBackend } from "../../utils/apiService";

export default function useDiary({ user, festival, diaries, setDiaries }) {
  const [newDiary, setNewDiary] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [editing, setEditing] = useState(null);

  // 編集履歴追加
  const logEditAction = async (content) => {
    if (!user || !festival) return;

    const log = {
      festival_id: festival.id,
      festival_name: festival.name,
      content,
      date: new Date().toISOString(),
    };

    try {
      await addEditLogToBackend(log);
    } catch (err) {
      console.error("編集履歴の保存に失敗:", err);
    }
  };

  // 日記保存
const handleSaveDiary = async () => {
  // ★★★ ログインチェック（OK/キャンセル付き） ★★★
  if (!user) {
    const goLogin = window.confirm(
      "この機能はログインすると使えます。\nログインページに移動しますか？"
    );

    // OK → ログインページへ
    if (goLogin) {
      window.location.href = "/login";
    }

    // キャンセル → 現在のページに残る
    return;
  }

  // ★★ text を定義（←これが必須！） ★★
  const text = newDiary.trim();
  if (!text && !newImage) return;

  const updated = { ...diaries };
  const now = new Date().toLocaleString();

  if (editing) {
    updated[festival.id] = updated[festival.id].map((d) =>
      d.timestamp === editing.timestamp
        ? { ...d, text, image: newImage ?? d.image, date: now }
        : d
    );
    await logEditAction(`日記を編集: ${text}`);
    setEditing(null);
  } else {
    const newEntry = {
      text,
      image: newImage,
      timestamp: Date.now(),
      date: now,
    };
    updated[festival.id] = [...(updated[festival.id] || []), newEntry];
    await logEditAction(`新しい日記を投稿: ${text}`);
  }

  setDiaries(updated);
  await updateDiaries(updated);

  setNewDiary("");
  setNewImage(null);
};


  // 編集開始
  const handleEditDiary = (entry) => {
    setNewDiary(entry.text);
    setNewImage(entry.image || null);
    setEditing(entry);
  };

  // 削除
  const handleDeleteDiary = async (id, timestamp) => {
    if (!window.confirm("日記を削除しますか？")) return;

    const updated = {
      ...diaries,
      [id]: diaries[id].filter((e) => e.timestamp !== timestamp),
    };

    setDiaries(updated);
    await updateDiaries(updated);
    await logEditAction("日記を削除しました");
  };

  // キャンセル
  const handleCancelEdit = () => {
    if (!window.confirm("編集をキャンセルしますか？")) return;
    setNewDiary("");
    setNewImage(null);
    setEditing(null);
  };

  return {
    newDiary,
    setNewDiary,
    newImage,
    setNewImage,
    editing,
    handleSaveDiary,
    handleEditDiary,
    handleDeleteDiary,
    handleCancelEdit,
  };
}
