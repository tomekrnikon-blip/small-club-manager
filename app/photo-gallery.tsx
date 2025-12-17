import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 2) / 3;

interface Album {
  id: number;
  title: string;
  description?: string;
  eventType: string;
  eventDate?: string;
  photoCount: number;
  coverUrl?: string;
}

interface Photo {
  id: number;
  url: string;
  caption?: string;
  tags: string[];
}

export default function PhotoGalleryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [filter, setFilter] = useState<"all" | "training" | "match" | "event">("all");
  
  // Form state
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumDescription, setAlbumDescription] = useState("");

  const { data: clubs, isLoading: clubsLoading } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const { data: players } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  // Mock albums data
  const [albums] = useState<Album[]>([
    {
      id: 1,
      title: "Turniej zimowy 2025",
      description: "Zdjęcia z turnieju halowego",
      eventType: "tournament",
      eventDate: "2025-01-10",
      photoCount: 24,
      coverUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400",
    },
    {
      id: 2,
      title: "Trening 08.01",
      eventType: "training",
      eventDate: "2025-01-08",
      photoCount: 12,
      coverUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400",
    },
    {
      id: 3,
      title: "Mecz ligowy vs Orły",
      description: "Wygrana 3:1!",
      eventType: "match",
      eventDate: "2025-01-05",
      photoCount: 18,
      coverUrl: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400",
    },
    {
      id: 4,
      title: "Wigilia klubowa",
      eventType: "event",
      eventDate: "2024-12-20",
      photoCount: 35,
      coverUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400",
    },
  ]);

  // Mock photos for selected album
  const albumPhotos: Photo[] = selectedAlbum ? [
    { id: 1, url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800", caption: "Rozgrzewka", tags: ["Jan Kowalski", "Adam Nowak"] },
    { id: 2, url: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800", caption: "Akcja bramkowa", tags: ["Piotr Wiśniewski"] },
    { id: 3, url: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800", tags: [] },
    { id: 4, url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800", caption: "Dekoracja", tags: ["Cała drużyna"] },
    { id: 5, url: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800", tags: ["Jan Kowalski"] },
    { id: 6, url: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800", caption: "Trening techniczny", tags: [] },
  ] : [];

  const filteredAlbums = albums.filter(album => {
    if (filter === "all") return true;
    if (filter === "training") return album.eventType === "training";
    if (filter === "match") return album.eventType === "match" || album.eventType === "tournament";
    if (filter === "event") return album.eventType === "event";
    return true;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getEventTypeIcon = (type: string): keyof typeof MaterialIcons.glyphMap => {
    switch (type) {
      case "training": return "fitness-center";
      case "match": return "sports-soccer";
      case "tournament": return "emoji-events";
      case "event": return "celebration";
      default: return "photo-library";
    }
  };

  if (clubsLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Galeria zdjęć</ThemedText>
        <Pressable onPress={() => setShowCreateAlbum(true)} style={styles.addBtn}>
          <MaterialIcons name="add-photo-alternate" size={24} color={AppColors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <ThemedText style={styles.statValue}>{albums.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Albumów</ThemedText>
          </View>
          <View style={styles.statBox}>
            <ThemedText style={styles.statValue}>
              {albums.reduce((sum, a) => sum + a.photoCount, 0)}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Zdjęć</ThemedText>
          </View>
        </View>

        {/* Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {([
            { key: "all", label: "Wszystkie", icon: "photo-library" },
            { key: "training", label: "Treningi", icon: "fitness-center" },
            { key: "match", label: "Mecze", icon: "sports-soccer" },
            { key: "event", label: "Wydarzenia", icon: "celebration" },
          ] as const).map(f => (
            <Pressable
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <MaterialIcons 
                name={f.icon} 
                size={16} 
                color={filter === f.key ? "#fff" : "#64748b"} 
              />
              <ThemedText style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Albums Grid */}
        <View style={styles.albumsGrid}>
          {filteredAlbums.map(album => (
            <Pressable
              key={album.id}
              style={styles.albumCard}
              onPress={() => setSelectedAlbum(album)}
            >
              <Image
                source={{ uri: album.coverUrl }}
                style={styles.albumCover}
              />
              <View style={styles.albumOverlay}>
                <View style={styles.albumBadge}>
                  <MaterialIcons name={getEventTypeIcon(album.eventType)} size={14} color="#fff" />
                </View>
                <View style={styles.albumInfo}>
                  <ThemedText style={styles.albumTitle} numberOfLines={1}>
                    {album.title}
                  </ThemedText>
                  <ThemedText style={styles.albumMeta}>
                    {album.photoCount} zdjęć • {formatDate(album.eventDate)}
                  </ThemedText>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Album View Modal */}
      <Modal
        visible={!!selectedAlbum}
        animationType="slide"
        onRequestClose={() => setSelectedAlbum(null)}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top, 20) }]}>
            <Pressable onPress={() => setSelectedAlbum(null)} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <View style={styles.modalHeaderInfo}>
              <ThemedText style={styles.modalTitle} numberOfLines={1}>
                {selectedAlbum?.title}
              </ThemedText>
              <ThemedText style={styles.modalSubtitle}>
                {selectedAlbum?.photoCount} zdjęć
              </ThemedText>
            </View>
            <Pressable style={styles.addBtn}>
              <MaterialIcons name="add-a-photo" size={24} color={AppColors.primary} />
            </Pressable>
          </View>

          <ScrollView style={styles.photosGrid} contentContainerStyle={styles.photosContainer}>
            {albumPhotos.map(photo => (
              <Pressable
                key={photo.id}
                style={styles.photoThumb}
                onPress={() => setSelectedPhoto(photo)}
              >
                <Image source={{ uri: photo.url }} style={styles.photoImage} />
                {photo.tags.length > 0 && (
                  <View style={styles.tagBadge}>
                    <MaterialIcons name="person" size={12} color="#fff" />
                    <ThemedText style={styles.tagCount}>{photo.tags.length}</ThemedText>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </ThemedView>
      </Modal>

      {/* Photo Viewer Modal */}
      <Modal
        visible={!!selectedPhoto}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.photoViewerOverlay}>
          <Pressable 
            style={[styles.closePhotoBtn, { top: Math.max(insets.top, 20) }]}
            onPress={() => setSelectedPhoto(null)}
          >
            <MaterialIcons name="close" size={28} color="#fff" />
          </Pressable>
          
          {selectedPhoto && (
            <>
              <Image
                source={{ uri: selectedPhoto.url }}
                style={styles.fullPhoto}
                resizeMode="contain"
              />
              
              <View style={[styles.photoDetails, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                {selectedPhoto.caption && (
                  <ThemedText style={styles.photoCaption}>{selectedPhoto.caption}</ThemedText>
                )}
                {selectedPhoto.tags.length > 0 && (
                  <View style={styles.photoTags}>
                    <MaterialIcons name="people" size={16} color="#94a3b8" />
                    <ThemedText style={styles.photoTagsText}>
                      {selectedPhoto.tags.join(", ")}
                    </ThemedText>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Create Album Modal */}
      <Modal
        visible={showCreateAlbum}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateAlbum(false)}
      >
        <View style={styles.createModalOverlay}>
          <View style={[styles.createModalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.createModalHeader}>
              <ThemedText style={styles.createModalTitle}>Nowy album</ThemedText>
              <Pressable onPress={() => setShowCreateAlbum(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>

            <ThemedText style={styles.inputLabel}>Nazwa albumu</ThemedText>
            <TextInput
              style={styles.input}
              value={albumTitle}
              onChangeText={setAlbumTitle}
              placeholder="np. Trening 15.01.2025"
              placeholderTextColor="#64748b"
            />

            <ThemedText style={styles.inputLabel}>Opis (opcjonalnie)</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={albumDescription}
              onChangeText={setAlbumDescription}
              placeholder="Krótki opis albumu..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Pressable 
              style={[styles.createBtn, !albumTitle && styles.createBtnDisabled]}
              disabled={!albumTitle}
            >
              <MaterialIcons name="add-photo-alternate" size={20} color="#fff" />
              <ThemedText style={styles.createBtnText}>Utwórz i dodaj zdjęcia</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  addBtn: {
    padding: Spacing.xs,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  filterScroll: {
    marginBottom: Spacing.md,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1e293b",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  filterChipActive: {
    backgroundColor: AppColors.primary,
  },
  filterText: {
    fontSize: 13,
    color: "#64748b",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  albumsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.md,
  },
  albumCard: {
    width: "50%",
    padding: Spacing.sm,
  },
  albumCover: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: Radius.lg,
    backgroundColor: "#1e293b",
  },
  albumOverlay: {
    position: "absolute",
    bottom: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.sm,
  },
  albumBadge: {
    position: "absolute",
    top: -60,
    right: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 6,
    borderRadius: Radius.full,
  },
  albumInfo: {
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  albumTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  albumMeta: {
    fontSize: 11,
    color: "#94a3b8",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  modalHeaderInfo: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  photosGrid: {
    flex: 1,
  },
  photosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: Spacing.xs,
  },
  photoThumb: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: Spacing.xs,
  },
  photoImage: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.sm,
    backgroundColor: "#1e293b",
  },
  tagBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  tagCount: {
    fontSize: 10,
    color: "#fff",
  },
  photoViewerOverlay: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  closePhotoBtn: {
    position: "absolute",
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  fullPhoto: {
    width: "100%",
    height: "70%",
  },
  photoDetails: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  photoCaption: {
    fontSize: 15,
    color: "#fff",
    marginBottom: Spacing.sm,
  },
  photoTags: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  photoTagsText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  createModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  createModalContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
  },
  createModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  createModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: "#0f172a",
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: "#fff",
  },
  textArea: {
    minHeight: 80,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.xl,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
