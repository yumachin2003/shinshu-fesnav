import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Title, Text, Button, Group, Box, Paper, SimpleGrid, Alert, Divider, Stack, useMantineColorScheme } from '@mantine/core';
import { UserContext } from "../UserContext";
import { modals } from '@mantine/modals';
import { getEditLogs } from "../utils/apiService";
import useApiData from '../hooks/useApiData';
import BackButton from "../utils/BackButton";

export default function AccountLogs() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const { data: fetchedEditLogs, loading: editLogsLoading, error: editLogsError } = useApiData(getEditLogs, [user?.id], !user);
  const [showAllLogs, setShowAllLogs] = useState(false);

  const handleExportCSV = () => {
    if (!fetchedEditLogs || fetchedEditLogs.length === 0) { 
      modals.openConfirmModal({
        title: '通知',
        centered: true,
        children: <Text size="sm">出力する編集履歴がありません。</Text>,
        labels: { confirm: '閉じる' },
        cancelProps: { display: 'none' },
      });
      return; 
    }
    const headers = ["お祭り名", "編集内容", "日時"];
    const rows = fetchedEditLogs.map(log => [`"${log.festival}"`, `"${log.content.replace(/"/g,'""')}"`, `"${log.date}"`]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `festivalEditLogs.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (editLogsLoading) return <Container><Text>データを読み込み中...</Text></Container>;
  if (editLogsError) return <Container><Alert color="red" title="エラー">データの読み込みに失敗しました</Alert></Container>;

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" align="center" mb="xl">
        <Title order={2} c={colorScheme === 'dark' ? 'white' : 'dark'}>編集履歴</Title>
        <Group>
          <Button onClick={() => setShowAllLogs(prev => !prev)} variant="outline">{showAllLogs ? "自分の履歴に戻す" : "全期間の履歴を見る"}</Button>
          <Button onClick={handleExportCSV} variant="light" color="green">CSV形式で出力</Button>
          <BackButton to="/account" variant="outline" />
        </Group>
      </Group>

      {!fetchedEditLogs || fetchedEditLogs.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">まだ編集履歴はありません。</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {fetchedEditLogs.map((log, i) => (
            <Paper key={i} withBorder p="md" radius="md" shadow="xs">
              <Stack gap="xs">
                <Box>
                  <Text fw={700} size="sm" mb={4} truncate c={colorScheme === 'dark' ? 'white' : 'dark'}>{log.festival}</Text>
                  <Text size="xs" c="dimmed">{new Date(log.date).toLocaleString('ja-JP')}</Text>
                </Box>
                <Divider />
                <Text size="sm" c={colorScheme === 'dark' ? 'white' : 'dark'}>{log.content}</Text>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}