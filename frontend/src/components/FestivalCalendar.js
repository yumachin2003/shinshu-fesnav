import React, { useState } from 'react';

// FestivalViewSwitcherからデータを受け取ります。未定義の場合に備え、初期値として空の配列を設定します。
function FestivalCalendar({ festivals = [] }) {
    // 状態管理: 選択された日付（YYYY-MM-DD形式）
    const today = new Date();
    // ロケール設定
    const customLocale = 'ja-JP';

    // Dateオブジェクトを 'YYYY-MM-DD' 形式の文字列に変換するヘルパー関数
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState(formatDate(today)); 

    // 選択された日付に開催されるお祭りを抽出するロジック
    // festivalsが空配列（[]）であるため、安全にfilterを実行できます。
    const filteredFestivals = festivals.filter(f => {
        // f.date (例: "2025-08-15") と selectedDate (例: "2025-08-15") を直接比較
        return f && f.date === selectedDate;
    });

    // 選択された日付の整形表示
    const displayDate = new Date(selectedDate).toLocaleDateString(customLocale, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        weekday: 'short' 
    });

    // カレンダーを表示する代わりに、日付選択フィールドとリストを表示
    return (
        <div className="festival-calendar-container">
            <h3 style={{ color: '#28a745', textAlign: 'center', fontWeight: 'bold' }}>📅 日付別お祭り検索</h3>
            
            <div className="date-selector" style={{ 
                maxWidth: '400px', 
                margin: '20px auto', 
                textAlign: 'center', 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <label htmlFor="date-input" style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
                    開催日を選択してください
                </label>
                <input 
                    type="date" 
                    id="date-input"
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    style={{
                        padding: '10px',
                        fontSize: '16px',
                        borderRadius: '5px',
                        border: '1px solid #ced4da',
                        width: 'calc(100% - 22px)'
                    }}
                />
            </div>
            
            <div className="festival-list-for-date" style={{ maxWidth: '600px', margin: '30px auto', padding: '0 15px' }}>
                <h4 style={{ borderBottom: '2px solid #28a745', paddingBottom: '5px' }}>
                    {displayDate} のお祭り
                </h4>
                
                {filteredFestivals.length > 0 ? (
                    filteredFestivals.map((festival, index) => (
                        <div key={festival.id || index} className="festival-card-mini" style={{
                            border: '1px solid #28a745',
                            backgroundColor: '#e9f7ef',
                            padding: '15px',
                            borderRadius: '5px',
                            marginBottom: '10px'
                        }}>
                            <strong>{festival.name}</strong> ({festival.location})
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#6c757d' }}>選択された日付に開催されるお祭りはありません。</p>
                )}
        </div>
    </div>
    );
}

export default FestivalCalendar;