import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Text, SimpleGrid, Card, Alert, Group, LoadingOverlay, Box, Image, Badge, Stack, Button, useMantineColorScheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCalendar, IconMapPin, IconCheck, IconShare } from '@tabler/icons-react';
import FestivalDetail from "../components/FestivalDetail";
import { getImageUrl, getFestivals } from '../utils/apiService';
import useApiData from '../hooks/useApiData';
import "../css/GlassStyle.css";

export default function SharedFavorites() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  
  const [sharedData, setSharedData] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // フォールバックとして全体のお祭りデータも取得しておく（APIがIDのみ返す場合に備えて）
  const { data: allFestivals, loading: allFestivalsLoading } = useApiData(getFestivals);

  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        setFetchLoading(true);
        // バックエンドから共有リンクに紐づくデータを取得
        const response = await fetch(`/api/favorites/shared/${shareId}`);
        if (!response.ok) {
          throw new Error(response.status === 404 ? "共有リンクが見つからないか、無効になっています。" : "データの取得に失敗しました。");
        }
        const data = await response.json();
        setSharedData(data);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setFetchLoading(false);
      }
    };
    
    if (shareId) {
      fetchSharedData();
    }
  }, [shareId]);

  const isLoading = fetchLoading || allFestivalsLoading;

  // APIのレスポンス形式に応じて表示するお祭りデータを柔軟に解決する
  const displayFestivals = useMemo(() => {
    if (!sharedData) return [];
    
    // パターン1: APIが完全なお祭りのオブジェクト配列を返す場合
    if (sharedData.festivals && sharedData.festivals.length > 0 && typeof sharedData.festivals[0] === 'object') {
      return sharedData.festivals;
    }
    // パターン2: APIがIDの配列のみを返す場合
    if (sharedData.festival_ids && allFestivals) {
      return allFestivals.filter(f => sharedData.festival_ids.includes(f.id));
    }
    // パターン3: Object.keys(favorites) の形式で返す場合 (DBにそのまま保存されている場合など)
    if (sharedData.favorites && allFestivals) {
      const activeIds = Object.entries(sharedData.favorites)
        .filter(([_, v]) => v)
        .map(([k]) => parseInt(k, 10));
      return allFestivals.filter(f => activeIds.includes(f.id));
    }
    
    return [];
  }, [sharedData, allFestivals]);

  // 選択されたお祭りの詳細データ
  const selectedFestival = useMemo(() => {
    if (!displayFestivals || !detailId) return null;
    return displayFestivals.find(f => f.id === detailId);
  }, [displayFestivals, detailId]);

  if (fetchError) {
    return (
      <Container size="md" py={80} ta="center">
        <Title order={2} mb="md" c="red">エラーが発生しました</Title>
        <Text c="dimmed" mb="xl">{fetchError}</Text>
        <Button variant="default" onClick={() => navigate('/')}>トップページへ戻る</Button>
      </Container>
    );
  }

  const shareUrl = window.location.href;
  const userName = sharedData?.user_name || sharedData?.display_name || "誰か";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '信州おまつりナビ',
          text: `${userName} さんのお気に入りリストです！`,
          url: shareUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        notifications.show({
          title: '成功',
          message: '共有リンクをクリップボードにコピーしました！',
          color: 'teal',
          icon: <IconCheck size={18} />,
        });
      } catch (err) {
        notifications.show({
          title: 'エラー',
          message: 'URLのコピーに失敗しました。',
          color: 'red',
        });
      }
    }
  };

  return (
    <Box pos="relative" minH={400}>
      <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      <Container py="xl">
        {!isLoading && (
          <>
            <Box mb="xl" ta="center">
              <Title order={2} c={colorScheme === 'dark' ? 'white' : 'dark'} mb="xs">
                {userName} さんのお気に入りリスト
              </Title>
              <Text c="dimmed" mb="md">
                {displayFestivals.length} 件のお祭りが共有されています。
              </Text>
              
              <Button color="blue" variant="light" onClick={handleShare} leftSection={<IconShare size={16} />}>
                このリストをシェアする
              </Button>
            </Box>

            {displayFestivals.length === 0 ? (
              <Alert title="リストが空です" color="gray" ta="center" mt="xl">
                このリストにはまだお祭りが登録されていないか、非公開になっています。
              </Alert>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
                {displayFestivals.map((f) => (
                  <Card key={f.id} shadow="sm" padding="lg" radius="md" withBorder style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer' }} className="festival-card-hover" onClick={() => setDetailId(f.id)}>
                    <Card.Section>
                      <Image src={(f.photos && f.photos.length > 0) ? getImageUrl(f.photos[0].image_url) : (f.image_url ? getImageUrl(f.image_url) : `https://picsum.photos/seed/${f.id}/400/200`)} height={160} alt={f.name} loading="lazy" />
                    </Card.Section>
                    <Group justify="space-between" mt="md" mb="xs">
                      <Title order={4} fw={500} c={colorScheme === 'dark' ? 'white' : 'dark'}>{f.name}</Title>
                      {new Date(f.date) > new Date() && <Badge color="pink">開催予定</Badge>}
                    </Group>
                    <Stack gap="xs" mt="sm">
                      <Group gap="xs"><IconCalendar size={16} stroke={1.5} /><Text size="sm" c={colorScheme === 'dark' ? 'white' : 'dark'}>{f.date || '未定'}</Text></Group>
                      <Group gap="xs"><IconMapPin size={16} stroke={1.5} /><Text size="sm" c={colorScheme === 'dark' ? 'white' : 'dark'} truncate>{f.location ? f.location.split('・')[0] : '未定'}</Text></Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </>
        )}
      </Container>

      <FestivalDetail festivalData={selectedFestival} opened={!!detailId} onClose={() => setDetailId(null)} />
    </Box>
  );
}