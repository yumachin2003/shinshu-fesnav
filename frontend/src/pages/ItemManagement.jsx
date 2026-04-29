import React, { useState, useEffect, useRef, useMemo } from 'react';
// API通信ロジックを分離したモジュールをインポート
import { Container, Title, Table, Alert, Text, Modal, Button, Group, ActionIcon, Paper, useMantineColorScheme, Stack, TextInput, Textarea, Grid, FileInput, Image, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { IconEdit, IconTrash, IconPlus, IconMinus, IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';
import { getFestivals, deleteFestival, createFestival, updateFestival, uploadFestivalPhoto, deleteFestivalPhoto, getImageUrl } from '../utils/apiService';
import useApiData from '../hooks/useApiData';
import BackButton from '../utils/BackButton';
import '../css/GlassStyle.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const festivalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function ItemManagement() {
  // 🔹 常に Hooks を最初に呼ぶ（ルール）
  const { data: festivals, loading, error, refetch } = useApiData(getFestivals);
  const { colorScheme } = useMantineColorScheme();
  const headerBg = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const [opened, { open, close }] = useDisclosure(false);
  const [mapOpened, { open: openMap, close: closeMap }] = useDisclosure(false);
  const [tempCoords, setTempCoords] = useState(null);
  const [editingFestival, setEditingFestival] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [access, setAccess] = useState('');
  const [attendance, setAttendance] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]); // 複数画像ファイル用の状態
  const [existingPhotos, setExistingPhotos] = useState([]); // 既に登録されている画像
  const [deletedPhotoIds, setDeletedPhotoIds] = useState([]); // 削除予定の画像ID
  const [isSubmitting, setIsSubmitting] = useState(false); // 保存中のローディング状態
  const [formError, setFormError] = useState('');

  // Open modal and populate/reset form
  useEffect(() => {
    if (opened) {
      if (editingFestival) {
        setName(editingFestival.name || '');
        setDate(editingFestival.date || '');
        setLocation(editingFestival.location || '');
        setDescription(editingFestival.description || '');
        setAccess(editingFestival.access || '');
        setAttendance(editingFestival.attendance || '');
        setLatitude(editingFestival.latitude || '');
        setLongitude(editingFestival.longitude || '');
        setExistingPhotos(editingFestival.photos || []);
      } else {
        setName('');
        setDate('');
        setLocation('');
        setDescription('');
        setAccess('');
        setAttendance('');
        setLatitude('');
        setLongitude('');
        setExistingPhotos([]);
      }
      setPhotoFiles([]); // モーダルを開くたびにファイル選択をリセット
      setDeletedPhotoIds([]); // 削除予定リストもリセット
      setFormError(''); // Clear previous errors
    }
  }, [editingFestival, opened]);

  const setSorting = (field) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
  };

  const sortedFestivals = useMemo(() => {
    if (!festivals) return [];
    if (!sortBy) return festivals;

    return [...festivals].sort((a, b) => {
      const valA = a[sortBy] === null || a[sortBy] === undefined ? '' : String(a[sortBy]);
      const valB = b[sortBy] === null || b[sortBy] === undefined ? '' : String(b[sortBy]);
      return reverseSortDirection ? valB.localeCompare(valA, 'ja') : valA.localeCompare(valB, 'ja');
    });
  }, [festivals, sortBy, reverseSortDirection]);

  // 🔹 ユーザー情報チェック（Hooks のあとで実行）
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = storedUser && storedUser.is_admin;

  // 🔹 root 以外は閲覧不可
  if (!isAdmin) {
    return (
      <div style={{ padding: "20px", fontSize: "18px", color: "red" }}>
        閲覧権限がありません
      </div>
    );
  }

  const handleEdit = (festival) => {
    if (storedUser?.username === 'admin_test') {
      modals.openConfirmModal({
        title: <Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>権限エラー</Text>,
        yOffset: '10vh',
        children: <Text size="sm">プレビュー用の管理者アカウントのためデータの変更はできません</Text>,
        labels: { confirm: '閉じる' },
        cancelProps: { display: 'none' },
      });
      return;
    }
    setEditingFestival(festival);
    open();
  };

  const handleAddNew = () => {
    if (storedUser?.username === 'admin_test') {
      modals.openConfirmModal({
        title: <Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>権限エラー</Text>,
        yOffset: '10vh',
        children: <Text size="sm">プレビュー用の管理者アカウントのためデータの変更はできません</Text>,
        labels: { confirm: '閉じる' },
        cancelProps: { display: 'none' },
      });
      return;
    }
    setEditingFestival(null);
    open();
  };

  const handleDelete = (id) => {
    if (storedUser?.username === 'admin_test') {
      modals.openConfirmModal({
        title: <Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>権限エラー</Text>,
        yOffset: '10vh',
        children: <Text size="sm">プレビュー用の管理者アカウントのためデータの変更はできません</Text>,
        labels: { confirm: '閉じる' },
        cancelProps: { display: 'none' },
      });
      return;
    }
    modals.openConfirmModal({
      title: <Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>お祭りの削除</Text>,
      yOffset: '10vh',
      children: <Text size="sm">このお祭りを削除してもよろしいですか？</Text>,
      labels: { confirm: '削除', cancel: 'キャンセル' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteFestival(id);
          refetch();
        } catch (err) {
          modals.openConfirmModal({
            title: <Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>エラー</Text>,
            yOffset: '10vh',
            children: <Text size="sm">削除に失敗しました。</Text>,
            labels: { confirm: '閉じる' },
            cancelProps: { display: 'none' },
          });
        }
      },
    });
  };

  const handleDeleteExistingPhoto = (photoId) => {
    if (storedUser?.username === 'admin_test') {
      modals.openConfirmModal({
        title: <Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>権限エラー</Text>,
        children: <Text size="sm">プレビュー用アカウントのため削除できません</Text>,
        labels: { confirm: '閉じる' },
        cancelProps: { display: 'none' },
      });
      return;
    }
    // 画面上から非表示にし、削除予定リストに追加する（まだサーバーからは消さない）
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setDeletedPhotoIds((prev) => [...prev, photoId]);
  };

  const handleRemoveNewPhoto = (index) => {
    // 新しく選択した画像をアップロード対象から外す
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name || !location) {
      setFormError('お祭り名と場所は必須です。');
      return;
    }

    const performSave = async () => {
      setIsSubmitting(true); // ローディング開始

      const festivalPayload = { 
        name, 
        date, 
        location, 
        description,
        access,
        attendance: attendance || null,
        latitude: latitude || null,
        longitude: longitude || null };

      try {
        let festivalId = editingFestival?.id;
        if (editingFestival) {
          await updateFestival(editingFestival.id, festivalPayload);
        } else {
          const res = await createFestival(festivalPayload);
          festivalId = res.data.id; // 新規作成時はレスポンスからIDを取得
        }

        // 保存時に、削除予定の画像があればサーバーから削除
        if (deletedPhotoIds.length > 0) {
          await Promise.all(deletedPhotoIds.map((id) => deleteFestivalPhoto(id)));
        }

        // 画像が選択されていればアップロードを実行
        if (photoFiles && photoFiles.length > 0 && festivalId) {
          await Promise.all(photoFiles.map((file) => uploadFestivalPhoto(festivalId, file)));
        }
        refetch();
        close();
      } catch (err) {
        modals.openConfirmModal({
          title: <Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>保存エラー</Text>,
          yOffset: '10vh',
          children: <Text size="sm">データの保存に失敗しました: {err.response?.data?.error || err.message}</Text>,
          labels: { confirm: '閉じる' },
          cancelProps: { display: 'none' },
        });
      } finally {
        setIsSubmitting(false); // ローディング終了
      }
    };

    if (deletedPhotoIds.length > 0) {
      modals.openConfirmModal({
        title: <Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>変更の保存</Text>,
        yOffset: '10vh',
        children: <Text size="sm">削除される画像が含まれています。<br />本当に保存してもよろしいですか？</Text>,
        labels: { confirm: '保存する', cancel: 'キャンセル' },
        confirmProps: { color: 'red' },
        onConfirm: performSave,
      });
    } else {
      performSave();
    }
  };

  const handleMapConfirm = () => {
    if (tempCoords) {
      setLatitude(tempCoords.lat.toFixed(6));
      setLongitude(tempCoords.lng.toFixed(6));
    }
    closeMap();
  };

  const handleBulkUpdate2026 = () => {
    if (storedUser?.username === 'admin_test') {
      modals.openConfirmModal({
        title: <Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>権限エラー</Text>,
        yOffset: '10vh',
        children: <Text size="sm">プレビュー用の管理者アカウントのためデータの変更はできません</Text>,
        labels: { confirm: '閉じる' },
        cancelProps: { display: 'none' },
      });
      return;
    }
    modals.openConfirmModal({
      title: <Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>開催年の一括更新</Text>,
      yOffset: '10vh',
      children: <Text size="sm">登録されている全てのお祭りの開催年を「2026年」に更新しますか？<br />この操作は取り消せません。</Text>,
      labels: { confirm: '実行', cancel: 'キャンセル' },
      confirmProps: { color: 'orange' },
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('authToken');
          const response = await fetch('/api/festivals/bulk-update-year', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ year: 2026 })
          });
          if (!response.ok) throw new Error('更新に失敗しました');
          const data = await response.json();
          modals.openConfirmModal({
            title: <Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>完了</Text>,
            yOffset: '10vh',
            children: <Text size="sm">{data.message}</Text>,
            labels: { confirm: '閉じる' },
            cancelProps: { display: 'none' },
          });
          refetch();
        } catch (err) {
          modals.openConfirmModal({
            title: <Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>エラー</Text>,
            yOffset: '10vh',
            children: <Text size="sm">エラーが発生しました: {err.message}</Text>,
            labels: { confirm: '閉じる' },
            cancelProps: { display: 'none' },
            confirmProps: { color: 'red' },
          });
        }
      },
    });
  };

  const SortableTh = ({ children, field }) => {
    const sorted = sortBy === field;
    const Icon = sorted ? (reverseSortDirection ? IconChevronUp : IconChevronDown) : IconSelector;
    return (
      <Table.Th 
        style={{ color: 'var(--glass-text)', backgroundColor: headerBg, cursor: 'pointer' }} 
        onClick={() => setSorting(field)}
      >
        <Group justify="space-between" wrap="nowrap">
          <Text fw={700} size="sm" style={{ color: 'var(--glass-text)' }}>{children}</Text>
          <Icon size={14} stroke={1.5} />
        </Group>
      </Table.Th>
    );
  };

  return (
    <Container>
      <Group justify="space-between" align="center" mb="xl">
        <Title order={1} c={colorScheme === 'dark' ? 'white' : 'dark'}>おまつりデータ管理</Title>
        <BackButton to="/admin/dashboard" variant="outline" />
      </Group>
      <Group mt="xl">
        <Button onClick={handleAddNew} size="md">新規お祭りを追加</Button>
        <Button onClick={handleBulkUpdate2026} size="md" color="orange" variant="outline">2026年に一括更新</Button>
      </Group>

      <Title order={2} mt="xl" c={colorScheme === 'dark' ? 'white' : 'dark'}>登録済みのお祭り</Title>

      {error && <Alert color="red" mt="md">お祭りデータの読み込みに失敗しました。</Alert>}

      {loading ? (
        <Text mt="md">読み込み中...</Text>
      ) : festivals && (
        <Paper shadow="sm" p="md" radius="md" mt="md" className="glass-panel">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <SortableTh field="name">名前</SortableTh>
                <SortableTh field="date">開催日</SortableTh>
                <SortableTh field="location">場所</SortableTh>
                <Table.Th style={{ width: '100px', color: 'var(--glass-text)', backgroundColor: headerBg }}>操作</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedFestivals.map((festival) => (
                <Table.Tr key={festival.id}>
                  <Table.Td style={{ color: 'var(--glass-text)' }}>{festival.name}</Table.Td>
                  <Table.Td style={{ color: 'var(--glass-text)' }}>{festival.date}</Table.Td>
                  <Table.Td style={{ color: 'var(--glass-text)' }}>{festival.location}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon variant="light" color="blue" onClick={() => handleEdit(festival)} title="編集">
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="light" color="red" onClick={() => handleDelete(festival.id)} title="削除">
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      <Modal opened={opened} onClose={close} title={<Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>{editingFestival ? "お祭り情報の編集" : "新規お祭り登録"}</Text>} overlayProps={{ backgroundOpacity: 0.2, blur: 4 }} size="lg" yOffset="10vh">
        <Stack>
          <Text size="sm" fw={500}></Text>
          {formError && <Alert color="red" title="入力エラー">{formError}</Alert>}
          <TextInput label="お祭り名" placeholder="例：長野びんずる" value={name} onChange={(e) => setName(e.currentTarget.value)} required labelProps={{ style: { color: 'var(--glass-text)' } }} />
          <TextInput type="date" label="開催日" placeholder="YYYY-MM-DD" value={date} onChange={(e) => setDate(e.currentTarget.value)} labelProps={{ style: { color: 'var(--glass-text)' } }} />
          <TextInput label="場所" placeholder="例：長野市中央通り" value={location} onChange={(e) => setLocation(e.target.value)} required labelProps={{ style: { color: 'var(--glass-text)' } }} />
          <Textarea label="詳細" placeholder="お祭りの説明を入力" value={description} onChange={(e) => setDescription(e.target.value)} minRows={4} labelProps={{ style: { color: 'var(--glass-text)' } }} />
          <Textarea label="アクセス" placeholder="アクセス方法" value={access} onChange={(e) => setAccess(e.currentTarget.value)} minRows={2} labelProps={{ style: { color: 'var(--glass-text)' } }} />
          <TextInput label="想定動員数" placeholder="例: 10000" value={attendance} onChange={(e) => setAttendance(e.currentTarget.value)} labelProps={{ style: { color: 'var(--glass-text)' } }} />
          <FileInput
            label="お祭りの画像"
            placeholder="画像ファイルを選択（複数可）"
            accept="image/png,image/jpeg,image/webp"
            multiple
            value={photoFiles}
            onChange={setPhotoFiles}
            clearable
            labelProps={{ style: { color: 'var(--glass-text)' } }}
          />
          {/* 画像プレビュー */}
          {(existingPhotos.length > 0 || photoFiles.length > 0) && (
            <Grid mt="xs">
              {existingPhotos.map((photo) => (
                <Grid.Col span={4} key={`ext-${photo.id}`}>
                  <Box className="image-preview-container" style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                    <Image src={getImageUrl(photo.image_url)} height={100} fit="cover" loading="lazy" />
                    <ActionIcon
                      className="delete-btn" color="red" variant="filled" size="sm"
                      style={{ position: 'absolute', top: 4, right: 4 }}
                      onClick={() => handleDeleteExistingPhoto(photo.id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Box>
                </Grid.Col>
              ))}
              {photoFiles.map((file, idx) => {
                const objectUrl = URL.createObjectURL(file);
                return (
                  <Grid.Col span={4} key={`new-${idx}`}>
                    <Box className="image-preview-container" style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                      <Image src={objectUrl} height={100} fit="cover" onLoad={() => URL.revokeObjectURL(objectUrl)} loading="lazy" />
                      <ActionIcon
                        className="delete-btn" color="red" variant="filled" size="sm"
                        style={{ position: 'absolute', top: 4, right: 4 }}
                        onClick={() => handleRemoveNewPhoto(idx)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Box>
                  </Grid.Col>
                );
              })}
            </Grid>
          )}
          <Grid align="flex-end">
            <Grid.Col span={6}><TextInput label="緯度" placeholder="例: 36.6485" value={latitude} onChange={(e) => setLatitude(e.currentTarget.value)} labelProps={{ style: { color: 'var(--glass-text)' } }} /></Grid.Col>
            <Grid.Col span={6}><TextInput label="経度" placeholder="例: 138.1936" value={longitude} onChange={(e) => setLongitude(e.currentTarget.value)} labelProps={{ style: { color: 'var(--glass-text)' } }} /></Grid.Col>
            <Grid.Col span={12}>
              <Button 
                onClick={() => {
                  const currentLat = parseFloat(latitude);
                  const currentLng = parseFloat(longitude);
                  if (!isNaN(currentLat) && !isNaN(currentLng)) {
                    setTempCoords({ lat: currentLat, lng: currentLng });
                  } else {
                    setTempCoords(null);
                  }
                  openMap();
                }} 
                variant="light" 
                fullWidth
              >
                地図から選択
              </Button>
            </Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close} disabled={isSubmitting}>キャンセル</Button>
            <Button onClick={handleSubmit} loading={isSubmitting}>保存</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={mapOpened} onClose={closeMap} title={<Text c={colorScheme === 'dark' ? 'white' : 'dark'} fw={700}>地図上で位置を選択</Text>} overlayProps={{ backgroundOpacity: 0.2, blur: 4 }} size="xl" yOffset="10vh">
        <MapContainer 
          center={(latitude && longitude) ? [parseFloat(latitude), parseFloat(longitude)] : [36.651, 138.181]} 
          zoom={13} 
          zoomControl={false}
          style={{ height: '60vh', width: '100%' }}
        >
          <TileLayer
            attribution='© Google'
            url="https://mt1.google.com/vt/lyrs=y&hl=ja&x={x}&y={y}&z={z}"
          />
          <LocationMarker tempCoords={tempCoords} setTempCoords={setTempCoords} />
          <MapControls />
        </MapContainer>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeMap}>キャンセル</Button>
          <Button onClick={handleMapConfirm} disabled={!tempCoords}>この位置に設定</Button>
        </Group>
      </Modal>
    </Container>
  );
}

function LocationMarker({ tempCoords, setTempCoords }) {
  const markerRef = useRef(null);

  useMapEvents({
    click(e) {
      setTempCoords(e.latlng);
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragstart() {
        const marker = markerRef.current;
        if (marker) {
          const el = marker.getElement();
          if (el) {
            const icon = marker.options.icon;
            const anchorY = icon.options.iconAnchor ? icon.options.iconAnchor[1] : 41;
            el.style.transition = 'margin-top 0.2s ease';
            el.style.marginTop = `${-(anchorY + 20)}px`;
          }
        }
      },
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const el = marker.getElement();
          if (el) {
            const icon = marker.options.icon;
            const anchorY = icon.options.iconAnchor ? icon.options.iconAnchor[1] : 41;
            el.style.marginTop = `${-anchorY}px`;
          }
          setTempCoords(marker.getLatLng());
        }
      },
    }),
    [setTempCoords],
  );

  return tempCoords === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={tempCoords}
      ref={markerRef}
      icon={festivalIcon}
    >
      <Popup>選択した位置</Popup>
    </Marker>
  );
}

function MapControls() {
  const map = useMap();
  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
      <Paper className="glass-map-control" style={{ display: 'flex', flexDirection: 'column' }}>
        <ActionIcon onClick={() => map.zoomIn()} size="lg" variant="subtle" style={{ borderRadius: 0, borderBottom: '1px solid rgba(128,128,128,0.2)' }} color="gray"><IconPlus size={18} /></ActionIcon>
        <ActionIcon onClick={() => map.zoomOut()} size="lg" variant="subtle" style={{ borderRadius: 0 }} color="gray"><IconMinus size={18} /></ActionIcon>
      </Paper>
    </div>
  );
}

export default ItemManagement;
