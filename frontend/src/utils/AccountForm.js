import { useState, useContext } from "react";
import { TextInput, PasswordInput, Button, Stack, Text, Divider, Anchor, Alert, Switch } from '@mantine/core';
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import { loginUser, registerUser } from "./apiService";
import SocialLoginButtons from "../components/SocialLoginButtons";
import { usePasskey } from "../hooks/usePasskey";

export default function AccountForm({ isPopup = false, onSuccess, isRegister = false }) {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const { register, login } = usePasskey();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usePasskeyAuth, setUsePasskeyAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthSuccess = (loggedInUser, token) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    
    if (onSuccess) onSuccess();

    const targetPath = loggedInUser.username === 'root' ? '/admin/dashboard' : '/festivals';
    window.location.href = targetPath;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (usePasskeyAuth) {
        // パスキー処理
        if (isRegister) {
          await register(username);
          alert("パスキーの登録に成功しました！ログインページに移動します。");
          navigate("/login");
        } else {
          const responseData = await login(username);
          handleAuthSuccess(responseData.user, responseData.token);
        }
      } else {
        // 通常のパスワード処理
        if (isRegister) {
          await registerUser({ username, email, password });
          alert("登録が完了しました！ログインページに移動します。");
          navigate("/login");
        } else {
          const response = await loginUser({ username, password });
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

        <TextInput 
          label={!isPopup ? "ユーザー名" : null}
          placeholder="ユーザー名を入力" 
          size={size} 
          value={username} 
          onChange={(e) => setUsername(e.currentTarget.value)}
          required 
        />

        {isRegister && (
          <TextInput 
            label={!isPopup ? "メールアドレス" : null}
            placeholder="example@mail.com" 
            size={size} 
            value={email} 
            onChange={(e) => setEmail(e.currentTarget.value)}
            required 
            mt={!isPopup ? "md" : 0} 
          />
        )}

        {!usePasskeyAuth && (
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
          />
        )}

        {!isRegister && !usePasskeyAuth && (
          <Anchor component={Link} to="/forgot-password" size="xs" ml="auto">
            パスワードをお忘れですか？
          </Anchor>
        )}

        <Switch 
          label="パスキーを使用する" 
          checked={usePasskeyAuth} 
          onChange={(event) => setUsePasskeyAuth(event.currentTarget.checked)} 
          size="xs"
          mt="sm"
        />

        <Button type="submit" size={size} fullWidth loading={loading} mt={!isPopup ? "xl" : 0}>
          {isRegister ? (usePasskeyAuth ? "パスキーで登録" : "登録") : (usePasskeyAuth ? "パスキーでログイン" : "ログイン")}
        </Button>

        <Divider label="または" labelPosition="center" size="xs" />

        <SocialLoginButtons action={action} isPopup={isPopup} />

        <Text size="xs" ta="center" mt={5}>
        {isRegister ? "すでにアカウントをお持ちですか？ " : "アカウントをお持ちでないですか？ "}
        <Anchor component={Link} to={isRegister ? "/login" : "/register"} state={{ fromLoginPage: !isPopup }} size="xs">
            {isRegister ? "ログイン" : "新規登録"}
        </Anchor>
        </Text>
      </Stack>
    </form>
  );
}