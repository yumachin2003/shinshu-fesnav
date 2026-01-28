import React from "react";
import { Drawer } from '@mantine/core';
import AccountForm from "../utils/AccountForm";

export default function Register({ opened, onClose }) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="新規登録"
      position="right"
      size="md"
      zIndex={3100}
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      transitionProps={{ transition: 'slide-left', duration: 400 }}
    >
      <AccountForm isRegister={true} onSuccess={onClose} />
    </Drawer>
  );
}
