import React, { useState, useEffect } from 'react';
import { Container, Title, TextInput, PasswordInput, Stack, Group, Button, Text, useMantineColorScheme, Alert, Table, Paper, ActionIcon, Modal, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconEdit, IconUserPlus, IconRosetteDiscountCheckFilled } from '@tabler/icons-react';
import { apiClient, getUsers } from '../utils/apiService';
import BackButton from '../utils/BackButton';
import '../css/GlassStyle.css';

export default function AddAdminUser() {
  const { colorScheme } = useMantineColorScheme();
  const headerBg = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const [opened, { open, close }] = useDisclosure(false);
  
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  // ログイン中のユーザー情報を取得
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [adminUsers, setAdminUsers] = useState([]);

  const fetchAdminUsers = async () => {
    try {
      const response = await getUsers();
      // getUsersのレスポンス形式に対応
      const users = Array.isArray(response) ? response : (response.data || []);
      setAdminUsers(users.filter(u => u.is_admin));
    } catch (err) {
      console.error("管理者一覧の取得に失敗:", err);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const handleEdit = (user) => {
    setEditingId(user.id);
    setUsername(user.username);
    setDisplayName(user.display_name || '');
    setEmail(user.email || '');
    setPassword(''); // パスワードは変更時のみ入力させるため空にする
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    open();
  };

  const handleAddNew = () => {
    setEditingId(null);
    setUsername('');
    setDisplayName('');
    setEmail('');
    setPassword('');
    setError('');
    open();
  };

  const handleClose = () => {
    close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingId) {
        await apiClient.put(`/admin/users/${editingId}`, {
          username,
          display_name: displayName,
          email,
          password: password || undefined // 空の場合は送信しない（バックエンドで無視される）
        });
      } else {
        await apiClient.post('/admin/users', {
          username,
          display_name: displayName,
          email,
          password
        });
      }

      notifications.show({
        title: editingId ? '更新完了' : '作成完了',
        message: editingId ? '管理者アカウント情報を更新しました。' : '新しい管理者アカウントを作成しました。',
        color: 'green',
      });

      if (!editingId) { // 新規作成時のみフォームをクリア
        setUsername('');
        setDisplayName('');
        setEmail('');
        setPassword('');
      }
      fetchAdminUsers();
      close();
    } catch (err) {
      setError(err.response?.data?.error || (editingId ? '更新に失敗しました' : 'ユーザー作成に失敗しました'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (user) => {
    modals.openConfirmModal({
      title: <Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>管理者の削除</Text>,
      centered: true,
      overlayProps: { backgroundOpacity: 0.2, blur: 4 },
      yOffset: '10vh',
      children: <Text size="sm">管理者アカウント <b>{user.display_name} ({user.username})</b> を削除してもよろしいですか？</Text>,
      labels: { confirm: '削除', cancel: 'キャンセル' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await apiClient.delete(`/admin/users/${user.id}`);
          fetchAdminUsers();
        } catch (err) {
          modals.openConfirmModal({
            title: <Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>エラー</Text>,
            centered: true,
            overlayProps: { backgroundOpacity: 0.2, blur: 4 },
            yOffset: '10vh',
            children: <Text size="sm">削除に失敗しました: {err.response?.data?.error || err.message}</Text>,
            labels: { confirm: '閉じる' },
            cancelProps: { display: 'none' },
          });
        }
      },
    });
  };

  return (
    <Container size="sm" py="xl">
      <Group justify="space-between" align="center" mb="xl">
        <Title order={1} c={colorScheme === 'dark' ? 'white' : 'dark'}>管理者アカウントの管理</Title>
        <BackButton to="/admin/dashboard" variant="outline" />
      </Group>

      <Group mb="md">
        <Button leftSection={<IconUserPlus size={16} />} onClick={handleAddNew}>新規作成</Button>
      </Group>

      <Stack gap="xl">
        <Paper withBorder p="md" radius="md">
          <Title order={3} mb="md" size="h4">管理者一覧</Title>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ backgroundColor: headerBg }}>ユーザーID</Table.Th>
                <Table.Th style={{ backgroundColor: headerBg }}>表示名</Table.Th>
                <Table.Th style={{ backgroundColor: headerBg }}>メールアドレス</Table.Th>
                <Table.Th style={{ backgroundColor: headerBg }}>最終ログイン</Table.Th>
                <Table.Th style={{ width: '100px', backgroundColor: headerBg }}>操作</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {adminUsers.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td>
                    <Tooltip label={`ID: ${u.id}`} withArrow>
                      <Text size="sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {u.username} {u.is_admin && <IconRosetteDiscountCheckFilled size={14} color="var(--glass-text-dimmed)" />}
                      </Text>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td>{u.display_name || '-'}</Table.Td>
                  <Table.Td>{u.email || '未登録'}</Table.Td>
                  <Table.Td>{u.last_login_at ? new Date(u.last_login_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '-'}</Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      {currentUser && (currentUser.id === u.id || currentUser.username === 'root') && (
                        <ActionIcon color="blue" variant="light" onClick={() => handleEdit(u)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                      )}
                    {u.username !== 'root' && (
                      <ActionIcon color="red" variant="light" onClick={() => handleDelete(u)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>

      <Modal 
        opened={opened} 
        onClose={handleClose} 
        title={<Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>{editingId ? '管理者アカウントの編集' : '新規作成'}</Text>} 
        size="lg" 
        centered 
        overlayProps={{ backgroundOpacity: 0.2, blur: 4 }}
        yOffset="10vh"
      >
        <form onSubmit={handleSubmit}>
          <Stack>
            {error && <Alert color="red" title="エラー">{error}</Alert>}
            
            <TextInput label="ユーザーID" description="4文字以上の半角英数字" required value={username} onChange={(e) => setUsername(e.target.value)} />
            <TextInput label="ユーザー名（表示名）" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <TextInput label="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} />
            <PasswordInput label="パスワード" required={!editingId} placeholder={editingId ? "変更する場合のみ入力" : ""} value={password} onChange={(e) => setPassword(e.target.value)} />
            
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={handleClose}>キャンセル</Button>
              <Button type="submit" loading={loading}>{editingId ? '保存' : '作成'}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}