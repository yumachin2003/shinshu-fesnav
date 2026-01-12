import React, { useState } from 'react';
import { Button } from '@mantine/core';
import { IconKeyFilled } from '@tabler/icons-react';
import { usePasskey } from '../hooks/usePasskey';

export default function PasskeyButton({ action, username, onSuccess, onError, children, ...props }) {
  const { register, login } = usePasskey();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!username) {
      if (onError) onError(new Error("ユーザー名を入力してください。"));
      return;
    }
    setLoading(true);
    try {
      const result = action === 'register' ? await register(username) : await login(username);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleClick} 
      loading={loading} 
      leftSection={<IconKeyFilled size={20} />}
      {...props}
    >
      {children || (action === 'register' ? 'パスキーで登録' : 'パスキーでログイン')}
    </Button>
  );
}