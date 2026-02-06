import React from "react";
import { Button, Menu, rem } from '@mantine/core';
import { IconCalendarPlus, IconBrandGoogle, IconDownload, IconChevronDown } from '@tabler/icons-react';
import googleCalendarLogo from "../img/google_calender.png";

/**
 * カレンダー追加ボタン（Googleカレンダー / iCal / Outlook）
 * @param {Object} props
 * @param {string} props.name
 * @param {string} props.location
 * @param {string} props.date
 * @param {number} [props.festivalId]
 * @param {string} [props.description]
 */
export default function AddToCalendarButton({ name, location, date, festivalId, description }) {
  // 終日イベント用に日付を整形 (YYYYMMDD)
  const formatAllDay = (d) => d ? d.replace(/-/g, "") : "";
  
  // 翌日の日付を取得 (YYYYMMDD)
  const getNextDay = (d) => {
    if (!d) return "";
    const dateObj = new Date(d);
    dateObj.setDate(dateObj.getDate() + 1);
    return dateObj.toISOString().split('T')[0].replace(/-/g, "");
  };

  const start = formatAllDay(date);
  const end = getNextDay(date);
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const festivalUrl = festivalId ? `${window.location.origin}/festivals/${festivalId}` : window.location.href;
  
  const detailsContent = description || `${name}（${location}）のお祭りです。`;

  const createGoogleCalendarUrl = () => {
    const baseUrl = "https://www.google.com/calendar/render";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: name,
      location,
      details: `${detailsContent}\n詳細: ${festivalUrl}`,
      dates: `${start}/${end}`,
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const handleGoogleCalendarClick = () => {
    const url = createGoogleCalendarUrl();
    const width = 1200;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      url,
      "google-calendar",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
    );
  };

  const createICSFile = () => {

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Festival Calendar//JP
BEGIN:VEVENT
UID:${Date.now()}@festival.jp
DTSTAMP:${now}
DTSTART;VALUE=DATE:${start}
DTEND;VALUE=DATE:${end}
SUMMARY:${name}
LOCATION:${location}
URL:${festivalUrl}
DESCRIPTION:${detailsContent.replace(/\n/g, "\\n")}
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
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

  const handleICalClick = () => {
    createICSFile();
  };

  return (
    <Menu transitionProps={{ transition: 'pop' }} position="bottom-end" withinPortal zIndex={1500}>
      <Menu.Target>
        <Button
          variant="light"
          color="blue"
          leftSection={<IconCalendarPlus style={{ width: rem(18), height: rem(18) }} stroke={1.5} />}
          rightSection={<IconChevronDown style={{ width: rem(18), height: rem(18) }} stroke={1.5} />}
          pr={12}
        >
          カレンダーに追加
        </Button>
      </Menu.Target>
      <Menu.Dropdown className="glass-dropdown">
        <Menu.Item
          leftSection={<img src={googleCalendarLogo} alt="Google Calendar Logo" style={{ width: rem(16), height: rem(16) }}/>}
          onClick={handleGoogleCalendarClick}
        >
          Googleカレンダー
        </Menu.Item>
        <Menu.Item
          leftSection={<IconDownload style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
          onClick={handleICalClick}
        >
          端末に追加（iCal形式）
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
