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
import { Colors } from '@/constants/theme';
import { trpc } from '@/lib/trpc';

const AGE_GROUPS = [
  'Seniorzy',
  'Juniorzy Starsi (U19)',
  'Juniorzy Młodsi (U17)',
  'Trampkarze (U15)',
  'Młodziki (U13)',
  'Orliki (U11)',
  'Żaki (U9)',
  'Szkółka',
];

export default function TeamsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [ageGroup, setAgeGroup] = useState('Seniorzy');
  const [showAgeGroupPicker, setShowAgeGroupPicker] = useState(false);

  // Get first club
  const { data: clubs } = trpc.clubs.list.useQuery();
  const clubId = clubs?.[0]?.id;

  const { data: teams, isLoading, refetch } = trpc.teams.list.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId }
  );

  const createTeam = trpc.teams.create.useMutation({
    onSuccess: () => {
      setShowAddModal(false);
      setTeamName('');
      setAgeGroup('Seniorzy');
      refetch();
    },
    onError: (error) => {
      Alert.alert('Błąd', error.message);
    },
  });

  const deleteTeam = trpc.teams.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleAddTeam = () => {
    if (!teamName.trim() || !clubId) return;
    createTeam.mutate({
      clubId,
      name: teamName.trim(),
      ageGroup,
    });
  };

  const handleDeleteTeam = (teamId: number, teamName: string) => {
    Alert.alert(
      'Usuń drużynę',
      `Czy na pewno chcesz usunąć drużynę "${teamName}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => deleteTeam.mutate({ id: teamId }),
        },
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Zespoły</ThemedText>
        <Pressable onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#22c55e" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {teams && teams.length > 0 ? (
            teams.map((team: any) => (
              <Pressable
                key={team.id}
                style={styles.teamCard}
                onPress={() => router.push(`/team/${team.id}` as any)}
              >
                <View style={styles.teamIcon}>
                  <Ionicons name="people" size={28} color="#22c55e" />
                </View>
                <View style={styles.teamInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.teamName}>
                    {team.name}
                  </ThemedText>
                  <ThemedText style={styles.teamAgeGroup}>
                    {team.ageGroup || 'Brak kategorii'}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => handleDeleteTeam(team.id, team.name)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </Pressable>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#64748b" />
              <ThemedText style={styles.emptyText}>Brak zespołów</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Dodaj pierwszy zespół, aby rozpocząć
              </ThemedText>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Team Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Nowy zespół
              </ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Nazwa zespołu</ThemedText>
              <TextInput
                style={styles.input}
                value={teamName}
                onChangeText={setTeamName}
                placeholder="np. Pierwsza Drużyna"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Kategoria wiekowa</ThemedText>
              <Pressable
                style={styles.selectButton}
                onPress={() => setShowAgeGroupPicker(!showAgeGroupPicker)}
              >
                <ThemedText style={styles.selectText}>{ageGroup}</ThemedText>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </Pressable>
              {showAgeGroupPicker && (
                <View style={styles.pickerOptions}>
                  {AGE_GROUPS.map((group) => (
                    <Pressable
                      key={group}
                      style={[
                        styles.pickerOption,
                        ageGroup === group && styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setAgeGroup(group);
                        setShowAgeGroupPicker(false);
                      }}
                    >
                      <ThemedText
                        style={[
                          styles.pickerOptionText,
                          ageGroup === group && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {group}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Pressable
              style={[styles.submitButton, !teamName.trim() && styles.submitButtonDisabled]}
              onPress={handleAddTeam}
              disabled={!teamName.trim() || createTeam.isPending}
            >
              {createTeam.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Dodaj zespół</ThemedText>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInfo: {
    flex: 1,
    marginLeft: 12,
  },
  teamName: {
    fontSize: 16,
    color: '#fff',
  },
  teamAgeGroup: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
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
  },
  pickerOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  pickerOptionSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#94a3b8',
  },
  pickerOptionTextSelected: {
    color: '#22c55e',
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
