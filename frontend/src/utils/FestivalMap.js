import React from 'react';

// FestivalViewSwitcherからデータを受け取ります。未定義エラーを避けるため初期値を空配列にします。
function FestivalMap({ festivals = [] }) {
    // マーカーとして有効なデータのみをフィルタリング
    // iFrame埋め込み方式では、緯度・経度がなくても最初のデータがあれば中心を設定できる
    const validFestivals = festivals.filter(f => f.location);

    // データが存在しない場合のガード処理
    if (validFestivals.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#fff3cd', borderRadius: '8px', maxWidth: '600px', margin: '30px auto' }}>
                <h3 style={{ color: '#856404', fontWeight: 'bold' }}>🗺️ マップデータ準備中</h3>
                <p>地図を表示するための場所データがデータベースにありません。</p>
            </div>
        );
    }

    // --- iFrame埋め込み用ロジック ---
    
    // 複数の場所をクエリに含めるため、locationをURLエンコードして結合
    const locationQuery = validFestivals.map(f => f.location).join(' and ');
    
    // 地図の中心を長野県長野市付近に設定（マップ表示できない場合も安定させるため）
    const centerLat = 36.64917;
    const centerLng = 138.19500;
    const mapZoom = 9; // ズームレベル（信州全体が見やすい程度）

    // 環境変数からAPIキーを読み込む
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    // Google Maps Embed APIのURLを生成
    // qには場所のクエリ、centerには中心座標、zoomにはズームレベルを設定
    const iframeSrc = `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(locationQuery)}&key=${apiKey}&center=${centerLat},${centerLng}&zoom=${mapZoom}`;


    return (
        <div className="festival-map-container" style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 15px' }}>
            <h3 style={{ color: '#007bff', textAlign: 'center', fontWeight: 'bold' }}>🗺️ お祭りマップビュー (iFrame代替案)</h3>

            <div style={{ height: '600px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
                {/* 地図の埋め込み */}
                <iframe
                    title="Shinsyu Festival Map"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={iframeSrc}
                ></iframe>
            </div>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#6c757d', marginTop: '10px' }}>
                ※この地図は、データベースの場所情報 (`location`) に基づいてGoogle Mapsにクエリを送信しています。
            </p>
        </div>
    );
}

export default FestivalMap;