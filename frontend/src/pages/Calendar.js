import React, { useState, useMemo, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  Modal, 
  Title, 
  Text, 
  Group, 
  Button, 
  Stack, 
  Paper, 
  Box, 
  List, 
  LoadingOverlay, 
  useMantineColorScheme,
  HoverCard
} from '@mantine/core';
import { useMediaQuery, useElementSize } from '@mantine/hooks';
import { IconCalendar, IconMapPin } from '@tabler/icons-react';
import { getFestivals } from '../utils/apiService';
import useApiData from '../hooks/useApiData';
import FestivalDetail from "../components/FestivalDetail";
import NotFound from "./NotFound";
import AddToCalendarButton from "../components/AddToICalendarButton";
import { getErrorDetails } from '../utils/errorHandler';
import '../css/GlassStyle.css';

// 簡易的な祝日判定関数
const isHoliday = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = date.getDay();

  // 春分・秋分 (簡易計算)
  const vernal = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  const autumnal = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));

  // 固定祝日 (月, 日)
  const fixed = [
    [1, 1], [2, 11], [2, 23], [4, 29], [5, 3], [5, 4], [5, 5], [8, 11], [11, 3], [11, 23],
    [3, vernal], [9, autumnal]
  ];

  if (fixed.some(([m, d]) => m === month && d === day)) return true;

  // ハッピーマンデー
  const getNthMonday = (m, n) => {
    const firstDay = new Date(year, m - 1, 1).getDay();
    const firstMon = 1 + (8 - firstDay) % 7;
    return firstMon + (n - 1) * 7;
  };

  if (month === 1 && day === getNthMonday(1, 2)) return true; // 成人の日
  if (month === 7 && day === getNthMonday(7, 3)) return true; // 海の日
  if (month === 9 && day === getNthMonday(9, 3)) return true; // 敬老の日
  if (month === 10 && day === getNthMonday(10, 2)) return true; // スポーツの日

  // 振替休日 (月曜で、昨日が祝日の場合)
  if (dayOfWeek === 1) {
    const yesterday = new Date(date);
    yesterday.setDate(date.getDate() - 1);
    const yMonth = yesterday.getMonth() + 1;
    const yDay = yesterday.getDate();
    if (fixed.some(([m, d]) => m === yMonth && d === yDay)) return true;
  }

  return false;
};

