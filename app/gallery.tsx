import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48) / 3;

// Placeholder sample photos
const SAMPLE_PHOTOS = [
  { id: 1, url: 'https://picsum.photos/400/400?random=1', title: 'Mecz ligowy', album: 'Mecze' },
  { id: 2, url: 'https://picsum.photos/400/400?random=2', title: 'Trening', album: 'Treningi' },
  { id: 3, url: 'https://picsum.photos/400/400?random=3', title: 'Drużyna', album: 'Drużyna' },
  { id: 4, url: 'https://picsum.photos/400/400?random=4', title: 'Puchar', album: 'Mecze' },
  { id: 5, url: 'https://picsum.photos/400/400?random=5', title: 'Rozgrzewka', album: 'Treningi' },
  { id: 6, url: 'https://picsum.photos/400/400?random=6', title: 'Celebracja', album: 'Mecze' },
];

const ALBUMS = ['Wszystkie', 'Mecze', 'Treningi', 'Drużyna', 'Inne'];

export default function GalleryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedAlbum, setSelectedAlbum] = useState('Wszystkie');
  const [selectedPhoto, setSelectedPhoto] = useState<typeof SAMPLE_PHOTOS[0] | null>(null);
  const [photos] = useState(SAMPLE_PHOTOS);
  const [isLoading] = useState(false);

  const filteredPhotos = selectedAlbum === 'Wszystkie' 
    ? photos 
    : photos.filter(p => p.album === selectedAlbum);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Galeria</ThemedText>
        <Pressable style={styles.addButton}>
          <Ionicons name="add" size={24} color="#22c55e" />
        </Pressable>
      </View>

      {/* Album Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.albumTabs}
        contentContainerStyle={styles.albumTabsContent}
      >
        {ALBUMS.map((album) => (
          <Pressable
            key={album}
            style={[styles.albumTab, selectedAlbum === album && styles.albumTabActive]}
            onPress={() => setSelectedAlbum(album)}
          >
            <ThemedText style={[styles.albumTabText, selectedAlbum === album && styles.albumTabTextActive]}>
              {album}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Photos Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filteredPhotos.length > 0 ? (
            <View style={styles.photosGrid}>
              {filteredPhotos.map((photo) => (
                <Pressable
                  key={photo.id}
                  style={styles.photoItem}
                  onPress={() => setSelectedPhoto(photo)}
                >
                  <Image source={{ uri: photo.url }} style={styles.photoImage} />
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={64} color="#64748b" />
              <ThemedText style={styles.emptyText}>Brak zdjęć</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Dodaj pierwsze zdjęcie do galerii
              </ThemedText>
            </View>
          )}
        </ScrollView>
      )}

      {/* Photo Viewer Modal */}
      <Modal
        visible={!!selectedPhoto}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.closeButton} onPress={() => setSelectedPhoto(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          
          {selectedPhoto && (
            <View style={styles.photoViewer}>
              <Image 
                source={{ uri: selectedPhoto.url }} 
                style={styles.fullPhoto}
                resizeMode="contain"
              />
              <View style={styles.photoInfo}>
                <ThemedText type="defaultSemiBold" style={styles.photoTitle}>
                  {selectedPhoto.title}
                </ThemedText>
                <View style={styles.albumBadge}>
                  <Ionicons name="folder" size={14} color="#22c55e" />
                  <ThemedText style={styles.albumText}>{selectedPhoto.album}</ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Navigation Arrows */}
          <View style={styles.navArrows}>
            <Pressable 
              style={styles.navArrow}
              onPress={() => {
                const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto?.id);
                if (currentIndex > 0) {
                  setSelectedPhoto(filteredPhotos[currentIndex - 1]);
                }
              }}
            >
              <Ionicons name="chevron-back" size={32} color="#fff" />
            </Pressable>
            <Pressable 
              style={styles.navArrow}
              onPress={() => {
                const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto?.id);
                if (currentIndex < filteredPhotos.length - 1) {
                  setSelectedPhoto(filteredPhotos[currentIndex + 1]);
                }
              }}
            >
              <Ionicons name="chevron-forward" size={32} color="#fff" />
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
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
  },
  addButton: {
    padding: 8,
  },
  albumTabs: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  albumTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  albumTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    marginRight: 8,
  },
  albumTabActive: {
    backgroundColor: '#22c55e',
  },
  albumTabText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  albumTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#94a3b8',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  photoViewer: {
    width: '100%',
    alignItems: 'center',
  },
  fullPhoto: {
    width: width - 32,
    height: width - 32,
    borderRadius: 12,
  },
  photoInfo: {
    marginTop: 20,
    alignItems: 'center',
  },
  photoTitle: {
    fontSize: 18,
    color: '#fff',
  },
  albumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
  },
  albumText: {
    fontSize: 13,
    color: '#22c55e',
  },
  navArrows: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  navArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
