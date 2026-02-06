import React, { useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader, Center, Text, Stack } from '@mantine/core';
import { modals } from '@mantine/modals';
import { UserContext } from '../UserContext'; // ユーザー状態を更新するためにインポート

export default function LoginCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext); // コンテキストからsetUserを取得
  const hasFetched = useRef(false); // React 18の2回実行防止用

  useEffect(() => {
    if (hasFetched.current) return;
    
    // URLからクエリパラメータ(?code=...&provider=...)を取得
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');
    const provider = searchParams.get('provider'); // 'line' or 'google'

    if (!code || !provider) {
      // 情報が足りない場合はトップへ戻す
      if (window.opener) {
        window.close();
      } else {
        navigate('/');
      }
      return;
    }

    hasFetched.current = true;

    // バックエンドにコードを送信
    const verifyLogin = async () => {
      try {
        // setupProxy.js が効いているので /api/auth/... でOK
        const response = await fetch(`/api/auth/${provider}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (response.ok) {
          // 1. トークンを保存
          localStorage.setItem('authToken', data.token); // App.jsに合わせて 'authToken' に統一
          
          // 2. ユーザー情報を保存＆更新
          const userData = data.user;
          localStorage.setItem('user', JSON.stringify(userData));
          
          // 3. 別ウィンドウ(ポップアップ)かどうかで分岐
          if (window.opener) {
            // 親ウィンドウにメッセージを送信して閉じる
            window.opener.postMessage({
              type: 'LOGIN_SUCCESS',
              user: userData,
              token: data.token
            }, window.location.origin);
            window.close();
          } else {
            // 通常の画面遷移
            setUser(userData); // アプリ全体のログイン状態を即座に更新
            const target = userData.username === 'root' ? '/admin/dashboard' : '/';
            window.location.href = target;
          }
        } else {
          throw new Error(data.error || "認証に失敗しました");
        }
      } catch (error) {
        console.error("Login failed:", error);
        modals.openConfirmModal({
          title: 'ログイン失敗',
          centered: true,
          children: <Text size="sm">{error.message}</Text>,
          labels: { confirm: 'トップへ戻る' },
          cancelProps: { display: 'none' },
          confirmProps: { color: 'red' },
          onConfirm: () => {
            if (window.opener) { window.close(); } else { navigate('/'); }
          },
          onClose: () => {
            if (window.opener) { window.close(); } else { navigate('/'); }
          }
        });
      }
    };

    verifyLogin();
  }, [location, navigate, setUser]);

  return (
    <Center style={{ height: '100vh' }}>
      <Stack align="center">
        <Loader size="xl" />
        <Text>ログイン処理中...</Text>
        <Text size="sm" c="dimmed">画面を閉じずにお待ちください</Text>
      </Stack>
    </Center>
  );
}