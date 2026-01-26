import { useCallback } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

const API_BASE = "http://localhost:5052/api";

export const usePasskey = () => {
  const register = useCallback(async (username) => {
    const token = localStorage.getItem("authToken");
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // 1. オプション取得
    const resp = await fetch(`${API_BASE}/register/options`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ username }),
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || `オプション取得失敗: ${resp.status}`);
    }
    const options = await resp.json();

    // 2. ブラウザで登録実行
    const regResp = await startRegistration(options);

    // 3. 検証
    const verifyResp = await fetch(`${API_BASE}/register/verify`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(regResp),
    });

    if (!verifyResp.ok) {
      const verifyErr = await verifyResp.json().catch(() => ({}));
      throw new Error(verifyErr.error || 'パスキーの検証に失敗しました。');
    }
    return await verifyResp.json();
  }, []);

  const login = useCallback(async (username) => {
    // 1. オプション取得
    const resp = await fetch(`${API_BASE}/login/options`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || `認証オプション取得失敗: ${resp.status}`);
    }
    const options = await resp.json();

    // 2. ブラウザで認証実行
    const authResp = await startAuthentication(options);

    // 3. 検証
    const verifyResp = await fetch(`${API_BASE}/login/verify`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authResp),
    });

    if (!verifyResp.ok) {
      const verifyErr = await verifyResp.json().catch(() => ({}));
      throw new Error(verifyErr.error || '認証に失敗しました');
    }
    return await verifyResp.json();
  }, []);

  return { register, login };
};