export default function Calendar() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { ref: calendarRef, height: calendarHeight } = useElementSize();
  const { data, loading, error } = useApiData(getFestivals);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentMonthEvents, setCurrentMonthEvents] = useState([]);
  const [listTitle, setListTitle] = useState('');
  const [currentViewStart, setCurrentViewStart] = useState(null);

  const [detailId, setDetailId] = useState(null);
  const [detailOpened, setDetailOpened] = useState(false);
  
  // テーマ取得
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  // お祭りデータをFullCalendar形式に変換
  const events = useMemo(() => {
    const festivals = data || [];
    return festivals.map(festival => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const festivalDate = new Date(festival.date);
      festivalDate.setHours(0, 0, 0, 0);

      let eventColor = '#339AF0'; // 開催予定 (青)
      if (festivalDate < today) {
        eventColor = 'gray'; // 終了
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
        color: eventColor,
        classNames: ['no-bg-event']
      };
    });
  }, [data]);

  const handleEventClick = (clickInfo) => {
    setDetailId(parseInt(clickInfo.event.id, 10));
    setDetailOpened(true);
  };


  const handleDatesSet = (dateInfo) => {
    setCurrentViewStart(dateInfo.view.currentStart);
  };

  useEffect(() => {
    if (!currentViewStart) return;

    const currentMonth = currentViewStart.getMonth();
    const currentYear = currentViewStart.getFullYear();

    setListTitle(`${currentYear}年${currentMonth + 1}月のイベント`);

    const filteredEvents = events
      .filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth;
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    setCurrentMonthEvents(filteredEvents);
  }, [events, currentViewStart]);

  const selectedFestival = useMemo(() => {
    if (!data || !detailId) return null;
    return data.find(f => f.id === detailId);
  }, [data, detailId]);

  const selectedEventData = useMemo(() => {
    if (!data || !selectedEvent) return null;
    return data.find(f => String(f.id) === String(selectedEvent.id));
  }, [data, selectedEvent]);

  if (error) {
    const { code, title, message } = getErrorDetails(error);
    return <NotFound code={code} title={title} message={message} />;
  }

  // イベントのレンダリングをカスタマイズ（HoverCardでラップ）
  const renderEventContent = (eventInfo) => {
    const festivalData = data?.find(f => String(f.id) === String(eventInfo.event.id));

    return (
      <HoverCard width={280} shadow="md" withArrow openDelay={200} closeDelay={200} withinPortal zIndex={1500} position="left">
        <HoverCard.Target>
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              fontSize: '0.75rem', // 文字サイズを小さく
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'transparent' // 背景を透明に
            }}
          >
            <span 
              style={{ 
                color: eventInfo.event.backgroundColor, 
                marginRight: '4px',
                textShadow: `0 0 5px ${eventInfo.event.backgroundColor}` // 文字の影で光らせる
              }}
            >●</span> 
            {eventInfo.event.title}
          </div>
        </HoverCard.Target>
        <HoverCard.Dropdown className="glass-panel" style={{ backgroundColor: 'transparent' }}>
          <Stack gap="xs">
            <Text size="sm" fw={700} c={colorScheme === 'dark' ? 'white' : 'dark'}>{eventInfo.event.title}</Text>
            <Group gap="xs">
              <IconCalendar size={16} />
              <Text size="xs">{new Date(eventInfo.event.start).toLocaleDateString('ja-JP')}</Text>
            </Group>
            <Group gap="xs">
              <IconMapPin size={16} />
              <Text size="xs">{eventInfo.event.extendedProps.location || '場所未定'}</Text>
            </Group>
            {festivalData && (
              <AddToCalendarButton 
                name={festivalData.name} 
                location={festivalData.location} 
                date={festivalData.date} 
                festivalId={festivalData.id}
                description={festivalData.description}
              />
            )}
            <Text size="xs" c="dimmed" ta="center">クリックで詳細を表示</Text>
          </Stack>
        </HoverCard.Dropdown>
      </HoverCard>
    );
  };

  // カレンダーセクション（凡例 + FullCalendar）
  const renderCalendarSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', minHeight: 0, overflow: 'hidden' }}>
      {/* 凡例 */}
      <Paper shadow="sm" p="xs" mb="xs" radius="md" className="glass-panel" style={{ flexShrink: 0 }}>
        <Group justify="center" gap="xl">
          <Group gap="xs">
            <Box w={12} h={12} bg="#FA5252" style={{ borderRadius: '50%', boxShadow: '0 0 5px #FA5252' }} />
            <Text size="sm" fw={500} c={colorScheme === 'dark' ? 'white' : 'dark'}>今日開催</Text>
          </Group>
          <Group gap="xs">
            <Box w={12} h={12} bg="#339AF0" style={{ borderRadius: '50%', boxShadow: '0 0 5px #339AF0' }}/>
            <Text size="sm" fw={500} c={colorScheme === 'dark' ? 'white' : 'dark'}>開催予定</Text>
          </Group>
          <Group gap="xs">
            <Box w={12} h={12} bg="#7a7a7a" style={{ borderRadius: '50%', boxShadow: '0 0 5px #7a7a7a'}} />
            <Text size="sm" fw={500} c={colorScheme === 'dark' ? 'white' : 'dark'}>終了</Text>
          </Group>
        </Group>
      </Paper>

      {/* カレンダー本体 */}
      <Box className="glass-calendar-wrapper" style={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,today',
            center: 'title',
            right: 'next'
          }}
          events={events}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          datesSet={handleDatesSet}
          locale="ja"
          buttonText={{ today: '今日' }}
          height="100%"
          contentHeight="100%"
          aspectRatio={1.35}
          handleWindowResize={true}
          dayMaxEvents={true}
          dayCellClassNames={(arg) => isHoliday(arg.date) ? ['holiday'] : []}
          dayHeaderClassNames={(arg) => isHoliday(arg.date) ? ['holiday'] : []}
          
        />
      </Box>
    </div>
  );

  // リストセクション
  const renderListSection = () => (
    <Paper 
      shadow="xl" 
      p="lg" 
      radius="md" 
      className="glass-panel" 
      style={{ 
        position: 'relative', 
        zIndex: 1,
        // PCの場合は高さ制限とスクロールを追加
        height: isMobile ? 'auto' : 'calc(100vh - 120px)', 
        overflowY: isMobile ? 'visible' : 'auto'
      }}
    >
      <Title order={4} mb="md" c={colorScheme === 'dark' ? 'white' : 'dark'} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
        {listTitle || 'イベント一覧'}
      </Title>
      {currentMonthEvents.length > 0 ? (
        <List spacing="sm" center>
          {currentMonthEvents.map(event => (
            <List.Item 
              key={`list-${event.id}`}
              icon={
                <Box 
                  w={8} h={8} 
                  bg={event.color} 
                  style={{ borderRadius: '50%', boxShadow: `0 0 5px ${event.color}` }} 
                />
              }
            >
              <Group gap="xs" wrap="nowrap" style={{ overflowX: 'auto' }}>
                <Text w={35} size="sm" fw={700} c={isDark ? "dimmed" : "dimmed" } style={{ flexShrink: 0 }}>
                  {new Date(event.start).toLocaleDateString('ja-JP', { day: 'numeric' })}
                </Text>
                <Text 
                  fw={500}
                  style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => { setDetailId(event.id); setDetailOpened(true); }}
                >
                  {event.title}
                </Text>
              </Group>
            </List.Item>
          ))}
        </List>
      ) : (
        <Text c="dimmed" size="sm">この月のイベントはありません。</Text>
      )}
    </Paper>
  );

  return (
    <Box pos="relative" minH={400} p="md">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      
      {/* FullCalendarのスタイル定義 (ダークモード対応) */}
      <style>{`
        /* カレンダー内のスクロールバーを非表示 */
        .fc-scroller::-webkit-scrollbar {
          display: none;
        }
        .fc-scroller {
          -ms-overflow-style: none;
          scrollbar-width: none;
          /* height: 100% !important; */
        }
        .fc-scroller.fc-scroller-liquid-absolute {
          padding-top: 0px !important; /* ここで「潜り込まないギリギリ」を調整します */
        }
        /* カレンダーのグリッド部分の高さを自動調整 */
        .fc .fc-view-harness {
          height: auto !important;
        }
        .fc .fc-scrollgrid-sync-table {
          margin-top: 0 !important;
        }
        /* 各行の高さを均等にし、最小高さを解除する */
        .fc .fc-daygrid-body,
        .fc .fc-daygrid-day-frame {
          height: 100% !important;
          min-height: 0 !important;
          display: block !important;
        }
        /* 1. 日付が入るコンテナの上余白と最小高さを削る */
        .fc .fc-daygrid-day-top {
          display: flex !important;
          justify-content: flex-end !important; /* 右寄せ */
          padding: 0 !important;
          min-height: 0 !important; /* 謎の最低高さを解除 */
          height: auto !important;
          line-height: 1 !important;
        }
        /* 2. 日付の数字自体の余白を最小化 */
        .fc .fc-daygrid-day-number {
          padding: 4px !important;
          margin-top: -2px !important;
          display: inline-block !important; /* blockから変更 */
          line-height: 1 !important; /* 文字の高さ分だけにする */
          font-size: 0.85rem; /* 少し小さくするとよりスッキリします */
        }
        /* 3. 予定（イベント）の表示エリアを上に持ち上げる */
        .fc .fc-daygrid-day-events {
          margin-top: -4px !important;
          padding: 0 !important;
          display: block !important;
        }
        /* 予定自体のパーツも上に詰める */
        .fc .fc-daygrid-event-harness {
          margin: 1px 2px !important;
        }
        /* カレンダー全体の高さを固定し、はみ出しを隠す */
        .fc {
          height: 100% !important;
          overflow: hidden;
          --fc-border-color: ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.1)'};
          --fc-button-text-color: ${isDark ? '#fff' : '#333'};
          --fc-button-bg-color: ${isDark ? 'rgba(255,255,255,0.1)' : '#fff'};
          --fc-button-border-color: ${isDark ? 'rgba(255,255,255,0.2)' : '#ced4da'};
          --fc-button-hover-bg-color: ${isDark ? 'rgba(255,255,255,0.2)' : '#f1f3f5'};
          --fc-button-hover-border-color: ${isDark ? 'rgba(255,255,255,0.3)' : '#adb5bd'};
          --fc-button-active-bg-color: ${isDark ? 'rgba(255,255,255,0.3)' : '#e9ecef'};
          --fc-button-active-border-color: ${isDark ? 'rgba(255,255,255,0.4)' : '#868e96'};
          --fc-today-bg-color: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,0,0.1)'};
          --fc-neutral-bg-color: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(208, 208, 208, 0.3)'};
          --fc-list-event-hover-bg-color: ${isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5'};
          --fc-page-bg-color: transparent;
          color: ${isDark ? '#e0e0e0' : '#1f1f1f'};
          margin-bottom: 0 !important;
        }
        .fc .fc-toolbar-title {
        color: var(--glass-text) !important;
        }
        .fc .fc-col-header-cell-cushion,
        .fc .fc-daygrid-day-number {
          color: ${isDark ? '#e0e0e0' : '#1f1f1f'} !important;
          text-decoration: none !important;
        }
        .fc .fc-list-day-text,
        .fc .fc-list-day-side-text {
          color: ${isDark ? '#e0e0e0' : '#1f1f1f'} !important;
          text-decoration: none !important;
        }
        .fc-theme-standard th {
           border-color: ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.1)'} !important;
        }
        /* 曜日ヘッダーの余白をさらに詰める */
        .fc .fc-col-header-cell .fc-scrollgrid-sync-inner {
           padding: 0 !important;
        }
        .fc .fc-col-header-cell,
        .fc-theme-standard th {
          background-color: ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#dee2e6'} !important;
          color: ${isDark ? '#e0e0e0' : '#1f1f1f'} !important;
        }
        /* 土曜日 (青) */
        .fc-col-header-cell.fc-day-sat,
        .fc-daygrid-day.fc-day-sat .fc-daygrid-day-number {
          color: #339AF0 !important;
        }
        .fc-daygrid-day.fc-day-sat {
          background-color: ${isDark ? 'rgba(51, 154, 240, 0.05)' : 'rgba(51, 154, 240, 0.05)'};
        }

        /* 日曜日 (赤) */
        .fc-col-header-cell.fc-day-sun,
        .fc-daygrid-day.fc-day-sun .fc-daygrid-day-number {
          color: #FA5252 !important;
        }
        .fc-daygrid-day.fc-day-sun {
          background-color: ${isDark ? 'rgba(250, 82, 82, 0.05)' : 'rgba(250, 82, 82, 0.05)'};
        }

        /* 祝日 (紫) */
        .fc-col-header-cell.holiday,
        .fc-daygrid-day.holiday .fc-daygrid-day-number {
          color: #BE4BDB !important;
        }
        .fc-daygrid-day.holiday {
          background-color: ${isDark ? 'rgba(190, 75, 219, 0.05)' : 'rgba(190, 75, 219, 0.05)'};
        }
        /* イベントの背景と枠線を削除 */
        .fc-daygrid-event.no-bg-event {
          background: transparent !important;
          border: none !important;
        }
        html, body {
          overflow: hidden !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        #root {
          height: 100% !important;
          overflow: hidden !important;
        }
      `}</style>

      {isMobile ? (
        // スマホレイアウト: カレンダー固定 + リストスクロール
        <>
          <Box
            ref={calendarRef}
            style={{
              position: 'fixed',
              top: 60, // ヘッダーの高さ分下げる
              left: 0,
              right: 0,
              zIndex: 0,
              padding: '16px',
              backgroundColor: 'var(--glass-bg)', // 背景色をつけてリストが透けないようにする
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--glass-border)',
            }}
          >
            {renderCalendarSection()}
          </Box>
          <Box style={{ position: 'relative', zIndex: 2, marginTop: calendarHeight + 16 }}>
            {renderListSection()}
          </Box>
        </>
      ) : (
        // PCレイアウト: 2カラム (左:カレンダー, 右:リスト)
        <Group align="start" wrap="nowrap" gap="md">
          <Box style={{ width: 350, flexShrink: 0, position: 'sticky', top: 80 }}>
            {renderListSection()}
          </Box>
          <Box style={{ flex: 1 }}>
            {renderCalendarSection()}
          </Box>
        </Group>
      )}

      {/* リッチな詳細モーダル（共通コンポーネント） */}
      <FestivalDetail 
        festivalData={selectedFestival} 
        opened={detailOpened} 
        onClose={() => setDetailOpened(false)} 
      />
    </Box>
  );
}