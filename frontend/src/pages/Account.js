import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Title, Text, Button, Group, Card, List, Image, Grid, Tabs, Alert, Textarea } from '@mantine/core';
import { UserContext } from "../App";
import { getFestivals, getAccountData, updateFavorites, updateDiaries, getEditLogs, addEditLogToBackend } from "../utils/apiService";
import useApiData from '../hooks/useApiData';
import { initGoogleTranslate } from "../utils/translate";
import { IconLogout } from '@tabler/icons-react';
import { useLogout } from "../hooks/useLogout";

export default function Account() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  // --- Google翻訳初期化 ---
  useEffect(() => initGoogleTranslate(), []);

  // --- ログインチェックとリダイレクト ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!user && !storedUser) {
      navigate("/login");
    }
  }, [user, navigate]);

  // --- APIデータ取得 ---
  const { data: festivals, loading: festivalsLoading, error: festivalsError } = useApiData(getFestivals);
  const { data: accountData, loading: accountLoading, error: accountError } = useApiData(
    getAccountData,
    [user?.id],
    !user // userがいない場合はfetchスキップ
  );
  const { data: fetchedEditLogs, loading: editLogsLoading, error: editLogsError, refetch: refetchEditLogs } = useApiData(
    getEditLogs,
    [user?.id],
    !user
  );

  // --- State ---
  const [favorites, setFavorites] = useState({});
  const [diaries, setDiaries] = useState({});
  const [editLogs, setEditLogs] = useState([]);
  const [showAllLogs, setShowAllLogs] = useState(false);

  // --- アカウントデータ反映 ---
  useEffect(() => {
    if (accountData) {
      setFavorites(accountData.favorites || {});
      setDiaries(accountData.diaries || {});
    }
  }, [accountData]);

  useEffect(() => {
    if (fetchedEditLogs) setEditLogs(fetchedEditLogs);
  }, [fetchedEditLogs]);

  // --- データ保存関数 ---
  const saveFavorites = async (updated) => {
    setFavorites(updated);
    await updateFavorites(updated).catch(err => console.error("お気に入りの更新に失敗", err));
  };

  const saveDiaries = async (updated) => {
    setDiaries(updated);
    await updateDiaries(updated).catch(err => console.error("日記の更新に失敗", err));
  };

  const logout = useLogout();

  const logEditAction = async (festival, content) => {
    if (!user || !festival) return;
    const newLogData = { festival_id: festival.id, festival_name: festival.name, content, date: new Date().toISOString() };
    try { await addEditLogToBackend(newLogData); refetchEditLogs(); }
    catch (error) { console.error("編集履歴の保存に失敗:", error); }
  };

  const allPhotos = Object.values(diaries).flat(1).filter(e => e.image);

  // --- CSV出力 ---
  const handleExportCSV = () => {
    if (editLogs.length === 0) { alert("出力する編集履歴がありません。"); return; }
    const headers = ["お祭り名", "編集内容", "日時"];
    const rows = editLogs.map(log => [`"${log.festival}"`, `"${log.content.replace(/"/g,'""')}"`, `"${log.date}"`]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `festivalEditLogs.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // --- ローディング／エラー ---
  if (!user) return <Container><Text>ログイン情報を確認しています...</Text></Container>;
  if (festivalsLoading || accountLoading || editLogsLoading) return <Container><Text>データを読み込み中...</Text></Container>;
  if (festivalsError || accountError || editLogsError) return <Container><Alert color="red" title="エラー">データの読み込みに失敗しました</Alert></Container>;

  // --- UI ---
  return (
    <Container>
      <div id="google_translate_element" style={{ position: "fixed", bottom: 10, right: 10, zIndex: 9999 }}></div>

      <Group justify="space-between" align="center" my="xl">
        <Title order={2}>{user.display_name ?? user.username} さんのマイページ</Title>
        <Button 
          leftSection={<IconLogout size={16} />} 
          color="red" 
          variant="outline" 
          onClick={logout}
        >
          ログアウト
        </Button>
      </Group>

      <Tabs defaultValue="favorites">
        <Tabs.List>
          <Tabs.Tab value="favorites">❤️ お気に入り</Tabs.Tab>
          <Tabs.Tab value="diaries">📔 日記</Tabs.Tab>
          <Tabs.Tab value="photos">📷 写真アルバム</Tabs.Tab>
          <Tabs.Tab value="logs">🕒 編集履歴</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="favorites" pt="lg">
          <List spacing="xs" size="sm" center>
            {Object.entries(favorites).filter(([_, v]) => v).length === 0 && <Text>お気に入りのお祭りはまだありません。</Text>}
            {Object.entries(favorites).filter(([_, v]) => v).map(([fid]) => {
              const f = festivals.find(x => x.id === Number(fid));
              return (
                <List.Item key={fid}>
                  <Group justify="space-between">
                    <Text>{f?.name}</Text>
                    <Button size="xs" variant="light" color="red" onClick={() => { saveFavorites({ ...favorites, [fid]: false }); logEditAction(f, "お気に入りを解除しました"); }}>お気に入り解除</Button>
                  </Group>
                </List.Item>
              );
            })}
          </List>
        </Tabs.Panel>

        <Tabs.Panel value="diaries" pt="lg">
          {Object.entries(diaries).length === 0 ? <Text>まだ日記はありません。</Text> :
            Object.entries(diaries).map(([fid, entries]) => entries.map(entry => {
              const f = festivals.find(x => x.id === Number(fid));
              return (
                <Card withBorder p="md" mb="md" key={entry.timestamp}>
                  <Text fw={500}>{f?.name}</Text>
                  <Text size="xs" c="dimmed">{entry.date}</Text>
                  <Textarea value={entry.text} onChange={(e) => {
                    const updated = { ...diaries };
                    const idx = updated[fid].findIndex(x => x.timestamp === entry.timestamp);
                    updated[fid][idx].text = e.target.value;
                    saveDiaries(updated);
                    logEditAction(f, "日記内容を編集しました");
                  }} autosize minRows={2} my="sm" />
                  {entry.image && <Image src={entry.image} alt="" maw={400} radius="md" my="sm" />}
                </Card>
              );
            }))
          }
        </Tabs.Panel>

        <Tabs.Panel value="photos" pt="lg">
          {allPhotos.length === 0 ? <Text>まだ写真がありません。</Text> :
            <Grid>{allPhotos.map((e, i) => <Grid.Col span={{ base: 6, sm: 4, md: 3 }} key={i}><Image src={e.image} alt="" radius="md" fit="cover" h={150} /></Grid.Col>)}</Grid>
          }
        </Tabs.Panel>

        <Tabs.Panel value="logs" pt="lg">
          <Group mb="md">
            <Button onClick={() => setShowAllLogs(prev => !prev)} variant="outline">{showAllLogs ? "自分の履歴に戻す" : "全期間の履歴を見る"}</Button>
            <Button onClick={handleExportCSV} variant="light" color="green">CSV形式で出力</Button>
          </Group>
          {editLogs.length === 0 ? <Text>まだ編集履歴はありません。</Text> :
            <List spacing="xs" size="sm">
              {editLogs.map((log, i) => (
                <List.Item key={i}>
                  <Text><strong>{log.festival}</strong> — {log.date}</Text>
                  <Text c="dimmed">{log.content}</Text>
                </List.Item>
              ))}
            </List>
          }
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
