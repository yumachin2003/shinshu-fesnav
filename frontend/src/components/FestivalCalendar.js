import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Modal, Title, Text, Group, Button, Stack } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconCalendar, IconMapPin } from '@tabler/icons-react';

// FullCalendarのスタイルをインポート
import './FestivalCalendar.css';

export default function FestivalCalendar({ festivals }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  // お祭りデータをFullCalendarが要求する形式に変換
  const events = festivals.map(festival => ({
    id: festival.id,
    title: festival.name,
    start: festival.date,
    extendedProps: {
      location: festival.location,
    }
  }));

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
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth' // 週表示は一旦シンプルにするため削除
        }}
        events={events}
        eventClick={handleEventClick}
        locale="ja" // 日本語化
        buttonText={{
          today: '今日',
          month: '月',
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
