import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

const DAYS_PL = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];
const MONTHS_PL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
];

export default function CalendarScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  // Get first and last day of month for calendar query
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { data: events, isLoading } = trpc.calendar.getEvents.useQuery(
    {
      clubId: club?.id ?? 0,
      startDate: startOfMonth.toISOString(),
      endDate: endOfMonth.toISOString(),
    },
    { enabled: !!club?.id }
  );

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
        <ThemedText style={styles.title}>Kalendarz</ThemedText>
        <Pressable style={styles.todayButton} onPress={goToToday}>
          <ThemedText style={styles.todayButtonText}>Dziś</ThemedText>
        </Pressable>
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
          <ThemedText style={styles.eventsTitle}>
            {selectedDate.toLocaleDateString("pl-PL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </ThemedText>

          {selectedDateEvents.matches.length === 0 && selectedDateEvents.trainings.length === 0 ? (
            <View style={styles.noEvents}>
              <ThemedText style={styles.noEventsText}>Brak wydarzeń w tym dniu</ThemedText>
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
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
  eventsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
    textTransform: "capitalize",
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
});
