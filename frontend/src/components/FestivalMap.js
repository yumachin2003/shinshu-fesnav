import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom'; // Linkをインポートして詳細ページへのリンクを追加
import { Text } from '@mantine/core';
import L from 'leaflet';

const containerStyle = {
  height: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
};

// 地図の中心を長野県長野市付近に設定
const center = [36.64917, 138.19500]; // Leafletは [lat, lng] の配列形式

// カスタムアイコンの設定（例：赤いマーカー）
const festivalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function FestivalMap({ festivals = [] }) {
  const validFestivals = festivals.filter(f => f.latitude && f.longitude);

  return (
    <div className="festival-map-container" style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 15px' }}>
      <h3 style={{ color: '#339AF0', textAlign: 'center', fontWeight: 'bold' }}>🗺️ お祭りマップビュー (OpenStreetMap)</h3>

      <div style={containerStyle}>
        <MapContainer center={center} zoom={9} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {validFestivals.map(festival => (
            <Marker key={festival.id} position={[festival.latitude, festival.longitude]} icon={festivalIcon}>
              <Popup>
                <Text fw={700}>{festival.name}</Text>
                <Text size="sm">{festival.location}</Text>
                <Link to={`/festivals/${festival.id}`} style={{ textDecoration: 'none' }}>
                  <Text c="blue" size="sm" mt={4}>
                    詳細を見る
                  </Text>
                </Link>
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