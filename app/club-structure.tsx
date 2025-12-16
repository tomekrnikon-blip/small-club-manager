import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { trpc } from '@/lib/trpc';

const ROLES = [
  { id: 'manager', name: 'Manager', description: 'Pełny dostęp, może usuwać użytkowników', icon: 'shield' },
  { id: 'board_member', name: 'Członek Zarządu', description: 'Dostęp bez finansów', icon: 'briefcase' },
  { id: 'board_finance', name: 'Zarząd - Finanse', description: 'Dostęp z finansami', icon: 'cash' },
  { id: 'coach', name: 'Trener', description: 'Edycja zawodników i meczów', icon: 'fitness' },
  { id: 'player', name: 'Zawodnik', description: 'Tylko podgląd', icon: 'person' },
];

export default function ClubStructureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('player');
  const [showRolePicker, setShowRolePicker] = useState(false);

  // Get first club
  const { data: clubs } = trpc.clubs.list.useQuery();
  const clubId = clubs?.[0]?.id;

  // Placeholder for invitations - feature to be implemented
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const refetch = () => {
    // Placeholder refetch
  };

  const handleInvite = () => {
    if (!inviteEmail.trim() || !clubId) return;
    setIsPending(true);
    // Simulate invitation (feature to be implemented with backend)
    setTimeout(() => {
      setInvitations(prev => [...prev, {
        id: Date.now(),
        email: inviteEmail.trim(),
        role: selectedRole,
        status: 'pending',
      }]);
      setShowInviteModal(false);
      setInviteEmail('');
      setSelectedRole('player');
      setIsPending(false);
      Alert.alert('Sukces', 'Zaproszenie zostało wysłane');
    }, 500);
  };

  const handleRevoke = (invitationId: number) => {
    Alert.alert(
      'Anuluj zaproszenie',
      'Czy na pewno chcesz anulować to zaproszenie?',
      [
        { text: 'Nie', style: 'cancel' },
        {
          text: 'Tak',
          style: 'destructive',
          onPress: () => setInvitations(prev => prev.filter(i => i.id !== invitationId)),
        },
      ]
    );
  };

  const getRoleInfo = (roleId: string) => {
    return ROLES.find(r => r.id === roleId) || ROLES[4];
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Struktura Klubu</ThemedText>
        <Pressable onPress={() => setShowInviteModal(true)} style={styles.addButton}>
          <Ionicons name="person-add" size={22} color="#22c55e" />
        </Pressable>
      </View>

      {/* Roles Legend */}
      <View style={styles.rolesSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Role w klubie</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rolesScroll}>
          {ROLES.map((role) => (
            <View key={role.id} style={styles.roleCard}>
              <View style={styles.roleIcon}>
                <Ionicons name={role.icon as any} size={20} color="#22c55e" />
              </View>
              <ThemedText style={styles.roleName}>{role.name}</ThemedText>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Members List */}
      <View style={styles.membersSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Zaproszenia</ThemedText>
        
        {isLoading ? (
          <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
            {invitations && invitations.length > 0 ? (
              invitations.map((invitation: any) => {
                const roleInfo = getRoleInfo(invitation.role);
                return (
                  <View key={invitation.id} style={styles.memberCard}>
                    <View style={styles.memberAvatar}>
                      <Ionicons name={roleInfo.icon as any} size={24} color="#22c55e" />
                    </View>
                    <View style={styles.memberInfo}>
                      <ThemedText style={styles.memberEmail}>{invitation.email}</ThemedText>
                      <ThemedText style={styles.memberRole}>{roleInfo.name}</ThemedText>
                      <View style={[
                        styles.statusBadge,
                        invitation.status === 'pending' ? styles.statusPending : styles.statusAccepted
                      ]}>
                        <ThemedText style={styles.statusText}>
                          {invitation.status === 'pending' ? 'Oczekuje' : 'Zaakceptowane'}
                        </ThemedText>
                      </View>
                    </View>
                    {invitation.status === 'pending' && (
                      <Pressable
                        onPress={() => handleRevoke(invitation.id)}
                        style={styles.revokeButton}
                      >
                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                      </Pressable>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="#64748b" />
                <ThemedText style={styles.emptyText}>Brak zaproszeń</ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  Zaproś członków do swojego klubu
                </ThemedText>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Zaproś do klubu
              </ThemedText>
              <Pressable onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Adres email</ThemedText>
              <TextInput
                style={styles.input}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="email@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Rola</ThemedText>
              <Pressable
                style={styles.selectButton}
                onPress={() => setShowRolePicker(!showRolePicker)}
              >
                <ThemedText style={styles.selectText}>
                  {getRoleInfo(selectedRole).name}
                </ThemedText>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </Pressable>
              {showRolePicker && (
                <View style={styles.pickerOptions}>
                  {ROLES.map((role) => (
                    <Pressable
                      key={role.id}
                      style={[
                        styles.pickerOption,
                        selectedRole === role.id && styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedRole(role.id);
                        setShowRolePicker(false);
                      }}
                    >
                      <View style={styles.pickerOptionContent}>
                        <Ionicons name={role.icon as any} size={20} color={selectedRole === role.id ? '#22c55e' : '#94a3b8'} />
                        <View style={styles.pickerOptionText}>
                          <ThemedText style={[
                            styles.pickerOptionName,
                            selectedRole === role.id && styles.pickerOptionNameSelected,
                          ]}>
                            {role.name}
                          </ThemedText>
                          <ThemedText style={styles.pickerOptionDesc}>
                            {role.description}
                          </ThemedText>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Pressable
              style={[styles.submitButton, !inviteEmail.trim() && styles.submitButtonDisabled]}
              onPress={handleInvite}
              disabled={!inviteEmail.trim() || isPending}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Wyślij zaproszenie</ThemedText>
              )}
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
  rolesSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  rolesScroll: {
    flexDirection: 'row',
  },
  roleCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  roleName: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  membersSection: {
    flex: 1,
    padding: 16,
  },
  membersList: {
    flex: 1,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberEmail: {
    fontSize: 15,
    color: '#fff',
  },
  memberRole: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  statusPending: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  statusAccepted: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusText: {
    fontSize: 11,
    color: '#fbbf24',
  },
  revokeButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectText: {
    fontSize: 16,
    color: '#fff',
  },
  pickerOptions: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: 300,
  },
  pickerOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  pickerOptionSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  pickerOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerOptionText: {
    marginLeft: 12,
  },
  pickerOptionName: {
    fontSize: 15,
    color: '#fff',
  },
  pickerOptionNameSelected: {
    color: '#22c55e',
  },
  pickerOptionDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
