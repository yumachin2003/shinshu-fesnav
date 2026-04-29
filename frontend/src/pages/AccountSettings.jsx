import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Title, Text, Button, Group, Box, Stack, TextInput, PasswordInput, Divider, Paper, SimpleGrid, Alert, useMantineColorScheme } from '@mantine/core';
import { modals } from '@mantine/modals';
import { UserContext } from "../UserContext";
import { updateProfile, getUserPasskeys, deletePasskey, getAccountData } from "../utils/apiService";
import useApiData from '../hooks/useApiData';
import PasskeyButton from "../components/PasskeyButton";
import SocialLoginButtons from "../components/SocialLoginButtons";
import BackButton from "../utils/BackButton";

export default function AccountSettings() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const isAdmin = user?.is_admin;

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const { data: passkeys, loading: passkeysLoading, error: passkeysError, refetch: refetchPasskeys } = useApiData(getUserPasskeys, [user?.id], !user);
  const { data: accountData } = useApiData(getAccountData, [user?.id], !user);

  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [newDisplayName, setNewDisplayName] = useState(user?.display_name || "");
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (user) {
      setNewUsername(user.username || "");
      setNewDisplayName(user.display_name || "");
      setNewEmail(user.email || "");
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({ username: newUsername, display_name: newDisplayName, email: newEmail, password: newPassword || undefined });
      modals.openConfirmModal({
        title: '成功',
        centered: true,
        children: <Text size="sm">プロフィールを更新しました</Text>,
        labels: { confirm: '閉じる' },
        cancelProps: { display: 'none' },
      });
      setNewPassword("");
    } catch (err) {
      modals.openConfirmModal({
        title: 'エラー',
        centered: true,
        children: <Text size="sm">更新に失敗しました: {err.response?.data?.error || err.message}</Text>,
        labels: { confirm: '閉じる' },
        cancelProps: { display: 'none' },
        confirmProps: { color: 'red' },
      });
    }
  };

  const handleDeletePasskey = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    modals.openConfirmModal({
      title: 'パスキーの削除',
      centered: true,
      children: <Text size="sm">このパスキーを削除しますか？この操作は取り消せません。</Text>,
      labels: { confirm: '削除する', cancel: 'キャンセル' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deletePasskey(id);
          refetchPasskeys();
        } catch (err) {
          modals.openConfirmModal({
            title: 'エラー',
            centered: true,
            children: <Text size="sm">削除に失敗しました: {err.message}</Text>,
            labels: { confirm: '閉じる' },
            cancelProps: { display: 'none' },
            confirmProps: { color: 'red' },
          });
        }
      },
    });
  };

  if (passkeysError) return <Container><Alert color="red" title="エラー">データの読み込みに失敗しました</Alert></Container>;

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" align="center" mb="xl">
        <Stack gap={0}>
          <Title order={2} c={colorScheme === 'dark' ? 'white' : 'dark'}>アカウント設定</Title>
          <Text c="dimmed" size="sm">ユーザーID: {user?.username}</Text>
        </Stack>
        <BackButton to="/account" variant="outline" />
      </Group>

      <SimpleGrid cols={{ base: 1, md: isAdmin ? 2 : 3 }} spacing="xl" align="flex-start">
        {/* 1. 基本情報 */}
        <Paper withBorder p="md" radius="md" shadow="xs">
          <Stack>
            <Divider label="基本情報" labelPosition="center" />
            <TextInput label="ユーザーID" description="4文字以上の半角英数字" value={newUsername} onChange={(e) => setNewUsername(e.currentTarget.value)} />
            <TextInput label="ユーザー名（表示名）" value={newDisplayName} onChange={(e) => setNewDisplayName(e.currentTarget.value)} />
            <TextInput label="メールアドレス" value={newEmail} onChange={(e) => setNewEmail(e.currentTarget.value)} />
            <PasswordInput label="新しいパスワード" placeholder="変更する場合のみ入力" value={newPassword} onChange={(e) => setNewPassword(e.currentTarget.value)} />
            <Button onClick={handleUpdateProfile} fullWidth>プロフィールを更新</Button>
          </Stack>
        </Paper>

        {/* 2. ソーシャルログイン連携 */}
        {!isAdmin && (
          <Paper withBorder p="md" radius="md" shadow="xs">
            <Stack>
              <Divider label="ソーシャルログイン連携" labelPosition="center" />
              <Text size="xs" c="dimmed">現在のアカウントと同じメールアドレスのGoogle/LINEアカウントと連携することで、次回からボタン一つでログインできるようになります。</Text>
              <Group>
                <Text size="sm" fw={500} c={colorScheme === 'dark' ? 'white' : 'dark'}>現在の連携:</Text>
                <Text size="sm" c={colorScheme === 'dark' ? 'white' : 'dark'}>
                  {[
                    accountData?.google_connected ? 'Google' : null,
                    accountData?.line_connected ? 'LINE' : null
                  ].filter(Boolean).join(', ') || 'なし'}
                </Text>
              </Group>
              <SocialLoginButtons 
                action="connect" 
                connectedStatus={{
                  google: accountData?.google_connected,
                  line: accountData?.line_connected
                }}
              />
            </Stack>
          </Paper>
        )}

        {/* 3. パスキー設定 */}
        <Paper withBorder p="md" radius="md" shadow="xs">
          <Stack>
            <Divider label="パスキー設定" labelPosition="center" />
            <PasskeyButton 
              action="register" 
              username={user?.username} 
              variant="outline" 
              color="blue"
              fullWidth
              onSuccess={() => { 
                modals.openConfirmModal({
                  title: '成功',
                  centered: true,
                  children: <Text size="sm">パスキーの登録に成功しました！</Text>,
                  labels: { confirm: '閉じる' },
                  cancelProps: { display: 'none' },
                });
                refetchPasskeys(); 
              }}
              onError={(err) => modals.openConfirmModal({
                title: 'エラー',
                centered: true,
                children: <Text size="sm">パスキー設定失敗: {err.message}</Text>,
                labels: { confirm: '閉じる' },
                cancelProps: { display: 'none' },
                confirmProps: { color: 'red' },
              })}
            >パスキーを追加登録する</PasskeyButton>

            <Box mt="xs">
              <Text size="sm" fw={500} mb="xs" c={colorScheme === 'dark' ? 'white' : 'dark'}>登録済みデバイス</Text>
              {passkeysLoading ? <Text size="xs">読み込み中...</Text> : (
                <Stack gap={5}>
                  {Array.isArray(passkeys) && passkeys.length > 0 ? passkeys.map(pk => (
                    <Paper key={pk.id} withBorder p="xs" radius="sm">
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="xs" c="dimmed" truncate style={{ flex: 1 }}>
                          ID: {pk.credential_id?.substring(0, 15) || '不明'}...
                        </Text>
                        <Button size="compact-xs" color="red" variant="light" onClick={(e) => handleDeletePasskey(e, pk.id)}>削除</Button>
                      </Group>
                    </Paper>
                  )) : (
                    <Text size="xs" c="dimmed">登録されたパスキーはありません</Text>
                  )}
                </Stack>
              )}
            </Box>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Container>
  );
}