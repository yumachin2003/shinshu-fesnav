import React, { useState, useContext, useEffect } from "react";
import { HoverCard, Button, Stack, Text, Anchor } from '@mantine/core';
import { useLocation } from "react-router-dom";
import { useMediaQuery } from '@mantine/hooks';
import { IconUser } from '@tabler/icons-react';
import { UserContext } from "../UserContext";
import { useLogout } from "../hooks/useLogout";

export default function AccountHoverCard() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { user, openLogin, openRegister, loginOpened, registerOpened } = useContext(UserContext);
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const logout = useLogout();

  // ログインまたは新規登録のドロワーが開いたら、ホバーカードを強制的に閉じる
  useEffect(() => {
    if (loginOpened || registerOpened) {
      setOpened(false);
    }
  }, [loginOpened, registerOpened]);

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
        disabled={isLoginPage}
      >
        <HoverCard.Target>
          <Button variant="subtle" leftSection={<IconUser size={18} />} px={isMobile ? 8 : undefined}>
            {!isMobile && "アカウント"}
          </Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Stack gap="xs">
            <Text size="sm" fw={500}>ログイン中</Text>
            <Text size="xs" c="dimmed">ユーザー名: {user.display_name || user.username}</Text>
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

  return (
    <HoverCard 
      width={220} 
      shadow="md" 
      withArrow 
      openDelay={200} 
      closeDelay={200}
      opened={opened}
      onChange={setOpened}
      disabled={isLoginPage}
    >
      <HoverCard.Target>
        <Button variant="subtle" leftSection={<IconUser size={18} />} px={isMobile ? 8 : undefined}>
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