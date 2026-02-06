import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Text, SimpleGrid, Card, Alert, Select, Group, LoadingOverlay, Box, Image, Badge, Paper, Stack, Grid, Button, useMantineColorScheme, ActionIcon, Modal, Transition, Tooltip } from '@mantine/core';
import { IconCalendar, IconMapPin, IconHeart, IconFilter, IconX } from '@tabler/icons-react';
import { getFestivals, getAccountData, updateFavorites } from '../utils/apiService';
import useApiData from '../hooks/useApiData'; // useApiDataフックをインポート
import FestivalDetail from "../components/FestivalDetail";
import NotFound from "./NotFound";
import { getErrorDetails } from '../utils/errorHandler';
import { UserContext } from '../UserContext';
import "../css/GlassStyle.css";

export default function Festival() {
  const { id } = useParams(); // URLパラメータからIDを取得
  const navigate = useNavigate();
  // --- APIからデータを取得 ---
  const { data: festivals, loading: festivalsLoading, error: festivalsError, refetch: refetchFestivals } = useApiData(getFestivals);
  const { colorScheme } = useMantineColorScheme();
  const { user, openLogin } = useContext(UserContext);
  const { data: accountData, refetch: refetchAccount } = useApiData(getAccountData, [user?.id], !user);

  // --- Stateの定義 ---
  const [sortBy, setSortBy] = useState('default'); // 並び替え用のState
  const [filterMonth, setFilterMonth] = useState(null); // 月フィルター用のState
  const [filterArea, setFilterArea] = useState(null);   // エリアフィルター用のState

  const [favorites, setFavorites] = useState({});
  const [loginModalOpened, setLoginModalOpened] = useState(false);
  const [filterOpened, setFilterOpened] = useState(false);

  // データが既にある場合はローディングを表示しない（バックグラウンド更新）
  const isLoading = festivalsLoading && !festivals;
  const error = festivalsError;

  useEffect(() => {
    if (accountData) {
      setFavorites(accountData.favorites || {});
    }
  }, [accountData]);

  // URLパラメータのIDに対応するお祭りデータを取得
  const selectedFestival = useMemo(() => {
    if (!festivals || !id) return null;
    return festivals.find(f => f.id === parseInt(id, 10));
  }, [festivals, id]);

  // モーダルの開閉状態はIDの有無で判定
  const detailOpened = !!id;


  const handleToggleFavorite = async (e, festivalId) => {
    e.stopPropagation();
    if (!user) {
      setLoginModalOpened(true);
      return;
    }
    
    const newFavorites = { ...favorites, [festivalId]: !favorites[festivalId] };
    setFavorites(newFavorites);

    try {
      await updateFavorites(newFavorites);
      refetchAccount();
      refetchFestivals();
    } catch (err) {
      console.error(err);
      setFavorites(favorites); // Revert
    }
  };

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
    const { code, title, message } = getErrorDetails(error);
    return <NotFound code={code} title={title} message={message} />;
  }

  return (
    <Box pos="relative">
      <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      <Container pos="relative">
        {/* フィルターボタンとパネルをスクロール追従させるコンテナ */}
        <Box pos="sticky" top={80} style={{ zIndex: 1001, height: 0 }}>
          {!filterOpened && (
            <Tooltip label="絞り込み" withArrow position="left">
              <ActionIcon 
                variant="default"
                radius="xl" 
                size="lg" 
                pos="absolute" 
                top={0} 
                right={0} 
                style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)', backgroundColor: 'var(--glass-bg)' }}
                onClick={() => setFilterOpened(true)}
              >
                <IconFilter size={20} />
              </ActionIcon>
            </Tooltip>
          )}

          {/* 絞り込み・並び替えパネル */}
          <Transition 
            transition={{
              in: { opacity: 1, transform: 'scale(1)' },
              out: { opacity: 0, transform: 'scale(0)' },
              common: { transformOrigin: 'top right' },
              transitionProperty: 'transform, opacity',
            }} 
            duration={300} 
            timingFunction="ease" 
            mounted={filterOpened}
          >
            {(styles) => (
              <Paper 
                shadow="xl" 
                p="md" 
                withBorder
                pos="absolute"
                className="glass-panel"
                style={{ ...styles, backgroundColor: 'transparent' }}
              >
                <Group justify="flex-end" mb="xs">
                  <ActionIcon variant="subtle" color="gray" onClick={() => setFilterOpened(false)}><IconX size={20} /></ActionIcon>
                </Group>
                <Grid align="flex-end">
                  <Grid.Col span={{ base: 12, sm: 'content' }}>
                    <Select
                      label="開催月"
                      placeholder="月"
                      value={filterMonth}
                      onChange={setFilterMonth}
                      data={filterOptions.months}
                      clearable
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 'content' }}>
                    <Select
                      label="エリア"
                      placeholder="エリア"
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
                    <Group>
                      <Button variant="default" onClick={() => { setFilterMonth(null); setFilterArea(null); }}>リセット</Button>
                      <Button variant="light" onClick={refetchFestivals} loading={festivalsLoading}>更新</Button>
                    </Group>
                  </Grid.Col>
                </Grid>
              </Paper>
            )}
          </Transition>
        </Box>

        <Title order={2} ta="center" mb="xl" c={colorScheme === 'dark' ? 'white' : 'dark'}>長野県のおまつり</Title>

        {/* お祭りリストの描画 */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
          {sortedFestivals.map((f) => (
            <Card
              key={f.id}
              shadow="sm"
              padding="lg"
              radius="md"
              onClick={(e) => {
                e.preventDefault();
                navigate(`/festivals/${f.id}`); // URLを変更してモーダルを開く
              }}
              withBorder
              style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer' }}
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
                <Title order={4} fw={500} c={colorScheme === 'dark' ? 'white' : 'dark'}>{f.name}</Title>
                {new Date(f.date) > new Date() && <Badge color="pink">開催予定</Badge>}
              </Group>

              <Group gap={4} mb="xs">
                <ActionIcon 
                  variant="transparent" 
                  size="sm"
                  onClick={(e) => handleToggleFavorite(e, f.id)}
                >
                  <IconHeart 
                    size={16} 
                    color="#fa5252"
                    fill={favorites[f.id] ? "#fa5252" : "none"} 
                  />
                </ActionIcon>
                <Text size="sm" c={colorScheme === 'dark' ? 'white' : 'dark'}>{f.favorites || 0}</Text>
              </Group>

              <Stack gap="xs" mt="sm">
                <Group gap="xs"><IconCalendar size={16} stroke={1.5} /><Text size="sm" c={colorScheme === 'dark' ? 'white' : 'dark'}>{f.date || '未定'}</Text></Group>
                <Group gap="xs"><IconMapPin size={16} stroke={1.5} /><Text size="sm" c={colorScheme === 'dark' ? 'white' : 'dark'} truncate>{f.location ? f.location.split('・')[0] : '未定'}</Text></Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Container>

      <FestivalDetail 
        festivalData={selectedFestival} 
        opened={detailOpened} 
        onClose={() => {
          navigate('/festivals'); // URLを戻してモーダルを閉じる
          if (user) {
            refetchAccount();
            refetchFestivals();
          }
        }} 
      />

      <Modal 
        opened={loginModalOpened} 
        onClose={() => setLoginModalOpened(false)} 
        title={<Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>ログインが必要です</Text>}
        centered 
        zIndex={2000}
      >
        <Text size="sm" mb="lg">お気に入り機能を利用するにはログインが必要です。</Text>
        <Group justify="flex-end">
          <Button onClick={() => { setLoginModalOpened(false); openLogin(); }}>ログインする</Button>
        </Group>
      </Modal>
    </Box>
  );
}
