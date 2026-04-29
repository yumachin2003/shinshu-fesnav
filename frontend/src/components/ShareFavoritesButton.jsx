import React, { useState } from 'react';
import { Button, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconShare, IconCheck, IconX } from '@tabler/icons-react';

export default function ShareFavoritesButton({ favoriteIds }) {
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'

  const handleShare = async () => {
    if (!favoriteIds || favoriteIds.length === 0) {
      notifications.show({
        title: '共有できません',
        message: 'お気に入りに登録されているお祭りがありません。',
        color: 'yellow',
      });
      return;
    }

    setStatus('loading');

    try {
      // バックエンドに共有リンク作成をリクエスト
      const response = await fetch('/api/favorites/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          festival_ids: favoriteIds,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          throw new Error(errorData.error || '共有リンクの作成に失敗しました。');
        } else {
          throw new Error(`サーバーエラー (${response.status}): APIが正しく応答しませんでした。`);
        }
      }

      const { shareUrl } = await response.json();

      // Web Share API がサポートされている場合は共有シートを表示
      if (navigator.share) {
        try {
          await navigator.share({
            title: '信州おまつりナビ',
            text: '私のお気に入りのお祭りリストです！',
            url: shareUrl,
          });
          setStatus('idle');
        } catch (shareError) {
          // ユーザーが共有シートを閉じた（キャンセルした）場合はエラーにしない
          if (shareError.name === 'AbortError') {
            setStatus('idle');
            return;
          }
          throw shareError;
        }
      } else {
        // サポートされていないブラウザ（一部のPC等）のフォールバック処理
        await navigator.clipboard.writeText(shareUrl);
        
        setStatus('success');
        notifications.show({
          title: '成功',
          message: '共有リンクをクリップボードにコピーしました！',
          color: 'teal',
          icon: <IconCheck size={18} />,
        });
      }

    } catch (error) {
      console.error('Share failed:', error);
      setStatus('error');
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
        icon: <IconX size={18} />,
      });
    } finally {
      // 3秒後にボタンの状態を元に戻す
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const buttonContent = {
    idle: { icon: <IconShare size={16} />, text: 'リストを共有' },
    loading: { icon: <Loader size={16} color="white" />, text: '作成中...' },
    success: { icon: <IconCheck size={16} />, text: 'コピーしました' },
    error: { icon: <IconX size={16} />, text: 'エラー' },
  };

  return (
    <Button
      variant="light"
      color={status === 'success' ? 'teal' : (status === 'error' ? 'red' : 'blue')}
      onClick={handleShare}
      disabled={status === 'loading' || status === 'success'}
      leftSection={buttonContent[status].icon}
    >
      {buttonContent[status].text}
    </Button>
  );
}