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

export default function CalendarScreen() {
  const { isAuthenticated } = useAuth();
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

  // Form state for training
  const [trainingTime, setTrainingTime] = useState("");
  const [trainingLocation, setTrainingLocation] = useState("");
  const [trainingNotes, setTrainingNotes] = useState("");

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];
  const { permissions } = useClubRole(club?.id);

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
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      utils.matches.list.invalidate();
      resetForm();
      setShowAddModal(false);
      Alert.alert("Sukces", "Mecz został dodany do kalendarza");
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message || "Nie udało się dodać meczu");
    },
  });

  const createTraining = trpc.trainings.create.useMutation({
    onSuccess: () => {
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
          <Pressable style={styles.exportButton} onPress={() => router.push('/calendar-export' as any)}>
            <MaterialIcons name="file-download" size={20} color={AppColors.primary} />
          </Pressable>
          <Pressable style={styles.todayButton} onPress={goToToday}>
            <ThemedText style={styles.todayButtonText}>Dziś</ThemedText>
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
    paddingHorizontal: Spacing.lg,
  },
  dayHeaders: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  dayHeader: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  dayHeaderText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
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
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radius.md,
  },
  todayCell: {
    backgroundColor: AppColors.bgCard,
  },
  selectedCell: {
    backgroundColor: AppColors.primary,
  },
  dayText: {
    fontSize: 16,
    color: "#e2e8f0",
  },
  todayText: {
    fontWeight: "bold",
  },
  selectedText: {
    color: "#fff",
    fontWeight: "bold",
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
    gap: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
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
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  noEvents: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  noEventsText: {
    color: "#64748b",
    fontSize: 14,
    marginTop: Spacing.sm,
  },
  noEventsAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  noEventsAddBtnText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "500",
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 13,
    color: "#94a3b8",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: AppColors.bgDark,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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
    fontWeight: "bold",
    color: "#fff",
  },
  selectedDateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: AppColors.primary + "10",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: Radius.md,
  },
  selectedDateText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  eventTypeSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  eventTypeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: AppColors.bgCard,
    borderWidth: 1,
    borderColor: "#334155",
  },
  eventTypeBtnActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  eventTypeBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  eventTypeBtnTextActive: {
    color: "#fff",
  },
  modalForm: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    maxHeight: 300,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
    marginBottom: Spacing.sm,
  },
  formInput: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#334155",
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
    backgroundColor: AppColors.bgCard,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  homeAwayBtnActive: {
    backgroundColor: AppColors.primary + "20",
    borderColor: AppColors.primary,
  },
  homeAwayBtnText: {
    fontSize: 14,
    color: "#64748b",
  },
  homeAwayBtnTextActive: {
    color: AppColors.primary,
    fontWeight: "600",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
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
