import React from "react";
import { Drawer, Modal, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import AccountForm from "../utils/AccountForm";
import '../css/GlassStyle.css';

export default function AuthModal({ opened, onClose, isRegister = false }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const title = <Text c="var(--glass-text)" fw={700}>{isRegister ? "新規登録" : "ログイン"}</Text>;

  const handleSuccess = () => {
    localStorage.setItem('pendingNotification', JSON.stringify({
      title: isRegister ? '登録完了' : 'ログイン成功',
      message: isRegister ? 'アカウントが作成されました。' : 'おかえりなさい！',
      color: 'green',
    }));
    onClose();
    window.location.reload();
  };

  const commonProps = {
    opened,
    onClose,
    title,
    zIndex: 3100,
    overlayProps: { backgroundOpacity: 0.2, blur: 4 },
  };

  if (isMobile) {
    return (
      <Modal
        {...commonProps}
        centered
        radius="lg"
      >
        <AccountForm isRegister={isRegister} onSuccess={handleSuccess} />
      </Modal>
    );
  }

  return (
    <Drawer
      {...commonProps}
      position="right"
      size="md"
      radius="lg"
      transitionProps={{ transition: 'slide-left', duration: 400 }}
      styles={{
        content: {
          margin: '12px',
          height: 'calc(100% - 24px)',
          borderRadius: 'var(--glass-radius-lg)',
          overflow: 'hidden',
        }
      }}
    >
      <AccountForm isRegister={isRegister} onSuccess={handleSuccess} />
    </Drawer>
  );
}