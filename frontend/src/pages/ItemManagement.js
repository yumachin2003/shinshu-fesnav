import React, { useState } from 'react';
// API通信ロジックを分離したモジュールをインポート
import { Container, Title, Table, Alert, Text, TextInput, Button } from '@mantine/core';
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
  // 🔹 常に Hooks を最初に呼ぶ（ルール）
  const { data: festivals, loading, error, refetch } = useApiData(getFestivals);
  const [newFestival, setNewFestival] = useState(INITIAL_STATE);
  const [submitError, setSubmitError] = useState(null);

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
      setSubmitError(null);          // エラーリセット
      refetch();                     // 再取得
    } catch (error) {
      console.error("Error adding festival:", error);

      if (error.response && error.response.status === 403) {
        setSubmitError("権限がありません");
      } else {
        setSubmitError("お祭りの追加に失敗しました。");
      }
    }
  };

  return (
    <Container>
      <Title order={1}>お祭り管理</Title>

      <form onSubmit={handleSubmit}>
        <TextInput
          name="name"
          value={newFestival.name}
          onChange={handleInputChange}
          placeholder="お祭り名"
          disabled={loading}
          required
        />
        <TextInput
          type="date"
          name="date"
          value={newFestival.date}
          onChange={handleInputChange}
          placeholder="開催日"
          disabled={loading}
          required
        />
        <TextInput
          name="location"
          value={newFestival.location}
          onChange={handleInputChange}
          placeholder="開催場所"
          disabled={loading}
          required
        />
        <Button type="submit" loading={loading} mt="md">
          お祭りを追加
        </Button>
      </form>

      <Title order={2} mt="xl">登録済みのお祭り</Title>

      {submitError && <Alert color="red" mt="md">{submitError}</Alert>}
      {error && <Alert color="red" mt="md">お祭りデータの読み込みに失敗しました。</Alert>}

      {loading ? (
        <Text mt="md">読み込み中...</Text>
      ) : festivals && (
        <Table mt="md">
          <Table.Thead>
            <thead>
              <tr>
                <th>名前</th>
                <th>開催日</th>
                <th>場所</th>
              </tr>
            </thead>
          </Table.Thead>
          <Table.Tbody>
            <tbody>
              {festivals.map((festival) => (
                <Table.Tr key={festival.id}>
                  <Table.Td>{festival.name}</Table.Td>
                  <Table.Td>{festival.date}</Table.Td>
                  <Table.Td>{festival.location}</Table.Td>
                </Table.Tr>
              ))}
            </tbody>
          </Table.Tbody>
        </Table>
      )}
    </Container>
  );
}

export default ItemManagement;
