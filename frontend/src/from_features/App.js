// 必要なモジュールやコンポーネントのインポート
import React, { useState, useEffect } from 'react';
import FestivalViewSwitcher from './components/FestivalViewSwitcher';
import './App.css'; 

// アプリケーションのメインコンポーネント
function App() {
    const [festivals, setFestivals] = useState([]); // お祭りデータ用のstate
    const [isLoading, setIsLoading] = useState(true);   // ローディング状態用のstate
    const [error, setError] = useState(null);   // エラー状態用のstate

    // 初回レンダリング時にAPIからお祭りデータを取得
    useEffect(() => {
        const API_URL = 'http://localhost:5000/api/festivals';  // APIエンドポイントのURL
        // 非同期でお祭りデータを取得する関数
        const fetchFestivals = async () => {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error(`HTTPエラー: ${response.status}`);
                }
                const data = await response.json();
                setFestivals(data); 
            } catch (err) {
                console.error("データ取得エラー:", err);
                setError("お祭り情報を読み込めませんでした。");
            } finally {
                setIsLoading(false);
            }
        };
        fetchFestivals();
    }, []);

    // ローディング中の表示
    if (isLoading) {
        return <div className="loading-message">読み込み中...</div>;
    }

    // エラー発生時の表示
    if (error) {
        return <div className="error-message">🚨 {error}</div>;
    }
    
    // データ取得後のメインコンテンツ表示
    return (
        <div className="App">
            <header className="App-header">
                <h1>信州お祭りナビ</h1>
            </header>
            <main>
                {/* FestivalViewSwitcherコンポーネントに取得したデータを渡して表示 */}
                <FestivalViewSwitcher festivals={festivals} />
            </main>
        </div>
    );
}

export default App;