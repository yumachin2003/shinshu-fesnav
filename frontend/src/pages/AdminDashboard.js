import React from 'react';
import { Container, Title, SimpleGrid, Card, Text, Group, ThemeIcon, Center, Button, useMantineColorScheme } from '@mantine/core';
import { IconSettings, IconMessage2, IconLogout, IconUsers, IconUserPlus } from '@tabler/icons-react';
import { useLogout } from '../hooks/useLogout';
import '../css/GlassStyle.css';

export default function AdminDashboard() {
  const logout = useLogout();
  const { colorScheme } = useMantineColorScheme();

  // ユーザー情報チェック（rootユーザーのみアクセス許可）
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = storedUser && storedUser.is_admin;

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
    </Container>
  );
}