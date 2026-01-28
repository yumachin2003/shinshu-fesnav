import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { Container, Card, Image, Title, Text, Group, Button, Alert, Paper, Stack, AspectRatio, Modal } from "@mantine/core";
import { IconCalendar, IconMapPin, IconRoad, IconUsers, IconEdit } from '@tabler/icons-react';
import Favorite from "../utils/Favorite";
import { UserContext } from "../UserContext";
import { getFestivals, getAccountData, updateFavorites} from "../utils/apiService";
import useApiData from "../hooks/useApiData";
import BackButton from "../utils/BackButton";
import AddToGoogleCalendarButton from "../components/AddToGoogleCalendarButton";
import AddToICalendarButton from "../components/AddToICalendarButton";
import InformationModal from "../components/InformationModal";

export default function FestivalDetail() {
  const { id } = useParams();
  const { user, openLogin } = useContext(UserContext);

  const [open, setOpen] = useState(false);
  const [loginModalOpened, setLoginModalOpened] = useState(false);

  // APIデータ
  const {
    data: festivals,
    loading: festivalsLoading,
    error: festivalsError,
  } = useApiData(getFestivals);

  const {
    data: accountData,
    loading: accountLoading,
    error: accountError,
  } = useApiData(getAccountData, [user?.id]);

  // 状態
  const [festival, setFestival] = useState(null);
  const [favorites, setFavorites] = useState({});

  // アカウントデータをセット
  useEffect(() => {
    if (!accountData) return;
    setFavorites(accountData.favorites || {});
  }, [accountData]);

  // 対象フェスティバル情報を抽出
  useEffect(() => {
    if (!festivals) return;
    const current = festivals.find((f) => f.id === parseInt(id, 10));
    setFestival(current);
  }, [festivals, id]);

  // お気に入り更新
  const saveFavorites = async (updated) => {
    setFavorites(updated);
    await updateFavorites(updated).catch((err) =>
      console.error("お気に入り更新エラー:", err)
    );
  };

  // ローディング & エラー処理
  const isLoading = festivalsLoading || (user && accountLoading);
  const error = festivalsError || (user && accountError);

  if (isLoading)
    return (
      <Container>
        <Text>読み込み中...</Text>
      </Container>
    );

  if (error)
    return (
      <Container>
        <Alert color="red" title="エラー">
          🚨 {error.message || "データ読み込み中にエラーが発生しました"}
        </Alert>
      </Container>
    );

  if (!festival)
    return (
      <Container>
        <Alert color="yellow" title="情報なし">
          お祭りが見つかりません。
        </Alert>
      </Container>
    );

  return (
    <Container>
      <Group justify="space-between" mb="lg">
        <BackButton variant="outline" />
        <Button
          variant="light"
          leftSection={<IconEdit size={16} />}
          onClick={() => setOpen(true)}
        >
          情報提供
        </Button>
      </Group>

      {/* フェスティバル情報カード */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        {/* --- お祭りの写真 --- */}
        <Card.Section mb="lg">
          <AspectRatio ratio={16 / 9}>
            <Image
              src={festival.image_url || `https://picsum.photos/seed/${festival.id}/800/450`}
              alt={festival.name}
            />
          </AspectRatio>
        </Card.Section>

        <Group justify="space-between" align="center" mb="md" wrap="nowrap">
          <Title order={2} style={{ flex: 1 }} fz="1.8rem">{festival.name}</Title>
          <Stack gap={0} align="center">
            <Favorite
              selected={favorites[id]}
              onToggle={() => {
                if (!user) {
                  setLoginModalOpened(true);
                  return;
                }
                const updated = { ...favorites, [id]: !favorites[id] };
                saveFavorites(updated);
              }}
            />
            <Text size="xs" fw={700} lh={1}>
              {festival.favorites || 0}
            </Text>
          </Stack>
        </Group>

        {/* --- お祭りの基本情報 --- */}
        <Stack mt="md">
          <Group><IconCalendar size={20} stroke={1.5} /><Text><strong>開催日:</strong> {festival.date || '未定'}</Text></Group>
          <Group><IconMapPin size={20} stroke={1.5} /><Text><strong>場所:</strong> {festival.location || '未定'}</Text></Group>
          <Group><IconRoad size={20} stroke={1.5} /><Text><strong>アクセス:</strong> {festival.access || '情報なし'}</Text></Group>
          <Group><IconUsers size={20} stroke={1.5} /><Text><strong>動員数:</strong> {festival.attendance ? `${festival.attendance.toLocaleString()}人` : '情報なし'}</Text></Group>
        </Stack>

        {/* --- お祭りの概要 --- */}
        <Paper mt="xl" p="lg" bg="gray.0" withBorder>
            <Title order={4} mb="sm">お祭りの概要</Title>
            <Text lh="lg" c="black" style={{ whiteSpace: 'pre-wrap' }}>
              {festival.description || 'このお祭りの概要はまだ登録されていません。'}
            </Text>
        </Paper>

        <Group mt="md">
          <AddToGoogleCalendarButton
            name={festival.name}
            location={festival.location}
            date={festival.date}
          />
          <AddToICalendarButton
            name={festival.name}
            location={festival.location}
            date={festival.date}
          />
        </Group>
      </Card>

      {/* ★ 情報提供モーダル */}
      <InformationModal
        opened={open}
        onClose={() => setOpen(false)}
        festival={festival}
      />

      {/* ログインを促すモーダル */}
      <Modal opened={loginModalOpened} onClose={() => setLoginModalOpened(false)} title="ログインが必要です" centered>
        <Text size="sm" mb="lg">
          お気に入り機能を利用するにはログインが必要です。
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={() => setLoginModalOpened(false)}>キャンセル</Button>
          <Button onClick={() => {
            setLoginModalOpened(false);
            openLogin();
          }}>ログインする</Button>
        </Group>
      </Modal>
    </Container>
  );
}
