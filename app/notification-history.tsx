import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";

const NOTIFICATION_HISTORY_KEY = '@skm_notification_history';
const MAX_HISTORY_ITEMS = 100;

type NotificationItem = {
  id: string;
  type: 'notification' | 'callup' | 'match_update' | 'training_update' | 'message' | 'sync';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
};

export default function NotificationHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (error) {
      console.error('[NotificationHistory] Error loading:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
  };

  const markAllAsRead = async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
  };

  const clearHistory = async () => {
    setNotifications([]);
    await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY);
  };

  const getIconForType = (type: NotificationItem['type']): string => {
    switch (type) {
      case 'notification':
        return 'notifications';
      case 'callup':
        return 'sports-soccer';
      case 'match_update':
        return 'event';
      case 'training_update':
        return 'fitness-center';
      case 'message':
        return 'message';
      case 'sync':
        return 'sync';
      default:
        return 'info';
    }
  };

  const getColorForType = (type: NotificationItem['type']): string => {
    switch (type) {
      case 'notification':
        return AppColors.primary;
      case 'callup':
        return AppColors.success;
      case 'match_update':
        return AppColors.warning;
      case 'training_update':
        return '#8b5cf6';
      case 'message':
        return '#06b6d4';
      case 'sync':
        return '#64748b';
      default:
        return AppColors.primary;
    }
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Przed chwilą';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min temu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} godz. temu`;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.title}>Historia powiadomień</ThemedText>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <Pressable onPress={markAllAsRead} style={styles.actionButton}>
              <MaterialIcons name="done-all" size={22} color={AppColors.primary} />
            </Pressable>
          )}
          {notifications.length > 0 && (
            <Pressable onPress={clearHistory} style={styles.actionButton}>
              <MaterialIcons name="delete-outline" size={22} color="#64748b" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.notificationItem, !item.read && styles.unreadItem]}
            onPress={() => markAsRead(item.id)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${getColorForType(item.type)}20` }]}>
              <MaterialIcons
                name={getIconForType(item.type) as any}
                size={20}
                color={getColorForType(item.type)}
              />
            </View>
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
              <ThemedText style={styles.itemMessage} numberOfLines={2}>
                {item.message}
              </ThemedText>
              <ThemedText style={styles.timestamp}>{formatTime(item.timestamp)}</ThemedText>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={AppColors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-none" size={64} color="#334155" />
            <ThemedText style={styles.emptyTitle}>Brak powiadomień</ThemedText>
            <ThemedText style={styles.emptyText}>
              Powiadomienia w czasie rzeczywistym pojawią się tutaj
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

// Helper function to add notification to history
export async function addNotificationToHistory(notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    const history: NotificationItem[] = stored ? JSON.parse(stored) : [];

    const newItem: NotificationItem = {
      ...notification,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
    };

    // Add to beginning, limit to MAX_HISTORY_ITEMS
    const updated = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[NotificationHistory] Error adding:', error);
  }
}

// Helper function to get unread count
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    if (!stored) return 0;
    const history: NotificationItem[] = JSON.parse(stored);
    return history.filter((n) => !n.read).length;
  } catch {
    return 0;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    color: "#fff",
  },
  badge: {
    backgroundColor: AppColors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  actionButton: {
    padding: 8,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  unreadItem: {
    backgroundColor: "#1e3a5f",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    color: "#fff",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
  },
  itemMessage: {
    fontSize: 13,
    lineHeight: 18,
    color: "#94a3b8",
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    lineHeight: 14,
    color: "#64748b",
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    color: "#64748b",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
    textAlign: "center",
  },
});
