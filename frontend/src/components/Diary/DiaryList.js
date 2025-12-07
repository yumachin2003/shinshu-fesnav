// src/components/Diary/DiaryList.js
import { Card, Text, Image, Button, Group, Stack } from "@mantine/core";

export default function DiaryList({ diaries, onEdit, onDelete }) {
  if (!diaries || diaries.length === 0) return null;

  return (
    <Stack>
      {diaries.map(entry => (
        <Card key={entry.timestamp} withBorder>
          <Text size="sm" c="dimmed">{entry.date}</Text>
          {entry.image && (
            <Image src={entry.image} maw={400} my="sm" radius="md" />
          )}
          <Text>{entry.text}</Text>

          <Group mt="sm">
            <Button size="xs" variant="light" onClick={() => onEdit(entry)}>
              編集
            </Button>
            <Button
              size="xs"
              variant="light"
              color="red"
              onClick={() => onDelete(entry.timestamp)}
            >
              削除
            </Button>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}
