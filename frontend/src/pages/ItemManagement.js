import React, { useState } from 'react';
// API通信ロジックを分離したモジュールをインポート
import { Container, Title, Table, Alert, Text } from '@mantine/core';
import { getFestivals, createFestival } from '../utils/apiService';
import useApiData from '../hooks/useApiData';

const INITIAL_STATE = {
  name: '',
  date: '',
  location: '',
  description: '',
  access: '',
  attendance: '',
  latitude: '',
  longitude: '',
};

function ItemManagement() {
  // useApiDataフックを使ってお祭りデータを取得
  const { data: festivals, loading, error, refetch } = useApiData(getFestivals);
  const [newFestival, setNewFestival] = useState(INITIAL_STATE);
  const [submitError, setSubmitError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // 動員数、緯度、経度は数値として扱う
    const isNumeric = ['attendance', 'latitude', 'longitude'].includes(name);
    setNewFestival({
      ...newFestival,
      [name]: isNumeric && value !== '' ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newFestival.name.trim() || !newFestival.date.trim() || !newFestival.location.trim()) {
      alert('すべての項目を入力してください。');
      return;
    }
    try {
      await createFestival(newFestival);
      setNewFestival(INITIAL_STATE); // フォームをリセット
      refetch(); // データを再取得
    } catch (error) {
      console.error("Error adding festival:", error);
      setSubmitError("お祭りの追加に失敗しました。");
    }
  };

  return (
    <Container>
      <Title order={2} ta="center" my="xl">お祭り管理</Title>
      <Text c="dimmed" ta="center" mb="xl">
        このページは管理者用です。お祭りの登録は、お祭りページの「お祭り登録」タブからも行えます。
      </Text>

      <Title order={3} mt="xl" mb="md">登録済みのお祭り</Title>
      {submitError && <Alert color="red" title="エラー">{submitError}</Alert>}
      {error && <Alert color="red" title="エラー">お祭りデータの読み込みに失敗しました。</Alert>}
      {loading && <Text>読み込み中...</Text>}
      {festivals && (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>名前</Table.Th>
              <Table.Th>開催日</Table.Th>
              <Table.Th>場所</Table.Th>
              <Table.Th>動員数</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {festivals.map((festival) => (
              <Table.Tr key={festival.id}>
                <Table.Td>{festival.name}</Table.Td>
                <Table.Td>{festival.date}</Table.Td>
                <Table.Td>{festival.location}</Table.Td>
                <Table.Td>{festival.attendance ? festival.attendance.toLocaleString() : ''}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Container>
  );
}

export default ItemManagement;
