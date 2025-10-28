import React, { useState, useEffect } from 'react';
import FestivalViewSwitcher from './components/FestivalViewSwitcher'; // 新しく作った切り替えコンポーネントをインポート
import './App.css'; 

function App() {
    // 取得したお祭りデータを格納するための状態変数
    const [festivals, setFestivals] = useState([]);
    // データ取得中の状態を管理するための状態変数
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // ★データを一度だけ取得する処理（useEffect）をApp.jsに移動！
    useEffect(() => {
        const API_URL = 'http://localhost:5000/api/festivals'; 
        const fetchFestivals = async () => {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }
                const data = await response.json();
                // ★ここで全データが取得されます
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

    if (isLoading) {
        return <div className="loading-message">信州のお祭り情報を読み込み中... 🏮</div>;
    }

    if (error) {
        return <div className="error-message">🚨 {error}</div>;
    }
    
    // データが取得できたら、ViewSwitcherにデータを渡す
    return (
        <div className="App">
            <header className="App-header">
                <h1>信州お祭りナビ</h1>
            </header>
            <main>
                {/* FestivalViewSwitcherに取得したデータを渡す */}
                <FestivalViewSwitcher festivals={festivals} />
            </main>
        </div>
    );
}

export default App;