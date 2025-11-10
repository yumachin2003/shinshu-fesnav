import React from "react";

/**
 * Outlook / Apple カレンダー (ICSファイル) に追加するボタン
 * @param {Object} props
 * @param {string} props.name
 * @param {string} props.location
 * @param {string} props.date
 */
export default function AddToICalendarButton({ name, location, date }) {
  const startDateTime = `${date}T09:00:00`;
  const endDateTime = `${date}T17:00:00`;

  const createICSFile = () => {
    const start = formatDate(startDateTime);
    const end = formatDate(endDateTime);

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Festival Calendar//JP
BEGIN:VEVENT
UID:${Date.now()}@festival.jp
DTSTAMP:${start}
DTSTART:${start}
DTEND:${end}
SUMMARY:${name}
LOCATION:${location}
DESCRIPTION:${name}（${location}）のお祭りです。
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (datetime) => {
    const dateObj = new Date(datetime);
    return dateObj.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  return (
    <button
      onClick={createICSFile}
      className="festival-btn"
      style={{
        backgroundColor: "#0078d4",
        color: "white",
        border: "none",
        borderRadius: "6px",
        padding: "6px 12px",
        cursor: "pointer",
        fontSize: "0.9rem",
      }}
    >
      🗓 iCal / Outlook に追加
    </button>
  );
}
