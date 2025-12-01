import React from "react";
import { Button } from '@mantine/core';

/**
 * Googleカレンダーにイベントを追加するボタン
 * @param {Object} props - イベント情報
 * @param {string} props.name - 祭りの名前
 * @param {string} props.location - 開催場所
 * @param {string} props.date - 開催日 (例: "2025-08-15")
 */
export default function AddToGoogleCalendarButton({ name, location, date }) {
  const startDateTime = `${date}T09:00:00`;
  const endDateTime = `${date}T17:00:00`;

  const createGoogleCalendarUrl = () => {
    const baseUrl = "https://www.google.com/calendar/render";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: name,
      location,
      details: `${name}（${location}）のお祭りです。`,
      dates: `${formatDate(startDateTime)}/${formatDate(endDateTime)}`,
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const formatDate = (datetime) => {
    const dateObj = new Date(datetime);
    return dateObj.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  return (
    <Button
      component="a"
      href={createGoogleCalendarUrl()}
      target="_blank"
      rel="noopener noreferrer"
      variant="light"
      color="green"
    >
      📅 Googleカレンダーに追加
    </Button>
  );
}
