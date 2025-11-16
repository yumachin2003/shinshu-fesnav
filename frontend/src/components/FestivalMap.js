import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leafletのデフォルトアイコンが正しく表示されない問題を修正
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// FestivalViewSwitcherからデータを受け取ります。未定義エラーを避けるため初期値を空配列にします。
function FestivalMap({ festivals = [] }) {
    // マーカーとして有効なデータのみをフィルタリング
    // 緯度(latitude)と経度(longitude)が設定されているお祭りのみ表示
    const validFestivals = festivals.filter(f => f.latitude && f.longitude);

    // データが存在しない場合のガード処理
    if (validFestivals.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#fff3cd', borderRadius: '8px', maxWidth: '600px', margin: '30px auto' }}>
                <h3 style={{ color: '#856404', fontWeight: 'bold' }}>🗺️ マップデータ準備中</h3>
                <p>地図に表示できるお祭りがありません。(緯度・経度情報が必要です)</p>
            </div>
        );
    }

    // 地図の中心を長野県長野市付近に設定（マップ表示できない場合も安定させるため）
    const centerLat = 36.64917;
    const centerLng = 138.19500;
    const mapZoom = 9; // ズームレベル（信州全体が見やすい程度）

    return (
        <div className="festival-map-container" style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 15px' }}>
            <h3 style={{ color: '#007bff', textAlign: 'center', fontWeight: 'bold' }}>🗺️ お祭りマップビュー (OpenStreetMap)</h3>

            <div style={{ height: '600px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
                <MapContainer center={[centerLat, centerLng]} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {validFestivals.map(festival => (
                        <Marker key={festival.id} position={[festival.latitude, festival.longitude]}>
                            <Popup>
                                <strong>{festival.name}</strong><br />
                                {festival.location}<br />
                                開催日: {festival.date}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#6c757d', marginTop: '10px' }}>
                ※この地図は、データベースの緯度・経度情報 (`latitude`, `longitude`) に基づいて表示しています。
            </p>
        </div>
    );
}

export default FestivalMap;