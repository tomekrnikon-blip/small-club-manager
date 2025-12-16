import { useRouter, Stack } from 'expo-router';
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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { trpc } from '@/lib/trpc';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48) / 3;

const ALBUMS = ['Wszystkie', 'Mecze', 'Treningi', 'Drużyna', 'Inne'];

export default function GalleryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedAlbum, setSelectedAlbum] = useState('Wszystkie');
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Get club
  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  // Get photos from database
  const { data: photos = [], isLoading, refetch } = trpc.photos.list.useQuery(
    { clubId: club?.id || 0 },
    { enabled: !!club }
  );

  const uploadPhoto = trpc.photos.upload.useMutation({
    onSuccess: () => {
      refetch();
      setIsUploading(false);
      Alert.alert('Sukces', 'Zdjęcie zostało dodane');
    },
    onError: (error: any) => {
      setIsUploading(false);
      Alert.alert('Błąd', error.message);
    },
  });

  const deletePhoto = trpc.photos.delete.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedPhoto(null);
      Alert.alert('Sukces', 'Zdjęcie zostało usunięte');
    },
    onError: (error: any) => {
      Alert.alert('Błąd', error.message);
    },
  });

  const filteredPhotos = selectedAlbum === 'Wszystkie' 
    ? photos 
    : photos.filter((p: any) => p.description === selectedAlbum);

  const handleAddPhoto = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Błąd', 'Potrzebujemy dostępu do galerii, aby dodać zdjęcia');
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0] && club) {
      // Show album selection
      Alert.alert(
        'Wybierz album',
        'Do którego albumu dodać zdjęcie?',
        ALBUMS.filter(a => a !== 'Wszystkie').map(album => ({
          text: album,
          onPress: () => {
            setIsUploading(true);
            const asset = result.assets[0];
            uploadPhoto.mutate({
              clubId: club.id,
              base64Data: asset.base64 || '',
              fileName: `photo_${Date.now()}.jpg`,
              contentType: 'image/jpeg',
              albumName: album,
              title: '',
            });
          },
        }))
      );
    }
  };

  const handleDeletePhoto = (photo: any) => {
    Alert.alert(
      'Usuń zdjęcie',
      'Czy na pewno chcesz usunąć to zdjęcie?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { 
          text: 'Usuń', 
          style: 'destructive',
          onPress: () => deletePhoto.mutate({ id: photo.id }),
        },
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Galeria</ThemedText>
        <Pressable 
          style={styles.addButton} 
          onPress={handleAddPhoto}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#22c55e" />
          ) : (
            <Ionicons name="add" size={24} color="#22c55e" />
          )}
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
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : filteredPhotos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={64} color="#64748b" />
          <ThemedText style={styles.emptyText}>Brak zdjęć</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Dodaj pierwsze zdjęcie do galerii
          </ThemedText>
          <Pressable style={styles.addFirstButton} onPress={handleAddPhoto}>
            <Ionicons name="add" size={20} color="#fff" />
            <ThemedText style={styles.addFirstButtonText}>Dodaj zdjęcie</ThemedText>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.photosGrid}>
            {filteredPhotos.map((photo: any) => (
              <Pressable
                key={photo.id}
                style={styles.photoItem}
                onPress={() => setSelectedPhoto(photo)}
              >
                <Image source={{ uri: photo.url }} style={styles.photoImage} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Photo Lightbox Modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.lightbox}>
          <Pressable 
            style={styles.lightboxClose} 
            onPress={() => setSelectedPhoto(null)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          
          {selectedPhoto && (
            <>
              <Image 
                source={{ uri: selectedPhoto.url }} 
                style={styles.lightboxImage}
                resizeMode="contain"
              />
              <View style={styles.lightboxInfo}>
                <ThemedText style={styles.lightboxTitle}>
                  {selectedPhoto.title || 'Bez tytułu'}
                </ThemedText>
                {selectedPhoto.description && (
                  <ThemedText style={styles.lightboxAlbum}>
                    Album: {selectedPhoto.description}
                  </ThemedText>
                )}
                <Pressable 
                  style={styles.deleteButton}
                  onPress={() => handleDeletePhoto(selectedPhoto)}
                >
                  <Ionicons name="trash" size={20} color="#ef4444" />
                  <ThemedText style={styles.deleteButtonText}>Usuń</ThemedText>
                </Pressable>
              </View>
            </>
          )}
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
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
    gap: 8,
  },
  albumTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
  },
  albumTabActive: {
    backgroundColor: '#22c55e',
  },
  albumTabText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
  },
  albumTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  addFirstButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    padding: 4,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  lightbox: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  lightboxImage: {
    width: width - 32,
    height: width - 32,
    borderRadius: 12,
  },
  lightboxInfo: {
    padding: 20,
    alignItems: 'center',
  },
  lightboxTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: '#fff',
  },
  lightboxAlbum: {
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
    marginTop: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
  },
});
