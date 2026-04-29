import { useCallback } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { apiClient } from '../utils/apiService';

export const usePasskey = () => {
  const register = useCallback(async (username) => {
    console.log("Passkey Register Start for:", username);
    console.log("Is Secure Context:", window.isSecureContext);
    if (!navigator.credentials) {
      throw new Error("このブラウザまたは接続環境（非HTTPS等）ではパスキーを使用できません。");
    }

    // 1. オプション取得
    const resp = await apiClient.post('/register/options', { username });
    const options = resp.data;

    // 2. ブラウザで登録実行
    const regResp = await startRegistration({ optionsJSON: options });

    // 3. 検証
    const verifyResp = await apiClient.post('/register/verify', regResp);
    return verifyResp.data;
  }, []);

  const login = useCallback(async (username) => {
    console.log("Passkey Login Start for:", username);
    console.log("Is Secure Context:", window.isSecureContext);
    if (!navigator.credentials) {
      throw new Error("このブラウザまたは接続環境ではパスキーを使用できません。");
    }

    // 1. オプション取得
    const resp = await apiClient.post('/login/options', { username });
    const options = resp.data;

    // 2. ブラウザで認証実行
    const authResp = await startAuthentication({ optionsJSON: options });

    // 3. 検証
    const verifyResp = await apiClient.post('/login/verify', authResp);
    return verifyResp.data;
  }, []);

  return { register, login };
};