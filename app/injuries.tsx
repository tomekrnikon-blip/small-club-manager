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

const INJURY_TYPES = [
  'Skręcenie kostki',
  'Naciągnięcie mięśnia',
  'Kontuzja kolana',
  'Uraz głowy',
  'Złamanie',
  'Stłuczenie',
  'Inne',
];

interface Injury {
  id: number;
  playerId: number;
  playerName: string;
  type: string;
  description: string;
  startDate: string;
  expectedReturn: string;
  status: 'active' | 'recovered';
}

export default function InjuriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [injuryType, setInjuryType] = useState('');
  const [description, setDescription] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'recovered'>('active');

  // Placeholder injuries data
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get first club
  const { data: clubs } = trpc.clubs.list.useQuery();
  const clubId = clubs?.[0]?.id;

  // Get players
  const { data: players } = trpc.players.list.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId }
  );

  const handleAddInjury = () => {
    if (!selectedPlayer || !injuryType) return;
    
    const player = players?.find((p: any) => p.id === selectedPlayer);
    
    const newInjury: Injury = {
      id: Date.now(),
      playerId: selectedPlayer,
      playerName: player?.name || 'Nieznany',
      type: injuryType,
      description,
      startDate: new Date().toISOString(),
      expectedReturn,
      status: 'active',
    };
    
    setInjuries(prev => [...prev, newInjury]);
    setShowAddModal(false);
    setSelectedPlayer(null);
    setInjuryType('');
    setDescription('');
    setExpectedReturn('');
    Alert.alert('Sukces', 'Kontuzja została dodana');
  };

  const handleMarkRecovered = (injuryId: number) => {
    Alert.alert(
      'Oznacz jako wyleczoną',
      'Czy zawodnik wrócił do pełnej sprawności?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Tak',
          onPress: () => {
            setInjuries(prev => prev.map(i => 
              i.id === injuryId ? { ...i, status: 'recovered' as const } : i
            ));
          },
        },
      ]
    );
  };

  const filteredInjuries = injuries.filter(i => {
    if (filter === 'all') return true;
    return i.status === filter;
  });

  const activeCount = injuries.filter(i => i.status === 'active').length;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Kontuzje</ThemedText>
        <Pressable onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#22c55e" />
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="medkit" size={24} color="#ef4444" />
          </View>
          <ThemedText style={styles.statValue}>{activeCount}</ThemedText>
          <ThemedText style={styles.statLabel}>Aktywne</ThemedText>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          </View>
          <ThemedText style={styles.statValue}>
            {injuries.filter(i => i.status === 'recovered').length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Wyleczone</ThemedText>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['active', 'recovered', 'all'] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <ThemedText style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'active' ? 'Aktywne' : f === 'recovered' ? 'Wyleczone' : 'Wszystkie'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Injuries List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filteredInjuries.length > 0 ? (
            filteredInjuries.map((injury) => (
              <View key={injury.id} style={styles.injuryCard}>
                <View style={styles.injuryHeader}>
                  <View style={[
                    styles.statusIndicator,
                    injury.status === 'active' ? styles.statusActive : styles.statusRecovered
                  ]} />
                  <View style={styles.injuryInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.playerName}>
                      {injury.playerName}
                    </ThemedText>
                    <ThemedText style={styles.injuryType}>{injury.type}</ThemedText>
                  </View>
                  {injury.status === 'active' && (
                    <Pressable
                      onPress={() => handleMarkRecovered(injury.id)}
                      style={styles.recoverButton}
                    >
                      <Ionicons name="checkmark" size={20} color="#22c55e" />
                    </Pressable>
                  )}
                </View>
                {injury.description && (
                  <ThemedText style={styles.injuryDescription}>{injury.description}</ThemedText>
                )}
                <View style={styles.injuryDates}>
                  <View style={styles.dateItem}>
                    <Ionicons name="calendar-outline" size={14} color="#64748b" />
                    <ThemedText style={styles.dateText}>
                      Od: {new Date(injury.startDate).toLocaleDateString('pl-PL')}
                    </ThemedText>
                  </View>
                  {injury.expectedReturn && (
                    <View style={styles.dateItem}>
                      <Ionicons name="time-outline" size={14} color="#64748b" />
                      <ThemedText style={styles.dateText}>
                        Powrót: {injury.expectedReturn}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="medkit-outline" size={64} color="#64748b" />
              <ThemedText style={styles.emptyText}>Brak kontuzji</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                {filter === 'active' ? 'Wszyscy zawodnicy są zdrowi!' : 'Brak zapisanych kontuzji'}
              </ThemedText>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Injury Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  Dodaj kontuzję
                </ThemedText>
                <Pressable onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color="#94a3b8" />
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Zawodnik</ThemedText>
                <Pressable
                  style={styles.selectButton}
                  onPress={() => setShowPlayerPicker(!showPlayerPicker)}
                >
                  <ThemedText style={styles.selectText}>
                    {selectedPlayer 
                      ? players?.find((p: any) => p.id === selectedPlayer)?.name 
                      : 'Wybierz zawodnika'}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                </Pressable>
                {showPlayerPicker && (
                  <View style={styles.pickerOptions}>
                    {players?.map((player: any) => (
                      <Pressable
                        key={player.id}
                        style={[
                          styles.pickerOption,
                          selectedPlayer === player.id && styles.pickerOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedPlayer(player.id);
                          setShowPlayerPicker(false);
                        }}
                      >
                        <ThemedText style={[
                          styles.pickerOptionText,
                          selectedPlayer === player.id && styles.pickerOptionTextSelected,
                        ]}>
                          {player.name}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Rodzaj kontuzji</ThemedText>
                <Pressable
                  style={styles.selectButton}
                  onPress={() => setShowTypePicker(!showTypePicker)}
                >
                  <ThemedText style={styles.selectText}>
                    {injuryType || 'Wybierz rodzaj'}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                </Pressable>
                {showTypePicker && (
                  <View style={styles.pickerOptions}>
                    {INJURY_TYPES.map((type) => (
                      <Pressable
                        key={type}
                        style={[
                          styles.pickerOption,
                          injuryType === type && styles.pickerOptionSelected,
                        ]}
                        onPress={() => {
                          setInjuryType(type);
                          setShowTypePicker(false);
                        }}
                      >
                        <ThemedText style={[
                          styles.pickerOptionText,
                          injuryType === type && styles.pickerOptionTextSelected,
                        ]}>
                          {type}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Opis (opcjonalnie)</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Szczegóły kontuzji..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Przewidywany powrót</ThemedText>
                <TextInput
                  style={styles.input}
                  value={expectedReturn}
                  onChangeText={setExpectedReturn}
                  placeholder="np. 2-3 tygodnie"
                  placeholderTextColor="#64748b"
                />
              </View>

              <Pressable
                style={[styles.submitButton, (!selectedPlayer || !injuryType) && styles.submitButtonDisabled]}
                onPress={handleAddInjury}
                disabled={!selectedPlayer || !injuryType}
              >
                <ThemedText style={styles.submitButtonText}>Dodaj kontuzję</ThemedText>
              </Pressable>
            </View>
          </ScrollView>
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
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
  },
  filterTabActive: {
    backgroundColor: '#22c55e',
  },
  filterTabText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  filterTabTextActive: {
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
  injuryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  injuryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusActive: {
    backgroundColor: '#ef4444',
  },
  statusRecovered: {
    backgroundColor: '#22c55e',
  },
  injuryInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    color: '#fff',
  },
  injuryType: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  recoverButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  injuryDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  injuryDates: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
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
  },
  modalScroll: {
    flex: 1,
    marginTop: 100,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    minHeight: 500,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
    maxHeight: 200,
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
