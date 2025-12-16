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
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import {
  getAllSegments,
  type NotificationSegment,
} from "@/lib/notification-segments";

type CampaignStatus = "draft" | "scheduled" | "sent" | "failed";

type Campaign = {
  id: string;
  name: string;
  title: string;
  body: string;
  segmentIds: string[];
  scheduledAt: string | null;
  sentAt: string | null;
  status: CampaignStatus;
  stats: {
    targeted: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
  createdAt: string;
};

// Mock campaigns for demo
const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "camp_1",
    name: "Przypomnienie o treningu",
    title: "Trening jutro!",
    body: "Pamiętaj o jutrzejszym treningu o 17:00",
    segmentIds: ["seg_players"],
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    sentAt: null,
    status: "scheduled",
    stats: { targeted: 45, delivered: 0, opened: 0, clicked: 0 },
    createdAt: new Date().toISOString(),
  },
  {
    id: "camp_2",
    name: "Nowy sezon",
    title: "Rozpoczynamy nowy sezon!",
    body: "Zapraszamy na pierwsze spotkanie organizacyjne",
    segmentIds: ["seg_all_users"],
    scheduledAt: null,
    sentAt: new Date(Date.now() - 86400000).toISOString(),
    status: "sent",
    stats: { targeted: 120, delivered: 118, opened: 89, clicked: 34 },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export default function CampaignsScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [segments, setSegments] = useState<NotificationSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allSegments = await getAllSegments();
      setSegments(allSegments);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !title.trim() || !body.trim()) {
      Alert.alert("Błąd", "Wypełnij wszystkie wymagane pola");
      return;
    }

    if (selectedSegments.length === 0) {
      Alert.alert("Błąd", "Wybierz co najmniej jeden segment");
      return;
    }

    setCreating(true);
    try {
      const newCampaign: Campaign = {
        id: `camp_${Date.now()}`,
        name,
        title,
        body,
        segmentIds: selectedSegments,
        scheduledAt: scheduleDate?.toISOString() || null,
        sentAt: null,
        status: scheduleDate ? "scheduled" : "draft",
        stats: { targeted: 0, delivered: 0, opened: 0, clicked: 0 },
        createdAt: new Date().toISOString(),
      };

      setCampaigns((prev) => [newCampaign, ...prev]);
      setShowCreateModal(false);
      resetForm();
      Alert.alert("Sukces", scheduleDate ? "Kampania została zaplanowana" : "Kampania została utworzona jako szkic");
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się utworzyć kampanii");
    } finally {
      setCreating(false);
    }
  };

  const handleSendNow = (campaign: Campaign) => {
    Alert.alert(
      "Wyślij teraz",
      `Czy na pewno chcesz wysłać kampanię "${campaign.name}" do ${campaign.stats.targeted} użytkowników?`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Wyślij",
          onPress: () => {
            setCampaigns((prev) =>
              prev.map((c) =>
                c.id === campaign.id
                  ? { ...c, status: "sent" as CampaignStatus, sentAt: new Date().toISOString() }
                  : c
              )
            );
            Alert.alert("Sukces", "Kampania została wysłana");
          },
        },
      ]
    );
  };

  const handleDelete = (campaign: Campaign) => {
    Alert.alert("Usuń kampanię", `Czy na pewno chcesz usunąć kampanię "${campaign.name}"?`, [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: () => {
          setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
        },
      },
    ]);
  };

  const resetForm = () => {
    setName("");
    setTitle("");
    setBody("");
    setSelectedSegments([]);
    setScheduleDate(null);
  };

  const toggleSegment = (segmentId: string) => {
    setSelectedSegments((prev) =>
      prev.includes(segmentId)
        ? prev.filter((id) => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case "draft":
        return "#64748b";
      case "scheduled":
        return AppColors.warning;
      case "sent":
        return AppColors.success;
      case "failed":
        return AppColors.danger;
    }
  };

  const getStatusLabel = (status: CampaignStatus) => {
    switch (status) {
      case "draft":
        return "Szkic";
      case "scheduled":
        return "Zaplanowana";
      case "sent":
        return "Wysłana";
      case "failed":
        return "Błąd";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <ThemedText style={styles.headerTitle}>Kampanie</ThemedText>
        <Pressable onPress={() => setShowCreateModal(true)} style={styles.addButton}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{campaigns.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Wszystkie</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>
              {campaigns.filter((c) => c.status === "scheduled").length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Zaplanowane</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>
              {campaigns.filter((c) => c.status === "sent").length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Wysłane</ThemedText>
          </View>
        </View>

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="campaign" size={48} color="#64748b" />
            <ThemedText style={styles.emptyText}>Brak kampanii</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Utwórz pierwszą kampanię powiadomień
            </ThemedText>
          </View>
        ) : (
          campaigns.map((campaign) => (
            <View key={campaign.id} style={styles.campaignCard}>
              <View style={styles.campaignHeader}>
                <View style={styles.campaignInfo}>
                  <ThemedText style={styles.campaignName}>{campaign.name}</ThemedText>
                  <View style={styles.campaignMeta}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(campaign.status) + "20" },
                      ]}
                    >
                      <ThemedText
                        style={[styles.statusText, { color: getStatusColor(campaign.status) }]}
                      >
                        {getStatusLabel(campaign.status)}
                      </ThemedText>
                    </View>
                    {campaign.scheduledAt && campaign.status === "scheduled" && (
                      <ThemedText style={styles.scheduleText}>
                        {formatDate(campaign.scheduledAt)}
                      </ThemedText>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.campaignContent}>
                <ThemedText style={styles.campaignTitle}>{campaign.title}</ThemedText>
                <ThemedText style={styles.campaignBody} numberOfLines={2}>
                  {campaign.body}
                </ThemedText>
              </View>

              {campaign.status === "sent" && (
                <View style={styles.campaignStats}>
                  <View style={styles.campaignStat}>
                    <ThemedText style={styles.campaignStatValue}>
                      {campaign.stats.targeted}
                    </ThemedText>
                    <ThemedText style={styles.campaignStatLabel}>Docelowo</ThemedText>
                  </View>
                  <View style={styles.campaignStat}>
                    <ThemedText style={styles.campaignStatValue}>
                      {campaign.stats.delivered}
                    </ThemedText>
                    <ThemedText style={styles.campaignStatLabel}>Dostarczono</ThemedText>
                  </View>
                  <View style={styles.campaignStat}>
                    <ThemedText style={styles.campaignStatValue}>
                      {campaign.stats.opened}
                    </ThemedText>
                    <ThemedText style={styles.campaignStatLabel}>Otwarto</ThemedText>
                  </View>
                  <View style={styles.campaignStat}>
                    <ThemedText style={[styles.campaignStatValue, { color: AppColors.primary }]}>
                      {campaign.stats.targeted > 0
                        ? ((campaign.stats.opened / campaign.stats.targeted) * 100).toFixed(1)
                        : 0}
                      %
                    </ThemedText>
                    <ThemedText style={styles.campaignStatLabel}>Open Rate</ThemedText>
                  </View>
                </View>
              )}

              <View style={styles.campaignActions}>
                {(campaign.status === "draft" || campaign.status === "scheduled") && (
                  <Pressable
                    style={[styles.actionBtn, styles.sendBtn]}
                    onPress={() => handleSendNow(campaign)}
                  >
                    <MaterialIcons name="send" size={16} color="#fff" />
                    <ThemedText style={styles.actionBtnText}>Wyślij</ThemedText>
                  </Pressable>
                )}
                <Pressable
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDelete(campaign)}
                >
                  <MaterialIcons name="delete" size={16} color="#fff" />
                </Pressable>
              </View>
            </View>
          ))
        )}
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
              <ThemedText style={styles.modalTitle}>Nowa kampania</ThemedText>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Nazwa kampanii *</ThemedText>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="np. Przypomnienie o treningu"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Tytuł powiadomienia *</ThemedText>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Tytuł wyświetlany w powiadomieniu"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Treść *</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={body}
                  onChangeText={setBody}
                  placeholder="Treść powiadomienia..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Segmenty docelowe *</ThemedText>
                <View style={styles.segmentsGrid}>
                  {segments.slice(0, 6).map((segment) => (
                    <Pressable
                      key={segment.id}
                      style={[
                        styles.segmentChip,
                        selectedSegments.includes(segment.id) && styles.segmentChipSelected,
                      ]}
                      onPress={() => toggleSegment(segment.id)}
                    >
                      <ThemedText
                        style={[
                          styles.segmentChipText,
                          selectedSegments.includes(segment.id) && styles.segmentChipTextSelected,
                        ]}
                      >
                        {segment.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Zaplanuj wysyłkę (opcjonalnie)</ThemedText>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialIcons name="schedule" size={20} color="#64748b" />
                  <ThemedText style={styles.dateButtonText}>
                    {scheduleDate ? formatDate(scheduleDate.toISOString()) : "Wybierz datę i godzinę"}
                  </ThemedText>
                </Pressable>
                {scheduleDate && (
                  <Pressable onPress={() => setScheduleDate(null)}>
                    <ThemedText style={styles.clearDate}>Wyczyść</ThemedText>
                  </Pressable>
                )}
              </View>

              {showDatePicker && Platform.OS !== "web" && (
                <DateTimePicker
                  value={scheduleDate || new Date()}
                  mode="datetime"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event: DateTimePickerEvent, date?: Date) => {
                    setShowDatePicker(false);
                    if (date) setScheduleDate(date);
                  }}
                />
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.createBtn, creating && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="campaign" size={20} color="#fff" />
                    <ThemedText style={styles.createBtnText}>
                      {scheduleDate ? "Zaplanuj kampanię" : "Utwórz szkic"}
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </View>
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
  headerTitle: {
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
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
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
  campaignCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  campaignHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  campaignMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  scheduleText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
  },
  campaignContent: {
    marginBottom: Spacing.md,
  },
  campaignTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#94a3b8",
  },
  campaignBody: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748b",
    marginTop: 2,
  },
  campaignStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: AppColors.bgDark,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  campaignStat: {
    alignItems: "center",
  },
  campaignStatValue: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  campaignStatLabel: {
    fontSize: 10,
    lineHeight: 14,
    color: "#64748b",
  },
  campaignActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  sendBtn: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: AppColors.primary,
  },
  deleteBtn: {
    backgroundColor: AppColors.danger,
  },
  actionBtnText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#fff",
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
    maxHeight: "85%",
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
  segmentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  segmentChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: AppColors.bgDark,
    borderWidth: 1,
    borderColor: "#334155",
  },
  segmentChipSelected: {
    backgroundColor: AppColors.primary + "20",
    borderColor: AppColors.primary,
  },
  segmentChipText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
  },
  segmentChipTextSelected: {
    color: AppColors.primary,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.bgDark,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  dateButtonText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#94a3b8",
  },
  clearDate: {
    fontSize: 12,
    lineHeight: 16,
    color: AppColors.danger,
    marginTop: Spacing.xs,
  },
  modalFooter: {
    paddingHorizontal: Spacing.lg,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  createBtnDisabled: {
    opacity: 0.6,
  },
  createBtnText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
});
