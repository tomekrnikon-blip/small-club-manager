import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View, Alert, TextInput, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useOfflineQuery } from "@/hooks/use-offline-query";
import { OfflineIndicator } from "@/components/offline-indicator";
import { addTrainingToCalendar } from "@/lib/system-calendar";

export default function TrainingsScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();

  const [showAddModal, setShowAddModal] = useState(false);
  const [trainingDate, setTrainingDate] = useState("");
  const [trainingTime, setTrainingTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  const trainingsQuery = trpc.trainings.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: trainings, isLoading, isFromCache, isStale, isOffline } = useOfflineQuery(
    trainingsQuery,
    { cacheKey: `trainings_${club?.id}`, enabled: !!club?.id }
  );

  const createMutation = trpc.trainings.create.useMutation({
    onSuccess: () => {
      utils.trainings.list.invalidate();
      utils.calendar.getEvents.invalidate();
      setShowAddModal(false);
      resetForm();
      Alert.alert("Sukces", "Trening został dodany!");
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const resetForm = () => {
    setTrainingDate("");
    setTrainingTime("");
    setLocation("");
    setDescription("");
  };

  const handleCreate = () => {
    if (!trainingDate) {
      Alert.alert("Błąd", "Podaj datę treningu");
      return;
    }

    if (!club?.id) {
      Alert.alert("Błąd", "Nie znaleziono klubu");
      return;
    }

    createMutation.mutate({
      clubId: club.id,
      trainingDate,
      trainingTime: trainingTime.trim() || undefined,
      location: location.trim() || undefined,
      notes: description.trim() || undefined,
    });
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Zaloguj się, aby zobaczyć treningi</ThemedText>
      </ThemedView>
    );
  }

  if (!club) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Utwórz klub, aby dodać treningi</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.title}>Treningi</ThemedText>
          <OfflineIndicator isFromCache={isFromCache} isStale={isStale} isOffline={isOffline} compact />
        </View>
        <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Trainings list */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : (
        <FlatList
          data={trainings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <TrainingCard training={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="fitness-center" size={64} color="#334155" />
              <ThemedText style={styles.emptyTitle}>Brak treningów</ThemedText>
              <ThemedText style={styles.emptyText}>
                Dodaj pierwszy trening
              </ThemedText>
            </View>
          }
        />
      )}

      {/* Add Training Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Dodaj trening</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <MaterialIcons name="close" size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Data *</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="RRRR-MM-DD"
                  placeholderTextColor="#64748b"
                  value={trainingDate}
                  onChangeText={setTrainingDate}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Godzina</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="GG:MM"
                  placeholderTextColor="#64748b"
                  value={trainingTime}
                  onChangeText={setTrainingTime}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Miejsce</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="np. Boisko główne"
                  placeholderTextColor="#64748b"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Opis</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Opis treningu..."
                  placeholderTextColor="#64748b"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <Pressable
              style={[styles.submitButton, createMutation.isPending && styles.submitButtonDisabled]}
              onPress={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitText}>Dodaj trening</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

function TrainingCard({ training }: { training: any }) {
  const trainingDate = new Date(training.trainingDate);
  const isPast = trainingDate < new Date();

  const handleAddToCalendar = async () => {
    const eventId = await addTrainingToCalendar(
      trainingDate,
      training.trainingTime ?? null,
      training.location ?? null,
      training.description ?? null
    );
    if (eventId) {
      Alert.alert('Sukces', 'Trening został dodany do kalendarza');
    }
  };

  return (
    <View style={[styles.trainingCard, isPast && styles.trainingCardPast]}>
      <View style={styles.trainingLeft}>
        <View style={[styles.trainingIcon, isPast && styles.trainingIconPast]}>
          <MaterialIcons
            name="fitness-center"
            size={24}
            color={isPast ? "#64748b" : AppColors.secondary}
          />
        </View>
        <View style={styles.trainingInfo}>
          <ThemedText style={styles.trainingDate}>
            {trainingDate.toLocaleDateString("pl-PL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </ThemedText>
          <View style={styles.trainingMeta}>
            {training.trainingTime && (
              <View style={styles.metaItem}>
                <MaterialIcons name="schedule" size={14} color="#64748b" />
                <ThemedText style={styles.metaText}>{training.trainingTime}</ThemedText>
              </View>
            )}
            {training.location && (
              <View style={styles.metaItem}>
                <MaterialIcons name="location-on" size={14} color="#64748b" />
                <ThemedText style={styles.metaText}>{training.location}</ThemedText>
              </View>
            )}
          </View>
          {training.description && (
            <ThemedText style={styles.trainingDescription} numberOfLines={2}>
              {training.description}
            </ThemedText>
          )}
        </View>
      </View>
      {!isPast && (
        <Pressable style={styles.calendarButton} onPress={handleAddToCalendar}>
          <MaterialIcons name="event" size={20} color={AppColors.secondary} />
        </Pressable>
      )}
    </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  addButton: {
    backgroundColor: AppColors.secondary,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  trainingCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.secondary,
    flexDirection: "row",
    alignItems: "center",
  },
  trainingCardPast: {
    opacity: 0.7,
    borderLeftColor: "#475569",
  },
  trainingLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: AppColors.secondary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.sm,
  },
  trainingIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: AppColors.secondary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  trainingIconPast: {
    backgroundColor: "#334155",
  },
  trainingInfo: {
    flex: 1,
  },
  trainingDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.xs,
    textTransform: "capitalize",
  },
  trainingMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#64748b",
  },
  trainingDescription: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: AppColors.bgCard,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  modalForm: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
  },
  input: {
    backgroundColor: AppColors.bgElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: "#fff",
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: AppColors.secondary,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
