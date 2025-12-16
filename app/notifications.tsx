import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

const notificationIcons: Record<string, { icon: string; color: string }> = {
  match: { icon: "sports-soccer", color: AppColors.primary },
  training: { icon: "fitness-center", color: AppColors.secondary },
  payment: { icon: "payment", color: AppColors.warning },
  callup: { icon: "people", color: AppColors.success },
  system: { icon: "info", color: "#64748b" },
};

export default function NotificationsScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  const { data: notifications, isLoading } = trpc.notifications.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const markAsReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
    },
  });

  // Mark all as read - iterate through unread notifications
  const handleMarkAllAsRead = async () => {
    if (!notifications) return;
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    for (const notification of unreadNotifications) {
      await markAsReadMutation.mutateAsync({ id: notification.id });
    }
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Zaloguj się, aby zobaczyć powiadomienia</ThemedText>
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
        <ThemedText style={styles.title}>Powiadomienia</ThemedText>
        {unreadCount > 0 && (
          <Pressable
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
            disabled={markAsReadMutation.isPending}
          >
            <ThemedText style={styles.markAllText}>Oznacz wszystkie</ThemedText>
          </Pressable>
        )}
        {unreadCount === 0 && <View style={{ width: 44 }} />}
      </View>

      {/* Unread Count */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <MaterialIcons name="notifications-active" size={20} color={AppColors.primary} />
          <ThemedText style={styles.unreadText}>
            {unreadCount} {unreadCount === 1 ? "nowe powiadomienie" : "nowych powiadomień"}
          </ThemedText>
        </View>
      )}

      {/* Notifications list */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={() => {
                if (!item.isRead) {
                  markAsReadMutation.mutate({ id: item.id });
                }
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="notifications-off" size={64} color="#334155" />
              <ThemedText style={styles.emptyTitle}>Brak powiadomień</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Tutaj pojawią się Twoje powiadomienia
              </ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

function NotificationCard({
  notification,
  onPress,
}: {
  notification: any;
  onPress: () => void;
}) {
  const config = notificationIcons[notification.type] || notificationIcons.system;
  const createdAt = new Date(notification.createdAt);
  const timeAgo = getTimeAgo(createdAt);

  return (
    <Pressable
      style={[styles.notificationCard, !notification.isRead && styles.notificationUnread]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: config.color + "20" }]}>
        <MaterialIcons name={config.icon as any} size={22} color={config.color} />
      </View>
      <View style={styles.notificationContent}>
        <ThemedText style={styles.notificationTitle}>{notification.title}</ThemedText>
        <ThemedText style={styles.notificationMessage} numberOfLines={2}>
          {notification.message}
        </ThemedText>
        <ThemedText style={styles.notificationTime}>{timeAgo}</ThemedText>
      </View>
      {!notification.isRead && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Teraz";
  if (diffMins < 60) return `${diffMins} min temu`;
  if (diffHours < 24) return `${diffHours} godz. temu`;
  if (diffDays < 7) return `${diffDays} dni temu`;
  return date.toLocaleDateString("pl-PL");
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
  markAllButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  markAllText: {
    fontSize: 13,
    color: AppColors.primary,
    fontWeight: "500",
  },
  unreadBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary + "15",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  unreadText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  notificationUnread: {
    backgroundColor: AppColors.bgElevated,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#64748b",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
    marginLeft: Spacing.sm,
    marginTop: 6,
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
  emptySubtitle: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
  },
});
