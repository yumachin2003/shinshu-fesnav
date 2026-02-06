import React, { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Title, Text, Button, Group, Box, Paper, SimpleGrid, Alert, Stack, useMantineColorScheme } from '@mantine/core';
import { UserContext } from "../UserContext";
import { getFestivals, getAccountData, updateFavorites, addEditLogToBackend } from "../utils/apiService";
import useApiData from '../hooks/useApiData';
import BackButton from "../utils/BackButton";

export default function AccountFavorites() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const { data: festivals, loading: festivalsLoading, error: festivalsError } = useApiData(getFestivals);
  const { data: accountData, loading: accountLoading, error: accountError } = useApiData(getAccountData, [user?.id], !user);

  const [favorites, setFavorites] = useState({});

  useEffect(() => {
    if (accountData) setFavorites(accountData.favorites || {});
  }, [accountData]);

  const saveFavorites = async (updated) => {
    setFavorites(updated);
    await updateFavorites(updated).catch(err => console.error("お気に入りの更新に失敗", err));
  };

  const logEditAction = async (festival, content) => {
    if (!user || !festival) return;
    const newLogData = { festival_id: festival.id, festival_name: festival.name, content, date: new Date().toISOString() };
    try { await addEditLogToBackend(newLogData); }
    catch (error) { console.error("編集履歴の保存に失敗:", error); }
  };

  if (festivalsLoading || accountLoading) return <Container><Text>データを読み込み中...</Text></Container>;
  if (festivalsError || accountError) return <Container><Alert color="red" title="エラー">データの読み込みに失敗しました</Alert></Container>;

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" align="center" mb="xl">
        <Title order={2} c={colorScheme === 'dark' ? 'white' : 'dark'}>お気に入りのお祭り</Title>
        <BackButton to="/account" variant="outline" />
      </Group>

      {Object.entries(favorites).filter(([_, v]) => v).length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">お気に入りのお祭りはまだありません。</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {Object.entries(favorites).filter(([_, v]) => v).map(([fid]) => {
            const f = festivals.find(x => x.id === Number(fid));
            if (!f) return null;
            return (
              <Paper key={fid} withBorder p="md" radius="md" shadow="xs">
                <Stack justify="space-between" h="100%">
                  <Box>
                    <Text fw={700} size="md" mb={4} truncate c={colorScheme === 'dark' ? 'white' : 'dark'}>{f.name}</Text>
                    <Text size="xs" c="dimmed" mb={2}>{f.date || '日付未定'}</Text>
                    <Text size="xs" c="dimmed" truncate>{f.location || '場所未定'}</Text>
                  </Box>
                  <Group grow mt="md">
                    <Button component="a" href={`/festivals/${f.id}`} variant="light" size="xs">詳細を見る</Button>
                    <Button size="xs" variant="outline" color="red" onClick={() => { saveFavorites({ ...favorites, [fid]: false }); logEditAction(f, "お気に入りを解除しました"); }}>解除</Button>
                  </Group>
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>
      )}
    </Container>
  );
}