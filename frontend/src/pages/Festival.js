import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Title, Text, SimpleGrid, Card, Alert, Select, Group, LoadingOverlay, Box, Image, Badge, Paper, Stack, Grid, Button } from '@mantine/core';
import { IconCalendar, IconMapPin, IconHeart } from '@tabler/icons-react';
import { getFestivals } from '../utils/apiService'; // getAccountDataを削除
import useApiData from '../hooks/useApiData'; // useApiDataフックをインポート

export default function Festival() {
  // --- APIからデータを取得 ---
  const { data: festivals, loading: festivalsLoading, error: festivalsError, refetch: refetchFestivals } = useApiData(getFestivals);

  // --- Stateの定義 ---
  const [sortBy, setSortBy] = useState('default'); // 並び替え用のState
  const [filterMonth, setFilterMonth] = useState(null); // 月フィルター用のState
  const [filterArea, setFilterArea] = useState(null);   // エリアフィルター用のState

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
      case 'newest':
        // 新着順（IDの降順）
        return festivalsCopy.sort((a, b) => b.id - a.id);
      case 'default':
      default:
        // デフォルト（ID順）
        return festivalsCopy.sort((a, b) => a.id - b.id);
    }
  }, [festivals, sortBy, filterMonth, filterArea]);

  if (error) {
    return <Container><Alert color="red" title="エラー">🚨 {error.message || 'データの読み込み中にエラーが発生しました。'}</Alert></Container>;
  }

  return (
    <Box pos="relative">
      <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      <Container>
        {/* 翻訳ウィジェット */}
        <div id="google_translate_element" style={{ position: "fixed", bottom: 10, left: 10, zIndex: 9999 }}></div>
        
        <Title order={2} ta="center" mb="xl">長野県のおまつり</Title>

        {/* 絞り込み・並び替えパネル (リスト表示の時だけ表示) */}
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
                  { label: '新着順', value: 'newest' },
                  { label: '開催日が近い順', value: 'date' },
                  { label: '人気順', value: 'popularity' },
                ]}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 'content' }}>
                <Button variant="outline" onClick={() => { setFilterMonth(null); setFilterArea(null); }}>フィルターをリセット</Button>
                <Button variant="light" ml="xs" onClick={refetchFestivals} loading={festivalsLoading}>更新</Button>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* お祭りリストの描画 */}
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
              className="festival-card-hover"
            >
              <Card.Section>
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
                <Group gap="xs"><IconCalendar size={16} stroke={1.5} /><Text size="sm" c="dimmed">{f.date || '未定'}</Text></Group>
                <Group gap="xs"><IconMapPin size={16} stroke={1.5} /><Text size="sm" c="dimmed" truncate>{f.location ? f.location.split('・')[0] : '未定'}</Text></Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
