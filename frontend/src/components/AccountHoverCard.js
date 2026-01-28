import React, { useState, useContext, useEffect } from "react";
import { HoverCard, Button, Stack, Text, Anchor } from '@mantine/core';
import { useLocation, Link } from "react-router-dom"; // Link をインポート
import { useMediaQuery } from '@mantine/hooks';
import { IconUser } from '@tabler/icons-react';
import { UserContext } from "../UserContext";
import { useLogout } from "../hooks/useLogout";

export default function AccountHoverCard() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { user, openLogin, openRegister, loginOpened, registerOpened } = useContext(UserContext);
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const isAccountPage = location.pathname === "/account";
  const logout = useLogout();

  useEffect(() => {
    if (loginOpened || registerOpened) {
      setOpened(false);
    }
  }, [loginOpened, registerOpened]);

  // ログイン済みの場合
  if (user) {
    return (
      <HoverCard 
        width={220} 
        shadow="md" 
        withArrow 
        openDelay={200} 
        closeDelay={200}
        opened={opened}
        onChange={setOpened}
        disabled={isAccountPage}
      >
        <HoverCard.Target>
          {/* ★ component={Link} と to="/account" を追加 */}
          <Button 
            component={Link} 
            to="/account"
            variant={isAccountPage ? "light" : "subtle"}
            leftSection={<IconUser size={18} />} 
            px={isMobile ? 8 : undefined}
            onClick={() => setOpened(false)} // クリック時にメニューを閉じる
          >
            {!isMobile && "アカウント"}
          </Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Stack gap="xs">
            <Text size="sm" fw={500}>ログイン中</Text>
            <Text size="xs" c="dimmed">ユーザー名: {user.display_name || user.username}</Text>
            {/* 詳細ページへの導線としても機能 */}
            <Button component={Link} to="/account" variant="light" size="xs" fullWidth onClick={() => setOpened(false)}>
              アカウント設定
            </Button>
            <Button variant="outline" color="red" size="xs" fullWidth onClick={() => {
              setOpened(false);
              logout();
            }}>
              ログアウト
            </Button>
          </Stack>
        </HoverCard.Dropdown>
      </HoverCard>
    );
  }

  // 未ログインの場合（ボタンを押しても遷移せず、ホバーメニューでログインを促す）
  return (
    <HoverCard 
      width={220} 
      shadow="md" 
      withArrow 
      openDelay={200} 
      closeDelay={200}
      opened={opened}
      onChange={setOpened}
    >
      <HoverCard.Target>
        <Button 
          variant="subtle" 
          leftSection={<IconUser size={18} />} 
          px={isMobile ? 8 : undefined}
          onClick={openLogin} // 未ログイン時は直接ログイン画面を開くのもアリ
        >
          {!isMobile && "アカウント"}
        </Button>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Stack gap="xs">
          <Text size="sm" fw={500}>ログインしていません</Text>
          <Button variant="outline" color="blue" size="xs" fullWidth onClick={() => {
            setOpened(false);
            openLogin();
          }}>
            ログイン
          </Button>
          <Text size="xs" ta="center" mt={5}>
            または: 
            <Anchor component="button" type="button" size="xs" ml={5} onClick={() => {
              setOpened(false);
              openRegister();
            }}>
              新規登録
            </Anchor>
          </Text>
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}