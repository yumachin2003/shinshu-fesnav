import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Text, useMantineColorScheme } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { UserContext } from '../UserContext';

export const useLogout = () => {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();

  const logout = () => {
    console.log("Logout function triggered");
    
    modals.openConfirmModal({
      title: <Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>ログアウトの確認</Text>,
      centered: true,
      overlayProps: { backgroundOpacity: 0.2, blur: 4 },
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
        localStorage.setItem('pendingNotification', JSON.stringify({
          title: 'ログアウト',
          message: 'ログアウトしました',
          color: 'blue',
        }));
        console.log("User state cleared, navigating to home...");
        window.location.href = "/";
      },
    });
  };

  return logout;
};