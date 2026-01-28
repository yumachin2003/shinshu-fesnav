import React from "react";
import { Drawer } from '@mantine/core';
import AccountForm from "../utils/AccountForm";

export default function Login({ opened, onClose }) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="ログイン"
      position="right"
      size="md"
      zIndex={3000}
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      transitionProps={{ transition: 'slide-left', duration: 400 }}
    >
      <AccountForm onSuccess={onClose} />
    </Drawer>
  );
}
