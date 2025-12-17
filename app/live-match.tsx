import { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

type EventType = "goal" | "assist" | "yellow_card" | "red_card" | "substitution_in" | "substitution_out" | "save" | "injury";
type HalfType = "first" | "second" | "extra_first" | "extra_second" | "penalties";

type MatchEvent = {
  id: number;
  type: EventType;
  playerId: number;
  playerName: string;
  minute: number;
  half: HalfType;
  assistPlayerId?: number;
  assistPlayerName?: string;
};

export default function LiveMatchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const utils = trpc.useUtils();
  
  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [half, setHalf] = useState<HalfType>("first");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Events state
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [pendingEventType, setPendingEventType] = useState<EventType | null>(null);
  const [showAssistModal, setShowAssistModal] = useState(false);
  const [pendingGoalEvent, setPendingGoalEvent] = useState<{ playerId: number; playerName: string } | null>(null);
  
  // Score
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  
  const { data: clubs } = trpc.clubs.list.useQuery();
  const clubId = clubs?.[0]?.id;
  
  const { data: match } = trpc.matches.get.useQuery(
    { id: parseInt(matchId || "0") },
    { enabled: !!matchId }
  );
  
  const { data: players } = trpc.players.list.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId }
  );
  
  // Load existing events from database
  const { data: existingEvents, isLoading: loadingEvents } = trpc.matches.getEvents.useQuery(
    { matchId: parseInt(matchId || "0") },
    { enabled: !!matchId }
  );
  
  // Mutations for database operations
  const addEventMutation = trpc.matches.addEvent.useMutation({
    onSuccess: () => {
      utils.matches.getEvents.invalidate({ matchId: parseInt(matchId || "0") });
    },
  });
  
  const updateMatchMutation = trpc.matches.update.useMutation();
  
  // Initialize from existing events
  useEffect(() => {
    if (existingEvents && players) {
      const mappedEvents: MatchEvent[] = existingEvents.map((e: any) => {
        const player = players.find(p => p.id === e.playerId);
        const assistPlayer = e.assistPlayerId ? players.find(p => p.id === e.assistPlayerId) : null;
        return {
          id: e.id,
          type: e.eventType as EventType,
          playerId: e.playerId || 0,
          playerName: player?.name || "Nieznany",
          minute: e.minute,
          half: e.half as HalfType,
          assistPlayerId: e.assistPlayerId,
          assistPlayerName: assistPlayer?.name,
        };
      });
      setEvents(mappedEvents);
      
      // Calculate score from events
      const goals = mappedEvents.filter(e => e.type === "goal").length;
      setHomeScore(goals);
    }
    
    // Initialize score from match data
    if (match) {
      setHomeScore(match.goalsScored || 0);
      setAwayScore(match.goalsConceded || 0);
    }
  }, [existingEvents, players, match]);
  
  // Timer logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);
  
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
  const getCurrentMinute = () => {
    const baseMinute = half === "first" ? 0 : half === "second" ? 45 : 90;
    return baseMinute + Math.floor(seconds / 60) + 1;
  };
  
  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(!isRunning);
  };
  
  const startSecondHalf = () => {
    Alert.alert(
      "Druga połowa",
      "Czy chcesz rozpocząć drugą połowę?",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Rozpocznij",
          onPress: () => {
            setHalf("second");
            setSeconds(0);
            setIsRunning(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };
  
  const endMatch = () => {
    Alert.alert(
      "Zakończ mecz",
      `Wynik końcowy: ${homeScore} - ${awayScore}\nCzy na pewno chcesz zakończyć mecz?`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Zakończ",
          style: "destructive",
          onPress: async () => {
            setIsRunning(false);
            
            // Save final score to database
            if (matchId) {
              try {
                await updateMatchMutation.mutateAsync({
                  id: parseInt(matchId),
                  goalsScored: homeScore,
                  goalsConceded: awayScore,
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Mecz zakończony", "Statystyki zostały zapisane do bazy danych.");
              } catch (error) {
                Alert.alert("Błąd", "Nie udało się zapisać wyniku meczu.");
              }
            }
            router.back();
          },
        },
      ]
    );
  };
  
  const addEvent = (type: EventType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingEventType(type);
    setShowPlayerModal(true);
  };
  
  const confirmEvent = async (playerId: number, playerName: string) => {
    if (!pendingEventType || !matchId) return;
    
    // For goals, ask for assist
    if (pendingEventType === "goal") {
      setPendingGoalEvent({ playerId, playerName });
      setShowPlayerModal(false);
      setShowAssistModal(true);
      return;
    }
    
    await saveEventToDatabase(pendingEventType, playerId, playerName);
  };
  
  const confirmGoalWithAssist = async (assistPlayerId?: number, assistPlayerName?: string) => {
    if (!pendingGoalEvent || !matchId) return;
    
    await saveEventToDatabase(
      "goal",
      pendingGoalEvent.playerId,
      pendingGoalEvent.playerName,
      assistPlayerId,
      assistPlayerName
    );
    
    // Also save assist event if provided
    if (assistPlayerId && assistPlayerName) {
      await saveEventToDatabase(
        "assist",
        assistPlayerId,
        assistPlayerName
      );
    }
    
    setShowAssistModal(false);
    setPendingGoalEvent(null);
  };
  
  const saveEventToDatabase = async (
    type: EventType,
    playerId: number,
    playerName: string,
    assistPlayerId?: number,
    assistPlayerName?: string
  ) => {
    const minute = getCurrentMinute();
    
    try {
      const result = await addEventMutation.mutateAsync({
        matchId: parseInt(matchId!),
        playerId,
        assistPlayerId,
        eventType: type,
        minute,
        half,
      });
      
      const newEvent: MatchEvent = {
        id: result.id,
        type,
        playerId,
        playerName,
        minute,
        half,
        assistPlayerId,
        assistPlayerName,
      };
      
      setEvents(prev => [newEvent, ...prev]);
      
      // Update score for goals
      if (type === "goal") {
        const newScore = homeScore + 1;
        setHomeScore(newScore);
        
        // Update match score in database
        await updateMatchMutation.mutateAsync({
          id: parseInt(matchId!),
          goalsScored: newScore,
        });
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setShowPlayerModal(false);
      setPendingEventType(null);
      
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się zapisać wydarzenia.");
    }
  };
  
  const getEventIcon = (type: EventType) => {
    switch (type) {
      case "goal": return "⚽";
      case "assist": return "🎯";
      case "yellow_card": return "🟨";
      case "red_card": return "🟥";
      case "substitution_in": return "🔼";
      case "substitution_out": return "🔽";
      case "save": return "🧤";
      case "injury": return "🏥";
      default: return "📝";
    }
  };
  
  const getEventLabel = (type: EventType) => {
    switch (type) {
      case "goal": return "Bramka";
      case "assist": return "Asysta";
      case "yellow_card": return "Żółta kartka";
      case "red_card": return "Czerwona kartka";
      case "substitution_in": return "Wejście";
      case "substitution_out": return "Zejście";
      case "save": return "Obrona";
      case "injury": return "Kontuzja";
      default: return type;
    }
  };
  
  const getHalfLabel = (h: HalfType) => {
    switch (h) {
      case "first": return "1. połowa";
      case "second": return "2. połowa";
      case "extra_first": return "Dogrywka 1";
      case "extra_second": return "Dogrywka 2";
      case "penalties": return "Karne";
      default: return h;
    }
  };
  
  if (loadingEvents) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#4ade80" />
        <ThemedText style={{ marginTop: 16 }}>Ładowanie danych meczu...</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText>← Wróć</ThemedText>
        </Pressable>
        <ThemedText type="subtitle">Statystyki na żywo</ThemedText>
      </View>
      
      {/* Score Board */}
      <View style={styles.scoreBoard}>
        <View style={styles.teamScore}>
          <ThemedText style={styles.teamName}>Nasz zespół</ThemedText>
          <ThemedText style={styles.score}>{homeScore}</ThemedText>
        </View>
        <View style={styles.timerContainer}>
          <ThemedText style={styles.halfText}>{getHalfLabel(half)}</ThemedText>
          <ThemedText style={styles.timer}>{formatTime(seconds)}</ThemedText>
          <ThemedText style={styles.minute}>{getCurrentMinute()}'</ThemedText>
        </View>
        <View style={styles.teamScore}>
          <ThemedText style={styles.teamName}>{match?.opponent || "Przeciwnik"}</ThemedText>
          <ThemedText style={styles.score}>{awayScore}</ThemedText>
        </View>
      </View>
      
      {/* Timer Controls */}
      <View style={styles.timerControls}>
        <Pressable
          style={[styles.timerBtn, isRunning && styles.timerBtnActive]}
          onPress={toggleTimer}
        >
          <ThemedText style={styles.timerBtnText}>
            {isRunning ? "⏸ Pauza" : "▶ Start"}
          </ThemedText>
        </Pressable>
        {half === "first" && (
          <Pressable style={styles.halfBtn} onPress={startSecondHalf}>
            <ThemedText style={styles.halfBtnText}>2. połowa</ThemedText>
          </Pressable>
        )}
        <Pressable style={styles.endBtn} onPress={endMatch}>
          <ThemedText style={styles.endBtnText}>Zakończ</ThemedText>
        </Pressable>
      </View>
      
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Szybkie akcje</ThemedText>
        <View style={styles.actionGrid}>
          <Pressable style={[styles.actionBtn, styles.goalBtn]} onPress={() => addEvent("goal")}>
            <ThemedText style={styles.actionIcon}>⚽</ThemedText>
            <ThemedText style={styles.actionLabel}>Bramka</ThemedText>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.assistBtn]} onPress={() => addEvent("assist")}>
            <ThemedText style={styles.actionIcon}>🎯</ThemedText>
            <ThemedText style={styles.actionLabel}>Asysta</ThemedText>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.yellowBtn]} onPress={() => addEvent("yellow_card")}>
            <ThemedText style={styles.actionIcon}>🟨</ThemedText>
            <ThemedText style={styles.actionLabel}>Żółta</ThemedText>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.redBtn]} onPress={() => addEvent("red_card")}>
            <ThemedText style={styles.actionIcon}>🟥</ThemedText>
            <ThemedText style={styles.actionLabel}>Czerwona</ThemedText>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.saveBtn]} onPress={() => addEvent("save")}>
            <ThemedText style={styles.actionIcon}>🧤</ThemedText>
            <ThemedText style={styles.actionLabel}>Obrona</ThemedText>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.subBtn]} onPress={() => addEvent("substitution_in")}>
            <ThemedText style={styles.actionIcon}>🔄</ThemedText>
            <ThemedText style={styles.actionLabel}>Zmiana</ThemedText>
          </Pressable>
        </View>
      </View>
      
      {/* Events Timeline */}
      <View style={styles.eventsSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Oś czasu ({events.length})
        </ThemedText>
        <ScrollView style={styles.eventsList}>
          {events.length === 0 ? (
            <ThemedText style={styles.emptyText}>
              Brak wydarzeń. Dodaj pierwsze wydarzenie meczu.
            </ThemedText>
          ) : (
            events.map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <ThemedText style={styles.eventMinute}>{event.minute}'</ThemedText>
                <ThemedText style={styles.eventIcon}>{getEventIcon(event.type)}</ThemedText>
                <View style={styles.eventInfo}>
                  <ThemedText style={styles.eventPlayer}>{event.playerName}</ThemedText>
                  <ThemedText style={styles.eventType}>
                    {getEventLabel(event.type)}
                    {event.assistPlayerName && ` (asysta: ${event.assistPlayerName})`}
                  </ThemedText>
                </View>
                <ThemedText style={styles.eventHalf}>{getHalfLabel(event.half)}</ThemedText>
              </View>
            ))
          )}
        </ScrollView>
      </View>
      
      {/* Player Selection Modal */}
      <Modal
        visible={showPlayerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlayerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">
                {pendingEventType ? getEventLabel(pendingEventType) : "Wybierz zawodnika"}
              </ThemedText>
              <Pressable onPress={() => setShowPlayerModal(false)}>
                <ThemedText style={styles.closeBtn}>✕</ThemedText>
              </Pressable>
            </View>
            <ThemedText style={styles.modalSubtitle}>Wybierz zawodnika:</ThemedText>
            <ScrollView style={styles.playerList}>
              {players?.map((player) => (
                <Pressable
                  key={player.id}
                  style={styles.playerItem}
                  onPress={() => confirmEvent(player.id, player.name)}
                >
                  <ThemedText style={styles.playerNumber}>
                    {player.jerseyNumber || "-"}
                  </ThemedText>
                  <ThemedText style={styles.playerName}>{player.name}</ThemedText>
                  <ThemedText style={styles.playerPosition}>{player.position}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Assist Selection Modal */}
      <Modal
        visible={showAssistModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssistModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Asysta</ThemedText>
              <Pressable onPress={() => {
                confirmGoalWithAssist();
              }}>
                <ThemedText style={styles.closeBtn}>✕</ThemedText>
              </Pressable>
            </View>
            <ThemedText style={styles.modalSubtitle}>
              Bramka: {pendingGoalEvent?.playerName}
            </ThemedText>
            <ThemedText style={styles.modalSubtitle}>
              Wybierz asystującego (lub pomiń):
            </ThemedText>
            <Pressable
              style={[styles.playerItem, { backgroundColor: "#f0f0f0" }]}
              onPress={() => confirmGoalWithAssist()}
            >
              <ThemedText style={styles.playerName}>Bez asysty</ThemedText>
            </Pressable>
            <ScrollView style={styles.playerList}>
              {players?.filter(p => p.id !== pendingGoalEvent?.playerId).map((player) => (
                <Pressable
                  key={player.id}
                  style={styles.playerItem}
                  onPress={() => confirmGoalWithAssist(player.id, player.name)}
                >
                  <ThemedText style={styles.playerNumber}>
                    {player.jerseyNumber || "-"}
                  </ThemedText>
                  <ThemedText style={styles.playerName}>{player.name}</ThemedText>
                  <ThemedText style={styles.playerPosition}>{player.position}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Saving indicator */}
      {addEventMutation.isPending && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator color="#fff" />
          <ThemedText style={styles.savingText}>Zapisywanie...</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: {},
  scoreBoard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#1a1a2e",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
  },
  teamScore: {
    alignItems: "center",
    flex: 1,
  },
  teamName: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 4,
  },
  score: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "bold",
  },
  timerContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  halfText: {
    color: "#4ade80",
    fontSize: 12,
    fontWeight: "600",
  },
  timer: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  minute: {
    color: "#fbbf24",
    fontSize: 16,
    fontWeight: "600",
  },
  timerControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    padding: 16,
  },
  timerBtn: {
    backgroundColor: "#4ade80",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  timerBtnActive: {
    backgroundColor: "#f59e0b",
  },
  timerBtnText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 16,
  },
  halfBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  halfBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  endBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  endBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  quickActions: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionBtn: {
    width: "31%",
    aspectRatio: 1.5,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  goalBtn: { backgroundColor: "#dcfce7" },
  assistBtn: { backgroundColor: "#dbeafe" },
  yellowBtn: { backgroundColor: "#fef9c3" },
  redBtn: { backgroundColor: "#fee2e2" },
  saveBtn: { backgroundColor: "#e0e7ff" },
  subBtn: { backgroundColor: "#f3e8ff" },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  eventsSection: {
    flex: 1,
    padding: 16,
  },
  eventsList: {
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  eventMinute: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    width: 30,
  },
  eventIcon: {
    fontSize: 20,
  },
  eventInfo: {
    flex: 1,
  },
  eventPlayer: {
    fontWeight: "600",
  },
  eventType: {
    fontSize: 12,
    color: "#666",
  },
  eventHalf: {
    fontSize: 10,
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  closeBtn: {
    fontSize: 24,
    color: "#666",
  },
  modalSubtitle: {
    color: "#666",
    marginBottom: 12,
  },
  playerList: {
    flex: 1,
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 12,
  },
  playerNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#e0e0e0",
    textAlign: "center",
    lineHeight: 30,
    fontWeight: "bold",
  },
  playerName: {
    flex: 1,
    fontWeight: "500",
  },
  playerPosition: {
    color: "#666",
    fontSize: 12,
  },
  savingOverlay: {
    position: "absolute",
    bottom: 100,
    left: "50%",
    transform: [{ translateX: -60 }],
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  savingText: {
    color: "#fff",
    fontSize: 14,
  },
});
