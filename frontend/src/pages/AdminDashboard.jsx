import React, { useState, useEffect } from 'react';
import { Container, Title, SimpleGrid, Card, Text, Group, ThemeIcon, Center, Button, useMantineColorScheme, Switch, Stack, Paper } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSettings, IconMessage2, IconLogout, IconUsers, IconUserPlus } from '@tabler/icons-react';
import { useLogout } from '../hooks/useLogout';
import '../css/GlassStyle.css';

export default function AdminDashboard() {
  const logout = useLogout();
  const { colorScheme } = useMantineColorScheme();

  // サイト設定用のState
  const [settings, setSettings] = useState({
    googleLogin: true,
    lineLogin: true,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);

  // ユーザー情報チェック（rootユーザーのみアクセス許可）
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = storedUser && storedUser.is_admin;

  // 設定の取得
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('設定の取得に失敗しました', err);
      }
    };
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  const handleSettingChange = async (key, value) => {
    if (storedUser?.username === 'admin_test') {
      notifications.show({
        title: '権限エラー',
        message: 'プレビュー用アカウントのため設定の変更はできません',
        color: 'red',
      });
      return;
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      setLoadingSettings(true);
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(newSettings)
      });
      
      if (!res.ok) throw new Error('設定の保存に失敗しました');
      
      notifications.show({
        title: '設定を更新しました',
        message: 'サイトの設定が保存されました。',
        color: 'teal',
      });
    } catch (err) {
      notifications.show({
        title: 'エラー',
        message: err.message,
        color: 'red',
      });
      setSettings(settings); // 失敗時は元に戻す
    } finally {
      setLoadingSettings(false);
    }
  };

  if (!isAdmin) {
    return (
      <Center style={{ height: '50vh' }}>
        <Text size="xl" fw={700} c="red">閲覧権限がありません</Text>
      </Center>
    );
  }

  const adminModules = [
    {
      title: 'お祭り管理',
      description: 'お祭りの追加、編集、削除、位置情報の設定などを行います。',
      icon: <IconSettings size="2rem" />,
      link: '/admin/items',
      color: 'blue',
    },
    {
      title: 'ユーザー管理',
      description: '登録ユーザーの確認や削除を行います。',
      icon: <IconUsers size="2rem" />,
      link: '/admin/users',
      color: 'orange',
    },
    {
      title: '情報提供一覧',
      description: 'ユーザーから寄せられたお祭りの修正依頼や新規情報を確認します。',
      icon: <IconMessage2 size="2rem" />,
      link: '/admin/info',
      color: 'teal',
    },
    {
      title: '管理者アカウントの管理',
      description: '管理者アカウントの作成や削除を行います。',
      icon: <IconUserPlus size="2rem" />,
      link: '/admin/users/add',
      color: 'grape',
    },
  ];

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1} c={colorScheme === 'dark' ? 'white' : 'dark'}>管理者ダッシュボード</Title>
        <Button 
          leftSection={<IconLogout size={16} />} 
          color="red" 
          variant="outline" 
          onClick={logout}
        >
          ログアウト
        </Button>
      </Group>
      
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        {adminModules.map((module) => (
          <Card
            key={module.title}
            shadow="sm"
            padding="xl"
            radius="md"
            withBorder
            component="a"
            href={module.link}
            className="glass-panel"
            style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
          >
            <Group>
              <ThemeIcon size={50} radius="md" color={module.color} variant="light">
                {module.icon}
              </ThemeIcon>
              <div>
                <Text fw={500} size="lg" c={colorScheme === 'dark' ? 'white' : 'dark'}>
                  {module.title}
                </Text>
                <Text size="sm" c="dimmed">
                  {module.description}
                </Text>
              </div>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      <Title order={2} mt={40} mb="md" c={colorScheme === 'dark' ? 'white' : 'dark'}>サイトの設定</Title>
      <Paper shadow="sm" p="xl" radius="md" withBorder className="glass-panel">
        <Stack gap="md">
          <Text fw={500} size="lg" c={colorScheme === 'dark' ? 'white' : 'dark'}>ソーシャルログイン設定</Text>
          <Text size="sm" c="dimmed">
            各ソーシャルログイン機能の有効・無効を切り替えます。無効にすると、ユーザー画面のログインボタンが非表示または無効化されます。
          </Text>
          <Group justify="space-between" align="center" style={{ maxWidth: 400 }}>
            <Text c={colorScheme === 'dark' ? 'white' : 'dark'}>Googleログイン</Text>
            <Switch 
              checked={settings.googleLogin} 
              onChange={(event) => handleSettingChange('googleLogin', event.currentTarget.checked)}
              disabled={loadingSettings}
              size="md"
            />
          </Group>
          <Group justify="space-between" align="center" style={{ maxWidth: 400 }}>
            <Text c={colorScheme === 'dark' ? 'white' : 'dark'}>LINEログイン</Text>
            <Switch 
              checked={settings.lineLogin} 
              onChange={(event) => handleSettingChange('lineLogin', event.currentTarget.checked)}
              disabled={loadingSettings}
              size="md"
            />
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}