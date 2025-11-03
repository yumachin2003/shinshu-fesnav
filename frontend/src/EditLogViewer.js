import React, { useState } from "react";

const safeParse = (key, fallback = {}) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

export default function EditLogViewer({ userEditLogs }) {
  const [showAllLogs, setShowAllLogs] = useState(false);

  // --- 編集履歴全期間取得 ---
  const getAllEditLogs = () => {
    if (!showAllLogs) return userEditLogs;

    const logs = [];
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("festivalEditLogs_")) {
        const userLogs = safeParse(key, []);
        logs.push(...userLogs);
      }
    });
    return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const handleExportCSV = () => {
    const logsToExport = getAllEditLogs();
    if (logsToExport.length === 0) {
      alert("出力する編集履歴がありません。");
      return;
    }

    const headers = ["お祭り名", "編集内容", "日時"];
    const rows = logsToExport.map((log) => [
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

  const logsToShow = getAllEditLogs();

  if (!logsToShow.length) return <p>まだ編集履歴はありません。</p>;

  return (
    <div>
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

      <button
        onClick={() => setShowAllLogs((prev) => !prev)}
        style={{
          marginBottom: "1rem",
          marginLeft: "10px",
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

      <ul>
        {logsToShow.map((log, i) => (
          <li key={i} style={{ marginBottom: "0.5rem" }}>
            <strong>{log.festival}</strong> — {log.date}
            <br />
            <span style={{ color: "#555" }}>{log.content}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
