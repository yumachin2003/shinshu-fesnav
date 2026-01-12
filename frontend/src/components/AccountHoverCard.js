import React, { useState, useContext } from "react";
import { HoverCard, Button, Stack, Text } from '@mantine/core';
import { Link, useLocation } from "react-router-dom";
import { UserContext } from "../App";
import LoginForm from "../utils/LoginForm";

export default function AccountHoverCard() {
  const { user, setUser } = useContext(UserContext);
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  const handleLogout = () => {
    if (window.confirm("本当にログアウトしますか？")) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      setOpened(false);
      window.location.href = "/";
    }
  };

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
          <Button component={Link} to="/account" variant="subtle" onClick={() => setOpened(false)}>
            アカウント
          </Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Stack gap="xs">
            <Text size="sm" fw={500}>ログイン中</Text>
            <Text size="xs" c="dimmed">ユーザー名: {user.display_name || user.username}</Text>
            <Button variant="outline" color="red" size="xs" fullWidth onClick={handleLogout}>
              ログアウト
            </Button>
          </Stack>
        </HoverCard.Dropdown>
      </HoverCard>
    );
  }

  return (
    <HoverCard 
      width={300} 
      shadow="md" 
      withArrow 
      openDelay={200} 
      closeDelay={200}
      opened={opened}
      onChange={setOpened}
      disabled={isLoginPage}
    >
      <HoverCard.Target>
        <Button component={Link} to="/login" variant="subtle" onClick={() => setOpened(false)}>
          アカウント
        </Button>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <LoginForm isPopup={true} onSuccess={() => setOpened(false)} />
      </HoverCard.Dropdown>
    </HoverCard>
  );
}