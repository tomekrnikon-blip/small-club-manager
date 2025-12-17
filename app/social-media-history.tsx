import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

interface SocialPost {
  id: number;
  platform: "facebook" | "instagram";
  contentType: string;
  title: string;
  content: string;
  imageUrl?: string;
  status: "draft" | "scheduled" | "published" | "failed";
  publishedAt?: string;
  externalPostId?: string;
  errorMessage?: string;
  createdAt: string;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  match_preview: "Zapowiedź meczu",
  match_result: "Wynik meczu",
  match_stats: "Statystyki",
  player_highlight: "Wyróżnienie",
  custom: "Własny post",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  draft: { label: "Szkic", color: "#64748b", icon: "edit" },
  scheduled: { label: "Zaplanowany", color: "#f59e0b", icon: "schedule" },
  published: { label: "Opublikowany", color: "#22c55e", icon: "check-circle" },
  failed: { label: "Błąd", color: "#ef4444", icon: "error" },
};

export default function SocialMediaHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "facebook" | "instagram">("all");

  // Mock data for demo - in production this would come from tRPC
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Mock data
    setPosts([
      {
        id: 1,
        platform: "facebook",
        contentType: "match_result",
        title: "Wygrana 3:1 z Orłem Białystok!",
        content: "🎉 ZWYCIĘSTWO!\n\nNasz klub pokonał Orła Białystok 3:1...",
        status: "published",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        externalPostId: "fb_123456789",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        platform: "instagram",
        contentType: "match_result",
        title: "Wygrana 3:1 z Orłem Białystok!",
        content: "🎉 ZWYCIĘSTWO!\n\nNasz klub pokonał Orła Białystok 3:1...",
        status: "published",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        externalPostId: "ig_987654321",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        platform: "facebook",
        contentType: "match_preview",
        title: "Zapowiedź: Mecz z Pogonią Szczecin",
        content: "📅 NADCHODZĄCY MECZ\n\nW sobotę o 15:00 zmierzymy się...",
        status: "scheduled",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 4,
        platform: "facebook",
        contentType: "match_stats",
        title: "Statystyki meczu z Legią",
        content: "📊 STATYSTYKI MECZU\n\nPosiadanie piłki: 55%...",
        status: "failed",
        errorMessage: "Token dostępu wygasł. Połącz ponownie konto Facebook.",
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPosts();
    setIsRefreshing(false);
  };

  const handleOpenPost = (post: SocialPost) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (post.status !== "published" || !post.externalPostId) {
      return;
    }

    let url = "";
    if (post.platform === "facebook") {
      url = `https://www.facebook.com/${post.externalPostId}`;
    } else if (post.platform === "instagram") {
      url = `https://www.instagram.com/p/${post.externalPostId}`;
    }

    if (url) {
      Linking.openURL(url);
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (filter === "all") return true;
    return post.platform === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return "Przed chwilą";
    } else if (diffHours < 24) {
      return `${diffHours}h temu`;
    } else if (diffDays < 7) {
      return `${diffDays}d temu`;
    } else {
      return date.toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const renderPost = ({ item }: { item: SocialPost }) => {
    const statusConfig = STATUS_CONFIG[item.status];

    return (
      <Pressable
        style={styles.postCard}
        onPress={() => handleOpenPost(item)}
        disabled={item.status !== "published"}
      >
        <View style={styles.postHeader}>
          <View
            style={[
              styles.platformBadge,
              {
                backgroundColor:
                  item.platform === "facebook" ? "#1877F2" : "#E4405F",
              },
            ]}
          >
            <MaterialIcons
              name={item.platform === "facebook" ? "facebook" : "photo-camera"}
              size={16}
              color="#fff"
            />
          </View>
          <View style={styles.postMeta}>
            <ThemedText style={styles.contentType}>
              {CONTENT_TYPE_LABELS[item.contentType] || item.contentType}
            </ThemedText>
            <ThemedText style={styles.postDate}>
              {formatDate(item.createdAt)}
            </ThemedText>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.color + "20" },
            ]}
          >
            <MaterialIcons
              name={statusConfig.icon as any}
              size={14}
              color={statusConfig.color}
            />
            <ThemedText
              style={[styles.statusText, { color: statusConfig.color }]}
            >
              {statusConfig.label}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.postTitle} numberOfLines={2}>
          {item.title}
        </ThemedText>

        <ThemedText style={styles.postContent} numberOfLines={3}>
          {item.content}
        </ThemedText>

        {item.status === "failed" && item.errorMessage && (
          <View style={styles.errorBox}>
            <MaterialIcons name="warning" size={16} color={AppColors.danger} />
            <ThemedText style={styles.errorText}>{item.errorMessage}</ThemedText>
          </View>
        )}

        {item.status === "published" && (
          <View style={styles.postFooter}>
            <MaterialIcons name="open-in-new" size={16} color="#64748b" />
            <ThemedText style={styles.openLinkText}>
              Otwórz na {item.platform === "facebook" ? "Facebook" : "Instagram"}
            </ThemedText>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Historia postów</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterTabs}>
        <Pressable
          style={[styles.filterTab, filter === "all" && styles.filterTabActive]}
          onPress={() => setFilter("all")}
        >
          <ThemedText
            style={[
              styles.filterTabText,
              filter === "all" && styles.filterTabTextActive,
            ]}
          >
            Wszystkie
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.filterTab,
            filter === "facebook" && styles.filterTabActive,
          ]}
          onPress={() => setFilter("facebook")}
        >
          <MaterialIcons
            name="facebook"
            size={18}
            color={filter === "facebook" ? "#fff" : "#64748b"}
          />
          <ThemedText
            style={[
              styles.filterTabText,
              filter === "facebook" && styles.filterTabTextActive,
            ]}
          >
            Facebook
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.filterTab,
            filter === "instagram" && styles.filterTabActive,
          ]}
          onPress={() => setFilter("instagram")}
        >
          <MaterialIcons
            name="photo-camera"
            size={18}
            color={filter === "instagram" ? "#fff" : "#64748b"}
          />
          <ThemedText
            style={[
              styles.filterTabText,
              filter === "instagram" && styles.filterTabTextActive,
            ]}
          >
            Instagram
          </ThemedText>
        </Pressable>
      </View>

      {/* Posts list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : filteredPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="history" size={64} color="#334155" />
          <ThemedText style={styles.emptyTitle}>Brak postów</ThemedText>
          <ThemedText style={styles.emptyText}>
            Nie masz jeszcze żadnych postów w historii.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={(item) => `${item.platform}-${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={AppColors.primary}
            />
          }
        />
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
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: AppColors.bgCard,
    gap: Spacing.xs,
  },
  filterTabActive: {
    backgroundColor: AppColors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: "#64748b",
  },
  filterTabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  platformBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  postMeta: {
    flex: 1,
  },
  contentType: {
    fontSize: 12,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  postDate: {
    fontSize: 12,
    color: "#64748b",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.sm,
  },
  postContent: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: AppColors.danger + "15",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: AppColors.danger,
    lineHeight: 18,
  },
  postFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    gap: Spacing.sm,
  },
  openLinkText: {
    fontSize: 14,
    color: "#64748b",
  },
});
