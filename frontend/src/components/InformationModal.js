import { Modal, TextInput, Textarea, Button, Stack, Notification } from "@mantine/core";
import { useState, useContext, useEffect } from "react";
import { submitInformation } from "../utils/apiService";
import { UserContext } from "../UserContext";
import '../css/GlassStyle.css';

export default function InformationModal({ opened, onClose, festival }) {
  const { user } = useContext(UserContext);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false); // 送信フラグ

  useEffect(() => {
    if (opened && user) {
      setName(user.username || user.username || "");
      setEmail(user.email || "");
    }
  }, [opened, user]);

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
    <Modal
      opened={opened}
      onClose={onClose}
      zIndex={1100}
      title="情報提供"
      centered
      classNames={{
        content: 'glass-modal',
        header: 'glass-modal-header',
      }}
      styles={{
        inner: { paddingTop: 60 },
        title: { fontWeight: "bold" },
        close: { color: "var(--glass-text)", "&:hover": { backgroundColor: "rgba(128, 128, 128, 0.15)" } },
      }}
      overlayProps={{ backgroundOpacity: 0.2, blur: 4 }}
    >
      <Stack>
        {submitted && <Notification color="green" className="glass-notification">送信しました！</Notification>}
        <TextInput
          label="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          classNames={{ input: 'glass-input' }}
          styles={{ label: { color: "var(--glass-text)" } }}
        />
        <Textarea
          label="内容"
          minRows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          classNames={{ input: 'glass-input' }}
          styles={{ label: { color: "var(--glass-text)" } }}
        />
        <TextInput
          label="お名前（任意）"
          value={name}
          onChange={(e) => setName(e.target.value)}
          classNames={{ input: 'glass-input' }}
          styles={{ label: { color: "var(--glass-text)" } }}
        />
        <TextInput
          label="メール（任意）"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          classNames={{ input: 'glass-input' }}
          styles={{ label: { color: "var(--glass-text)" } }}
        />
        <Button onClick={handleSubmit}>送信</Button>
      </Stack>
    </Modal>
  );
}
