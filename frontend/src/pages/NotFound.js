import React from 'react';
import { Container, Title, Text, Button, Group, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

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
          404
        </Text>
        <Title order={1} ta="center" fw={900} fz={34}>
          ページが見つかりません
        </Title>
        <Text c="dimmed" size="lg" ta="center" maw={500}>
          お探しのページは移動したか、削除された可能性があります。URLが正しいかもう一度ご確認ください。
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