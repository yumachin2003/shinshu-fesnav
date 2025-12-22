import React, { useState } from 'react';
// API通信ロジックを分離したモジュールをインポート
import { Container, Title, Table, Alert, Text, Modal, Button, Group, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { getFestivals, deleteFestival } from '../utils/apiService';
import useApiData from '../hooks/useApiData';
import FestivalRegistrationForm from '../components/FestivalRegistrationForm';

function ItemManagement() {
  // 🔹 常に Hooks を最初に呼ぶ（ルール）
  const { data: festivals, loading, error, refetch } = useApiData(getFestivals);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingFestival, setEditingFestival] = useState(null);

  // 🔹 ユーザー情報チェック（Hooks のあとで実行）
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

  const handleEdit = (festival) => {
    setEditingFestival(festival);
    open();
  };

  const handleAddNew = () => {
    setEditingFestival(null);
    open();
  };

  const handleDelete = async (id) => {
    if (window.confirm('このお祭りを削除してもよろしいですか？')) {
      try {
        await deleteFestival(id);
        refetch();
      } catch (err) {
        alert('削除に失敗しました。');
      }
    }
  };

  return (
    <Container>
      <Title order={1}>お祭り管理</Title>

      <Group mt="xl">
        <Button onClick={handleAddNew} size="md">新規お祭りを追加</Button>
      </Group>

      <Title order={2} mt="xl">登録済みのお祭り</Title>

      {error && <Alert color="red" mt="md">お祭りデータの読み込みに失敗しました。</Alert>}

      {loading ? (
        <Text mt="md">読み込み中...</Text>
      ) : festivals && (
        <>
          <Table mt="md">
            <Table.Thead>
              <tr>
                <th>名前</th>
                <th>開催日</th>
                <th>場所</th>
                <th style={{ width: '100px' }}>操作</th>
              </tr>
            </Table.Thead>
            <Table.Tbody>
              {festivals.map((festival) => (
                <Table.Tr key={festival.id}>
                  <Table.Td>{festival.name}</Table.Td>
                  <Table.Td>{festival.date}</Table.Td>
                  <Table.Td>{festival.location}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon variant="light" color="blue" onClick={() => handleEdit(festival)} title="編集">
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="light" color="red" onClick={() => handleDelete(festival.id)} title="削除">
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </>
      )}

      <Modal opened={opened} onClose={close} title={editingFestival ? "お祭り情報の編集" : "新規お祭り登録"} size="lg" centered>
        <FestivalRegistrationForm 
          onFestivalAdded={() => { refetch(); close(); }} 
          festivalData={editingFestival}
        />
      </Modal>
    </Container>
  );
}

export default ItemManagement;
