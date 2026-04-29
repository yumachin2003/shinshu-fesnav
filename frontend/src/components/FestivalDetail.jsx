import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Modal,
  Box,
  Text,
  Title,
  Group,
  Button,
  Alert,
  Stack,
  Image,
  ActionIcon,
  Tooltip,
  Loader,
} from "@mantine/core";
import {
  IconCalendar,
  IconMapPin,
  IconUsers,
  IconEdit,
  IconHeart,
  IconX,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { UserContext } from "../UserContext";
import { getAccountData, updateFavorites, getImageUrl } from "../utils/apiService";
import useApiData from "../hooks/useApiData";
import AddToCalendarButton from "./AddToICalendarButton";
import InformationModal from "./InformationModal";
import '../css/GlassStyle.css';
import { getErrorDetails } from "../utils/errorHandler";

// 日本人向けの数字フォーマット関数 (例: 12000 -> 1.2万人, 500 -> 500人)
const formatAttendance = (num) => {
  if (!num) return "不明";
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万人`.replace(".0", "");
  }
  return `${num.toLocaleString()}人`;
};

export default function FestivalDetail({ festivalData, opened, onClose }) {
  
  // 常にダークモード（黒透け）で表示
  const isDark = true;

  const { user, openLogin } = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const [loginModalOpened, setLoginModalOpened] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: accountData, loading: accountLoading, error: accountError } = useApiData(getAccountData, [user?.id]);

  const [festival, setFestival] = useState(null);
  const [favorites, setFavorites] = useState({});

  useEffect(() => {
    setFestival(festivalData);
    setCurrentImageIndex(0); // お祭りが切り替わったら画像インデックスをリセット
  }, [festivalData]);

  useEffect(() => {
    if (!accountData) return;
    setFavorites(accountData.favorites || {});
  }, [accountData]);

  const saveFavorites = async (updated) => {
    setFavorites(updated);
    await updateFavorites(updated).catch((err) => console.error("お気に入り更新エラー:", err));
  };

  const toggleFavorite = () => {
    if (!user) {
      setLoginModalOpened(true);
      return;
    }
    const nextValue = !favorites[festival.id];
    const updated = { ...favorites, [festival.id]: nextValue };

    if (festival) {
      setFestival((prev) => ({
        ...prev,
        favorites: (prev.favorites || 0) + (nextValue ? 1 : -1),
      }));
    }
    saveFavorites(updated);
  };

  // スライド用画像の配列を生成
  const images = useMemo(() => {
    if (!festival) return [];
    if (festival.photos && festival.photos.length > 0) {
      return festival.photos.map((p) => getImageUrl(p.image_url));
    }
    const fallbackUrl = festival.image_url ? getImageUrl(festival.image_url) : `https://picsum.photos/seed/${festival.id}/600/400`;
    return [fallbackUrl];
  }, [festival]);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const isLoading = (user && accountLoading);
  const error = (user && accountError);

  const { title: errorTitle, message: errorMessage } = error ? getErrorDetails(error) : {};

  // デザイン変数
  const bgColor = "var(--glass-bg)";
  
  const textColor = "var(--glass-text)";
  const subTextColor = "var(--glass-text-dimmed)";
  

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="md"
      padding={0}
      withCloseButton={false}
      zIndex={1300}
      centered
      overlayProps={{ backgroundOpacity: 0.2, blur: 4 }}
      transitionProps={{ transition: 'pop', duration: 300, timingFunction: 'ease-out' }}
      classNames={{ root: 'force-dark-mode' }}
      styles={{
        content: { 
          backgroundColor: "transparent", 
          boxShadow: "none",
          borderRadius: "var(--glass-radius-xxl)",
        },
        body: { padding: 0 },
      }}
    >
      {isLoading ? (
        <Box 
          style={{ 
            background: bgColor, 
            backdropFilter: "blur(var(--glass-blur))", 
            borderRadius: "var(--glass-radius-xxl)",
            minHeight: "500px", // 高さを確保して切り替え時のガタつきを防止
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Loader color="gray" type="bars" />
        </Box>
      ) : error ? (
        <Alert color="red" variant="filled" style={{ borderRadius: "var(--glass-radius-xxl)" }} title={errorTitle}>🚨 {errorMessage}</Alert>
      ) : !festival ? (
        <Alert color="yellow" variant="filled" style={{ borderRadius: "var(--glass-radius-xxl)" }}>お祭りが見つかりません</Alert>
      ) : (
        <Box
          className="glass-fade-in"
          style={{
            position: "relative",
            width: "100%",
            backgroundColor: "transparent",
            borderRadius: "var(--glass-radius-xxl)",
            overflow: "hidden",
            color: textColor,
          }}
        >
          {/* --- 0. 背景用 (色を引き伸ばす表現) --- */}
          <Box
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0,
              backgroundImage: `url(${images[currentImageIndex]})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(60px) saturate(1.5)",
              transform: "scale(1.2)",
              opacity: 0.6,
            }}
          />

          {/* --- 1. 画像エリア --- */}
          <Box style={{ position: "relative", height: "300px", overflow: "hidden", zIndex: 1 }}>
            {/* 前景：メイン画像 (下だけぼかす) */}
            <Image
              src={images[currentImageIndex]}
              alt={festival.name}
              style={{
                width: "100%", 
                height: "100%", 
                objectFit: "cover",
                objectPosition: "center",
                zIndex: 1,
                maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
              }}
            />
            
            {/* 複数画像がある場合のみ左右の矢印とインジケーターを表示 */}
            {images.length > 1 && (
              <>
                <ActionIcon
                  variant="transparent"
                  color="gray.3"
                  onClick={handlePrevImage}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 8,
                    transform: "translateY(-50%)",
                    backgroundColor: "rgba(0,0,0,0.4)",
                    borderRadius: "50%",
                    zIndex: 2,
                  }}
                  size="xl"
                >
                  <IconChevronLeft size={32} />
                </ActionIcon>
                <ActionIcon
                  variant="transparent"
                  color="gray.3"
                  onClick={handleNextImage}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 8,
                    transform: "translateY(-50%)",
                    backgroundColor: "rgba(0,0,0,0.4)",
                    borderRadius: "50%",
                    zIndex: 2,
                  }}
                  size="xl"
                >
                  <IconChevronRight size={32} />
                </ActionIcon>
                {/* インジケーター（ドット） */}
                <Box style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 2 }}>
                  {images.map((_, idx) => (
                    <Box
                      key={idx}
                      style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: idx === currentImageIndex ? "white" : "rgba(255,255,255,0.5)", transition: "background-color 0.2s" }}
                    />
                  ))}
                </Box>
              </>
            )}

            {/* 右上の閉じるボタン (×) */}
            <ActionIcon
              variant="subtle"
              color="gray.3"
              size="lg"
              radius="xl"
              onClick={onClose}
              style={{ 
                position: "absolute", 
                top: 16, 
                right: 16, 
                backgroundColor: "rgba(0,0,0,0.3)", // 背景をつけて視認性確保
                backdropFilter: "blur(4px)",
                zIndex: 3
              }}
            >
              <IconX size={20} stroke={2} />
            </ActionIcon>
          </Box>

          {/* --- 2. コンテンツエリア --- */}
          <Box style={{ position: "relative", zIndex: 2, marginTop: -120 }}>
            {/* 背景レイヤー（上から段々ぼかし） */}
            <Box
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: bgColor,
                backdropFilter: "blur(var(--glass-blur))",
                WebkitBackdropFilter: "blur(var(--glass-blur))",
                /*borderRadius: "24px 24px 0 0",*/
                maskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 200px)",
                WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 200px)",
              }}
            />

            <Stack p={24} gap="md" style={{ position: "relative" }}>
            
            {/* タイトル & お気に入りボタン */}
            <Group justify="space-between" align="flex-start">
              <Title order={2} fz="1.6rem" fw={800} lh={1.2} c={textColor} style={{ flex: 1 }}>
                {festival.name}
              </Title>
              <Group gap={4} align="center">
                <Text size="lg" fw={700} c={subTextColor} style={{ lineHeight: 1 }}>
                  {festival.favorites || 0}
                </Text>
                <Tooltip label={favorites[festival.id] ? "お気に入り解除" : "お気に入り登録"}>
                  <ActionIcon 
                    variant="transparent" 
                    size="xl" 
                    onClick={toggleFavorite}
                  >
                    <IconHeart 
                      size={28} 
                      fill={favorites[festival.id] ? "#fa5252" : "none"} 
                      color="#fa5252"
                    />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>

            {/* 基本情報 (日時・場所・動員数) */}
            <Stack gap={8} mt="xs">
              <Group gap={8}>
                <IconCalendar size={18} color={subTextColor} />
                <Text size="sm" c={textColor} fw={500}>
                  {festival.date || "開催日未定"}
                </Text>
              </Group>
              <Group gap={8}>
                <IconMapPin size={18} color={subTextColor} />
                <Text size="sm" c={textColor} fw={500}>
                  {festival.location || "場所詳細なし"}
                </Text>
              </Group>
              <Group gap={8}>
                <IconUsers size={18} color={subTextColor} />
                <Text size="sm" c={textColor} fw={500}>
                  動員数: {formatAttendance(festival.attendance)}
                </Text>
              </Group>
            </Stack>

            {/* 説明文 */}
            <Text size="sm" c={subTextColor} lh={1.6} lineClamp={3} mt="xs">
              {festival.description || "このお祭りの詳細な説明はまだありません。"}
            </Text>

            {/* 下部アクション (カレンダー追加 & 右下に情報提供) */}
            <Group justify="space-between" align="flex-end" mt="md">
              <AddToCalendarButton 
                name={festival.name} 
                location={festival.location} 
                date={festival.date} 
                festivalId={festival.id}
                description={festival.description}
              />
              
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconEdit size={14} />}
                onClick={() => setOpen(true)}
                c={subTextColor}
                style={{ opacity: 0.8 }}
              >
                情報提供
              </Button>
            </Group>
            </Stack>
          </Box>

          {/* 各種モーダル */}
          <InformationModal opened={open} onClose={() => setOpen(false)} festival={festival} />
          
          <Modal 
            opened={loginModalOpened} 
            onClose={() => setLoginModalOpened(false)} 
            title="ログインが必要です" 
            centered 
            zIndex={4000}
            overlayProps={{ backgroundOpacity: 0.2, blur: 4 }}
            classNames={{ content: 'glass-modal force-dark-mode', header: 'glass-modal-header' }}
            styles={{
              header: { color: textColor },
              title: { color: textColor },
            }}
          >
            <Text size="sm" mb="lg" c={textColor}>
              お気に入り機能を利用するにはログインが必要です。
            </Text>
            <Group justify="flex-end">
              <Button onClick={() => { setLoginModalOpened(false); openLogin(); }}>ログインする</Button>
            </Group>
          </Modal>
        </Box>
      )}
    </Modal>
  );
}