import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

interface AbsentPlayer {
  id: number;
  firstName: string;
  lastName: string;
  parentEmail?: string | null;
  parentPhone?: string | null;
  reason?: string;
}

export default function ParentNotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [selectedEvent, setSelectedEvent] = useState<{
    type: 'training' | 'match';
    id: number;
    name: string;
    date: Date;
  } | null>(null);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [autoNotify, setAutoNotify] = useState(false);
  const [notifyDelay, setNotifyDelay] = useState('60');

  // Get club
  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  // Fetch data
  const { data: players, isLoading: loadingPlayers } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );
  const { data: matches, isLoading: loadingMatches } = trpc.matches.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );
  const { data: trainings, isLoading: loadingTrainings } = trpc.trainings.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const isLoading = loadingPlayers || loadingMatches || loadingTrainings;

  // Get recent events (past 7 days)
  const recentEvents = useMemo(() => {
    if (!matches || !trainings) return [];
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const events = [
      ...matches
        .filter((m: any) => {
          const date = new Date(m.matchDate);
          return date >= weekAgo && date <= now;
        })
        .map((m: any) => ({
          type: 'match' as const,
          id: m.id,
          name: `vs ${m.opponent}`,
          date: new Date(m.matchDate),
        })),
      ...trainings
        .filter((t: any) => {
          const date = new Date(t.trainingDate);
          return date >= weekAgo && date <= now;
        })
        .map((t: any) => ({
          type: 'training' as const,
          id: t.id,
          name: t.location || 'Trening',
          date: new Date(t.trainingDate),
        })),
    ];
    
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [matches, trainings]);

  // Mock absent players - in real app, this would come from attendance records
  const absentPlayers = useMemo((): AbsentPlayer[] => {
    if (!players || !selectedEvent) return [];
    
    // For demo, randomly select some players as absent
    return players
      .filter((_: any, i: number) => i % 3 === 0)
      .map((p: any) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        parentEmail: p.parentEmail,
        parentPhone: p.parentPhone,
      }));
  }, [players, selectedEvent]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const togglePlayer = (playerId: number) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const selectAllPlayers = () => {
    if (selectedPlayers.length === absentPlayers.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(absentPlayers.map(p => p.id));
    }
  };

  const handleSendNotifications = async () => {
    if (!selectedEvent || selectedPlayers.length === 0) {
      Alert.alert('Błąd', 'Wybierz wydarzenie i co najmniej jednego zawodnika');
      return;
    }

    Alert.alert(
      'Potwierdź wysyłkę',
      `Czy na pewno chcesz wysłać powiadomienia do rodziców ${selectedPlayers.length} zawodników?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyślij',
          onPress: async () => {
            setSending(true);
            try {
              // In real app, this would call the API
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              Alert.alert(
                'Sukces',
                `Wysłano ${selectedPlayers.length} powiadomień do rodziców`,
                [{ text: 'OK', onPress: () => setSelectedPlayers([]) }]
              );
            } catch (error) {
              Alert.alert('Błąd', 'Nie udało się wysłać powiadomień');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  const hasContactInfo = (player: AbsentPlayer) => {
    return !!(player.parentEmail || player.parentPhone);
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <ThemedText style={styles.loadingText}>Ładowanie danych...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Powiadomienia dla rodziców</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Settings Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Ustawienia automatyczne</ThemedText>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="notifications-active" size={24} color={AppColors.primary} />
              <View style={styles.settingText}>
                <ThemedText style={styles.settingLabel}>Automatyczne powiadomienia</ThemedText>
                <ThemedText style={styles.settingDesc}>
                  Wysyłaj automatycznie po zakończeniu wydarzenia
                </ThemedText>
              </View>
            </View>
            <Switch
              value={autoNotify}
              onValueChange={setAutoNotify}
              trackColor={{ false: '#3e3e3e', true: AppColors.primary + '50' }}
              thumbColor={autoNotify ? AppColors.primary : '#f4f3f4'}
            />
          </View>

          {autoNotify && (
            <View style={styles.delayInput}>
              <ThemedText style={styles.inputLabel}>Opóźnienie (minuty):</ThemedText>
              <TextInput
                style={styles.input}
                value={notifyDelay}
                onChangeText={setNotifyDelay}
                keyboardType="numeric"
                placeholder="60"
                placeholderTextColor="#64748b"
              />
            </View>
          )}
        </View>

        {/* Event Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Wybierz wydarzenie</ThemedText>
          
          <Pressable 
            style={styles.eventSelector}
            onPress={() => setShowEventPicker(true)}
          >
            {selectedEvent ? (
              <View style={styles.selectedEvent}>
                <View style={[
                  styles.eventBadge,
                  { backgroundColor: selectedEvent.type === 'match' ? '#a855f7' : '#f59e0b' }
                ]}>
                  <MaterialIcons 
                    name={selectedEvent.type === 'match' ? 'sports-soccer' : 'fitness-center'} 
                    size={16} 
                    color="#fff" 
                  />
                </View>
                <View style={styles.eventInfo}>
                  <ThemedText style={styles.eventName}>{selectedEvent.name}</ThemedText>
                  <ThemedText style={styles.eventDate}>{formatDate(selectedEvent.date)}</ThemedText>
                </View>
              </View>
            ) : (
              <View style={styles.placeholderEvent}>
                <MaterialIcons name="event" size={24} color="#64748b" />
                <ThemedText style={styles.placeholderText}>Wybierz wydarzenie</ThemedText>
              </View>
            )}
            <MaterialIcons name="chevron-right" size={24} color="#64748b" />
          </Pressable>
        </View>

        {/* Absent Players */}
        {selectedEvent && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                Nieobecni zawodnicy ({absentPlayers.length})
              </ThemedText>
              <Pressable onPress={selectAllPlayers}>
                <ThemedText style={styles.selectAllBtn}>
                  {selectedPlayers.length === absentPlayers.length ? 'Odznacz wszystko' : 'Zaznacz wszystko'}
                </ThemedText>
              </Pressable>
            </View>

            {absentPlayers.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="check-circle" size={48} color="#22c55e" />
                <ThemedText style={styles.emptyText}>Wszyscy obecni!</ThemedText>
              </View>
            ) : (
              absentPlayers.map(player => (
                <Pressable
                  key={player.id}
                  style={[
                    styles.playerRow,
                    selectedPlayers.includes(player.id) && styles.playerRowSelected,
                  ]}
                  onPress={() => togglePlayer(player.id)}
                >
                  <View style={styles.checkbox}>
                    {selectedPlayers.includes(player.id) ? (
                      <MaterialIcons name="check-box" size={24} color={AppColors.primary} />
                    ) : (
                      <MaterialIcons name="check-box-outline-blank" size={24} color="#64748b" />
                    )}
                  </View>
                  <View style={styles.playerInfo}>
                    <ThemedText style={styles.playerName}>
                      {player.firstName} {player.lastName}
                    </ThemedText>
                    <View style={styles.contactInfo}>
                      {player.parentEmail && (
                        <View style={styles.contactBadge}>
                          <MaterialIcons name="email" size={12} color="#64748b" />
                          <ThemedText style={styles.contactText}>Email</ThemedText>
                        </View>
                      )}
                      {player.parentPhone && (
                        <View style={styles.contactBadge}>
                          <MaterialIcons name="phone" size={12} color="#64748b" />
                          <ThemedText style={styles.contactText}>SMS</ThemedText>
                        </View>
                      )}
                      {!hasContactInfo(player) && (
                        <View style={[styles.contactBadge, { backgroundColor: '#ef4444' + '20' }]}>
                          <MaterialIcons name="warning" size={12} color="#ef4444" />
                          <ThemedText style={[styles.contactText, { color: '#ef4444' }]}>
                            Brak kontaktu
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* Send Button */}
        {selectedEvent && absentPlayers.length > 0 && (
          <Pressable
            style={[
              styles.sendButton,
              (selectedPlayers.length === 0 || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendNotifications}
            disabled={selectedPlayers.length === 0 || sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="send" size={20} color="#fff" />
                <ThemedText style={styles.sendButtonText}>
                  Wyślij powiadomienia ({selectedPlayers.length})
                </ThemedText>
              </>
            )}
          </Pressable>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={20} color="#3b82f6" />
          <ThemedText style={styles.infoText}>
            Powiadomienia zostaną wysłane do rodziców za pomocą preferowanego kanału 
            (SMS, email lub powiadomienie w aplikacji). Upewnij się, że dane kontaktowe 
            rodziców są aktualne w profilu zawodnika.
          </ThemedText>
        </View>
      </ScrollView>

      {/* Event Picker Modal */}
      <Modal
        visible={showEventPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Wybierz wydarzenie</ThemedText>
              <Pressable onPress={() => setShowEventPicker(false)}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <FlatList
              data={recentEvents}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.eventOption}
                  onPress={() => {
                    setSelectedEvent(item);
                    setShowEventPicker(false);
                    setSelectedPlayers([]);
                  }}
                >
                  <View style={[
                    styles.eventBadge,
                    { backgroundColor: item.type === 'match' ? '#a855f7' : '#f59e0b' }
                  ]}>
                    <MaterialIcons 
                      name={item.type === 'match' ? 'sports-soccer' : 'fitness-center'} 
                      size={16} 
                      color="#fff" 
                    />
                  </View>
                  <View style={styles.eventInfo}>
                    <ThemedText style={styles.eventName}>{item.name}</ThemedText>
                    <ThemedText style={styles.eventDate}>{formatDate(item.date)}</ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#64748b" />
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialIcons name="event-busy" size={48} color="#64748b" />
                  <ThemedText style={styles.emptyText}>
                    Brak wydarzeń z ostatnich 7 dni
                  </ThemedText>
                </View>
              }
            />
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
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
  loadingText: {
    marginTop: Spacing.md,
    color: "#64748b",
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  selectAllBtn: {
    fontSize: 13,
    color: AppColors.primary,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  settingDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  delayInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    color: "#94a3b8",
  },
  input: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    color: "#fff",
    fontSize: 14,
  },
  eventSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  selectedEvent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  placeholderEvent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  placeholderText: {
    fontSize: 14,
    color: "#64748b",
  },
  eventBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  eventDate: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  playerRowSelected: {
    backgroundColor: AppColors.primary + '20',
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  checkbox: {
    marginRight: Spacing.sm,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  contactInfo: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: 4,
  },
  contactBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0f172a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  contactText: {
    fontSize: 10,
    color: "#64748b",
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sendButtonDisabled: {
    backgroundColor: "#334155",
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  infoBox: {
    flexDirection: "row",
    gap: Spacing.sm,
    backgroundColor: "#1e3a5f",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  eventOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    gap: Spacing.sm,
  },
});
