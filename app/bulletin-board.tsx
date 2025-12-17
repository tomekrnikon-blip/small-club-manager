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

type Priority = "normal" | "important" | "urgent";

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: Priority;
  pinned: boolean;
  authorName: string;
  publishedAt: string;
  isRead: boolean;
}

const PRIORITY_INFO: Record<Priority, { icon: keyof typeof MaterialIcons.glyphMap; color: string; label: string }> = {
  normal: { icon: "info", color: "#64748b", label: "Normalny" },
  important: { icon: "warning", color: "#f59e0b", label: "Ważne" },
  urgent: { icon: "error", color: "#ef4444", label: "Pilne" },
};

export default function BulletinBoardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "pinned">("all");
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [pinned, setPinned] = useState(false);

  const { data: clubs, isLoading: clubsLoading } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  // Mock announcements data
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      title: "Zmiana terminu treningu",
      content: "W związku z remontem hali, trening w środę 15.01 został przeniesiony na czwartek 16.01 o tej samej godzinie. Przepraszamy za utrudnienia.",
      priority: "urgent",
      pinned: true,
      authorName: "Trener Kowalski",
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: false,
    },
    {
      id: 2,
      title: "Składka na turniej",
      content: "Przypominamy o wpłacie składki na turniej zimowy do końca tygodnia. Kwota: 150 zł. Wpłaty u kierownika drużyny.",
      priority: "important",
      pinned: true,
      authorName: "Zarząd klubu",
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
    {
      id: 3,
      title: "Nowe stroje meczowe",
      content: "Informujemy, że zamówiliśmy nowe stroje meczowe. Przymiarki odbędą się w przyszłym tygodniu po treningu.",
      priority: "normal",
      pinned: false,
      authorName: "Kierownik drużyny",
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
    {
      id: 4,
      title: "Spotkanie z rodzicami",
      content: "Zapraszamy wszystkich rodziców na spotkanie organizacyjne w piątek o 18:00 w sali konferencyjnej klubu.",
      priority: "normal",
      pinned: false,
      authorName: "Trener Kowalski",
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: false,
    },
  ]);

  const filteredAnnouncements = announcements.filter(a => {
    if (filter === "unread") return !a.isRead;
    if (filter === "pinned") return a.pinned;
    return true;
  }).sort((a, b) => {
    // Pinned first, then by date
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const unreadCount = announcements.filter(a => !a.isRead).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Przed chwilą";
    if (diffHours < 24) return `${diffHours}h temu`;
    if (diffDays < 7) return `${diffDays}d temu`;
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
  };

  const handleCreateAnnouncement = () => {
    if (!title || !content) return;
    
    const newAnnouncement: Announcement = {
      id: Date.now(),
      title,
      content,
      priority,
      pinned,
      authorName: "Ty",
      publishedAt: new Date().toISOString(),
      isRead: true,
    };
    
    setAnnouncements([newAnnouncement, ...announcements]);
    setShowCreateModal(false);
    setTitle("");
    setContent("");
    setPriority("normal");
    setPinned(false);
  };

  const markAsRead = (id: number) => {
    setAnnouncements(announcements.map(a => 
      a.id === id ? { ...a, isRead: true } : a
    ));
  };

  const openAnnouncement = (announcement: Announcement) => {
    markAsRead(announcement.id);
    setSelectedAnnouncement(announcement);
  };

  if (clubsLoading) {
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
        <ThemedText style={styles.headerTitle}>Tablica ogłoszeń</ThemedText>
        <Pressable onPress={() => setShowCreateModal(true)} style={styles.addBtn}>
          <MaterialIcons name="add" size={24} color={AppColors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{announcements.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Ogłoszeń</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, unreadCount > 0 && { color: AppColors.primary }]}>
              {unreadCount}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Nieprzeczytanych</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>
              {announcements.filter(a => a.pinned).length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Przypiętych</ThemedText>
          </View>
        </View>

        {/* Filter */}
        <View style={styles.filterContainer}>
          {(["all", "unread", "pinned"] as const).map(f => (
            <Pressable
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <ThemedText style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === "all" ? "Wszystkie" : f === "unread" ? "Nieprzeczytane" : "Przypięte"}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Announcements List */}
        {filteredAnnouncements.map(announcement => {
          const priorityInfo = PRIORITY_INFO[announcement.priority];
          
          return (
            <Pressable
              key={announcement.id}
              style={[
                styles.announcementCard,
                !announcement.isRead && styles.announcementCardUnread,
                announcement.priority === "urgent" && styles.announcementCardUrgent,
              ]}
              onPress={() => openAnnouncement(announcement)}
            >
              <View style={styles.announcementHeader}>
                {announcement.pinned && (
                  <MaterialIcons name="push-pin" size={14} color="#64748b" style={styles.pinIcon} />
                )}
                <View style={[styles.priorityBadge, { backgroundColor: priorityInfo.color + "20" }]}>
                  <MaterialIcons name={priorityInfo.icon} size={12} color={priorityInfo.color} />
                  <ThemedText style={[styles.priorityText, { color: priorityInfo.color }]}>
                    {priorityInfo.label}
                  </ThemedText>
                </View>
                <ThemedText style={styles.announcementDate}>
                  {formatDate(announcement.publishedAt)}
                </ThemedText>
              </View>
              
              <ThemedText style={styles.announcementTitle}>{announcement.title}</ThemedText>
              <ThemedText style={styles.announcementContent} numberOfLines={2}>
                {announcement.content}
              </ThemedText>
              
              <View style={styles.announcementFooter}>
                <ThemedText style={styles.authorName}>{announcement.authorName}</ThemedText>
                {!announcement.isRead && <View style={styles.unreadDot} />}
              </View>
            </Pressable>
          );
        })}

        {filteredAnnouncements.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="campaign" size={64} color="#334155" />
            <ThemedText style={styles.emptyText}>Brak ogłoszeń</ThemedText>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Announcement Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Nowe ogłoszenie</ThemedText>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>

            <ThemedText style={styles.inputLabel}>Tytuł</ThemedText>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Tytuł ogłoszenia"
              placeholderTextColor="#64748b"
            />

            <ThemedText style={styles.inputLabel}>Treść</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Treść ogłoszenia..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <ThemedText style={styles.inputLabel}>Priorytet</ThemedText>
            <View style={styles.prioritySelector}>
              {(["normal", "important", "urgent"] as Priority[]).map(p => {
                const info = PRIORITY_INFO[p];
                return (
                  <Pressable
                    key={p}
                    style={[
                      styles.priorityOption,
                      priority === p && { backgroundColor: info.color + "30", borderColor: info.color },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <MaterialIcons name={info.icon} size={18} color={priority === p ? info.color : "#64748b"} />
                    <ThemedText style={[styles.priorityOptionText, priority === p && { color: info.color }]}>
                      {info.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={styles.pinnedToggle}
              onPress={() => setPinned(!pinned)}
            >
              <MaterialIcons 
                name={pinned ? "check-box" : "check-box-outline-blank"} 
                size={24} 
                color={pinned ? AppColors.primary : "#64748b"} 
              />
              <ThemedText style={styles.pinnedText}>Przypnij na górze tablicy</ThemedText>
            </Pressable>

            <Pressable 
              style={[styles.createBtn, (!title || !content) && styles.createBtnDisabled]}
              onPress={handleCreateAnnouncement}
              disabled={!title || !content}
            >
              <ThemedText style={styles.createBtnText}>Opublikuj</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Announcement Detail Modal */}
      <Modal
        visible={!!selectedAnnouncement}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAnnouncement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {selectedAnnouncement && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_INFO[selectedAnnouncement.priority].color + "20" }]}>
                    <MaterialIcons 
                      name={PRIORITY_INFO[selectedAnnouncement.priority].icon} 
                      size={14} 
                      color={PRIORITY_INFO[selectedAnnouncement.priority].color} 
                    />
                    <ThemedText style={[styles.priorityText, { color: PRIORITY_INFO[selectedAnnouncement.priority].color }]}>
                      {PRIORITY_INFO[selectedAnnouncement.priority].label}
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => setSelectedAnnouncement(null)}>
                    <MaterialIcons name="close" size={24} color="#64748b" />
                  </Pressable>
                </View>

                <ThemedText style={styles.detailTitle}>{selectedAnnouncement.title}</ThemedText>
                <ThemedText style={styles.detailMeta}>
                  {selectedAnnouncement.authorName} • {formatDate(selectedAnnouncement.publishedAt)}
                </ThemedText>
                
                <ScrollView style={styles.detailContent}>
                  <ThemedText style={styles.detailText}>{selectedAnnouncement.content}</ThemedText>
                </ScrollView>
              </>
            )}
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
  statsBar: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#334155",
    marginVertical: 4,
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
    fontSize: 12,
    color: "#64748b",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  announcementCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },
  announcementCardUnread: {
    borderLeftColor: AppColors.primary,
  },
  announcementCardUrgent: {
    borderLeftColor: "#ef4444",
  },
  announcementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  pinIcon: {
    marginRight: Spacing.xs,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "600",
  },
  announcementDate: {
    fontSize: 11,
    color: "#64748b",
    marginLeft: "auto",
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  announcementContent: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
  },
  announcementFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  authorName: {
    fontSize: 12,
    color: "#64748b",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
    marginLeft: "auto",
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
    maxHeight: "80%",
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
  input: {
    backgroundColor: "#0f172a",
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: "#fff",
  },
  textArea: {
    minHeight: 100,
  },
  prioritySelector: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  priorityOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0f172a",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  priorityOptionText: {
    fontSize: 12,
    color: "#64748b",
  },
  pinnedToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  pinnedText: {
    fontSize: 14,
    color: "#94a3b8",
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
  detailTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: Spacing.xs,
  },
  detailMeta: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: Spacing.lg,
  },
  detailContent: {
    maxHeight: 300,
  },
  detailText: {
    fontSize: 15,
    color: "#e2e8f0",
    lineHeight: 24,
  },
});
