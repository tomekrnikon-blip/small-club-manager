import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { trpc } from '@/lib/trpc';

export default function ClubSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Get first club
  const { data: clubs, isLoading } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];
  
  const [name, setName] = useState(club?.name || '');
  const [location, setLocation] = useState(club?.location || '');
  const [city, setCity] = useState(club?.city || '');
  const [description, setDescription] = useState(club?.description || '');
  const [isEditing, setIsEditing] = useState(false);

  const utils = trpc.useUtils();
  
  const updateClub = trpc.clubs.update.useMutation({
    onSuccess: () => {
      utils.clubs.list.invalidate();
      setIsEditing(false);
      Alert.alert('Sukces', 'Ustawienia klubu zostały zapisane');
    },
    onError: (error: any) => {
      Alert.alert('Błąd', error.message);
    },
  });

  const handleSave = () => {
    if (!club) return;
    updateClub.mutate({
      id: club.id,
      name: name.trim(),
      location: location.trim() || undefined,
      city: city.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  // Update state when club data loads
  useState(() => {
    if (club) {
      setName(club.name || '');
      setLocation(club.location || '');
      setCity(club.city || '');
      setDescription(club.description || '');
    }
  });

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#22c55e" />
      </ThemedView>
    );
  }

  if (!club) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Ionicons name="business-outline" size={64} color="#64748b" />
        <ThemedText style={styles.emptyText}>Nie znaleziono klubu</ThemedText>
        <Pressable style={styles.backButtonLarge} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Wróć</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Ustawienia klubu</ThemedText>
        <Pressable 
          onPress={() => isEditing ? handleSave() : setIsEditing(true)} 
          style={styles.editButton}
        >
          {updateClub.isPending ? (
            <ActivityIndicator size="small" color="#22c55e" />
          ) : (
            <ThemedText style={styles.editButtonText}>
              {isEditing ? 'Zapisz' : 'Edytuj'}
            </ThemedText>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Club Logo */}
        <View style={styles.logoSection}>
          <View style={styles.clubLogo}>
            <Ionicons name="football" size={48} color="#22c55e" />
          </View>
          {isEditing && (
            <Pressable style={styles.changeLogoButton}>
              <Ionicons name="camera" size={16} color="#22c55e" />
              <ThemedText style={styles.changeLogoText}>Zmień logo</ThemedText>
            </Pressable>
          )}
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Informacje podstawowe</ThemedText>
          
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Nazwa klubu *</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nazwa klubu"
                placeholderTextColor="#64748b"
              />
            ) : (
              <ThemedText style={styles.fieldValue}>{club.name}</ThemedText>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Miasto</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Miasto"
                placeholderTextColor="#64748b"
              />
            ) : (
              <ThemedText style={styles.fieldValue}>{club.city || 'Nie podano'}</ThemedText>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Adres / Obiekt sportowy</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Adres lub nazwa obiektu"
                placeholderTextColor="#64748b"
              />
            ) : (
              <ThemedText style={styles.fieldValue}>{club.location || 'Nie podano'}</ThemedText>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Opis klubu</ThemedText>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Krótki opis klubu..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={4}
              />
            ) : (
              <ThemedText style={styles.fieldValue}>{club.description || 'Brak opisu'}</ThemedText>
            )}
          </View>
        </View>

        {/* Club Stats */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Statystyki klubu</ThemedText>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#3b82f6" />
              <ThemedText style={styles.statValue}>0</ThemedText>
              <ThemedText style={styles.statLabel}>Zawodników</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="football" size={24} color="#22c55e" />
              <ThemedText style={styles.statValue}>0</ThemedText>
              <ThemedText style={styles.statLabel}>Meczów</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="fitness" size={24} color="#f59e0b" />
              <ThemedText style={styles.statValue}>0</ThemedText>
              <ThemedText style={styles.statLabel}>Treningów</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="school" size={24} color="#ec4899" />
              <ThemedText style={styles.statValue}>0</ThemedText>
              <ThemedText style={styles.statLabel}>W szkółce</ThemedText>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Strefa niebezpieczna</ThemedText>
          
          <Pressable style={styles.dangerButton}>
            <Ionicons name="trash" size={20} color="#ef4444" />
            <ThemedText style={styles.dangerButtonText}>Usuń klub</ThemedText>
          </Pressable>
          <ThemedText style={styles.dangerHint}>
            Usunięcie klubu jest nieodwracalne. Wszystkie dane zostaną trwale usunięte.
          </ThemedText>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 15,
    color: '#22c55e',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  clubLogo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeLogoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  changeLogoText: {
    fontSize: 14,
    color: '#22c55e',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fieldGroup: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#fff',
  },
  input: {
    fontSize: 16,
    color: '#fff',
    padding: 0,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  dangerHint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 16,
  },
  backButtonLarge: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#22c55e',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});
