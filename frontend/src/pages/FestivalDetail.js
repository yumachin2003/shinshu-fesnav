import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Card, Title, Text, Group, Button, Textarea, FileInput, Image, Alert, Paper, Stack, AspectRatio } from '@mantine/core';
import { IconCalendar, IconMapPin, IconRoad, IconUsers } from '@tabler/icons-react';
import Favorite from "../utils/Favorite";
import { UserContext } from "../App";
import { getFestivals, getAccountData, updateFavorites, updateDiaries, addEditLogToBackend } from "../utils/apiService";
import useApiData from '../hooks/useApiData';
import AddToGoogleCalendarButton from "../components/AddToGoogleCalendarButton";
import AddToICalendarButton from "../components/AddToICalendarButton";

export default function FestivalDetail() {
  const { id } = useParams(); // URLからお祭りのIDを取得
  const { user } = useContext(UserContext);

  // --- APIからデータを取得 ---
  const { data: festivals, loading: festivalsLoading, error: festivalsError } = useApiData(getFestivals);
  const { data: accountData, loading: accountLoading, error: accountError } = useApiData(getAccountData, [user?.id]);

  // --- Stateの定義 ---
  const [festival, setFestival] = useState(null);
  const [favorites, setFavorites] = useState({});
  const [diaries, setDiaries] = useState({});
  const [newDiary, setNewDiary] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [editing, setEditing] = useState(null);

  // APIから取得したアカウントデータでStateを更新
  useEffect(() => {
    if (accountData) {
      setFavorites(accountData.favorites || {});
      setDiaries(accountData.diaries || {});
    }
  }, [accountData]);

  // 全お祭りリストから該当IDのお祭りを見つけてStateにセット
  useEffect(() => {
    if (festivals) {
      const currentFestival = festivals.find(f => f.id === parseInt(id, 10));
      setFestival(currentFestival);
    }
  }, [festivals, id]);

  // --- データ保存関数 (API呼び出し) ---
  const saveFavorites = async (updated) => {
    setFavorites(updated);
    await updateFavorites(updated).catch(err => console.error("お気に入りの更新に失敗", err));
  };

  const saveDiaries = async (updated) => {
    setDiaries(updated);
    await updateDiaries(updated).catch(err => console.error("日記の更新に失敗", err));
  };

  // 編集履歴追加
  const logEditAction = async (content) => {
    if (!user || !festival) return;

    const newLogData = {
      festival_id: festival.id,
      festival_name: festival.name,
      content: content,
      date: new Date().toISOString(),
    };

    try {
      await addEditLogToBackend(newLogData);
    } catch (error) {
      console.error("編集履歴の保存に失敗しました:", error);
    }
  };

  // 日記保存（新規・編集共通）
  const handleSaveDiary = async () => {
    const text = newDiary.trim();
    if (!text && !newImage) return;

    const updated = { ...diaries };
    const now = new Date().toLocaleString();

    if (editing) {
      updated[id] = updated[id].map((d) =>
        d.timestamp === editing.timestamp
          ? { ...d, text, image: newImage ?? d.image, date: now }
          : d
      );
      logEditAction(`日記を編集しました: ${text}`);
      setEditing(null);
    } else {
      const newEntry = {
        text: text || "",
        image: newImage || null,
        timestamp: Date.now(),
        date: now,
      };
      updated[id] = [...(updated[id] || []), newEntry];
      logEditAction(`新しい日記を投稿しました: ${text}`);
    }

    await saveDiaries(updated);
    setNewDiary("");
    setNewImage(null);
  };

  // 日記削除
  const handleDeleteDiary = (timestamp) => {
    if (!window.confirm("この日記を削除しますか？")) return;
    const updated = {
      ...diaries,
      [id]: diaries[id].filter((entry) => entry.timestamp !== timestamp),
    };
    saveDiaries(updated);
    logEditAction("日記を削除しました。");
  };

  // 日記編集開始
  const handleEditDiary = (entry) => {
    setNewDiary(entry.text);
    setNewImage(entry.image || null);
    setEditing(entry);
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    if (!window.confirm("編集をキャンセルしますか？\n変更内容は保存されません。")) return;
    setNewDiary("");
    setNewImage(null);
    setEditing(null);
  };

  // 画像アップロード
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const isLoading = festivalsLoading || (user && accountLoading);
  const error = festivalsError || (user && accountError);

  if (isLoading) return <Container><Text>読み込み中...</Text></Container>;
  if (error) return <Container><Alert color="red" title="エラー">🚨 {error.message || 'データの読み込み中にエラーが発生しました。'}</Alert></Container>;
  if (!festival) return <Container><Alert color="yellow" title="情報なし">お祭りが見つかりません。</Alert></Container>;

  return (
    <Container>
      <Button component={Link} to="/festivals" variant="outline" mb="lg">
        ← お祭り一覧に戻る
      </Button>
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
          <AddToGoogleCalendarButton name={festival.name} location={festival.location} date={festival.date} />
          <AddToICalendarButton name={festival.name} location={festival.location} date={festival.date} />
          <Favorite
            selected={favorites[id]}
            onToggle={() => {
              const updated = { ...favorites, [id]: !favorites[id] };
              saveFavorites(updated);
            }}
          />
        </Group>
      </Card>

      <Paper shadow="xs" p="md" mt="xl" withBorder>
        <Title order={3} mb="md">日記</Title>
        <Stack>
          <Textarea
            placeholder="今日の日記を書こう！"
            value={newDiary}
            onChange={(e) => setNewDiary(e.target.value)}
            autosize
            minRows={3}
          />
          <FileInput
            placeholder="画像をアップロード"
            accept="image/*"
            onChange={(file) => {
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setNewImage(reader.result);
              reader.readAsDataURL(file);
            }}
          />
          {newImage && <Image src={newImage} alt="プレビュー" maw={240} mx="auto" radius="md" />}
          <Group>
            <Button onClick={handleSaveDiary} color={editing ? "green" : "orange"}>
              {editing ? "更新する" : "日記を保存"}
            </Button>
            {editing && (
              <Button variant="default" onClick={handleCancelEdit}>
                キャンセル
              </Button>
            )}
          </Group>
        </Stack>
      </Paper>

      {diaries[id] && diaries[id].length > 0 && (
        <Paper shadow="xs" p="md" mt="xl" withBorder>
          <Title order={3} mb="md">📔 自分の日記一覧</Title>
          <Stack>
            {diaries[id].map((entry) => (
              <Card key={entry.timestamp} withBorder>
                <Text size="sm" c="dimmed">{entry.date}</Text>
                {entry.image && (
                  <Image src={entry.image} alt="投稿写真" maw={400} my="sm" radius="md" />
                )}
                <Text>{entry.text}</Text>
                <Group mt="sm">
                  <Button size="xs" variant="light" onClick={() => handleEditDiary(entry)}>編集</Button>
                  <Button size="xs" variant="light" color="red" onClick={() => handleDeleteDiary(entry.timestamp)}>削除</Button>
                </Group>
              </Card>
            ))}
          </Stack>
        </Paper>
      )}
    </Container>
  );
}