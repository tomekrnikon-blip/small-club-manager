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
import { useAuth } from '@/hooks/use-auth';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      Alert.alert('Sukces', 'Profil został zaktualizowany');
    }, 500);
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Profil</ThemedText>
        <Pressable 
          onPress={() => isEditing ? handleSave() : setIsEditing(true)} 
          style={styles.editButton}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#22c55e" />
          ) : (
            <ThemedText style={styles.editButtonText}>
              {isEditing ? 'Zapisz' : 'Edytuj'}
            </ThemedText>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color="#22c55e" />
          </View>
          {isEditing && (
            <Pressable style={styles.changeAvatarButton}>
              <Ionicons name="camera" size={16} color="#22c55e" />
              <ThemedText style={styles.changeAvatarText}>Zmień zdjęcie</ThemedText>
            </Pressable>
          )}
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Informacje</ThemedText>
          
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Imię i nazwisko</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Twoje imię i nazwisko"
                placeholderTextColor="#64748b"
              />
            ) : (
              <ThemedText style={styles.fieldValue}>{user?.name || 'Nie podano'}</ThemedText>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Email</ThemedText>
            <ThemedText style={styles.fieldValue}>{user?.email || 'Nie podano'}</ThemedText>
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>ID użytkownika</ThemedText>
            <ThemedText style={styles.fieldValueMuted}>{user?.openId || 'N/A'}</ThemedText>
          </View>
        </View>

        {/* Account Status */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Status konta</ThemedText>
          
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <ThemedText style={styles.statusLabel}>Typ konta</ThemedText>
              <View style={[styles.badge, user?.isPro ? styles.badgePro : styles.badgeFree]}>
                <Ionicons 
                  name={user?.isPro ? 'star' : 'person'} 
                  size={14} 
                  color="#fff" 
                />
                <ThemedText style={styles.badgeText}>
                  {user?.isPro ? 'PRO' : 'Darmowe'}
                </ThemedText>
              </View>
            </View>
            
            {user?.isMasterAdmin && (
              <View style={styles.statusRow}>
                <ThemedText style={styles.statusLabel}>Rola</ThemedText>
                <View style={[styles.badge, styles.badgeAdmin]}>
                  <Ionicons name="shield" size={14} color="#fff" />
                  <ThemedText style={styles.badgeText}>Master Admin</ThemedText>
                </View>
              </View>
            )}
          </View>

          {!user?.isPro && (
            <Pressable 
              style={styles.upgradeButton}
              onPress={() => router.push('/subscription' as any)}
            >
              <Ionicons name="rocket" size={20} color="#fff" />
              <ThemedText style={styles.upgradeButtonText}>Przejdź na PRO</ThemedText>
            </Pressable>
          )}
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Bezpieczeństwo</ThemedText>
          
          <Pressable style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="key" size={20} color="#94a3b8" />
            </View>
            <ThemedText style={styles.menuLabel}>Zmień hasło</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </Pressable>
          
          <Pressable style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="shield-checkmark" size={20} color="#94a3b8" />
            </View>
            <ThemedText style={styles.menuLabel}>Weryfikacja dwuetapowa</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </Pressable>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Strefa niebezpieczna</ThemedText>
          
          <Pressable style={styles.dangerButton}>
            <Ionicons name="trash" size={20} color="#ef4444" />
            <ThemedText style={styles.dangerButtonText}>Usuń konto</ThemedText>
          </Pressable>
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  changeAvatarText: {
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
  fieldValueMuted: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  input: {
    fontSize: 16,
    color: '#fff',
    padding: 0,
  },
  statusCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 15,
    color: '#94a3b8',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeFree: {
    backgroundColor: '#64748b',
  },
  badgePro: {
    backgroundColor: '#22c55e',
  },
  badgeAdmin: {
    backgroundColor: '#8b5cf6',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#e2e8f0',
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
});
