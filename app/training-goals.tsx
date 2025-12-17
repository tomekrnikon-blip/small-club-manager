import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

type GoalType = "goals" | "assists" | "attendance" | "rating" | "custom";
type GoalStatus = "active" | "completed" | "failed";

interface Goal {
  id: number;
  type: GoalType;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  endDate?: string;
  status: GoalStatus;
}

const GOAL_TYPES: { value: GoalType; label: string; icon: keyof typeof MaterialIcons.glyphMap; color: string }[] = [
  { value: "goals", label: "Bramki", icon: "sports-soccer", color: "#22c55e" },
  { value: "assists", label: "Asysty", icon: "handshake", color: "#3b82f6" },
  { value: "attendance", label: "Frekwencja", icon: "fitness-center", color: "#a855f7" },
  { value: "rating", label: "Ocena", icon: "star", color: "#eab308" },
  { value: "custom", label: "Własny", icon: "flag", color: "#64748b" },
];

export default function TrainingGoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  
  // Form state
  const [goalType, setGoalType] = useState<GoalType>("goals");
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const { data: players, isLoading } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  // Mock goals data
  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, type: "goals", title: "10 bramek w sezonie", targetValue: 10, currentValue: 7, status: "active" },
    { id: 2, type: "assists", title: "5 asyst w miesiącu", targetValue: 5, currentValue: 5, status: "completed" },
    { id: 3, type: "attendance", title: "90% frekwencji", targetValue: 90, currentValue: 85, status: "active" },
    { id: 4, type: "rating", title: "Średnia ocen 4.5", targetValue: 45, currentValue: 42, status: "active" },
  ]);

  const filteredGoals = goals.filter(goal => {
    if (filter === "all") return true;
    if (filter === "active") return goal.status === "active";
    if (filter === "completed") return goal.status === "completed";
    return true;
  });

  const getGoalTypeInfo = (type: GoalType) => {
    return GOAL_TYPES.find(t => t.value === type) || GOAL_TYPES[4];
  };

  const getProgressPercent = (goal: Goal) => {
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  const handleCreateGoal = () => {
    if (!title || !targetValue) return;
    
    const newGoal: Goal = {
      id: Date.now(),
      type: goalType,
      title,
      targetValue: parseInt(targetValue),
      currentValue: 0,
      status: "active",
    };
    
    setGoals([newGoal, ...goals]);
    setShowCreateModal(false);
    setTitle("");
    setTargetValue("");
    setGoalType("goals");
  };

  const handleDeleteGoal = (id: number) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Cele treningowe</ThemedText>
        <Pressable onPress={() => setShowCreateModal(true)} style={styles.addBtn}>
          <MaterialIcons name="add" size={24} color={AppColors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <ThemedText style={styles.summaryValue}>
              {goals.filter(g => g.status === "active").length}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>Aktywne</ThemedText>
          </View>
          <View style={styles.summaryCard}>
            <ThemedText style={[styles.summaryValue, { color: "#22c55e" }]}>
              {goals.filter(g => g.status === "completed").length}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>Ukończone</ThemedText>
          </View>
          <View style={styles.summaryCard}>
            <ThemedText style={[styles.summaryValue, { color: "#eab308" }]}>
              {Math.round(goals.reduce((sum, g) => sum + getProgressPercent(g), 0) / goals.length)}%
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>Śr. postęp</ThemedText>
          </View>
        </View>

        {/* Filter */}
        <View style={styles.filterContainer}>
          {(["all", "active", "completed"] as const).map(f => (
            <Pressable
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <ThemedText style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === "all" ? "Wszystkie" : f === "active" ? "Aktywne" : "Ukończone"}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Goals List */}
        {filteredGoals.map(goal => {
          const typeInfo = getGoalTypeInfo(goal.type);
          const progress = getProgressPercent(goal);
          const isCompleted = goal.status === "completed";
          
          return (
            <View key={goal.id} style={[styles.goalCard, isCompleted && styles.goalCardCompleted]}>
              <View style={styles.goalHeader}>
                <View style={[styles.goalIcon, { backgroundColor: typeInfo.color + "20" }]}>
                  <MaterialIcons name={typeInfo.icon} size={20} color={typeInfo.color} />
                </View>
                <View style={styles.goalInfo}>
                  <ThemedText style={styles.goalTitle}>{goal.title}</ThemedText>
                  <ThemedText style={styles.goalType}>{typeInfo.label}</ThemedText>
                </View>
                {isCompleted ? (
                  <View style={styles.completedBadge}>
                    <MaterialIcons name="check-circle" size={20} color="#22c55e" />
                  </View>
                ) : (
                  <Pressable onPress={() => handleDeleteGoal(goal.id)} style={styles.deleteBtn}>
                    <MaterialIcons name="close" size={18} color="#64748b" />
                  </Pressable>
                )}
              </View>
              
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${progress}%`,
                        backgroundColor: isCompleted ? "#22c55e" : typeInfo.color,
                      }
                    ]} 
                  />
                </View>
                <View style={styles.progressLabels}>
                  <ThemedText style={styles.progressText}>
                    {goal.currentValue} / {goal.targetValue}
                  </ThemedText>
                  <ThemedText style={[styles.progressPercent, { color: typeInfo.color }]}>
                    {Math.round(progress)}%
                  </ThemedText>
                </View>
              </View>
            </View>
          );
        })}

        {filteredGoals.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="flag" size={64} color="#334155" />
            <ThemedText style={styles.emptyText}>Brak celów do wyświetlenia</ThemedText>
            <Pressable style={styles.emptyBtn} onPress={() => setShowCreateModal(true)}>
              <ThemedText style={styles.emptyBtnText}>Dodaj pierwszy cel</ThemedText>
            </Pressable>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Nowy cel</ThemedText>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>

            {/* Goal Type Selection */}
            <ThemedText style={styles.inputLabel}>Typ celu</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {GOAL_TYPES.map(type => (
                <Pressable
                  key={type.value}
                  style={[
                    styles.typeChip,
                    goalType === type.value && { backgroundColor: type.color + "30", borderColor: type.color },
                  ]}
                  onPress={() => setGoalType(type.value)}
                >
                  <MaterialIcons 
                    name={type.icon} 
                    size={18} 
                    color={goalType === type.value ? type.color : "#64748b"} 
                  />
                  <ThemedText style={[
                    styles.typeLabel,
                    goalType === type.value && { color: type.color },
                  ]}>
                    {type.label}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            {/* Title Input */}
            <ThemedText style={styles.inputLabel}>Nazwa celu</ThemedText>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="np. 10 bramek w sezonie"
              placeholderTextColor="#64748b"
            />

            {/* Target Value Input */}
            <ThemedText style={styles.inputLabel}>Wartość docelowa</ThemedText>
            <TextInput
              style={styles.input}
              value={targetValue}
              onChangeText={setTargetValue}
              placeholder="np. 10"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
            />

            {/* Create Button */}
            <Pressable 
              style={[styles.createBtn, (!title || !targetValue) && styles.createBtnDisabled]}
              onPress={handleCreateGoal}
              disabled={!title || !targetValue}
            >
              <ThemedText style={styles.createBtnText}>Utwórz cel</ThemedText>
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
  addBtn: {
    padding: Spacing.xs,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: AppColors.primary,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Radius.sm,
  },
  filterBtnActive: {
    backgroundColor: AppColors.primary,
  },
  filterText: {
    fontSize: 13,
    color: "#64748b",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  goalCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  goalCardCompleted: {
    borderWidth: 1,
    borderColor: "#22c55e30",
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  goalType: {
    fontSize: 12,
    color: "#64748b",
  },
  completedBadge: {
    padding: 4,
  },
  deleteBtn: {
    padding: 4,
  },
  progressSection: {
    gap: 6,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#0f172a",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 12,
    color: "#64748b",
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
  },
  emptyBtn: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  emptyBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1e293b",
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
    fontWeight: "700",
    color: "#fff",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  typeScroll: {
    marginBottom: Spacing.sm,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0f172a",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  input: {
    backgroundColor: "#0f172a",
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: "#fff",
  },
  createBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
