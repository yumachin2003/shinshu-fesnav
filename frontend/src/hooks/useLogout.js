import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { UserContext } from '../UserContext';

export const useLogout = () => {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const logout = () => {
    console.log("Logout function triggered");
    
    modals.openConfirmModal({
      title: 'ログアウトの確認',
      centered: true,
      children: (
        <Text size="sm">
          本当にログアウトしますか？
        </Text>
      ),
      labels: { confirm: 'ログアウト', cancel: 'キャンセル' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        console.log("Logout confirmed by user. Clearing storage...");
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        console.log("User state cleared, navigating to home...");
        navigate("/");
      },
    });
  };

  return logout;
};