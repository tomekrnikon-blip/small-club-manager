import { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

const CATEGORIES = [
  { key: undefined, label: "Wszystkie" },
  { key: "auth", label: "Autoryzacja" },
  { key: "club", label: "Klub" },
  { key: "member", label: "Członkowie" },
  { key: "finance", label: "Finanse" },
  { key: "config", label: "Konfiguracja" },
  { key: "admin", label: "Admin" },
  { key: "subscription", label: "Subskrypcje" },
] as const;

const ACTION_ICONS: Record<string, string> = {
  "user.login": "log-in",
  "user.logout": "log-out",
  "user.pro_granted": "star",
  "user.pro_revoked": "star-outline",
  "member.invited": "person-add",
  "member.role_changed": "swap-horizontal",
  "member.removed": "person-remove",
  "club.created": "add-circle",
  "club.settings_updated": "settings",
  "finance.transaction_created": "cash",
  "config.sms_updated": "chatbubble",
  "config.email_updated": "mail",
  "subscription.purchased": "card",
  "subscription.cancelled": "close-circle",
  "2fa.enabled": "shield-checkmark",
  "2fa.disabled": "shield-outline",
};

export default function AuditLogsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  
  const { data: logs, isLoading, refetch } = trpc.masterAdmin.getAuditLogs.useQuery({
    category: selectedCategory as any,
    limit: 100,
  });
  
  const { data: stats } = trpc.masterAdmin.getAuditStats.useQuery();
  
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  const getActionIcon = (action: string) => {
    return ACTION_ICONS[action] || "ellipse";
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "auth": return "#3b82f6";
      case "club": return "#22c55e";
      case "member": return "#f59e0b";
      case "finance": return "#ef4444";
      case "config": return "#8b5cf6";
      case "admin": return "#ec4899";
      case "subscription": return "#06b6d4";
      default: return "#6b7280";
    }
  };
  
  const renderLogItem = ({ item }: { item: any }) => (
    <View style={styles.logItem}>
      <View style={[styles.logIcon, { backgroundColor: getCategoryColor(item.category) + "20" }]}>
        <Ionicons 
          name={getActionIcon(item.action) as any} 
          size={20} 
          color={getCategoryColor(item.category)} 
        />
      </View>
      <View style={styles.logContent}>
        <View style={styles.logHeader}>
          <ThemedText style={styles.logAction}>{item.action}</ThemedText>
          <ThemedText style={styles.logDate}>{formatDate(item.createdAt)}</ThemedText>
        </View>
        <ThemedText style={styles.logUser}>
          {item.userEmail || `User #${item.userId}`}
        </ThemedText>
        {item.targetType && (
          <ThemedText style={styles.logTarget}>
            {item.targetType}: #{item.targetId}
          </ThemedText>
        )}
        {item.details && (
          <ThemedText style={styles.logDetails}>
            {JSON.stringify(item.details)}
          </ThemedText>
        )}
      </View>
    </View>
  );
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </Pressable>
        <ThemedText type="title" style={styles.title}>Logi Audytu</ThemedText>
        <Pressable onPress={() => refetch()} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={Colors.dark.text} />
        </Pressable>
      </View>
      
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{stats.total || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Łącznie</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{Object.keys(stats.byCategory || {}).length}</ThemedText>
            <ThemedText style={styles.statLabel}>Kategorie</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{Object.keys(stats.byAction || {}).length}</ThemedText>
            <ThemedText style={styles.statLabel}>Akcje</ThemedText>
          </View>
        </View>
      )}
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key || "all"}
            style={[
              styles.filterChip,
              selectedCategory === cat.key && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <ThemedText style={[
              styles.filterChipText,
              selectedCategory === cat.key && styles.filterChipTextActive,
            ]}>
              {cat.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
        </View>
      ) : (
        <FlatList
          data={logs || []}
          renderItem={renderLogItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#6b7280" />
              <ThemedText style={styles.emptyText}>Brak logów</ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f1f1f",
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
  },
  statsRow: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#22c55e",
  },
  statLabel: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },
  filterScroll: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#1f1f1f",
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#22c55e",
  },
  filterChipText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  logItem: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logAction: {
    fontWeight: "600",
    fontSize: 14,
  },
  logDate: {
    color: "#6b7280",
    fontSize: 12,
  },
  logUser: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 4,
  },
  logTarget: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  logDetails: {
    color: "#4b5563",
    fontSize: 11,
    marginTop: 4,
    fontFamily: "monospace",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#6b7280",
    marginTop: 12,
  },
});
