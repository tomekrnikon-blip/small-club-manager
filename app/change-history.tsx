import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

type EntityType = "training" | "match" | "player" | "team" | "finance";
type ActionType = "create" | "update" | "delete";

interface ChangeItem {
  id: number;
  entityType: EntityType;
  entityId: number;
  action: ActionType;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string | null;
  canRevert: boolean;
  revertedAt: Date | null;
  createdAt: Date;
  userId: number;
}

export default function ChangeHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [selectedType, setSelectedType] = useState<EntityType | "all">("all");

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const { data: changes, isLoading, refetch } = trpc.changeHistory.list.useQuery(
    { 
      clubId: club?.id ?? 0, 
      entityType: selectedType === "all" ? undefined : selectedType,
      limit: 100,
    },
    { enabled: !!club?.id }
  );

  const revert = trpc.changeHistory.revert.useMutation({
    onSuccess: () => {
      Alert.alert("Sukces", "Zmiana została cofnięta");
      refetch();
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const handleRevert = (change: ChangeItem) => {
    Alert.alert(
      "Cofnij zmianę",
      `Czy na pewno chcesz cofnąć tę zmianę?\n\n${change.description || getChangeDescription(change)}`,
      [
        { text: "Anuluj", style: "cancel" },
        { 
          text: "Cofnij", 
          style: "destructive",
          onPress: () => revert.mutate({ changeId: change.id }),
        },
      ]
    );
  };

  const getEntityIcon = (type: EntityType): keyof typeof MaterialIcons.glyphMap => {
    switch (type) {
      case "training": return "fitness-center";
      case "match": return "sports-soccer";
      case "player": return "person";
      case "team": return "groups";
      case "finance": return "payments";
      default: return "history";
    }
  };

  const getEntityColor = (type: EntityType): string => {
    switch (type) {
      case "training": return "#f59e0b";
      case "match": return "#a855f7";
      case "player": return "#3b82f6";
      case "team": return "#22c55e";
      case "finance": return "#ef4444";
      default: return "#64748b";
    }
  };

  const getActionIcon = (action: ActionType): keyof typeof MaterialIcons.glyphMap => {
    switch (action) {
      case "create": return "add-circle";
      case "update": return "edit";
      case "delete": return "delete";
      default: return "history";
    }
  };

  const getActionColor = (action: ActionType): string => {
    switch (action) {
      case "create": return "#22c55e";
      case "update": return "#3b82f6";
      case "delete": return "#ef4444";
      default: return "#64748b";
    }
  };

  const getChangeDescription = (change: ChangeItem): string => {
    const entityNames: Record<EntityType, string> = {
      training: "Trening",
      match: "Mecz",
      player: "Zawodnik",
      team: "Drużyna",
      finance: "Finanse",
    };

    const actionNames: Record<ActionType, string> = {
      create: "Utworzono",
      update: "Zaktualizowano",
      delete: "Usunięto",
    };

    let desc = `${actionNames[change.action]} ${entityNames[change.entityType]}`;
    
    if (change.fieldName && change.action === "update") {
      desc += ` (${change.fieldName})`;
    }

    return desc;
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Przed chwilą";
    if (hours < 24) return `${hours}h temu`;
    if (days < 7) return `${days}d temu`;
    
    return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
  };

  const renderChange = ({ item }: { item: ChangeItem }) => {
    const isReverted = !!item.revertedAt;

    return (
      <View style={[styles.changeCard, isReverted && styles.changeCardReverted]}>
        <View style={styles.changeHeader}>
          <View style={[styles.entityIcon, { backgroundColor: getEntityColor(item.entityType) + "20" }]}>
            <MaterialIcons 
              name={getEntityIcon(item.entityType)} 
              size={20} 
              color={getEntityColor(item.entityType)} 
            />
          </View>
          <View style={styles.changeInfo}>
            <ThemedText style={styles.changeDesc}>
              {item.description || getChangeDescription(item)}
            </ThemedText>
            <View style={styles.changeMeta}>
              <View style={[styles.actionBadge, { backgroundColor: getActionColor(item.action) + "20" }]}>
                <MaterialIcons 
                  name={getActionIcon(item.action)} 
                  size={12} 
                  color={getActionColor(item.action)} 
                />
                <ThemedText style={[styles.actionText, { color: getActionColor(item.action) }]}>
                  {item.action === "create" ? "Nowe" : item.action === "update" ? "Edycja" : "Usunięcie"}
                </ThemedText>
              </View>
              <ThemedText style={styles.changeTime}>{formatDate(item.createdAt)}</ThemedText>
            </View>
          </View>
        </View>

        {/* Value changes */}
        {item.action === "update" && item.fieldName && (
          <View style={styles.valueChange}>
            <View style={styles.valueRow}>
              <ThemedText style={styles.valueLabel}>Przed:</ThemedText>
              <ThemedText style={styles.oldValue}>{item.oldValue || "-"}</ThemedText>
            </View>
            <View style={styles.valueRow}>
              <ThemedText style={styles.valueLabel}>Po:</ThemedText>
              <ThemedText style={styles.newValue}>{item.newValue || "-"}</ThemedText>
            </View>
          </View>
        )}

        {/* Revert button */}
        {item.canRevert && !isReverted && (
          <Pressable 
            style={styles.revertBtn}
            onPress={() => handleRevert(item)}
            disabled={revert.isPending}
          >
            <MaterialIcons name="undo" size={16} color="#f59e0b" />
            <ThemedText style={styles.revertText}>Cofnij zmianę</ThemedText>
          </Pressable>
        )}

        {isReverted && (
          <View style={styles.revertedBadge}>
            <MaterialIcons name="check-circle" size={14} color="#64748b" />
            <ThemedText style={styles.revertedText}>
              Cofnięto {formatDate(item.revertedAt!)}
            </ThemedText>
          </View>
        )}
      </View>
    );
  };

  const filterOptions: { value: EntityType | "all"; label: string }[] = [
    { value: "all", label: "Wszystkie" },
    { value: "training", label: "Treningi" },
    { value: "match", label: "Mecze" },
    { value: "player", label: "Zawodnicy" },
    { value: "team", label: "Drużyny" },
    { value: "finance", label: "Finanse" },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Historia zmian</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <FlatList
          horizontal
          data={filterOptions}
          keyExtractor={item => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.filterChip,
                selectedType === item.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType(item.value)}
            >
              <ThemedText style={[
                styles.filterText,
                selectedType === item.value && styles.filterTextActive,
              ]}>
                {item.label}
              </ThemedText>
            </Pressable>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : changes && changes.length > 0 ? (
        <FlatList
          data={changes}
          renderItem={renderChange}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.empty}>
          <MaterialIcons name="history" size={64} color="#334155" />
          <ThemedText style={styles.emptyText}>Brak historii zmian</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Zmiany w harmonogramie będą tutaj zapisywane
          </ThemedText>
        </View>
      )}
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
  filters: {
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  filterList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: "#1e293b",
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: AppColors.primary,
  },
  filterText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: Spacing.lg,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
  },
  changeCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  changeCardReverted: {
    opacity: 0.6,
  },
  changeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  entityIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  changeInfo: {
    flex: 1,
  },
  changeDesc: {
    fontSize: 15,
    color: "#fff",
    marginBottom: Spacing.xs,
  },
  changeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "500",
  },
  changeTime: {
    fontSize: 12,
    color: "#64748b",
  },
  valueChange: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: "#0f172a",
    borderRadius: Radius.md,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  valueLabel: {
    fontSize: 12,
    color: "#64748b",
    width: 50,
  },
  oldValue: {
    fontSize: 13,
    color: "#ef4444",
    flex: 1,
    textDecorationLine: "line-through",
  },
  newValue: {
    fontSize: 13,
    color: "#22c55e",
    flex: 1,
  },
  revertBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: "#f59e0b20",
  },
  revertText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#f59e0b",
  },
  revertedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  revertedText: {
    fontSize: 12,
    color: "#64748b",
  },
});
