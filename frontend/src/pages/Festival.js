import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Title, Text, SimpleGrid, Card, SegmentedControl, Center, Alert, Select, Group } from '@mantine/core';
import { UserContext } from "../App";
import { getFestivals, getAccountData } from '../utils/apiService'; // getAccountDataをインポート
import useApiData from '../hooks/useApiData'; // useApiDataフックをインポート
import { initGoogleTranslate } from "../utils/translate";
import FestivalCalendar from "../components/FestivalCalendar";
import FestivalMap from '../components/FestivalMap';
import FestivalRegistrationForm from "../components/FestivalRegistrationForm"; // 登録フォームをインポート
import { useNavigate } from "react-router-dom";

export default function Festival() {
  const navigate = useNavigate();  // ← ★ここに追加！

  const { user } = useContext(UserContext);


  // --- APIからデータを取得 ---
  const { data: festivals, loading: festivalsLoading, error: festivalsError, refetch: refetchFestivals } = useApiData(getFestivals);
  const { data: accountData, loading: accountLoading, error: accountError } =
  useApiData(
    user ? getAccountData : async () => ({ data: null }), // ← 未ログインではAPIを呼ばない
    [user?.id]
  );

  // 未ログインチェック機能
  const requireLogin = () => {
    if (!user) {
      const confirmed = window.confirm("この機能を使うにはログインが必要です。\nログインページへ移動しますか？");
      if (confirmed) {
        navigate("/login");
      }
      return false;  // ← ログインしてないので、処理は中断
    }
    return true; // ログイン済み
  };

  // --- Stateの定義 ---
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', 'map', 'register'
  const [sortBy, setSortBy] = useState('default'); // 並び替え用のState

  // --- useEffectフック ---
  useEffect(() => {
    initGoogleTranslate();
  }, []);

  const handleFestivalAdded = () => {
    refetchFestivals(); // お祭りリストを再取得
    setViewMode('list'); // 登録後、リスト表示に戻る
  };

  const isLoading = festivalsLoading;
  const error = festivalsError;

  // useMemoを使ってソート処理を効率化
  const sortedFestivals = useMemo(() => {
    if (!festivals) return [];

    const festivalsCopy = [...festivals];

    switch (sortBy) {
      case 'date':
        // 開催日が近い順
        return festivalsCopy.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          // 無効な日付は末尾に
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          return dateA - dateB;
        });
      case 'popularity':
        // 人気順（動員数が多い順）
        return festivalsCopy.sort((a, b) => (b.attendance || 0) - (a.attendance || 0));
      case 'default':
      default:
        // デフォルト（ID順）
        return festivalsCopy.sort((a, b) => a.id - b.id);
    }
  }, [festivals, sortBy]);

  if (isLoading) { // accountLoadingを削除
    return <Container><Text>読み込み中...</Text></Container>;
  }

  if (error) {
    return <Container><Alert color="red" title="エラー">🚨 {error.message || 'データの読み込み中にエラーが発生しました。'}</Alert></Container>;
  }

  // 表示するコンテンツをviewModeに応じて切り替える
  const renderContent = () => {
    if (!festivals) return null;

    switch (viewMode) {
      case 'calendar':
        return <FestivalCalendar festivals={festivals} />;
      case 'map':
        return <FestivalMap festivals={festivals} />;
      case 'register':
        return <FestivalRegistrationForm onFestivalAdded={handleFestivalAdded} />;
      case 'list':
      default:
        return (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {sortedFestivals.map((f) => (
              <Card
                key={f.id}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                component={Link}
                className="festival-card"
                to={`/festivals/${f.id}`}
              >
                <Title order={3} ta="center">{f.name}</Title>
              </Card>
            ))}
          </SimpleGrid>
        );
    }
  };

  return (
    <Container>
      {/* 翻訳ウィジェット */}
      <div id="google_translate_element" style={{ position: "fixed", bottom: 10, left: 10, zIndex: 9999 }}></div>
      
      <Title order={2} ta="center" mb="xl">長野県のお祭り</Title>

      {/* 操作パネル */}
      <Group justify="space-between" mb="xl">
        {/* 表示モード切り替え */}
        <SegmentedControl
          value={viewMode}
          onChange={setViewMode}
          data={[
            { label: 'リスト', value: 'list' },
            { label: 'イベントカレンダー', value: 'calendar' },
            { label: '地図', value: 'map' },
            { label: 'お祭り登録', value: 'register' },
          ]}
        />
        {/* 並び替え */}
        {viewMode === 'list' && (
          <Select
            label="並び替え"
            value={sortBy}
            onChange={setSortBy}
            data={[
              { label: 'デフォルト', value: 'default' },
              { label: '開催日が近い順', value: 'date' },
              { label: '人気順', value: 'popularity' },
            ]}
            style={{ width: 180 }}
          />
        )}
      </Group>

      {/* コンテンツの描画 */}
      {renderContent()}
    </Container>
  );
}
