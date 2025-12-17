import { useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 2) / 3;

interface PublicPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  takenAt?: string;
}

interface AlbumData {
  id: string;
  title: string;
  description?: string;
  clubName: string;
  eventDate?: string;
  photos: PublicPhoto[];
  allowDownload: boolean;
  expiresAt?: string;
}

export default function PublicAlbumScreen() {
  const params = useLocalSearchParams<{ linkId?: string }>();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PublicPhoto | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    loadAlbum();
  }, [params.linkId]);

  const loadAlbum = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would fetch from the API using the linkId
      // For now, we simulate loading with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!params.linkId) {
        setError("Nieprawidłowy link do albumu");
        return;
      }
      
      // Mock album data
      setAlbum({
        id: "album1",
        title: "Turniej Wiosenny 2024",
        description: "Zdjęcia z turnieju piłkarskiego dla młodzieży",
        clubName: "KS Orlik",
        eventDate: "2024-03-15",
        allowDownload: true,
        photos: [
          { id: "1", url: "https://picsum.photos/800/600?random=1", thumbnailUrl: "https://picsum.photos/200/200?random=1", caption: "Ceremonia otwarcia" },
          { id: "2", url: "https://picsum.photos/800/600?random=2", thumbnailUrl: "https://picsum.photos/200/200?random=2", caption: "Mecz grupowy" },
          { id: "3", url: "https://picsum.photos/800/600?random=3", thumbnailUrl: "https://picsum.photos/200/200?random=3" },
          { id: "4", url: "https://picsum.photos/800/600?random=4", thumbnailUrl: "https://picsum.photos/200/200?random=4", caption: "Finał" },
          { id: "5", url: "https://picsum.photos/800/600?random=5", thumbnailUrl: "https://picsum.photos/200/200?random=5" },
          { id: "6", url: "https://picsum.photos/800/600?random=6", thumbnailUrl: "https://picsum.photos/200/200?random=6", caption: "Dekoracja zwycięzców" },
        ],
      });
    } catch (err) {
      setError("Nie udało się załadować albumu");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoPress = (photo: PublicPhoto, index: number) => {
    setSelectedPhoto(photo);
    setPhotoIndex(index);
  };

  const handlePrevPhoto = () => {
    if (album && photoIndex > 0) {
      const newIndex = photoIndex - 1;
      setPhotoIndex(newIndex);
      setSelectedPhoto(album.photos[newIndex]);
    }
  };

  const handleNextPhoto = () => {
    if (album && photoIndex < album.photos.length - 1) {
      const newIndex = photoIndex + 1;
      setPhotoIndex(newIndex);
      setSelectedPhoto(album.photos[newIndex]);
    }
  };

  const renderPhoto = ({ item, index }: { item: PublicPhoto; index: number }) => (
    <Pressable
      style={styles.photoItem}
      onPress={() => handlePhotoPress(item, index)}
    >
      <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
    </Pressable>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <ThemedText style={styles.loadingText}>Ładowanie albumu...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !album) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <MaterialIcons name="error-outline" size={64} color="#ef4444" />
          <ThemedText style={styles.errorTitle}>Błąd</ThemedText>
          <ThemedText style={styles.errorText}>{error || "Album nie istnieje"}</ThemedText>
          <Pressable style={styles.retryBtn} onPress={loadAlbum}>
            <ThemedText style={styles.retryBtnText}>Spróbuj ponownie</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerContent}>
          <View style={styles.clubBadge}>
            <MaterialIcons name="sports-soccer" size={20} color={AppColors.primary} />
          </View>
          <View style={styles.headerInfo}>
            <ThemedText style={styles.clubName}>{album.clubName}</ThemedText>
            <ThemedText style={styles.albumTitle}>{album.title}</ThemedText>
          </View>
        </View>
        {album.eventDate && (
          <View style={styles.dateBadge}>
            <MaterialIcons name="event" size={14} color="#64748b" />
            <ThemedText style={styles.dateText}>
              {new Date(album.eventDate).toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Description */}
      {album.description && (
        <View style={styles.descriptionContainer}>
          <ThemedText style={styles.description}>{album.description}</ThemedText>
        </View>
      )}

      {/* Photo Count */}
      <View style={styles.photoCountContainer}>
        <MaterialIcons name="photo-library" size={18} color="#64748b" />
        <ThemedText style={styles.photoCount}>
          {album.photos.length} {album.photos.length === 1 ? 'zdjęcie' : 'zdjęć'}
        </ThemedText>
        {album.allowDownload && (
          <View style={styles.downloadBadge}>
            <MaterialIcons name="download" size={14} color="#22c55e" />
            <ThemedText style={styles.downloadText}>Pobieranie dozwolone</ThemedText>
          </View>
        )}
      </View>

      {/* Photo Grid */}
      <FlatList
        data={album.photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.photoGrid}
        showsVerticalScrollIndicator={false}
      />

      {/* Photo Viewer Modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top, 20) }]}>
            <Pressable onPress={() => setSelectedPhoto(null)} style={styles.closeBtn}>
              <MaterialIcons name="close" size={28} color="#fff" />
            </Pressable>
            <ThemedText style={styles.photoCounter}>
              {photoIndex + 1} / {album.photos.length}
            </ThemedText>
            {album.allowDownload && (
              <Pressable style={styles.downloadBtn}>
                <MaterialIcons name="download" size={24} color="#fff" />
              </Pressable>
            )}
          </View>

          {selectedPhoto && (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: selectedPhoto.url }}
                style={styles.fullPhoto}
                resizeMode="contain"
              />
              
              {/* Navigation arrows */}
              {photoIndex > 0 && (
                <Pressable style={[styles.navArrow, styles.navArrowLeft]} onPress={handlePrevPhoto}>
                  <MaterialIcons name="chevron-left" size={40} color="#fff" />
                </Pressable>
              )}
              {photoIndex < album.photos.length - 1 && (
                <Pressable style={[styles.navArrow, styles.navArrowRight]} onPress={handleNextPhoto}>
                  <MaterialIcons name="chevron-right" size={40} color="#fff" />
                </Pressable>
              )}
            </View>
          )}

          {selectedPhoto?.caption && (
            <View style={[styles.captionContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <ThemedText style={styles.caption}>{selectedPhoto.caption}</ThemedText>
            </View>
          )}
        </View>
      </Modal>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <ThemedText style={styles.footerText}>
          Udostępniono przez Small Club Manager
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: "#64748b",
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  retryBtn: {
    marginTop: Spacing.lg,
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  clubBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  albumTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginTop: 2,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.sm,
  },
  dateText: {
    fontSize: 13,
    color: "#64748b",
  },
  descriptionContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  description: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 20,
  },
  photoCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  photoCount: {
    fontSize: 13,
    color: "#64748b",
  },
  downloadBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
    backgroundColor: "#22c55e20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  downloadText: {
    fontSize: 11,
    color: "#22c55e",
  },
  photoGrid: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: Spacing.xs,
    borderRadius: Radius.sm,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1e293b",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  photoCounter: {
    color: "#fff",
    fontSize: 14,
  },
  downloadBtn: {
    padding: Spacing.xs,
  },
  photoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  fullPhoto: {
    width: "100%",
    height: "100%",
  },
  navArrow: {
    position: "absolute",
    top: "50%",
    marginTop: -30,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  navArrowLeft: {
    left: 0,
  },
  navArrowRight: {
    right: 0,
  },
  captionContainer: {
    padding: Spacing.lg,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  caption: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
  footer: {
    padding: Spacing.md,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  footerText: {
    fontSize: 11,
    color: "#475569",
  },
});
