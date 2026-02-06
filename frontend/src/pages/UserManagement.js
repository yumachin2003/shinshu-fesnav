import React, { useEffect, useState, useMemo } from 'react';
import { Container, Title, Table, Alert, Text, Group, ActionIcon, Paper, useMantineColorScheme, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { Link } from 'react-router-dom';
import { IconTrash, IconChevronUp, IconChevronDown, IconSelector, IconKeyFilled } from '@tabler/icons-react';
import { getUsers, deleteUser } from '../utils/apiService';
import useApiData from '../hooks/useApiData';
import BackButton from '../utils/BackButton';
import '../css/GlassStyle.css';
import lineLogo from "../img/line_88.png";

function UserManagement() {
  // 🔹 常に Hooks を最初に呼ぶ
  const { data: users, loading, error, refetch } = useApiData(getUsers);
  const { colorScheme } = useMantineColorScheme();
  const headerBg = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const [sortBy, setSortBy] = useState(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  // デバッグ用：データの中身をコンソールで確認
  useEffect(() => {
    if (users) console.log("取得したユーザーデータ:", users);
  }, [users]);

  // レスポンスが配列ならそのまま、オブジェクトで中に users 配列があればそれを使う
  const userList = Array.isArray(users) 
    ? users 
    : (Array.isArray(users?.users) 
        ? users.users 
        : (Array.isArray(users?.data) 
            ? users.data 
            : null));
            
  const isDataValid = Array.isArray(userList);

  const setSorting = (field) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
  };

  const sortedUsers = useMemo(() => {
    if (!userList) return [];
    
    // 管理者アカウントを除外
    const filteredUsers = userList.filter(u => !u.is_admin);

    if (!sortBy) return filteredUsers;

    return [...filteredUsers].sort((a, b) => {
      const valA = a[sortBy] === null || a[sortBy] === undefined ? '' : String(a[sortBy]);
      const valB = b[sortBy] === null || b[sortBy] === undefined ? '' : String(b[sortBy]);
      return reverseSortDirection ? valB.localeCompare(valA, 'ja') : valA.localeCompare(valB, 'ja');
    });
  }, [userList, sortBy, reverseSortDirection]);

  // 🔹 ユーザー情報チェック
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = storedUser && storedUser.is_admin;

  // 🔹 root 以外は閲覧不可
  if (!isAdmin) {
    return (
      <div style={{ padding: "20px", fontSize: "18px", color: "red" }}>
        閲覧権限がありません
      </div>
    );
  }

  const handleDelete = (user) => {
    modals.openConfirmModal({
      title: 'ユーザーの削除',
      centered: true,
      overlayProps: { backgroundOpacity: 0.2, blur: 4 },
      children: <Text size="sm"><b>{user.username}</b> を削除してもよろしいですか？</Text>,
      labels: { confirm: '削除', cancel: 'キャンセル' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteUser(user.id);
          refetch();
        } catch (err) {
          modals.openConfirmModal({
            title: 'エラー',
            centered: true,
            overlayProps: { backgroundOpacity: 0.2, blur: 4 },
            children: <Text size="sm">削除に失敗しました。</Text>,
            labels: { confirm: '閉じる' },
            cancelProps: { display: 'none' },
          });
        }
      },
    });
  };

  const SortableTh = ({ children, field }) => {
    const sorted = sortBy === field;
    const Icon = sorted ? (reverseSortDirection ? IconChevronUp : IconChevronDown) : IconSelector;
    return (
      <Table.Th 
        style={{ color: 'var(--glass-text)', backgroundColor: headerBg, cursor: 'pointer' }} 
        onClick={() => setSorting(field)}
      >
        <Group justify="space-between" wrap="nowrap">
          <Text fw={700} size="sm" style={{ color: 'var(--glass-text)' }}>{children}</Text>
          <Icon size={14} stroke={1.5} />
        </Group>
      </Table.Th>
    );
  };

  return (
    <Container>
      <Group justify="space-between" align="center" mb="xl">
        <Title order={1} c={colorScheme === 'dark' ? 'white' : 'dark'}>ユーザー管理</Title>
        <BackButton to="/admin/dashboard" variant="outline" />
      </Group>

      <Title order={2} mt="xl" c={colorScheme === 'dark' ? 'white' : 'dark'}>登録済みのユーザー</Title>

      <Text size="sm" c="dimmed" mt="xs" mb="md">
        管理者ユーザーは<Link to="/admin/users/add" style={{ color: '#339af0', textDecoration: 'underline' }}>管理者アカウントの管理</Link>から確認・変更できます。
      </Text>

      {error && <Alert color="red" mt="md">ユーザーデータの読み込みに失敗しました。</Alert>}

      {loading ? (
        <Text mt="md">読み込み中...</Text>
      ) : isDataValid ? (
        <Paper shadow="sm" p="md" radius="md" mt="md" className="glass-panel">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <SortableTh field="username">ユーザー名</SortableTh>
                <SortableTh field="display_name">表示名</SortableTh>
                <SortableTh field="email">メールアドレス</SortableTh>
                <Table.Th style={{ color: 'var(--glass-text)', backgroundColor: headerBg }}>連携</Table.Th>
                <Table.Th style={{ color: 'var(--glass-text)', backgroundColor: headerBg }}>パスキー</Table.Th>
                <Table.Th style={{ width: '100px', color: 'var(--glass-text)', backgroundColor: headerBg }}>操作</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedUsers.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td style={{ color: 'var(--glass-text)' }}>{u.username}</Table.Td>
                  <Table.Td style={{ color: 'var(--glass-text)' }}>{u.username || '-'}</Table.Td>
                  <Table.Td style={{ color: 'var(--glass-text)' }}>{u.email || '-'}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {u.google_connected && (
                        <Tooltip label={`ID: ${u.google_user_id}`} withArrow>
                          <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" width={18} height={18} />
                        </Tooltip>
                      )}
                      {u.line_connected && (
                        <Tooltip label={`ID: ${u.line_user_id}`} withArrow>
                          <img src={lineLogo} alt="LINE" width={18} height={18} />
                        </Tooltip>
                      )}
                      {!u.google_connected && !u.line_connected && <Text size="xs" c="dimmed">未</Text>}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {u.passkey_registered ? (
                        <Tooltip 
                          label={
                            <div>
                              {u.passkeys?.map(pk => (
                                <div key={pk.id}>ID: {pk.credential_id.substring(0, 10)}... (Count: {pk.sign_count})</div>
                              ))}
                            </div>
                          } 
                          withArrow
                        >
                          <IconKeyFilled size={18} color="green" />
                        </Tooltip>
                      ) : <Text size="xs" c="dimmed">未</Text>}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {/* rootユーザー自身は削除できないように制御 */}
                      {u.username !== 'root' && (
                        <ActionIcon variant="light" color="red" onClick={() => handleDelete(u)} title="削除">
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
      ) : (
        !loading && users && <Text mt="md" c="red">データの形式が正しくありません。バックエンドのレスポンスを確認してください。</Text>
      )}
    </Container>
  );
}

export default UserManagement;