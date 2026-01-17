import React from "react";
import { Button, Stack } from '@mantine/core';
import lineLogo from "../img/line_88.png";

export default function SocialLoginButtons({ action = 'login', isPopup = false }) {
  const size = isPopup ? "xs" : "sm";
  const textAction = action === 'register' ? '登録' : 'ログイン';

  return (
    <>
      <style>
        {`
          .google-button {
            background-color: #ffffff !important;
            color: #000000 !important;
            border: 1px solid #dadce0 !important;
          }
          .google-button:hover {
            background-color: #f8f9fa !important;
          }
        `}
      </style>
      <Stack gap="xs">
        <Button
          fullWidth
          variant="outline"
          color="gray"
          className="google-button"
          size={size}
          onClick={() => {
            const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
            const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI;
            const scope = "openid email profile";
            const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
            window.location.href = url;
          }}
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google Logo"
            style={{ width: isPopup ? 14 : 20, height: isPopup ? 14 : 20, marginRight: 8 }}
          />
          Googleで{textAction}
        </Button>

        <Button fullWidth color="green" size={size} onClick={() => window.location.href = "http://localhost:5051/api/auth/line"}>
          <img src={lineLogo} alt="LINE Logo" style={{ width: isPopup ? 14 : 20, height: isPopup ? 14 : 20, marginRight: 8 }} />
          LINEで{textAction}
        </Button>
      </Stack>
    </>
  );
}