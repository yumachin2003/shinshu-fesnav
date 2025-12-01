import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';

const FestivalCalendar = ({ festivals }) => {
  // FullCalendarで扱えるイベント形式にデータを変換
  const events = festivals.map(festival => ({
    id: festival.id,
    title: festival.name,
    date: festival.date,
    extendedProps: {
      location: festival.location,
      description: festival.description,
    }
  }));

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <FullCalendar
        plugins={[dayGridPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,listWeek' // 月表示と週リスト表示の切り替えボタン
        }}
        events={events}
        locale="ja" // 日本語化
        buttonText={{
          today: '今日',
          month: '月',
          list: '一覧'
        }}
      />
    </div>
  );
};

export default FestivalCalendar;