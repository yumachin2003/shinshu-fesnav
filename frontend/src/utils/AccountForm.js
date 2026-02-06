import { useState, useContext } from "react";
import { TextInput, PasswordInput, Button, Stack, Text, Divider, Anchor, Alert, Switch, Group, Paper } from '@mantine/core';
import { modals } from '@mantine/modals';
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";
import { loginUser, registerUser } from "./apiService";
import SocialLoginButtons from "../components/SocialLoginButtons";
import { usePasskey } from "../hooks/usePasskey";

export default function AccountForm({ isPopup = false, onSuccess, isRegister = false }) {
  const { setUser, openLogin, openRegister } = useContext(UserContext);
  const navigate = useNavigate();
  const { register, login } = usePasskey();
  const [userID, setUserID] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usePasskeyAuth, setUsePasskeyAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState(1);

  const handleAuthSuccess = (loggedInUser, token) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    
    if (onSuccess) {
      onSuccess();
    } else {
      const targetPath = loggedInUser.is_admin ? '/admin/dashboard' : '/festivals';
      navigate(targetPath);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // パスキーを使用しない場合のステップ制御
    if (loginStep === 1 && !usePasskeyAuth) {
      if (!userID) {
        setError("ユーザーIDを入力してください");
        return;
      }
      setLoginStep(2);
      return;
    }

    if (isRegister && !usePasskeyAuth) {
      if (loginStep === 2) {
        if (!email) {
          setError("メールアドレスを入力してください");
          return;
        }
        setLoginStep(3);
        return;
      }
      if (loginStep === 3) {
        if (!password) {
          setError("パスワードを入力してください");
          return;
        }
        // ステップ3で送信処理へ進む
      }
    }

    setLoading(true);
    try {
      if (usePasskeyAuth) {
        // パスキー処理
        if (isRegister) {
          await register(userID);
          modals.openModal({
            title: '登録完了',
            centered: true,
            children: (
              <Text size="sm">パスキーの登録に成功しました！ログインページに移動します。</Text>
            ),
            onClose: () => navigate("/login"),
          });
        } else {
          const responseData = await login(userID);
          handleAuthSuccess(responseData.user, responseData.token);
        }
      } else {
        // 通常のパスワード処理
        if (isRegister) {
          await registerUser({ username: userID, display_name: displayName, email, password });
          modals.openModal({
            title: '登録完了',
            centered: true,
            children: (
              <Text size="sm">登録が完了しました！ログインページに移動します。</Text>
            ),
            onClose: () => navigate("/login"),
          });
        } else {
          const response = await loginUser({ username: userID, password });
          const { token, user: loggedInUser } = response.data;
          handleAuthSuccess(loggedInUser, token);
        }
      }
    } catch (err) {
      console.error(isRegister ? "登録に失敗しました:" : "ログインに失敗しました:", err.response?.data?.error || err.message);
      setError(
        err.response?.data?.error || 
        (isRegister ? "登録に失敗しました。後ほどもう一度お試しください。" : "認証に失敗しました。")
      );
    } finally {
      setLoading(false);
    }
  };

  const size = isPopup ? "xs" : "sm";
  const action = isRegister ? "register" : "login";

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="xs">
        {isPopup && <Text size="sm" fw={500}>{isRegister ? "新規登録" : "ログイン"}</Text>}
        
        {error && (
          isPopup 
            ? <Text c="red" size="xs">{error}</Text>
            : <Alert color="red" title={isRegister ? "登録エラー" : "ログインエラー"} mb="md">{error}</Alert>
        )}

        {loginStep >= 2 ? (
          <Paper withBorder p="xs" radius="sm" bg="var(--mantine-color-body)">
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">ユーザーID</Text>
                  <Text size="sm" fw={500}>{userID}</Text>
                </Stack>
                <Anchor component="button" type="button" size="xs" onClick={() => setLoginStep(1)}>変更</Anchor>
              </Group>
              
              {isRegister && loginStep === 2 && (
                <>
                  <Divider />
                  <TextInput 
                    label={!isPopup ? "ユーザー名（表示名）" : null}
                    placeholder="表示名を入力" 
                    size={size} 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.currentTarget.value)}
                    mt={!isPopup ? "xs" : 0} 
                  />

                  <TextInput 
                    label={!isPopup ? "メールアドレス" : null}
                    placeholder="example@mail.com" 
                    size={size} 
                    value={email} 
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    required 
                    mt={!isPopup ? "xs" : 0} 
                  />
                </>
              )}

              {isRegister && loginStep === 3 && (
                <>
                  <Divider />
                  <Stack gap={0}>
                    <Text size="xs" c="dimmed">メールアドレス</Text>
                    <Text size="sm" fw={500}>{email}</Text>
                  </Stack>
                  <Anchor component="button" type="button" size="xs" onClick={() => setLoginStep(2)} style={{alignSelf: 'flex-end'}}>変更</Anchor>
                </>
              )}
            </Stack>
          </Paper>
        ) : (
          <>
            <TextInput 
              label={!isPopup ? "ユーザーID" : null}
              placeholder="4文字以上の半角英数字" 
              size={size} 
              value={userID} 
              onChange={(e) => setUserID(e.currentTarget.value)}
              required 
              autoFocus
            />
          </>
        )}

        {(!usePasskeyAuth && ((!isRegister && loginStep === 2) || (isRegister && loginStep === 3))) && (
          <PasswordInput 
            label={!isPopup ? "パスワード" : null}
            placeholder="パスワードを入力" 
            size={size} 
            value={password} 
            onChange={(e) => setPassword(e.currentTarget.value)}
            visible={showPassword}
            onVisibilityChange={setShowPassword}
            required 
            mt={!isPopup ? "md" : 0}
            autoFocus
          />
        )}

        {!isRegister && !usePasskeyAuth && loginStep === 2 && (
          <Anchor component={Link} to="/forgot-password" size="xs" ml="auto">
            パスワードをお忘れですか？
          </Anchor>
        )}

        {loginStep === 1 && (
          <Switch 
            label="パスキーを使用する" 
            checked={usePasskeyAuth} 
            onChange={(event) => setUsePasskeyAuth(event.currentTarget.checked)} 
            size="xs"
            mt="sm"
          />
        )}

        <Button type="submit" size={size} fullWidth loading={loading} mt={!isPopup ? "xl" : 0}>
          {isRegister 
            ? (usePasskeyAuth ? "パスキーで登録" : (loginStep === 3 ? "登録" : "次へ")) 
            : (loginStep === 1 
                ? (usePasskeyAuth ? "パスキーでログイン" : "次へ") 
                : "ログイン")
          }
        </Button>

        {loginStep === 1 && (
          <>
            <Divider label="または" labelPosition="center" size="xs" />
            <SocialLoginButtons action={action} isPopup={isPopup} onSuccess={onSuccess} />
          </>
        )}

        <Text size="xs" ta="center" mt={5}>
        {isRegister ? "すでにアカウントをお持ちですか？ " : "アカウントをお持ちでないですか？ "}
        <Anchor component="button" type="button" onClick={(e) => {
          e.preventDefault();
          setLoginStep(1);
          setError(null);
          isRegister ? openLogin() : openRegister();
        }} size="xs">
            {isRegister ? "ログイン" : "新規登録"}
        </Anchor>
        </Text>
      </Stack>
    </form>
  );
}