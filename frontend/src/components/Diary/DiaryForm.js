// src/components/Diary/DiaryForm.js
import { Textarea, FileInput, Image, Button, Group, Stack } from "@mantine/core";

export default function DiaryForm({
  newDiary,
  setNewDiary,
  newImage,
  setNewImage,
  editing,
  onSave,
  onCancel
}) {
  return (
    <Stack>
      <Textarea
        placeholder="今日の日記を書こう！"
        value={newDiary}
        onChange={(e) => setNewDiary(e.target.value)}
        autosize
        minRows={3}
      />

      <FileInput
        placeholder="画像をアップロード"
        accept="image/*"
        onChange={(file) => {
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => setNewImage(reader.result);
          reader.readAsDataURL(file);
        }}
      />

      {newImage && (
        <Image src={newImage} maw={240} mx="auto" radius="md" />
      )}

      <Group>
        <Button onClick={onSave} color={editing ? "green" : "orange"}>
          {editing ? "更新する" : "日記を保存"}
        </Button>
        {editing && (
          <Button variant="default" onClick={onCancel}>
            キャンセル
          </Button>
        )}
      </Group>
    </Stack>
  );
}
