import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useClubRole } from "@/hooks/use-club-role";
import { addTrainingToCalendar } from "@/lib/system-calendar";

export default function TrainingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingAttendance, setUpdatingAttendance] = useState<number | null>(null);

  const { data: training, isLoading } = trpc.trainings.get.useQuery(
    { id: Number(id) },
    { enabled: !!id && isAuthenticated }
  );

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];
  const { permissions } = useClubRole(club?.id);

  // Get attendance for this training
  const { data: attendance, refetch: refetchAttendance } = trpc.trainings.getAttendance.useQuery(
    { trainingId: Number(id) },
    { enabled: !!id && isAuthenticated }
  );

  // Get all players for the club
  const { data: players } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  // Get teams
  const { data: teams } = trpc.teams.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const deleteTraining = trpc.trainings.delete.useMutation({
    onSuccess: () => {
      utils.trainings.list.invalidate();
      utils.calendar.getEvents.invalidate();
      router.back();
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message || "Nie udało się usunąć treningu");
      setIsDeleting(false);
    },
  });

  const setAttendance = trpc.trainings.setAttendance.useMutation({
    onSuccess: () => {
      refetchAttendance();
      setUpdatingAttendance(null);
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message || "Nie udało się zaktualizować obecności");
      setUpdatingAttendance(null);
    },
  });

  // Build attendance map
  const attendanceMap = useMemo(() => {
    const map = new Map<number, number>();
    attendance?.forEach(a => {
      map.set(a.playerId, a.attended);
    });
    return map;
  }, [attendance]);

  // Get invited players (those with attendance records)
  const invitedPlayerIds = useMemo(() => {
    return new Set(attendance?.map(a => a.playerId) || []);
  }, [attendance]);

  // Group players by team for display
  const playersByTeam = useMemo(() => {
    if (!players || !teams) return [];
    
    const result: { team: { id: number; name: string; ageGroup?: string | null } | null; players: typeof players }[] = [];
    
    teams.forEach(team => {
      const teamPlayers = players.filter(p => p.teamId === team.id && invitedPlayerIds.has(p.id));
      if (teamPlayers.length > 0) {
        result.push({ team, players: teamPlayers });
      }
    });
    
    // Players without team
    const noTeamPlayers = players.filter(p => !p.teamId && invitedPlayerIds.has(p.id));
    if (noTeamPlayers.length > 0) {
      result.push({ team: null, players: noTeamPlayers });
    }
    
    return result;
  }, [players, teams, invitedPlayerIds]);

  // Calculate attendance stats
  const attendanceStats = useMemo(() => {
    const total = attendance?.length || 0;
    const present = attendance?.filter(a => a.attended === 1).length || 0;
    const absent = attendance?.filter(a => a.attended === 2).length || 0;
    const pending = total - present - absent;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { total, present, absent, pending, percentage };
  }, [attendance]);

  const handleDelete = () => {
    Alert.alert(
      "Usuń trening",
      "Czy na pewno chcesz usunąć ten trening?",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: () => {
            setIsDeleting(true);
            deleteTraining.mutate({ id: Number(id) });
          },
        },
      ]
    );
  };

  const handleToggleAttendance = (playerId: number) => {
    const currentStatus = attendanceMap.get(playerId) || 0;
    // Cycle: 0 (pending) -> 1 (present) -> 2 (absent) -> 0
    const newStatus = currentStatus === 0 ? 1 : currentStatus === 1 ? 2 : 0;
    
    setUpdatingAttendance(playerId);
    setAttendance.mutate({
      trainingId: Number(id),
      playerId,
      attended: newStatus,
    });
  };

  const handleAddToCalendar = async () => {
    if (!training) return;
    
    try {
      await addTrainingToCalendar(
        new Date(training.trainingDate),
        training.trainingTime || null,
        training.location || null,
        training.notes || null
      );
      Alert.alert("Sukces", "Trening został dodany do kalendarza");
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się dodać do kalendarza");
    }
  };

  const getAttendanceIcon = (status: number) => {
    switch (status) {
      case 1: return "check-circle";
      case 2: return "cancel";
      default: return "radio-button-unchecked";
    }
  };

  const getAttendanceColor = (status: number) => {
    switch (status) {
      case 1: return AppColors.success;
      case 2: return AppColors.danger;
      default: return "#64748b";
    }
  };

  const getAttendanceLabel = (status: number) => {
    switch (status) {
      case 1: return "Obecny";
      case 2: return "Nieobecny";
      default: return "Oczekuje";
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </ThemedView>
    );
  }

  if (!training) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.errorText}>Nie znaleziono treningu</ThemedText>
      </ThemedView>
    );
  }

  const trainingDate = new Date(training.trainingDate);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Szczegóły treningu",
          headerStyle: { backgroundColor: AppColors.bgDark },
          headerTintColor: "#fff",
        }}
      />
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* Training Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={[styles.iconContainer, { backgroundColor: AppColors.secondary + "20" }]}>
                <MaterialIcons name="fitness-center" size={32} color={AppColors.secondary} />
              </View>
              <View style={styles.infoHeaderText}>
                <ThemedText style={styles.trainingTitle}>Trening</ThemedText>
                <ThemedText style={styles.trainingDate}>
                  {trainingDate.toLocaleDateString("pl-PL", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </ThemedText>
              </View>
            </View>

            <View style={styles.infoDetails}>
              <View style={styles.infoRow}>
                <MaterialIcons name="access-time" size={20} color="#64748b" />
                <ThemedText style={styles.infoText}>
                  {training.trainingTime || "Czas do ustalenia"}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="location-on" size={20} color="#64748b" />
                <ThemedText style={styles.infoText}>
                  {training.location || "Miejsce do ustalenia"}
                </ThemedText>
              </View>
            </View>

            {training.notes && (
              <View style={styles.notesSection}>
                <ThemedText style={styles.notesLabel}>Notatki:</ThemedText>
                <ThemedText style={styles.notesText}>{training.notes}</ThemedText>
              </View>
            )}

            {/* Calendar button */}
            <Pressable style={styles.calendarBtn} onPress={handleAddToCalendar}>
              <MaterialIcons name="event" size={20} color={AppColors.primary} />
              <ThemedText style={styles.calendarBtnText}>Dodaj do kalendarza</ThemedText>
            </Pressable>
          </View>

          {/* Attendance Stats */}
          {attendance && attendance.length > 0 && (
            <View style={styles.statsCard}>
              <ThemedText style={styles.sectionTitle}>Frekwencja</ThemedText>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: AppColors.success }]}>
                    {attendanceStats.present}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Obecni</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: AppColors.danger }]}>
                    {attendanceStats.absent}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Nieobecni</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: "#64748b" }]}>
                    {attendanceStats.pending}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Oczekuje</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: AppColors.primary }]}>
                    {attendanceStats.percentage}%
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Frekwencja</ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Attendance List */}
          {playersByTeam.length > 0 && (
            <View style={styles.attendanceSection}>
              <ThemedText style={styles.sectionTitle}>Lista obecności</ThemedText>
              <ThemedText style={styles.sectionSubtitle}>
                Dotknij zawodnika, aby zmienić status obecności
              </ThemedText>

              {playersByTeam.map(({ team, players: teamPlayers }) => (
                <View key={team?.id || "no-team"} style={styles.teamGroup}>
                  <ThemedText style={styles.teamGroupTitle}>
                    {team?.name || "Bez zespołu"}
                  </ThemedText>
                  
                  {teamPlayers.map((player) => {
                    const status = attendanceMap.get(player.id) || 0;
                    const isUpdating = updatingAttendance === player.id;
                    
                    return (
                      <Pressable
                        key={player.id}
                        style={[styles.playerRow, isUpdating && styles.playerRowUpdating]}
                        onPress={() => permissions.canEditClub && handleToggleAttendance(player.id)}
                        disabled={!permissions.canEditClub || isUpdating}
                      >
                        <View style={styles.playerInfo}>
                          <ThemedText style={styles.playerName}>{player.name}</ThemedText>
                          <ThemedText style={styles.playerPosition}>{player.position}</ThemedText>
                        </View>
                        
                        {isUpdating ? (
                          <ActivityIndicator size="small" color={AppColors.primary} />
                        ) : (
                          <View style={styles.attendanceStatus}>
                            <MaterialIcons
                              name={getAttendanceIcon(status) as any}
                              size={24}
                              color={getAttendanceColor(status)}
                            />
                            <ThemedText style={[styles.attendanceLabel, { color: getAttendanceColor(status) }]}>
                              {getAttendanceLabel(status)}
                            </ThemedText>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          {/* No attendance records */}
          {(!attendance || attendance.length === 0) && (
            <View style={styles.emptyAttendance}>
              <MaterialIcons name="people-outline" size={48} color="#475569" />
              <ThemedText style={styles.emptyAttendanceText}>
                Brak zaproszonych zawodników
              </ThemedText>
              <ThemedText style={styles.emptyAttendanceHint}>
                Dodaj zawodników podczas tworzenia treningu w kalendarzu
              </ThemedText>
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        {permissions.canEditClub && (
          <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Pressable
              style={[styles.deleteBtn, isDeleting && styles.deleteBtnDisabled]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={AppColors.danger} />
              ) : (
                <>
                  <MaterialIcons name="delete" size={20} color={AppColors.danger} />
                  <ThemedText style={styles.deleteBtnText}>Usuń trening</ThemedText>
                </>
              )}
            </Pressable>
          </View>
        )}
      </ThemedView>
    </>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  errorText: {
    color: "#64748b",
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  infoHeaderText: {
    flex: 1,
  },
  trainingTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  trainingDate: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 2,
    textTransform: "capitalize",
  },
  infoDetails: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: 15,
    color: "#e2e8f0",
  },
  notesSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  notesLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: "#e2e8f0",
    lineHeight: 20,
  },
  calendarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  calendarBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.primary,
  },
  statsCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  attendanceSection: {
    marginBottom: Spacing.lg,
  },
  teamGroup: {
    marginBottom: Spacing.md,
  },
  teamGroupTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  playerRowUpdating: {
    opacity: 0.6,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#fff",
  },
  playerPosition: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  attendanceStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  attendanceLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyAttendance: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyAttendanceText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: Spacing.md,
  },
  emptyAttendanceHint: {
    fontSize: 13,
    color: "#475569",
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AppColors.bgDark,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    padding: Spacing.lg,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: AppColors.danger,
  },
  deleteBtnDisabled: {
    opacity: 0.6,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.danger,
  },
});
