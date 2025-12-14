import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Title, Text, SimpleGrid, Card, SegmentedControl, Alert, Select, Group, LoadingOverlay, Box, Image, Badge, Paper, Stack, Grid, Button, Center } from '@mantine/core';
import { IconCalendar, IconMapPin, IconHeart, IconList, IconMap } from '@tabler/icons-react';
import { UserContext } from "../App";
import { getFestivals, getAccountData } from '../utils/apiService'; // getAccountDataをインポート
import useApiData from '../hooks/useApiData'; // useApiDataフックをインポート
import { initGoogleTranslate } from "../utils/translate";
import FestivalCalendar from "../components/FestivalCalendar";
import FestivalMap from '../components/FestivalMap';
import FestivalRegistrationForm from "../components/FestivalRegistrationForm"; // 登録フォームをインポート
import { useNavigate } from "react-router-dom";

export default function Festival() {
  const navigate = useNavigate();  // ← ★ここに追加！

  const { user } = useContext(UserContext);


  // --- APIからデータを取得 ---
  const { data: festivals, loading: festivalsLoading, error: festivalsError, refetch: refetchFestivals } = useApiData(getFestivals);
  const { data: accountData, loading: accountLoading, error: accountError } =
  useApiData(
    user ? getAccountData : async () => ({ data: null }), // ← 未ログインではAPIを呼ばない
    [user?.id]
  );

  // 未ログインチェック機能
  const requireLogin = () => {
    if (!user) {
      const confirmed = window.confirm("この機能を使うにはログインが必要です。\nログインページへ移動しますか？");
      if (confirmed) {
        navigate("/login");
      }
      return false;  // ← ログインしてないので、処理は中断
    }
    return true; // ログイン済み
  };

  // --- Stateの定義 ---
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', 'map', 'register'
  const [sortBy, setSortBy] = useState('default'); // 並び替え用のState
  const [filterMonth, setFilterMonth] = useState(null); // 月フィルター用のState
  const [filterArea, setFilterArea] = useState(null);   // エリアフィルター用のState

  // --- useEffectフック ---
  useEffect(() => {
    initGoogleTranslate();
  }, []);

  const handleFestivalAdded = () => {
    refetchFestivals(); // お祭りリストを再取得
    setViewMode('list'); // 登録後、リスト表示に戻る
  };

  const isLoading = festivalsLoading;
  const error = festivalsError;

  // useMemoを使ってフィルターの選択肢を生成
  const filterOptions = useMemo(() => {
    if (!festivals) return { months: [], areas: [] };

    const months = [...new Set(festivals
        .map(f => f.date ? new Date(f.date).getMonth() + 1 : null)
        .filter(Boolean)
    )].sort((a, b) => a - b).map(m => ({ label: `${m}月`, value: String(m) }));

    const areas = [...new Set(festivals
        .map(f => f.location ? f.location.split(/市|町|村/)[0] + (f.location.match(/市|町|村/)?.[0] || '') : null)
        .filter(Boolean)
    )].sort().map(a => ({ label: a, value: a }));

    return { months, areas };
  }, [festivals]);

  // useMemoを使ってフィルタリングとソート処理を効率化
  const sortedFestivals = useMemo(() => {
    if (!festivals) return [];

    // フィルタリング処理
    const filtered = festivals.filter(f => {
      const monthMatch = filterMonth ? (f.date && new Date(f.date).getMonth() + 1 === parseInt(filterMonth, 10)) : true;
      const areaMatch = filterArea ? (f.location && f.location.startsWith(filterArea)) : true;
      return monthMatch && areaMatch;
    });


    // ソート処理
    const festivalsCopy = [...filtered];

    switch (sortBy) {
      case 'date':
        // 開催日が近い順
        return festivalsCopy.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          // 無効な日付は末尾に
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          return dateA - dateB;
        });
      case 'popularity':
        // 人気順（動員数が多い順）
        return festivalsCopy.sort((a, b) => (b.attendance || 0) - (a.attendance || 0));
      case 'default':
      default:
        // デフォルト（ID順）
        return festivalsCopy.sort((a, b) => a.id - b.id);
    }
  }, [festivals, sortBy, filterMonth, filterArea]);

  // SegmentedControlのデータをuseMemoでメモ化
  const segmentData = useMemo(() => {
    const baseData = [
      {
        value: 'list',
        label: (
          <Center>
            <IconList size="1rem" />
            <Box ml="xs">リスト</Box>
          </Center>
        ),
      },
      {
        value: 'calendar',
        label: (
          <Center>
            <IconCalendar size="1rem" />
            <Box ml="xs">カレンダー</Box>
          </Center>
        ),
      },
      {
        value: 'map',
        label: (
          <Center>
            <IconMap size="1rem" />
            <Box ml="xs">マップ</Box>
          </Center>
        ),
      },
    ];
    // rootユーザーの場合のみ「登録」タブを追加
    if (user && user.username === 'root') {
      baseData.push({ label: '登録', value: 'register' });
    }
    return baseData;
  }, [user]); // userの状態が変わったときに再計算

  if (error) {
    return <Container><Alert color="red" title="エラー">🚨 {error.message || 'データの読み込み中にエラーが発生しました。'}</Alert></Container>;
  }

  // 表示するコンテンツをviewModeに応じて切り替える
  const renderContent = () => {
    if (!festivals) return null;

    switch (viewMode) {
      case 'calendar':
        return <FestivalCalendar festivals={festivals} />;
      case 'map':
        return <FestivalMap festivals={festivals} />;
      case 'register':
        return <FestivalRegistrationForm onFestivalAdded={handleFestivalAdded} />;
      case 'list':
      default:
        return (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
            {sortedFestivals.map((f) => (
              <Card
                key={f.id}
                shadow="sm"
                padding="lg"
                radius="md"
                component={Link}
                to={`/festivals/${f.id}`}
                withBorder
                style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                className="festival-card-hover" // CSSでホバーエフェクトを追加するためのクラス
              >
                <Card.Section>
                  {/* お祭りの画像（ダミー画像を表示） */}
                  <Image
                    src={f.image_url || `https://picsum.photos/seed/${f.id}/400/200`}
                    height={160}
                    alt={f.name}
                  />
                </Card.Section>

                <Group justify="space-between" mt="md" mb="xs">
                  <Title order={4} fw={500}>{f.name}</Title>
                  {new Date(f.date) > new Date() && <Badge color="pink">開催予定</Badge>}
                </Group>

                <Group gap={4} mb="xs">
                  <IconHeart size={16} color="red" />
                  <Text size="sm" c="dimmed">{f.favorites || 0}</Text>
                </Group>

                <Stack gap="xs" mt="sm">
                  <Group gap="xs">
                    <IconCalendar size={16} stroke={1.5} />
                    <Text size="sm" c="dimmed">{f.date || '未定'}</Text>
                  </Group>
                  <Group gap="xs">
                    <IconMapPin size={16} stroke={1.5} />
                    <Text size="sm" c="dimmed" truncate>{f.location || '未定'}</Text>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        );
    }
  };
  return (
    <Box pos="relative">
      <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      <Container>
        {/* 翻訳ウィジェット */}
        <div id="google_translate_element" style={{ position: "fixed", bottom: 10, left: 10, zIndex: 9999 }}></div>
        
        <Title order={2} ta="center" mb="xl">長野県のお祭り</Title>

        {/* 表示モード切り替え */}
        <Group justify="center" mb="xl">
          <SegmentedControl
            value={viewMode}
            onChange={setViewMode}
            data={segmentData}
          />
        </Group>

        {/* 絞り込み・並び替えパネル (リスト表示の時だけ表示) */}
        {viewMode === 'list' && (
          <Paper shadow="xs" p="md" mb="xl" withBorder>
            <Grid align="flex-end">
              <Grid.Col span={{ base: 12, sm: 'content' }}>
                <Select
                  label="開催月で絞り込み"
                  placeholder="月を選択"
                  value={filterMonth}
                  onChange={setFilterMonth}
                  data={filterOptions.months}
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 'content' }}>
                <Select
                  label="エリアで絞り込み"
                  placeholder="エリアを選択"
                  value={filterArea}
                  onChange={setFilterArea}
                  data={filterOptions.areas}
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 'content' }}>
                <Select
                  label="並び替え"
                  placeholder="並び替え"
                  value={sortBy}
                  onChange={(value) => setSortBy(value || 'default')}
                  data={[
                    { label: 'デフォルト', value: 'default' },
                    { label: '開催日が近い順', value: 'date' },
                    { label: '人気順', value: 'popularity' },
                  ]}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 'content' }}>
                  <Button variant="outline" onClick={() => { setFilterMonth(null); setFilterArea(null); }}>フィルターをリセット</Button>
              </Grid.Col>
            </Grid>
          </Paper>
        )}

        {/* コンテンツの描画 */}
        {renderContent()}
      </Container>
    </Box>
  );
}
