import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid'; // 週表示用プラグイン
import listPlugin from '@fullcalendar/list';       // リスト表示用プラグイン
import interactionPlugin from '@fullcalendar/interaction';
import { Modal, Title, Text, Group, Button, Stack } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconCalendar, IconMapPin } from '@tabler/icons-react';

// FullCalendarのスタイルをインポート
import './FestivalCalendar.css';

export default function FestivalCalendar({ festivals }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  // お祭りデータをFullCalendarが要求する形式に変換
  const events = festivals.map(festival => {
    // 日付の比較用に今日の0時0分0秒のDateオブジェクトを生成
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const festivalDate = new Date(festival.date);
    festivalDate.setHours(0, 0, 0, 0);

    let eventColor = '#339AF0'; // デフォルトの色 (青: 開催予定)
    if (festivalDate < today) {
      eventColor = 'gray'; // 開催済み
    } else if (festivalDate.getTime() === today.getTime()) {
      eventColor = '#FA5252'; // 今日開催 (赤)
    }

    return {
      id: festival.id,
      title: festival.name,
      start: festival.date,
      extendedProps: {
        location: festival.location,
      },
      color: eventColor, // イベントの色を設定
    };
  });

  // カレンダー上のイベントがクリックされたときの処理
  const handleEventClick = (clickInfo) => {
    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start,
      location: clickInfo.event.extendedProps.location,
    });
  };

  // モーダルを閉じる処理
  const closeModal = () => {
    setSelectedEvent(null);
  };

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listWeek' // 表示形式の切り替えボタン
        }}
        events={events}
        eventClick={handleEventClick}
        locale="ja" // 日本語化
        buttonText={{
          today: '今日',
          month: '月',
          week: '週',
          list: 'リスト',
        }}
        height="auto" // コンテナの高さに合わせる
        contentHeight="auto"
      />

      {/* イベント詳細を表示するモーダル */}
      <Modal
        opened={selectedEvent !== null}
        onClose={closeModal}
        title={<Title order={3}>{selectedEvent?.title}</Title>}
        centered
      >
        {selectedEvent && (
          <Stack>
            <Group>
              <IconCalendar size={18} />
              <Text>{new Date(selectedEvent.start).toLocaleDateString('ja-JP')}</Text>
            </Group>
            <Group>
              <IconMapPin size={18} />
              <Text>{selectedEvent.location || '場所未定'}</Text>
            </Group>
            <Button
              component={Link}
              to={`/festivals/${selectedEvent.id}`}
              fullWidth
              mt="md"
              onClick={closeModal} // 詳細ページに移動したらモーダルを閉じる
            >
              もっと詳しく見る
            </Button>
          </Stack>
        )}
      </Modal>
    </>
  );
}
