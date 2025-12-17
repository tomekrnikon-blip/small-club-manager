import { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

type MatchEvent = {
  id: string;
  type: "goal" | "assist" | "yellow" | "red" | "sub_in" | "sub_out" | "save";
  playerId: number;
  playerName: string;
  minute: number;
  half: 1 | 2;
};

export default function LiveMatchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  
  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [half, setHalf] = useState<1 | 2>(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Events state
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [pendingEventType, setPendingEventType] = useState<MatchEvent["type"] | null>(null);
  
  // Score
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  
  const { data: clubs } = trpc.clubs.list.useQuery();
  const clubId = clubs?.[0]?.id;
  
  const { data: players } = trpc.players.list.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId }
  );
  
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
    const baseMinute = half === 1 ? 0 : 45;
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
            setHalf(2);
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
          onPress: () => {
            setIsRunning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Mecz zakończony", "Statystyki zostały zapisane.");
            router.back();
          },
        },
      ]
    );
  };
  
  const addEvent = (type: MatchEvent["type"]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingEventType(type);
    setShowPlayerModal(true);
  };
  
  const confirmEvent = (playerId: number, playerName: string) => {
    if (!pendingEventType) return;
    
    const newEvent: MatchEvent = {
      id: Date.now().toString(),
      type: pendingEventType,
      playerId,
      playerName,
      minute: getCurrentMinute(),
      half,
    };
    
    setEvents(prev => [newEvent, ...prev]);
    
    // Update score for goals
    if (pendingEventType === "goal") {
      setHomeScore(prev => prev + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setShowPlayerModal(false);
    setPendingEventType(null);
  };
  
  const removeEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event?.type === "goal") {
      setHomeScore(prev => Math.max(0, prev - 1));
    }
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };
  
  const getEventIcon = (type: MatchEvent["type"]) => {
    switch (type) {
      case "goal": return "⚽";
      case "assist": return "🎯";
      case "yellow": return "🟨";
      case "red": return "🟥";
      case "sub_in": return "🔼";
      case "sub_out": return "🔽";
      case "save": return "🧤";
      default: return "📝";
    }
  };
  
  const getEventLabel = (type: MatchEvent["type"]) => {
    switch (type) {
      case "goal": return "Bramka";
      case "assist": return "Asysta";
      case "yellow": return "Żółta kartka";
      case "red": return "Czerwona kartka";
      case "sub_in": return "Wejście";
      case "sub_out": return "Zejście";
      case "save": return "Obrona";
      default: return type;
    }
  };
  
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
          <ThemedText style={styles.halfText}>
            {half === 1 ? "1. połowa" : "2. połowa"}
          </ThemedText>
          <ThemedText style={styles.timer}>{formatTime(seconds)}</ThemedText>
          <ThemedText style={styles.minute}>{getCurrentMinute()}'</ThemedText>
        </View>
        <View style={styles.teamScore}>
          <ThemedText style={styles.teamName}>Przeciwnik</ThemedText>
          <Pressable onPress={() => setAwayScore(prev => prev + 1)}>
            <ThemedText style={styles.score}>{awayScore}</ThemedText>
          </Pressable>
        </View>
      </View>
      
      {/* Timer Controls */}
      <View style={styles.timerControls}>
        <Pressable
          style={[styles.timerBtn, isRunning && styles.timerBtnActive]}
          onPress={toggleTimer}
        >
          <ThemedText style={styles.timerBtnText}>
            {isRunning ? "⏸️ Pauza" : "▶️ Start"}
          </ThemedText>
        </Pressable>
        {half === 1 && seconds > 0 && (
          <Pressable style={styles.halfBtn} onPress={startSecondHalf}>
            <ThemedText style={styles.halfBtnText}>2. połowa →</ThemedText>
          </Pressable>
        )}
        {half === 2 && (
          <Pressable style={styles.endBtn} onPress={endMatch}>
            <ThemedText style={styles.endBtnText}>🏁 Zakończ</ThemedText>
          </Pressable>
        )}
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
          <Pressable style={[styles.actionBtn, styles.yellowBtn]} onPress={() => addEvent("yellow")}>
            <ThemedText style={styles.actionIcon}>🟨</ThemedText>
            <ThemedText style={styles.actionLabel}>Żółta</ThemedText>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.redBtn]} onPress={() => addEvent("red")}>
            <ThemedText style={styles.actionIcon}>🟥</ThemedText>
            <ThemedText style={styles.actionLabel}>Czerwona</ThemedText>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.saveBtn]} onPress={() => addEvent("save")}>
            <ThemedText style={styles.actionIcon}>🧤</ThemedText>
            <ThemedText style={styles.actionLabel}>Obrona</ThemedText>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.subBtn]} onPress={() => addEvent("sub_in")}>
            <ThemedText style={styles.actionIcon}>🔄</ThemedText>
            <ThemedText style={styles.actionLabel}>Zmiana</ThemedText>
          </Pressable>
        </View>
      </View>
      
      {/* Events Timeline */}
      <View style={styles.eventsSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Przebieg meczu ({events.length})
        </ThemedText>
        <ScrollView style={styles.eventsList}>
          {events.length === 0 ? (
            <ThemedText style={styles.emptyText}>
              Brak wydarzeń. Użyj przycisków powyżej.
            </ThemedText>
          ) : (
            events.map(event => (
              <Pressable
                key={event.id}
                style={styles.eventItem}
                onLongPress={() => {
                  Alert.alert(
                    "Usuń wydarzenie",
                    `Czy usunąć: ${getEventLabel(event.type)} - ${event.playerName}?`,
                    [
                      { text: "Anuluj", style: "cancel" },
                      { text: "Usuń", style: "destructive", onPress: () => removeEvent(event.id) },
                    ]
                  );
                }}
              >
                <ThemedText style={styles.eventMinute}>{event.minute}'</ThemedText>
                <ThemedText style={styles.eventIcon}>{getEventIcon(event.type)}</ThemedText>
                <View style={styles.eventInfo}>
                  <ThemedText style={styles.eventPlayer}>{event.playerName}</ThemedText>
                  <ThemedText style={styles.eventType}>{getEventLabel(event.type)}</ThemedText>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
      
      {/* Player Selection Modal */}
      <Modal
        visible={showPlayerModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPlayerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">
                {pendingEventType && `${getEventIcon(pendingEventType)} ${getEventLabel(pendingEventType)}`}
              </ThemedText>
              <Pressable onPress={() => setShowPlayerModal(false)}>
                <ThemedText style={styles.closeBtn}>✕</ThemedText>
              </Pressable>
            </View>
            <ThemedText style={styles.modalSubtitle}>Wybierz zawodnika:</ThemedText>
            <ScrollView style={styles.playerList}>
              {players?.map((player: any) => (
                <Pressable
                  key={player.id}
                  style={styles.playerItem}
                  onPress={() => confirmEvent(player.id, player.name)}
                >
                  <ThemedText style={styles.playerNumber}>
                    {player.jerseyNumber || "-"}
                  </ThemedText>
                  <ThemedText style={styles.playerName}>{player.name}</ThemedText>
                  <ThemedText style={styles.playerPosition}>{player.position || ""}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
});
