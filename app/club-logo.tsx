import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const PLACEHOLDER_LOGO = 'https://via.placeholder.com/200x200/1a1a2e/10b981?text=LOGO';

export default function ClubLogoScreen() {
  const insets = useSafeAreaInsets();
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);

  useEffect(() => {
    // Load current club logo from storage
    loadCurrentLogo();
  }, []);

  const loadCurrentLogo = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const clubData = await AsyncStorage.getItem('club_data');
      if (clubData) {
        const parsed = JSON.parse(clubData);
        if (parsed.logoUrl) {
          setCurrentLogo(parsed.logoUrl);
        }
      }
    } catch (error) {
      console.error('Error loading club logo:', error);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Brak uprawnień',
          'Potrzebujemy dostępu do galerii, aby wybrać logo klubu.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Square for logo
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLogoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Błąd', 'Nie udało się wybrać obrazu.');
    }
  };

  const takePhoto = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Brak uprawnień',
          'Potrzebujemy dostępu do aparatu, aby zrobić zdjęcie logo.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLogoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Błąd', 'Nie udało się zrobić zdjęcia.');
    }
  };

  const saveLogo = async () => {
    if (!logoUri) {
      Alert.alert('Błąd', 'Najpierw wybierz lub zrób zdjęcie logo.');
      return;
    }

    setIsUploading(true);

    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      // In production, you would upload to a server here
      // For now, we save the local URI
      const clubData = await AsyncStorage.getItem('club_data');
      const parsed = clubData ? JSON.parse(clubData) : {};
      
      parsed.logoUrl = logoUri;
      
      await AsyncStorage.setItem('club_data', JSON.stringify(parsed));
      
      setCurrentLogo(logoUri);
      
      Alert.alert(
        'Sukces',
        'Logo klubu zostało zapisane.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving logo:', error);
      Alert.alert('Błąd', 'Nie udało się zapisać logo.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeLogo = async () => {
    Alert.alert(
      'Usuń logo',
      'Czy na pewno chcesz usunąć logo klubu?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
              const clubData = await AsyncStorage.getItem('club_data');
              const parsed = clubData ? JSON.parse(clubData) : {};
              
              delete parsed.logoUrl;
              
              await AsyncStorage.setItem('club_data', JSON.stringify(parsed));
              
              setCurrentLogo(null);
              setLogoUri(null);
              
              Alert.alert('Sukces', 'Logo zostało usunięte.');
            } catch (error) {
              console.error('Error removing logo:', error);
              Alert.alert('Błąd', 'Nie udało się usunąć logo.');
            }
          },
        },
      ]
    );
  };

  const displayLogo = logoUri || currentLogo || PLACEHOLDER_LOGO;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backText}>← Wstecz</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>Logo klubu</ThemedText>
        </View>

        {/* Logo Preview */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: displayLogo }}
              style={styles.logoImage}
              contentFit="cover"
            />
            {logoUri && (
              <View style={styles.newBadge}>
                <ThemedText style={styles.newBadgeText}>NOWE</ThemedText>
              </View>
            )}
          </View>
          
          <ThemedText style={styles.logoHint}>
            {currentLogo ? 'Aktualne logo klubu' : 'Brak logo - wybierz lub zrób zdjęcie'}
          </ThemedText>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Wybierz źródło
          </ThemedText>

          <Pressable
            style={[styles.actionButton, styles.galleryButton]}
            onPress={pickImage}
          >
            <ThemedText style={styles.actionIcon}>🖼️</ThemedText>
            <View style={styles.actionTextContainer}>
              <ThemedText style={styles.actionTitle}>Galeria</ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                Wybierz logo z galerii zdjęć
              </ThemedText>
            </View>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.cameraButton]}
            onPress={takePhoto}
          >
            <ThemedText style={styles.actionIcon}>📷</ThemedText>
            <View style={styles.actionTextContainer}>
              <ThemedText style={styles.actionTitle}>Aparat</ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                Zrób zdjęcie herbu klubu
              </ThemedText>
            </View>
          </Pressable>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Wskazówki
          </ThemedText>
          
          <View style={styles.tipItem}>
            <ThemedText style={styles.tipIcon}>✓</ThemedText>
            <ThemedText style={styles.tipText}>
              Użyj kwadratowego obrazu dla najlepszego efektu
            </ThemedText>
          </View>
          
          <View style={styles.tipItem}>
            <ThemedText style={styles.tipIcon}>✓</ThemedText>
            <ThemedText style={styles.tipText}>
              Logo będzie wyświetlane w szablonach social media
            </ThemedText>
          </View>
          
          <View style={styles.tipItem}>
            <ThemedText style={styles.tipIcon}>✓</ThemedText>
            <ThemedText style={styles.tipText}>
              Zalecana rozdzielczość: min. 200x200 pikseli
            </ThemedText>
          </View>
        </View>

        {/* Save/Remove Buttons */}
        <View style={styles.bottomButtons}>
          {logoUri && (
            <Pressable
              style={[styles.saveButton, isUploading && styles.disabledButton]}
              onPress={saveLogo}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.saveButtonText}>
                  Zapisz logo
                </ThemedText>
              )}
            </Pressable>
          )}

          {currentLogo && !logoUri && (
            <Pressable style={styles.removeButton} onPress={removeLogo}>
              <ThemedText style={styles.removeButtonText}>
                Usuń aktualne logo
              </ThemedText>
            </Pressable>
          )}

          {logoUri && (
            <Pressable
              style={styles.cancelButton}
              onPress={() => setLogoUri(null)}
            >
              <ThemedText style={styles.cancelButtonText}>
                Anuluj zmiany
              </ThemedText>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    color: '#10b981',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 180,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    borderWidth: 3,
    borderColor: '#10b981',
    position: 'relative',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logoHint: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  actionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  galleryButton: {
    backgroundColor: '#1e3a5f',
  },
  cameraButton: {
    backgroundColor: '#3d1e5f',
  },
  actionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
  },
  tipsSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipIcon: {
    color: '#10b981',
    fontSize: 14,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    color: '#d1d5db',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  bottomButtons: {
    gap: 12,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4b5563',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
