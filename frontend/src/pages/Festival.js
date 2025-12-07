import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Title, Text, SimpleGrid, Card, SegmentedControl, Alert, Select, Group, LoadingOverlay, Box, Image, Badge, Paper, Stack } from '@mantine/core';
import { IconCalendar, IconMapPin } from '@tabler/icons-react';
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
    alert("この機能を使うにはログインしてください");
    navigate("/login");
    return false;
  }
  return true;
};


  // --- Stateの定義 ---
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', 'map', 'register'
  const [sortBy, setSortBy] = useState('default'); // 並び替え用のState

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

  // useMemoを使ってソート処理を効率化
  const sortedFestivals = useMemo(() => {
    if (!festivals) return [];

    const festivalsCopy = [...festivals];

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
  }, [festivals, sortBy]);

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

        {/* 操作パネル (Paperで囲んで視覚的にまとめる) */}
        <Paper shadow="xs" p="md" mb="xl" withBorder>
          <Group justify="space-between">
            {/* 表示モード切り替え */}
            <SegmentedControl
              value={viewMode}
              onChange={setViewMode}
              data={[
                { label: 'リスト', value: 'list' },
                { label: 'カレンダー', value: 'calendar' },
                { label: '地図', value: 'map' },
                { label: '登録', value: 'register' },
              ]}
            />
            {/* 並び替え */}
            {viewMode === 'list' && (
              <Select
                placeholder="並び替え"
                value={sortBy}
                onChange={(value) => setSortBy(value || 'default')}
                data={[
                  { label: 'デフォルト', value: 'default' },
                  { label: '開催日が近い順', value: 'date' },
                  { label: '人気順', value: 'popularity' },
                ]}
                style={{ width: 160 }}
              />
            )}
          </Group>
        </Paper>

        {/* コンテンツの描画 */}
        {renderContent()}
      </Container>
    </Box>
  );
}
