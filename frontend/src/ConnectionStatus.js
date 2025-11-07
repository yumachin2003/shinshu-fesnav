import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('Checking...');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/test');
        if (response.data && response.data.status === 'ok') {
          setIsConnected(true);
          setMessage('Connected');
        } else {
          setIsConnected(false);
          setMessage('Error: Invalid response');
        }
      } catch (error) {
        setIsConnected(false);
        // CORSエラーの場合、error.responseは存在しないことが多い
        if (error.message === 'Network Error') {
          setMessage('CORS or Network Error');
        } else {
          setMessage(`Error: ${error.code || 'Unknown'}`);
        }
      }
    };

    // 初回チェック
    checkConnection();

    // 5秒ごとに定期的にチェック
    const intervalId = setInterval(checkConnection, 5000);

    // コンポーネントがアンマウントされた時にインターバルをクリア
    return () => clearInterval(intervalId);
  }, []);

  const style = {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    padding: '10px 20px',
    backgroundColor: isConnected ? '#4CAF50' : '#f44336',
    color: 'white',
    borderRadius: '5px',
    zIndex: 1000,
    fontSize: '14px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
  };

  return <div style={style}>Backend: {message} {isConnected ? '✅' : '❌'}</div>;
};

export default ConnectionStatus;