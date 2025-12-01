import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  height: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
};

// 地図の中心を長野県長野市付近に設定
const center = {
  lat: 36.64917,
  lng: 138.19500
};

function FestivalMap({ festivals = [] }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    // APIキーを後で設定するために、一旦仮の文字列を入れます。
    // 本番環境にデプロイする前には、必ず正規のAPIキーに置き換えてください。
    googleMapsApiKey: 'YOUR_API_KEY_HERE' // process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  });

  const [selectedFestival, setSelectedFestival] = useState(null);
  const mapRef = useRef(null);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handleMarkerClick = (festival) => {
    setSelectedFestival(festival);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: festival.latitude, lng: festival.longitude });
      mapRef.current.setZoom(14); // クリック時にズームイン
    }
  };

  const validFestivals = festivals.filter(f => f.latitude && f.longitude);

  if (!isLoaded) {
    return <div>地図を読み込んでいます...</div>;
  }

  return (
    <div className="festival-map-container" style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 15px' }}>
      <h3 style={{ color: '#4285F4', textAlign: 'center', fontWeight: 'bold' }}>🗺️ お祭りマップビュー (Google Maps)</h3>

      <div style={containerStyle}>
        <GoogleMap
          mapContainerStyle={{ height: '100%', width: '100%' }}
          center={center}
          zoom={9}
          onLoad={onMapLoad}
          options={{
            streetViewControl: false, // ストリートビューを非表示に
            mapTypeControl: false, // 地図/航空写真の切り替えを非表示に
          }}
        >
          {validFestivals.map(festival => (
            <Marker
              key={festival.id}
              position={{ lat: festival.latitude, lng: festival.longitude }}
              onClick={() => handleMarkerClick(festival)}
            />
          ))}

          {selectedFestival && (
            <InfoWindow
              position={{ lat: selectedFestival.latitude, lng: selectedFestival.longitude }}
              onCloseClick={() => setSelectedFestival(null)}
            >
              <div>
                <h4>{selectedFestival.name}</h4>
                <p>{selectedFestival.location}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
      <p style={{ textAlign: 'center', fontSize: '12px', color: '#6c757d', marginTop: '10px' }}>
        ※この地図は、データベースの緯度・経度情報 (`latitude`, `longitude`) に基づいて表示しています。
      </p>
    </div>
  );
}

export default FestivalMap;