import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom'; // Linkをインポートして詳細ページへのリンクを追加
import { Text, Button, Group, Paper, Title, List, ScrollArea, TextInput, Grid } from '@mantine/core';
import { IconCurrentLocation, IconMapPin, IconSearch } from '@tabler/icons-react';
import L from 'leaflet';

const containerStyle = {
  height: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  position: 'relative',
  zIndex: 0,
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

// 地図の中心を移動させるためのコンポーネント
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

function FestivalMap({ festivals = [] }) {
  const validFestivals = festivals.filter(f => f.latitude && f.longitude);
  const [mapCenter, setMapCenter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 検索語に基づいてお祭りをフィルタリング
  const filteredFestivals = useMemo(() => {
    if (!searchTerm) {
      return validFestivals;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return validFestivals.filter(f =>
      (f.name && f.name.toLowerCase().includes(lowercasedFilter)) ||
      (f.location && f.location.toLowerCase().includes(lowercasedFilter))
    );
  }, [validFestivals, searchTerm]);

  // 現在地を取得して地図を移動
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          alert('位置情報を取得できませんでした。');
        }
      );
    } else {
      alert('お使いのブラウザは位置情報をサポートしていません。');
    }
  };

  return (
    <div className="festival-map-container" style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 15px' }}>
      <Group justify="space-between" align="center" mb="md">
        <h3 style={{ color: '#339AF0', fontWeight: 'bold', margin: 0 }}>おまつりマップ</h3>
        <Button leftSection={<IconCurrentLocation size={16} />} onClick={handleCurrentLocation} variant="light">現在地へ移動</Button>
      </Group>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <div style={containerStyle}>
            <MapContainer center={center} zoom={9} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapRecenter center={mapCenter} />
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
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          {/* マップ内のお祭り一覧リスト */}
          <Paper shadow="xs" p="md" withBorder style={{ height: '100%' }}>
            <Title order={4} mb="md">📍 登録されているお祭り一覧</Title>
            <TextInput
              placeholder="名前や場所で検索..."
              leftSection={<IconSearch size={14} />}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.currentTarget.value)}
              mb="md"
            />
            <ScrollArea h={500}>
              <List spacing="xs" size="sm" center>
                {filteredFestivals.length > 0 ? filteredFestivals.map(f => (
                  <List.Item
                    key={f.id}
                    icon={<IconMapPin size={16} style={{ color: 'red' }} />}
                    style={{ cursor: 'pointer', padding: '8px', borderRadius: '4px' }}
                    onClick={() => setMapCenter([f.latitude, f.longitude])}
                    className="festival-list-item"
                  >
                    <Group justify="space-between">
                      <Text fw={500}>{f.name}</Text>
                      <Text c="dimmed" size="xs">{f.location}</Text>
                    </Group>
                  </List.Item>
                )) : (
                  <Text c="dimmed" ta="center" mt="md">該当するお祭りがありません。</Text>
                )}
              </List>
            </ScrollArea>
          </Paper>
        </Grid.Col>
      </Grid>
    </div>
  );
}

export default FestivalMap;