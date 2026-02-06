import React, { useState, useContext, useEffect } from "react";
import { HoverCard, Button, Stack, Text, Anchor } from '@mantine/core';
import { useLocation } from "react-router-dom"; // Link をインポート
import { useMediaQuery } from '@mantine/hooks';
import { IconUser, IconLayoutDashboard, IconRosetteDiscountCheckFilled } from '@tabler/icons-react';
import { UserContext } from "../UserContext";
import { useLogout } from "../hooks/useLogout";

import '../css/GlassStyle.css';

export default function AccountHoverCard() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { user, openLogin, openRegister, loginOpened, registerOpened } = useContext(UserContext);
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const logout = useLogout();

  const isAdmin = user?.username === "root" || user?.is_admin;
  const targetPath = isAdmin ? "/admin/dashboard" : "/account";
  const isActive = location.pathname === targetPath;

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
        zIndex={2000}
      >
        <HoverCard.Target>
          {/* ★ component={Link} と to="/account" を追加 */}
          <Button 
            component="a" 
            href={targetPath}
            variant={isActive ? "light" : "subtle"}
            leftSection={isAdmin ? <IconLayoutDashboard size={18} /> : <IconUser size={18} />} 
            px={isMobile ? 8 : undefined}
            onClick={() => setOpened(false)} // クリック時にメニューを閉じる
          >
            {!isMobile && (isAdmin ? "管理" : "アカウント")}
          </Button>
        </HoverCard.Target>
        <HoverCard.Dropdown className="glass-dropdown">
          <Stack gap="xs">
            <Text size="sm" fw={500} c="var(--glass-text)">{isAdmin ? "管理者アカウントでログイン中" : "ログイン中"}</Text>
            <Text size="xs" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {user.display_name || user.username}
              {isAdmin && <IconRosetteDiscountCheckFilled size={14} color="var(--glass-text-dimmed)" />}
            </Text>
            {!isAdmin && (
              <Button component="a" href="/account" variant="light" size="xs" fullWidth onClick={() => setOpened(false)}>
                アカウント設定
              </Button>
            )}
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
      zIndex={2000}
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
      <HoverCard.Dropdown className="glass-dropdown">
        <Stack gap="xs">
          <Text size="sm" fw={500} c="var(--glass-text)">ログインしていません</Text>
          <Button variant="outline" color="blue" size="xs" fullWidth onClick={() => {
            setOpened(false);
            openLogin();
          }}>
            ログイン
          </Button>
          <Text size="xs" ta="center" mt={5} c="var(--glass-text)">
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