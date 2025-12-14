import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Card,
  Image, // Image をインポート
  Title,
  Text,
  Group,
  Button,
  Alert,
  Paper,
  Stack, AspectRatio,
} from "@mantine/core";
import { IconCalendar, IconMapPin, IconRoad, IconUsers } from '@tabler/icons-react';
import Favorite from "../utils/Favorite";
import { UserContext } from "../App";
import {
  getFestivals,
  getAccountData,
  updateFavorites,
} from "../utils/apiService";

import useApiData from "../hooks/useApiData";
import AddToGoogleCalendarButton from "../components/AddToGoogleCalendarButton";
import AddToICalendarButton from "../components/AddToICalendarButton";

// ★ コンポーネント化した日記機能
import { DiaryForm, DiaryList, useDiary } from "../components/Diary";

export default function FestivalDetail() {
  const { id } = useParams();
  const { user } = useContext(UserContext);

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
  const [diaries, setDiaries] = useState({});

  // ★ 日記ロジック（コンポーネント化後）
  const diary = useDiary({
    user,
    festival,
    diaries,
    setDiaries,
  });

  // アカウントデータをセット
  useEffect(() => {
    if (!accountData) return;
    setFavorites(accountData.favorites || {});
    setDiaries(accountData.diaries || {});
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
      <Button component={Link} to="/festivals" variant="outline" mb="lg">
        ← お祭り一覧に戻る
      </Button>

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

        <Title order={2}>{festival.name}</Title>


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
            <Text lh="lg" style={{ whiteSpace: 'pre-wrap' }}>
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

          <Favorite
            selected={favorites[id]}
            onToggle={() => {
              const updated = { ...favorites, [id]: !favorites[id] };
              saveFavorites(updated);
            }}
          />
          <Text size="sm" style={{ alignSelf: 'center' }}>お気に入り数: {festival.favorites || 0}</Text>
        </Group>
      </Card>

      {/* ★ 日記入力フォーム（別コンポーネント） */}
      <Paper shadow="xs" p="md" mt="xl" withBorder>
        <Title order={3} mb="md">
          日記
        </Title>

        <DiaryForm
          newDiary={diary.newDiary}
          setNewDiary={diary.setNewDiary}
          newImage={diary.newImage}
          setNewImage={diary.setNewImage}
          editing={diary.editing}
          onSave={diary.handleSaveDiary}
          onCancel={diary.handleCancelEdit}
        />
      </Paper>

      {/* ★ 日記一覧（別コンポーネント） */}
      {diaries[id] && diaries[id].length > 0 && (
        <Paper shadow="xs" p="md" mt="xl" withBorder>
          <Title order={3} mb="md">
            📔 自分の日記一覧
          </Title>

          <DiaryList
            diaries={diaries[id]}
            onEdit={diary.handleEditDiary}
            onDelete={(timestamp) =>
              diary.handleDeleteDiary(id, timestamp)
            }
          />
        </Paper>
      )}
    </Container>
  );
}