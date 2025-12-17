import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Modal,
  TextInput,
  Alert,
  Platform,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useOfflineQuery } from "@/hooks/use-offline-query";
import { OfflineIndicator } from "@/components/offline-indicator";
import { useClubRole } from "@/hooks/use-club-role";

const DAYS_PL = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];
const MONTHS_PL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
];

type EventType = "match" | "training";
type CallupMode = "team" | "individual";

interface Player {
  id: number;
  name: string;
  teamId?: number | null;
  position: string;
}

interface Team {
  id: number;
  name: string;
  ageGroup?: string | null;
}

export default function CalendarScreen() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [eventType, setEventType] = useState<EventType>("match");
  const [isCreating, setIsCreating] = useState(false);

  // Form state for match
  const [opponent, setOpponent] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [matchLocation, setMatchLocation] = useState("");
  const [homeAway, setHomeAway] = useState<"home" | "away">("home");
  
  // Callup state for match
  const [callupMode, setCallupMode] = useState<CallupMode>("team");
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);

  // Form state for training
  const [trainingTime, setTrainingTime] = useState("");
  const [trainingLocation, setTrainingLocation] = useState("");
  const [trainingNotes, setTrainingNotes] = useState("");
  
  // Training invitation state
  const [invitedTeamIds, setInvitedTeamIds] = useState<number[]>([]);

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];
  const { permissions } = useClubRole(club?.id);

  // Get teams for the club
  const { data: teams } = trpc.teams.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  // Get players for the club
  const { data: players } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  // Get first and last day of month for calendar query
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const eventsQuery = trpc.calendar.getEvents.useQuery(
    {
      clubId: club?.id ?? 0,
      startDate: startOfMonth.toISOString(),
      endDate: endOfMonth.toISOString(),
    },
    { enabled: !!club?.id }
  );

  const { data: events, isLoading, isFromCache, isStale, isOffline } = useOfflineQuery(
    eventsQuery,
    { cacheKey: `calendar_${club?.id}_${currentDate.getFullYear()}_${currentDate.getMonth()}`, enabled: !!club?.id }
  );

  // Mutations
  const createMatch = trpc.matches.create.useMutation({
    onSuccess: async (data) => {
      // Create callups for the match
      const playerIdsToCallup = getPlayersToCallup();
      if (playerIdsToCallup.length > 0) {
        try {
          await createCallups.mutateAsync({
            matchId: data.id,
            playerIds: playerIdsToCallup,
            notificationChannel: "app",
          });
        } catch (err) {
          console.error("Failed to create callups:", err);
        }
      }
      
      utils.calendar.getEvents.invalidate();
      utils.matches.list.invalidate();
      resetForm();
      setShowAddModal(false);
      Alert.alert("Sukces", "Mecz został dodany do kalendarza z powołaniami");
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message || "Nie udało się dodać meczu");
    },
  });

  const createTraining = trpc.trainings.create.useMutation({
    onSuccess: async (data) => {
      // Create attendance records for invited teams
      const playerIdsToInvite = getPlayersToInvite();
      if (playerIdsToInvite.length > 0) {
        try {
          for (const playerId of playerIdsToInvite) {
            await setTrainingAttendance.mutateAsync({
              trainingId: data.id,
              playerId,
              attended: 0, // Not attended yet, just invited
            });
          }
        } catch (err) {
          console.error("Failed to create training invitations:", err);
        }
      }
      
      utils.calendar.getEvents.invalidate();
      utils.trainings.list.invalidate();
      resetForm();
      setShowAddModal(false);
      Alert.alert("Sukces", "Trening został dodany do kalendarza");
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message || "Nie udało się dodać treningu");
    },
  });

  const createCallups = trpc.callups.createForMatch.useMutation();
  const setTrainingAttendance = trpc.trainings.setAttendance.useMutation();

  // Get players to callup based on selection mode
  const getPlayersToCallup = (): number[] => {
    if (callupMode === "team") {
      // Get all players from selected teams
      if (!players) return [];
      return players
        .filter(p => selectedTeamIds.includes(p.teamId ?? 0))
        .map(p => p.id);
    } else {
      // Return individually selected players
      return selectedPlayerIds;
    }
  };

  // Get players to invite to training
  const getPlayersToInvite = (): number[] => {
    if (!players) return [];
    return players
      .filter(p => invitedTeamIds.includes(p.teamId ?? 0))
      .map(p => p.id);
  };

  // Group players by team for display
  const playersByTeam = useMemo(() => {
    if (!players || !teams) return new Map<number, Player[]>();
    
    const grouped = new Map<number, Player[]>();
    teams.forEach(team => {
      grouped.set(team.id, players.filter(p => p.teamId === team.id));
    });
    
    // Add players without team
    const noTeamPlayers = players.filter(p => !p.teamId);
    if (noTeamPlayers.length > 0) {
      grouped.set(0, noTeamPlayers);
    }
    
    return grouped;
  }, [players, teams]);

  const resetForm = () => {
    setOpponent("");
    setMatchTime("");
    setMatchLocation("");
    setHomeAway("home");
    setTrainingTime("");
    setTrainingLocation("");
    setTrainingNotes("");
    setEventType("match");
    setIsCreating(false);
    setCallupMode("team");
    setSelectedTeamIds([]);
    setSelectedPlayerIds([]);
    setInvitedTeamIds([]);
  };

  const handleAddEvent = () => {
    if (!selectedDate || !club) return;

    setIsCreating(true);

    if (eventType === "match") {
      if (!opponent.trim()) {
        Alert.alert("Błąd", "Podaj nazwę przeciwnika");
        setIsCreating(false);
        return;
      }

      createMatch.mutate({
        clubId: club.id,
        opponent: opponent.trim(),
        matchDate: selectedDate.toISOString(),
        matchTime: matchTime.trim() || undefined,
        location: matchLocation.trim() || undefined,
        homeAway,
      });
    } else {
      createTraining.mutate({
        clubId: club.id,
        trainingDate: selectedDate.toISOString(),
        trainingTime: trainingTime.trim() || undefined,
        location: trainingLocation.trim() || undefined,
        notes: trainingNotes.trim() || undefined,
      });
    }
  };

  const openAddModal = () => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
    resetForm();
    setShowAddModal(true);
  };

  const toggleTeamSelection = (teamId: number) => {
    if (eventType === "match") {
      setSelectedTeamIds(prev => 
        prev.includes(teamId) 
          ? prev.filter(id => id !== teamId)
          : [...prev, teamId]
      );
    } else {
      setInvitedTeamIds(prev => 
        prev.includes(teamId) 
          ? prev.filter(id => id !== teamId)
          : [...prev, teamId]
      );
    }
  };

  const togglePlayerSelection = (playerId: number) => {
    setSelectedPlayerIds(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Get day of week (0 = Sunday, adjust for Monday start)
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    // Add empty days for previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    
    return days;
  }, [currentDate]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate || !events) return { matches: [], trainings: [] };
    
    const dateStr = selectedDate.toISOString().split("T")[0];
    
    const matchesOnDate = events.matches.filter((m) => {
      const mDate = new Date(m.matchDate).toISOString().split("T")[0];
      return mDate === dateStr;
    });
    
    const trainingsOnDate = events.trainings.filter((t) => {
      const tDate = new Date(t.trainingDate).toISOString().split("T")[0];
      return tDate === dateStr;
    });
    
    return { matches: matchesOnDate, trainings: trainingsOnDate };
  }, [selectedDate, events]);

  // Check if date has events
  const hasEventsOnDate = (date: Date) => {
    if (!events) return false;
    const dateStr = date.toISOString().split("T")[0];
    
    const hasMatch = events.matches.some((m) => {
      const mDate = new Date(m.matchDate).toISOString().split("T")[0];
      return mDate === dateStr;
    });
    
    const hasTraining = events.trainings.some((t) => {
      const tDate = new Date(t.trainingDate).toISOString().split("T")[0];
      return tDate === dateStr;
    });
    
    return { hasMatch, hasTraining };
  };

  // Count events for selected date
  const eventCount = selectedDateEvents.matches.length + selectedDateEvents.trainings.length;

  // Count selected players/teams for callups
  const callupCount = callupMode === "team" 
    ? getPlayersToCallup().length 
    : selectedPlayerIds.length;

  const inviteCount = getPlayersToInvite().length;

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Zaloguj się, aby zobaczyć kalendarz</ThemedText>
      </ThemedView>
    );
  }

  if (!club) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Utwórz klub, aby korzystać z kalendarza</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.title}>Kalendarz</ThemedText>
          <OfflineIndicator isFromCache={isFromCache} isStale={isStale} isOffline={isOffline} compact />
        </View>
        <View style={styles.headerButtons}>
          {permissions.canEditClub && (
            <Pressable style={styles.addButton} onPress={openAddModal}>
              <MaterialIcons name="add" size={24} color="#fff" />
            </Pressable>
          )}
          {permissions.canEditClub && (
            <Pressable style={styles.importButton} onPress={() => router.push('/import-matches' as any)}>
              <MaterialIcons name="cloud-download" size={20} color={AppColors.primary} />
            </Pressable>
          )}
          <Pressable style={styles.exportButton} onPress={() => router.push('/calendar-export' as any)}>
            <MaterialIcons name="file-download" size={20} color={AppColors.primary} />
          </Pressable>
          <Pressable style={styles.todayButton} onPress={goToToday}>
            <ThemedText style={styles.todayButtonText}>Dziś</ThemedText>
          </Pressable>
          <Pressable style={styles.logoutButton} onPress={logout}>
            <MaterialIcons name="logout" size={22} color={AppColors.danger} />
          </Pressable>
        </View>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <Pressable onPress={goToPrevMonth} style={styles.navButton}>
          <MaterialIcons name="chevron-left" size={28} color="#fff" />
        </Pressable>
        <ThemedText style={styles.monthTitle}>
          {MONTHS_PL[currentDate.getMonth()]} {currentDate.getFullYear()}
        </ThemedText>
        <Pressable onPress={goToNextMonth} style={styles.navButton}>
          <MaterialIcons name="chevron-right" size={28} color="#fff" />
        </Pressable>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        {/* Day headers */}
        <View style={styles.dayHeaders}>
          {DAYS_PL.map((day) => (
            <View key={day} style={styles.dayHeader}>
              <ThemedText style={styles.dayHeaderText}>{day}</ThemedText>
            </View>
          ))}
        </View>

        {/* Calendar days */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary} />
          </View>
        ) : (
          <View style={styles.daysGrid}>
            {calendarDays.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const eventStatus = hasEventsOnDate(date);

              return (
                <Pressable
                  key={date.toISOString()}
                  style={[
                    styles.dayCell,
                    isToday && styles.todayCell,
                    isSelected && styles.selectedCell,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <ThemedText
                    style={[
                      styles.dayText,
                      isToday && styles.todayText,
                      isSelected && styles.selectedText,
                    ]}
                  >
                    {date.getDate()}
                  </ThemedText>
                  {eventStatus && (eventStatus.hasMatch || eventStatus.hasTraining) && (
                    <View style={styles.eventDots}>
                      {eventStatus.hasMatch && (
                        <View style={[styles.eventDot, { backgroundColor: AppColors.primary }]} />
                      )}
                      {eventStatus.hasTraining && (
                        <View style={[styles.eventDot, { backgroundColor: AppColors.secondary }]} />
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: AppColors.primary }]} />
          <ThemedText style={styles.legendText}>Mecz</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: AppColors.secondary }]} />
          <ThemedText style={styles.legendText}>Trening</ThemedText>
        </View>
      </View>

      {/* Selected Date Events */}
      {selectedDate && (
        <ScrollView style={styles.eventsContainer} contentContainerStyle={styles.eventsContent}>
          <View style={styles.eventsTitleRow}>
            <View>
              <ThemedText style={styles.eventsTitle}>
                {selectedDate.toLocaleDateString("pl-PL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </ThemedText>
              {eventCount > 0 && (
                <ThemedText style={styles.eventCount}>
                  {eventCount} {eventCount === 1 ? "wydarzenie" : eventCount < 5 ? "wydarzenia" : "wydarzeń"}
                </ThemedText>
              )}
            </View>
            {permissions.canEditClub && (
              <Pressable style={styles.addEventBtn} onPress={openAddModal}>
                <MaterialIcons name="add" size={20} color="#fff" />
                <ThemedText style={styles.addEventBtnText}>Dodaj</ThemedText>
              </Pressable>
            )}
          </View>

          {selectedDateEvents.matches.length === 0 && selectedDateEvents.trainings.length === 0 ? (
            <View style={styles.noEvents}>
              <MaterialIcons name="event-busy" size={40} color="#475569" />
              <ThemedText style={styles.noEventsText}>Brak wydarzeń w tym dniu</ThemedText>
              {permissions.canEditClub && (
                <Pressable style={styles.noEventsAddBtn} onPress={openAddModal}>
                  <MaterialIcons name="add" size={18} color={AppColors.primary} />
                  <ThemedText style={styles.noEventsAddBtnText}>Dodaj wydarzenie</ThemedText>
                </Pressable>
              )}
            </View>
          ) : (
            <>
              {selectedDateEvents.matches.map((match) => (
                <Pressable
                  key={`match-${match.id}`}
                  style={styles.eventCard}
                  onPress={() => router.push(`/match/${match.id}` as any)}
                >
                  <View style={[styles.eventIcon, { backgroundColor: AppColors.primary + "20" }]}>
                    <MaterialIcons name="sports-soccer" size={20} color={AppColors.primary} />
                  </View>
                  <View style={styles.eventInfo}>
                    <ThemedText style={styles.eventTitle}>
                      {match.homeAway === "home" ? "vs" : "@"} {match.opponent}
                    </ThemedText>
                    <ThemedText style={styles.eventTime}>
                      {match.matchTime || "Czas do ustalenia"} • {match.location || "Miejsce do ustalenia"}
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#64748b" />
                </Pressable>
              ))}

              {selectedDateEvents.trainings.map((training) => (
                <Pressable
                  key={`training-${training.id}`}
                  style={styles.eventCard}
                  onPress={() => router.push(`/training/${training.id}` as any)}
                >
                  <View style={[styles.eventIcon, { backgroundColor: AppColors.secondary + "20" }]}>
                    <MaterialIcons name="fitness-center" size={20} color={AppColors.secondary} />
                  </View>
                  <View style={styles.eventInfo}>
                    <ThemedText style={styles.eventTitle}>Trening</ThemedText>
                    <ThemedText style={styles.eventTime}>
                      {training.trainingTime || "Czas do ustalenia"} • {training.location || "Miejsce do ustalenia"}
                    </ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#64748b" />
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Add Event Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowAddModal(false)} style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={24} color="#94a3b8" />
              </Pressable>
              <ThemedText style={styles.modalTitle}>Dodaj wydarzenie</ThemedText>
              <View style={{ width: 44 }} />
            </View>

            {/* Selected Date Display */}
            {selectedDate && (
              <View style={styles.selectedDateDisplay}>
                <MaterialIcons name="event" size={20} color={AppColors.primary} />
                <ThemedText style={styles.selectedDateText}>
                  {selectedDate.toLocaleDateString("pl-PL", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </ThemedText>
              </View>
            )}

            {/* Event Type Selector */}
            <View style={styles.eventTypeSelector}>
              <Pressable
                style={[styles.eventTypeBtn, eventType === "match" && styles.eventTypeBtnActive]}
                onPress={() => setEventType("match")}
              >
                <MaterialIcons
                  name="sports-soccer"
                  size={20}
                  color={eventType === "match" ? "#fff" : "#64748b"}
                />
                <ThemedText
                  style={[styles.eventTypeBtnText, eventType === "match" && styles.eventTypeBtnTextActive]}
                >
                  Mecz
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.eventTypeBtn, eventType === "training" && styles.eventTypeBtnActive]}
                onPress={() => setEventType("training")}
              >
                <MaterialIcons
                  name="fitness-center"
                  size={20}
                  color={eventType === "training" ? "#fff" : "#64748b"}
                />
                <ThemedText
                  style={[styles.eventTypeBtnText, eventType === "training" && styles.eventTypeBtnTextActive]}
                >
                  Trening
                </ThemedText>
              </Pressable>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {eventType === "match" ? (
                <>
                  {/* Match Form */}
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.formLabel}>Przeciwnik *</ThemedText>
                    <TextInput
                      style={styles.formInput}
                      value={opponent}
                      onChangeText={setOpponent}
                      placeholder="Nazwa drużyny przeciwnej"
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText style={styles.formLabel}>Godzina</ThemedText>
                    <TextInput
                      style={styles.formInput}
                      value={matchTime}
                      onChangeText={setMatchTime}
                      placeholder="np. 15:00"
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText style={styles.formLabel}>Miejsce</ThemedText>
                    <TextInput
                      style={styles.formInput}
                      value={matchLocation}
                      onChangeText={setMatchLocation}
                      placeholder="Adres lub nazwa obiektu"
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText style={styles.formLabel}>Rodzaj meczu</ThemedText>
                    <View style={styles.homeAwaySelector}>
                      <Pressable
                        style={[styles.homeAwayBtn, homeAway === "home" && styles.homeAwayBtnActive]}
                        onPress={() => setHomeAway("home")}
                      >
                        <ThemedText
                          style={[styles.homeAwayBtnText, homeAway === "home" && styles.homeAwayBtnTextActive]}
                        >
                          U siebie
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        style={[styles.homeAwayBtn, homeAway === "away" && styles.homeAwayBtnActive]}
                        onPress={() => setHomeAway("away")}
                      >
                        <ThemedText
                          style={[styles.homeAwayBtnText, homeAway === "away" && styles.homeAwayBtnTextActive]}
                        >
                          Na wyjeździe
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>

                  {/* Callups Section */}
                  <View style={styles.sectionDivider}>
                    <ThemedText style={styles.sectionTitle}>Powołania na mecz</ThemedText>
                    <ThemedText style={styles.sectionSubtitle}>
                      {callupCount > 0 ? `Wybrano ${callupCount} zawodników` : "Wybierz zawodników do powołania"}
                    </ThemedText>
                  </View>

                  {/* Callup Mode Selector */}
                  <View style={styles.callupModeSelector}>
                    <Pressable
                      style={[styles.callupModeBtn, callupMode === "team" && styles.callupModeBtnActive]}
                      onPress={() => setCallupMode("team")}
                    >
                      <MaterialIcons
                        name="groups"
                        size={18}
                        color={callupMode === "team" ? "#fff" : "#64748b"}
                      />
                      <ThemedText
                        style={[styles.callupModeBtnText, callupMode === "team" && styles.callupModeBtnTextActive]}
                      >
                        Cały zespół
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      style={[styles.callupModeBtn, callupMode === "individual" && styles.callupModeBtnActive]}
                      onPress={() => setCallupMode("individual")}
                    >
                      <MaterialIcons
                        name="person"
                        size={18}
                        color={callupMode === "individual" ? "#fff" : "#64748b"}
                      />
                      <ThemedText
                        style={[styles.callupModeBtnText, callupMode === "individual" && styles.callupModeBtnTextActive]}
                      >
                        Indywidualnie
                      </ThemedText>
                    </Pressable>
                  </View>

                  {callupMode === "team" ? (
                    // Team selection
                    <View style={styles.teamList}>
                      {teams && teams.length > 0 ? (
                        teams.map((team) => {
                          const teamPlayerCount = playersByTeam.get(team.id)?.length || 0;
                          const isSelected = selectedTeamIds.includes(team.id);
                          return (
                            <Pressable
                              key={team.id}
                              style={[styles.teamItem, isSelected && styles.teamItemSelected]}
                              onPress={() => toggleTeamSelection(team.id)}
                            >
                              <View style={styles.teamItemContent}>
                                <MaterialIcons
                                  name={isSelected ? "check-box" : "check-box-outline-blank"}
                                  size={24}
                                  color={isSelected ? AppColors.primary : "#64748b"}
                                />
                                <View style={styles.teamItemInfo}>
                                  <ThemedText style={styles.teamItemName}>{team.name}</ThemedText>
                                  <ThemedText style={styles.teamItemMeta}>
                                    {team.ageGroup || "Brak kategorii"} • {teamPlayerCount} zawodników
                                  </ThemedText>
                                </View>
                              </View>
                            </Pressable>
                          );
                        })
                      ) : (
                        <ThemedText style={styles.noTeamsText}>
                          Brak zespołów. Dodaj zespoły w sekcji Kadra.
                        </ThemedText>
                      )}
                    </View>
                  ) : (
                    // Individual player selection
                    <View style={styles.playerList}>
                      {teams && teams.map((team) => {
                        const teamPlayers = playersByTeam.get(team.id) || [];
                        if (teamPlayers.length === 0) return null;
                        
                        return (
                          <View key={team.id} style={styles.playerGroup}>
                            <ThemedText style={styles.playerGroupTitle}>{team.name}</ThemedText>
                            {teamPlayers.map((player) => {
                              const isSelected = selectedPlayerIds.includes(player.id);
                              return (
                                <Pressable
                                  key={player.id}
                                  style={[styles.playerItem, isSelected && styles.playerItemSelected]}
                                  onPress={() => togglePlayerSelection(player.id)}
                                >
                                  <MaterialIcons
                                    name={isSelected ? "check-box" : "check-box-outline-blank"}
                                    size={22}
                                    color={isSelected ? AppColors.primary : "#64748b"}
                                  />
                                  <ThemedText style={styles.playerItemName}>{player.name}</ThemedText>
                                  <ThemedText style={styles.playerItemPosition}>{player.position}</ThemedText>
                                </Pressable>
                              );
                            })}
                          </View>
                        );
                      })}
                      
                      {/* Players without team */}
                      {playersByTeam.get(0) && playersByTeam.get(0)!.length > 0 && (
                        <View style={styles.playerGroup}>
                          <ThemedText style={styles.playerGroupTitle}>Bez zespołu</ThemedText>
                          {playersByTeam.get(0)!.map((player) => {
                            const isSelected = selectedPlayerIds.includes(player.id);
                            return (
                              <Pressable
                                key={player.id}
                                style={[styles.playerItem, isSelected && styles.playerItemSelected]}
                                onPress={() => togglePlayerSelection(player.id)}
                              >
                                <MaterialIcons
                                  name={isSelected ? "check-box" : "check-box-outline-blank"}
                                  size={22}
                                  color={isSelected ? AppColors.primary : "#64748b"}
                                />
                                <ThemedText style={styles.playerItemName}>{player.name}</ThemedText>
                                <ThemedText style={styles.playerItemPosition}>{player.position}</ThemedText>
                              </Pressable>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  )}
                </>
              ) : (
                <>
                  {/* Training Form */}
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.formLabel}>Godzina</ThemedText>
                    <TextInput
                      style={styles.formInput}
                      value={trainingTime}
                      onChangeText={setTrainingTime}
                      placeholder="np. 17:00"
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText style={styles.formLabel}>Miejsce</ThemedText>
                    <TextInput
                      style={styles.formInput}
                      value={trainingLocation}
                      onChangeText={setTrainingLocation}
                      placeholder="Adres lub nazwa obiektu"
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText style={styles.formLabel}>Notatki</ThemedText>
                    <TextInput
                      style={[styles.formInput, styles.formTextarea]}
                      value={trainingNotes}
                      onChangeText={setTrainingNotes}
                      placeholder="Dodatkowe informacje o treningu"
                      placeholderTextColor="#64748b"
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  {/* Training Invitations Section */}
                  <View style={styles.sectionDivider}>
                    <ThemedText style={styles.sectionTitle}>Zaproszenia na trening</ThemedText>
                    <ThemedText style={styles.sectionSubtitle}>
                      {inviteCount > 0 ? `Zaproszono ${inviteCount} zawodników` : "Wybierz zespoły do zaproszenia"}
                    </ThemedText>
                  </View>

                  <ThemedText style={styles.inviteHint}>
                    Możesz zaprosić kilka zespołów na jeden trening
                  </ThemedText>

                  <View style={styles.teamList}>
                    {teams && teams.length > 0 ? (
                      teams.map((team) => {
                        const teamPlayerCount = playersByTeam.get(team.id)?.length || 0;
                        const isSelected = invitedTeamIds.includes(team.id);
                        return (
                          <Pressable
                            key={team.id}
                            style={[styles.teamItem, isSelected && styles.teamItemSelected]}
                            onPress={() => toggleTeamSelection(team.id)}
                          >
                            <View style={styles.teamItemContent}>
                              <MaterialIcons
                                name={isSelected ? "check-box" : "check-box-outline-blank"}
                                size={24}
                                color={isSelected ? AppColors.secondary : "#64748b"}
                              />
                              <View style={styles.teamItemInfo}>
                                <ThemedText style={styles.teamItemName}>{team.name}</ThemedText>
                                <ThemedText style={styles.teamItemMeta}>
                                  {team.ageGroup || "Brak kategorii"} • {teamPlayerCount} zawodników
                                </ThemedText>
                              </View>
                            </View>
                          </Pressable>
                        );
                      })
                    ) : (
                      <ThemedText style={styles.noTeamsText}>
                        Brak zespołów. Dodaj zespoły w sekcji Kadra.
                      </ThemedText>
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Submit Button */}
            <Pressable
              style={[styles.submitBtn, isCreating && styles.submitBtnDisabled]}
              onPress={handleAddEvent}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="add" size={20} color="#fff" />
                  <ThemedText style={styles.submitBtnText}>
                    Dodaj {eventType === "match" ? "mecz" : "trening"}
                    {eventType === "match" && callupCount > 0 && ` (${callupCount} powołań)`}
                    {eventType === "training" && inviteCount > 0 && ` (${inviteCount} zaproszeń)`}
                  </ThemedText>
                </>
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
    backgroundColor: AppColors.bgDark,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: AppColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  importButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: AppColors.success + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  todayButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  todayButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  logoutButton: {
    padding: Spacing.sm,
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  navButton: {
    padding: Spacing.sm,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  calendarContainer: {
    paddingHorizontal: Spacing.md,
  },
  dayHeaders: {
    flexDirection: "row",
    marginBottom: Spacing.xs,
  },
  dayHeader: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  dayHeaderText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
  loadingContainer: {
    height: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radius.sm,
  },
  todayCell: {
    backgroundColor: AppColors.primary + "30",
  },
  selectedCell: {
    backgroundColor: AppColors.primary,
  },
  dayText: {
    fontSize: 14,
    color: "#e2e8f0",
  },
  todayText: {
    fontWeight: "bold",
    color: AppColors.primary,
  },
  selectedText: {
    fontWeight: "bold",
    color: "#fff",
  },
  eventDots: {
    flexDirection: "row",
    gap: 3,
    marginTop: 2,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  eventsContainer: {
    flex: 1,
  },
  eventsContent: {
    padding: Spacing.lg,
  },
  eventsTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textTransform: "capitalize",
  },
  eventCount: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  addEventBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  addEventBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  noEvents: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  noEventsText: {
    color: "#64748b",
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  noEventsAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderRadius: Radius.md,
  },
  noEventsAddBtnText: {
    color: AppColors.primary,
    fontWeight: "500",
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  eventTime: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  modalCloseBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  selectedDateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: AppColors.primary + "10",
  },
  selectedDateText: {
    fontSize: 15,
    color: AppColors.primary,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  eventTypeSelector: {
    flexDirection: "row",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  eventTypeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: "#1e293b",
  },
  eventTypeBtnActive: {
    backgroundColor: AppColors.primary,
  },
  eventTypeBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
  eventTypeBtnTextActive: {
    color: "#fff",
  },
  modalForm: {
    paddingHorizontal: Spacing.lg,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
    marginBottom: Spacing.xs,
  },
  formInput: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: "#fff",
  },
  formTextarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  homeAwaySelector: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  homeAwayBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: "#1e293b",
    alignItems: "center",
  },
  homeAwayBtnActive: {
    backgroundColor: AppColors.primary,
  },
  homeAwayBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  homeAwayBtnTextActive: {
    color: "#fff",
  },
  // Callups styles
  sectionDivider: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  callupModeSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  callupModeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: "#1e293b",
  },
  callupModeBtnActive: {
    backgroundColor: AppColors.primary,
  },
  callupModeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  callupModeBtnTextActive: {
    color: "#fff",
  },
  teamList: {
    gap: Spacing.sm,
  },
  teamItem: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  teamItemSelected: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "10",
  },
  teamItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  teamItemInfo: {
    flex: 1,
  },
  teamItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  teamItemMeta: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  noTeamsText: {
    color: "#64748b",
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
  playerList: {
    gap: Spacing.md,
  },
  playerGroup: {
    marginBottom: Spacing.sm,
  },
  playerGroupTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#1e293b",
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  playerItemSelected: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "10",
  },
  playerItemName: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
  },
  playerItemPosition: {
    fontSize: 12,
    color: "#64748b",
  },
  inviteHint: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: Spacing.md,
    fontStyle: "italic",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
