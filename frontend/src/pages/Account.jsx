import React, { useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Title, Text, Button, Group, Card, ThemeIcon, SimpleGrid, useMantineColorScheme } from '@mantine/core';
import { UserContext } from "../UserContext";
import { IconLogout, IconHeart, IconHistory, IconSettings } from '@tabler/icons-react';
import { useLogout } from "../hooks/useLogout";
import '../css/GlassStyle.css';

export default function Account() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const isAdmin = user?.is_admin;

  // --- ログインチェックとリダイレクト ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!user && !storedUser) {
      navigate("/login");
    }
  }, [user, navigate]);

  const logout = useLogout();

  const accountModules = [
    {
      title: 'お気に入り',
      description: 'お気に入り登録したお祭りの一覧を確認・管理します。',
      icon: <IconHeart size="2rem" />,
      link: '/account/favorites',
      color: 'red',
    },
    {
      title: '編集履歴',
      description: '過去に行ったお祭り情報の編集や提供の履歴を確認します。',
      icon: <IconHistory size="2rem" />,
      link: '/account/logs',
      color: 'blue',
    },
    {
      title: 'アカウント設定',
      description: 'プロフィール情報の変更やソーシャル連携、パスキーの設定を行います。',
      icon: <IconSettings size="2rem" />,
      link: '/account/settings',
      color: 'gray',
    },
  ];

  // --- UI ---
  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" align="center" my="xl">
        <Title order={1} c={colorScheme === 'dark' ? 'white' : 'dark'}>{user?.username ?? user?.username} さんのマイページ</Title>
        <Button 
          leftSection={<IconLogout size={16} />} 
          color="red" 
          variant="outline" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            logout();
          }}
        >
          ログアウト
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        {accountModules.map((module) => (
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
