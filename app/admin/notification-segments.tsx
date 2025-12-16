import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import {
  getAllSegments,
  createSegment,
  deleteSegment,
  getSegmentDisplayInfo,
  type NotificationSegment,
  type SegmentType,
  type UserRole,
} from "@/lib/notification-segments";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "owner", label: "Właściciel" },
  { value: "admin", label: "Administrator" },
  { value: "coach", label: "Trener" },
  { value: "player", label: "Zawodnik" },
  { value: "parent", label: "Rodzic" },
  { value: "viewer", label: "Obserwator" },
];

export default function NotificationSegmentsScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [segments, setSegments] = useState<NotificationSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<SegmentType>("role");
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    try {
      const allSegments = await getAllSegments();
      setSegments(allSegments);
    } catch (error) {
      console.error("Error loading segments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      Alert.alert("Błąd", "Podaj nazwę segmentu");
      return;
    }

    setCreating(true);
    try {
      await createSegment(newName, newDescription, newType, {
        roles: selectedRoles.length > 0 ? selectedRoles : undefined,
      });
      await loadSegments();
      setShowCreateModal(false);
      resetForm();
      Alert.alert("Sukces", "Segment został utworzony");
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się utworzyć segmentu");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (segment: NotificationSegment) => {
    if (segment.id.startsWith("seg_") && !segment.id.includes("custom")) {
      Alert.alert("Błąd", "Nie można usunąć predefiniowanego segmentu");
      return;
    }

    Alert.alert("Usuń segment", `Czy na pewno chcesz usunąć segment "${segment.name}"?`, [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: async () => {
          await deleteSegment(segment.id);
          await loadSegments();
        },
      },
    ]);
  };

  const resetForm = () => {
    setNewName("");
    setNewDescription("");
    setNewType("role");
    setSelectedRoles([]);
  };

  const toggleRole = (role: UserRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  if (!isAuthenticated || !user?.isMasterAdmin) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <MaterialIcons name="lock" size={48} color="#64748b" />
        <ThemedText style={styles.emptyText}>
          Brak dostępu - wymagane uprawnienia Master Admin
        </ThemedText>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
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
        <ThemedText style={styles.title}>Segmenty</ThemedText>
        <Pressable onPress={() => setShowCreateModal(true)} style={styles.addButton}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="segment" size={24} color={AppColors.primary} />
          <View style={styles.infoContent}>
            <ThemedText style={styles.infoTitle}>Segmentacja powiadomień</ThemedText>
            <ThemedText style={styles.infoText}>
              Twórz grupy użytkowników i wysyłaj targetowane powiadomienia do
              trenerów, zawodników, rodziców lub własnych segmentów.
            </ThemedText>
          </View>
        </View>

        {/* Predefined Segments */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Predefiniowane segmenty</ThemedText>
          {segments
            .filter((s) => !s.id.includes("custom"))
            .map((segment) => {
              const { icon, color } = getSegmentDisplayInfo(segment);
              return (
                <View key={segment.id} style={styles.segmentCard}>
                  <View style={[styles.segmentIcon, { backgroundColor: color + "20" }]}>
                    <MaterialIcons name={icon as any} size={24} color={color} />
                  </View>
                  <View style={styles.segmentInfo}>
                    <ThemedText style={styles.segmentName}>{segment.name}</ThemedText>
                    <ThemedText style={styles.segmentDescription}>
                      {segment.description}
                    </ThemedText>
                  </View>
                  <View style={styles.segmentBadge}>
                    <MaterialIcons name="lock" size={14} color="#64748b" />
                  </View>
                </View>
              );
            })}
        </View>

        {/* Custom Segments */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Własne segmenty</ThemedText>
          {segments.filter((s) => s.id.includes("custom")).length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="add-circle-outline" size={48} color="#64748b" />
              <ThemedText style={styles.emptyText}>Brak własnych segmentów</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Utwórz własny segment, aby targetować powiadomienia
              </ThemedText>
            </View>
          ) : (
            segments
              .filter((s) => s.id.includes("custom"))
              .map((segment) => {
                const { icon, color } = getSegmentDisplayInfo(segment);
                return (
                  <View key={segment.id} style={styles.segmentCard}>
                    <View style={[styles.segmentIcon, { backgroundColor: color + "20" }]}>
                      <MaterialIcons name={icon as any} size={24} color={color} />
                    </View>
                    <View style={styles.segmentInfo}>
                      <ThemedText style={styles.segmentName}>{segment.name}</ThemedText>
                      <ThemedText style={styles.segmentDescription}>
                        {segment.description}
                      </ThemedText>
                      {segment.criteria.roles && (
                        <View style={styles.criteriaRow}>
                          <ThemedText style={styles.criteriaLabel}>Role:</ThemedText>
                          <ThemedText style={styles.criteriaValue}>
                            {segment.criteria.roles.join(", ")}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDelete(segment)}
                    >
                      <MaterialIcons name="delete" size={20} color={AppColors.danger} />
                    </Pressable>
                  </View>
                );
              })
          )}
        </View>
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Nowy segment</ThemedText>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Nazwa</ThemedText>
                <TextInput
                  style={styles.input}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="np. Aktywni zawodnicy"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Opis</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newDescription}
                  onChangeText={setNewDescription}
                  placeholder="Opis segmentu..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Role (opcjonalnie)</ThemedText>
                <View style={styles.rolesGrid}>
                  {ROLE_OPTIONS.map((role) => (
                    <Pressable
                      key={role.value}
                      style={[
                        styles.roleChip,
                        selectedRoles.includes(role.value) && styles.roleChipSelected,
                      ]}
                      onPress={() => toggleRole(role.value)}
                    >
                      <ThemedText
                        style={[
                          styles.roleChipText,
                          selectedRoles.includes(role.value) && styles.roleChipTextSelected,
                        ]}
                      >
                        {role.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            <Pressable
              style={[styles.createButton, creating && styles.createButtonDisabled]}
              onPress={handleCreate}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="add" size={20} color="#fff" />
                  <ThemedText style={styles.createButtonText}>Utwórz segment</ThemedText>
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
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "bold",
    color: "#fff",
  },
  addButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#94a3b8",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  segmentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  segmentIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  segmentInfo: {
    flex: 1,
  },
  segmentName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  segmentDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
  },
  segmentBadge: {
    padding: Spacing.xs,
  },
  criteriaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  criteriaLabel: {
    fontSize: 10,
    lineHeight: 14,
    color: "#64748b",
  },
  criteriaValue: {
    fontSize: 10,
    lineHeight: 14,
    color: AppColors.primary,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  emptyContainer: {
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#64748b",
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 12,
    lineHeight: 18,
    color: "#475569",
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: AppColors.bgCard,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  modalBody: {
    padding: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#94a3b8",
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: AppColors.bgDark,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: "#fff",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  rolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  roleChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: AppColors.bgDark,
    borderWidth: 1,
    borderColor: "#334155",
  },
  roleChipSelected: {
    backgroundColor: AppColors.primary + "20",
    borderColor: AppColors.primary,
  },
  roleChipText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
  },
  roleChipTextSelected: {
    color: AppColors.primary,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
});
