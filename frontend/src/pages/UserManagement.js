import React, { useEffect } from 'react';
import { Container, Title, Table, Alert, Text, Group, ActionIcon } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { getUsers, deleteUser } from '../utils/apiService';
import useApiData from '../hooks/useApiData';
import BackButton from '../utils/BackButton';

function UserManagement() {
  // 🔹 常に Hooks を最初に呼ぶ
  const { data: users, loading, error, refetch } = useApiData(getUsers);

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

  // 🔹 ユーザー情報チェック
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const isRoot = storedUser && storedUser.username === "root";

  // 🔹 root 以外は閲覧不可
  if (!isRoot) {
    return (
      <div style={{ padding: "20px", fontSize: "18px", color: "red" }}>
        閲覧権限がありません
      </div>
    );
  }

  const handleDelete = async (id) => {
    if (window.confirm('このユーザーを削除してもよろしいですか？')) {
      try {
        await deleteUser(id);
        refetch();
      } catch (err) {
        alert('削除に失敗しました。');
      }
    }
  };

  return (
    <Container>
      <Group justify="space-between" align="center" mb="xl">
        <Title order={1}>ユーザー管理</Title>
        <BackButton to="/admin/dashboard" variant="outline" />
      </Group>

      <Title order={2} mt="xl">登録済みのユーザー</Title>

      {error && <Alert color="red" mt="md">ユーザーデータの読み込みに失敗しました。</Alert>}

      {loading ? (
        <Text mt="md">読み込み中...</Text>
      ) : isDataValid ? (
        <Table mt="md">
          <Table.Thead>
            <tr>
              <th>ユーザー名</th>
              <th>表示名</th>
              <th style={{ width: '100px' }}>操作</th>
            </tr>
          </Table.Thead>
          <Table.Tbody>
            {userList.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td>{u.username}</Table.Td>
                <Table.Td>{u.display_name || '-'}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {/* rootユーザー自身は削除できないように制御 */}
                    {u.username !== 'root' && (
                      <ActionIcon variant="light" color="red" onClick={() => handleDelete(u.id)} title="削除">
                        <IconTrash size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        !loading && users && <Text mt="md" c="red">データの形式が正しくありません。バックエンドのレスポンスを確認してください。</Text>
      )}
    </Container>
  );
}

export default UserManagement;