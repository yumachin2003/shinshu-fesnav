import React, { useEffect, useContext } from "react";
import { Button, Stack, Tooltip } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext';
import lineLogo from "../img/line_88.png";

export default function SocialLoginButtons({ action = 'login', isPopup = false, onSuccess, connectedStatus }) {
  const size = isPopup ? "xs" : "sm";
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  // 文言の切り替えロジックを拡張
  let textAction = 'ログイン';
  if (action === 'register') textAction = '登録';
  else if (action === 'connect') textAction = '連携';

  const openPopup = (url) => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      url,
      "social-login",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
    );
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === 'LOGIN_SUCCESS') {
        const { user } = event.data;
        setUser(user);
        
        if (onSuccess) {
          onSuccess();
        } else if (action === 'connect') {
           // 連携の場合はリロードして状態を反映
           window.location.reload();
        } else {
           // ログイン・登録の場合はダッシュボードまたはトップへ遷移
           const target = user.is_admin ? '/admin/dashboard' : '/';
           window.location.href = target;
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setUser, navigate, action, onSuccess]);

  return (
    <>
      <style>
        {`
          .google-button:not(:disabled) {
            background-color: #ffffff !important;
            color: #000000 !important;
            border: 1px solid #dadce0 !important;
          }
          .google-button:not(:disabled):hover {
            background-color: #f8f9fa !important;
          }
          .maintenance-tooltip {
            background-color: rgba(250, 82, 82, 0.3) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            color: white !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
          }
        `}
      </style>
      <Stack gap="xs">
        <Tooltip
          label="メンテナンス中のため利用できません"
          withArrow
          zIndex={3200}
          classNames={{ tooltip: 'maintenance-tooltip' }}
        >
          <div style={{ cursor: 'not-allowed' }}>
            <Button
              fullWidth
              variant="outline"
              color="gray"
              // className="google-button"
              size={size}
              // onClick={() => !connectedStatus?.google && openPopup(`${process.env.REACT_APP_API_BASE_URL}/auth/google`)}
              // onClick={handleGoogleClickMentainance}
              disabled={connectedStatus?.google}
              style={{ pointerEvents: 'none' }}
            >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google Logo"
                // style={{ width: isPopup ? 14 : 20, height: isPopup ? 14 : 20, marginRight: 8 }}
                style={{ width: isPopup ? 14 : 20, height: isPopup ? 14 : 20, marginRight: 8, filter: 'grayscale(100%)', opacity: 0.6 }}
              />
              {connectedStatus?.google ? "Google連携済み" : `Googleで${textAction}`}
            </Button>
          </div>
        </Tooltip>

        <Button 
          fullWidth 
          color="green" 
          size={size} 
          onClick={() => !connectedStatus?.line && openPopup(`${process.env.REACT_APP_API_BASE_URL}/auth/line`)}
          disabled={connectedStatus?.line}
        >
          <img src={lineLogo} alt="LINE Logo" style={{ width: isPopup ? 14 : 20, height: isPopup ? 14 : 20, marginRight: 8 }} />
          {connectedStatus?.line ? "LINE連携済み" : `LINEで${textAction}`}
        </Button>
      </Stack>
    </>
  );
}