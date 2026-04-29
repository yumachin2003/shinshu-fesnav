import React from 'react';
import { Container, Title, Text, Button, Group, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export default function NotFound({ code = 404, title, message }) {
  const navigate = useNavigate();

  // デフォルトメッセージの定義
  const defaultContent = {
    400: {
      title: "不正なリクエスト",
      message: "リクエストが不正です。入力内容を確認してください。"
    },
    401: {
      title: "認証が必要です",
      message: "このページにアクセスするにはログインが必要です。"
    },
    404: {
      title: "ページが見つかりません",
      message: "お探しのページは移動したか、削除された可能性があります。URLが正しいかもう一度ご確認ください。"
    },
    500: {
      title: "サーバーエラー",
      message: "サーバーで問題が発生しました。しばらくしてから再度お試しください。"
    },
    502: {
      title: "不正なゲートウェイ",
      message: "サーバー間の通信でエラーが発生しました。しばらくしてから再度お試しください。"
    },
    503: {
      title: "サービス利用不可",
      message: "現在サーバーが混み合っているかメンテナンス中です。しばらくしてから再度お試しください。"
    },
    504: {
      title: "ゲートウェイタイムアウト",
      message: "サーバーからの応答がありませんでした。しばらくしてから再度お試しください。"
    },
    403: {
      title: "アクセス権限がありません",
      message: "このページを表示する権限がありません。"
    },
    default: {
      title: "エラーが発生しました",
      message: "予期せぬエラーが発生しました。"
    }
  };

  const content = defaultContent[code] || defaultContent.default;
  const displayTitle = title || content.title;
  const displayMessage = message || content.message;

  return (
    <Container py={80}>
      <Stack align="center" gap="xl">
        <Text
          style={{
            fontSize: 'clamp(100px, 20vw, 200px)',
            fontWeight: 900,
            lineHeight: 1,
            color: 'var(--mantine-color-gray-2)',
            userSelect: 'none',
          }}
        >
          {code}
        </Text>
        <Title order={1} ta="center" fw={900} fz={34}>
          {displayTitle}
        </Title>
        <Text c="dimmed" size="lg" ta="center" maw={500}>
          {displayMessage}
        </Text>
        <Group justify="center">
          <Button variant="subtle" size="md" onClick={() => navigate('/')}>
            ホームへ戻る
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}