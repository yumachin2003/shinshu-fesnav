import { Modal, TextInput, Textarea, Button, Stack, Notification } from "@mantine/core";
import { useState } from "react";
import { submitInformation } from "../utils/apiService";

export default function InformationModal({ opened, onClose, festival }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false); // 送信フラグ

  const handleSubmit = async () => {
    try {
      await submitInformation({
        festival_id: festival?.id,
        festival_name: festival?.name,
        title,
        content,
        name,
        email,
      });

      setSubmitted(true);     // 送信通知を出す
      setTitle("");           // フォームをリセット
      setContent("");
      setName("");
      setEmail("");

      setTimeout(() => setSubmitted(false), 3000); // 3秒後に通知を消す
    } catch (err) {
      console.error(err);
      alert("送信中にエラーが発生しました");
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="情報提供">
      <Stack>
        {submitted && <Notification color="green">送信しました！</Notification>}
        <TextInput label="タイトル" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="内容" minRows={4} value={content} onChange={(e) => setContent(e.target.value)} />
        <TextInput label="お名前（任意）" value={name} onChange={(e) => setName(e.target.value)} />
        <TextInput label="メール（任意）" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button onClick={handleSubmit}>送信</Button>
      </Stack>
    </Modal>
  );
}
