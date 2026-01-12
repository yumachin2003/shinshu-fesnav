import React, { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Title, Text, Button, Group, List, Alert, SegmentedControl, Center, Box, Stack, TextInput, PasswordInput } from '@mantine/core';
import { UserContext } from "../App";
import { getFestivals, getAccountData, updateFavorites, getEditLogs, addEditLogToBackend } from "../utils/apiService";
import useApiData from '../hooks/useApiData';
import { initGoogleTranslate } from "../utils/translate";
import { IconLogout, IconHeart, IconHistory, IconSettings } from '@tabler/icons-react';
import { useLogout } from "../hooks/useLogout";
import PasskeyButton from "../components/PasskeyButton";

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
  const [editLogs, setEditLogs] = useState([]);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [activeTab, setActiveTab] = useState('favorites');
  const [newUsername, setNewUsername] = useState(user?.display_name || user?.username || "");
  const [newPassword, setNewPassword] = useState("");

  // --- アカウントデータ反映 ---
  useEffect(() => {
    if (accountData) {
      setFavorites(accountData.favorites || {});
    }
  }, [accountData]);

  useEffect(() => {
    if (fetchedEditLogs) setEditLogs(fetchedEditLogs);
  }, [fetchedEditLogs]);

  useEffect(() => {
    if (user) {
      setNewUsername(user.display_name || user.username || "");
    }
  }, [user]);

  // --- データ保存関数 ---
  const saveFavorites = async (updated) => {
    setFavorites(updated);
    await updateFavorites(updated).catch(err => console.error("お気に入りの更新に失敗", err));
  };

  const logout = useLogout();

  const logEditAction = async (festival, content) => {
    if (!user || !festival) return;
    const newLogData = { festival_id: festival.id, festival_name: festival.name, content, date: new Date().toISOString() };
    try { await addEditLogToBackend(newLogData); refetchEditLogs(); }
    catch (error) { console.error("編集履歴の保存に失敗:", error); }
  };

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

  const handleUpdateProfile = async () => {
    const token = localStorage.getItem("authToken");
    const API_BASE = "http://localhost:5051/api";
    try {
      const resp = await fetch(`${API_BASE}/account/profile`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword || undefined
        }),
      });
      const result = await resp.json();
      if (resp.ok) {
        alert("プロフィールを更新しました");
        setNewPassword(""); // パスワード入力欄をクリア
      } else {
        alert("更新失敗: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("通信エラーが発生しました");
    }
  };

  const segmentData = useMemo(() => [
    {
      value: 'favorites',
      label: (
        <Center>
          <IconHeart size="1rem" />
          <Box ml="xs">お気に入り</Box>
        </Center>
      ),
    },
    {
      value: 'logs',
      label: (
        <Center>
          <IconHistory size="1rem" />
          <Box ml="xs">編集履歴</Box>
        </Center>
      ),
    },
    {
      value: 'settings',
      label: (
        <Center>
          <IconSettings size="1rem" />
          <Box ml="xs">設定</Box>
        </Center>
      ),
    },
  ], []);

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

      <Group justify="center" mb="xl">
        <SegmentedControl
          value={activeTab}
          onChange={setActiveTab}
          data={segmentData}
        />
      </Group>

      {activeTab === 'favorites' && (
        <Box pt="lg">
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
        </Box>
      )}

      {activeTab === 'logs' && (
        <Box pt="lg">
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
        </Box>
      )}

      {activeTab === 'settings' && (
        <Box pt="lg">
          <Stack maw={400} align="flex-start">
            <TextInput
              label="ユーザー名"
              value={newUsername}
              onChange={(e) => setNewUsername(e.currentTarget.value)}
            />
            <PasswordInput
              label="新しいパスワード"
              placeholder="変更する場合のみ入力"
              value={newPassword}
              onChange={(e) => setNewPassword(e.currentTarget.value)}
            />
            <Button onClick={handleUpdateProfile}>プロフィールを更新</Button>
            <PasskeyButton 
              action="register" 
              username={user?.username} 
              variant="outline" 
              color="blue"
              onSuccess={() => alert('パスキーの登録に成功しました！')}
              onError={(err) => alert('パスキー設定失敗: ' + err.message)}
            >パスキーを設定する</PasskeyButton>
          </Stack>
        </Box>
      )}
    </Container>
  );
}
