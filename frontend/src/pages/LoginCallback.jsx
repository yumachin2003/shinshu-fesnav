import React, { useEffect, useRef, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader, Center, Text, Stack, TextInput, Button, Title, Alert, Container, Paper, Group, Checkbox, Modal, List } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { UserContext } from '../UserContext'; // ユーザー状態を更新するためにインポート

export default function LoginCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext); // コンテキストからsetUserを取得
  const hasFetched = useRef(false); // React 18の2回実行防止用
  
  const [registrationData, setRegistrationData] = useState(null);
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [consentOpened, { open: openConsent, close: closeConsent }] = useDisclosure(false);

  const isPopup = !!window.opener;

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
          // 新規登録が必要な場合
          if (data.action === 'register') {
            setRegistrationData(data);
            setRegUsername(data.suggested_username || '');
            setRegDisplayName(data.name || ''); // ソーシャルアカウントの名前を初期値に
            setRegEmail(data.email || '');
            return;
          }

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
            const target = userData.is_admin ? '/admin/dashboard' : '/';
            window.location.href = target;
          }
        } else {
          throw new Error(data.error || "認証に失敗しました");
        }
      } catch (error) {
        console.error("Login failed:", error);
        modals.openConfirmModal({
          title: 'ログイン失敗',
          yOffset: '10vh',
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

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');

    try {
      const response = await fetch('/api/auth/social-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_token: registrationData.registration_token,
          username: regUsername,
          display_name: regDisplayName,
          email: regEmail
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登録に失敗しました');
      }

      // 登録成功時の処理（ログイン成功時と同じ）
      localStorage.setItem('authToken', data.token);
      const userData = data.user;
      localStorage.setItem('user', JSON.stringify(userData));

      if (window.opener) {
        window.opener.postMessage({
          type: 'LOGIN_SUCCESS',
          user: userData,
          token: data.token
        }, window.location.origin);
        window.close();
      } else {
        setUser(userData);
        const target = userData.is_admin ? '/admin/dashboard' : '/';
        window.location.href = target;
      }

    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/');
    }
  };

  if (registrationData) {
    return (
      <Container size="xs" py="xl">
        <Paper withBorder shadow="md" p="xl" radius="md" mt="xl">
          <Title order={2} ta="center" mb="md">アカウント設定</Title>
          <Text c="dimmed" size="sm" ta="center" mb="xl">
            ユーザーID、表示名、メールアドレスを設定して登録を完了してください。
          </Text>
          
          <form onSubmit={handleRegistrationSubmit}>
            <Stack>
              {regError && <Alert color="red" title="エラー">{regError}</Alert>}
              <TextInput label="ユーザーID" description="4文字以上の半角英数字・ピリオド・アンダーバー" required value={regUsername} onChange={(e) => setRegUsername(e.target.value)} />
              <TextInput label="ユーザー名（表示名）" value={regDisplayName} onChange={(e) => setRegDisplayName(e.target.value)} />
              <TextInput label="メールアドレス" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              
              <Checkbox 
                mt="sm"
                checked={agreed} 
                onChange={(event) => setAgreed(event.currentTarget.checked)}
                label={
                  <Text size="sm">
                    <Text span c="blue" style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); openConsent(); }}>
                      メールアドレスの利用目的
                    </Text>
                    を確認し、同意します。
                  </Text>
                }
              />

              <Group mt="md" grow>
                <Button variant="default" onClick={handleCancel}>キャンセル</Button>
                <Button type="submit" loading={regLoading} disabled={!agreed}>登録を完了する</Button>
              </Group>
            </Stack>
          </form>
        </Paper>

        <Modal opened={consentOpened} onClose={closeConsent} title="メールアドレスの取り扱いについて" centered overlayProps={{ backgroundOpacity: 0.2, blur: 4 }}>
          <Stack>
            <Text size="sm">当サイトでは、以下の目的でメールアドレスを取得・利用いたします。</Text>
            <List size="sm" withPadding>
              <List.Item>ユーザー認証および本人確認のため</List.Item>
              <List.Item>重要なお知らせ（規約変更、障害情報など）の通知のため</List.Item>
              <List.Item>お問い合わせへの返信のため</List.Item>
            </List>
            <Text size="sm">取得した個人情報は、プライバシーポリシーに基づき適切に管理し、法令に基づく場合を除き第三者への提供は行いません。</Text>
            <Button onClick={() => { setAgreed(true); closeConsent(); }}>同意して閉じる</Button>
          </Stack>
        </Modal>
      </Container>
    );
  }

  return (
    <Center style={{ 
      height: '100vh',
      ...(isPopup && {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        zIndex: 10000,
        backgroundColor: 'var(--mantine-color-body)'
      })
    }}>
      <Stack align="center">
        <Loader size="xl" />
        <Text>ログイン処理中...</Text>
        <Text size="sm" c="dimmed">画面を閉じずにお待ちください</Text>
      </Stack>
    </Center>
  );
}