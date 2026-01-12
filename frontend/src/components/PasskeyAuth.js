import React, { useState } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

function PasskeyAuth() {
    const [username, setUsername] = useState('');
    const API_BASE = "http://localhost:5051/api";

    // 新規登録フロー
    const handleRegister = async () => {
        try {
            // 1. サーバーからオプションを取得
            const resp = await fetch(`${API_BASE}/register/options`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            const options = await resp.json();

            // 2. ブラウザでパスキーを作成
            const regResp = await startRegistration(options);

            // 3. サーバーで検証
            const verifyResp = await fetch(`${API_BASE}/register/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(regResp),
            });

            if (verifyResp.ok) alert('パスキーの登録に成功しました！');
        } catch (err) {
            console.error(err);
            alert('登録失敗: ' + err.message);
        }
    };

    // ログインフロー
    const handleLogin = async () => {
        try {
            // 1. サーバーからオプションを取得
            const resp = await fetch(`${API_BASE}/login/options`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            const options = await resp.json();

            // 2. ブラウザで認証（指紋や顔認証が起動）
            const authResp = await startAuthentication(options);

            // 3. サーバーで検証
            const verifyResp = await fetch(`${API_BASE}/login/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(authResp),
            });

            if (verifyResp.ok) alert('ログインに成功しました！');
        } catch (err) {
            console.error(err);
            alert('ログイン失敗: ' + err.message);
        }
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>パスキー認証</h2>
            <input 
                type="text" 
                placeholder="ユーザー名" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
            />
            <button onClick={handleRegister}>パスキーを登録</button>
            <button onClick={handleLogin}>ログイン</button>
        </div>
    );
}

export default PasskeyAuth;