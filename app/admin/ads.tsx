import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  Alert,
  Modal,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";

type Ad = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  sponsor: string;
  placement: "home" | "matches" | "players" | "more" | "all";
  isActive: boolean;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
};

// Mock data - in production this would come from the database
const MOCK_ADS: Ad[] = [
  {
    id: "1",
    title: "Sprzęt sportowy Premium",
    description: "Najlepszy sprzęt dla Twojego klubu",
    imageUrl: "",
    linkUrl: "https://example.com/sports",
    sponsor: "SportShop",
    placement: "home",
    isActive: true,
    impressions: 1250,
    clicks: 45,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
  },
  {
    id: "2",
    title: "Ubezpieczenie sportowe",
    description: "Ochrona dla zawodników",
    imageUrl: "",
    linkUrl: "https://example.com/insurance",
    sponsor: "InsureCo",
    placement: "all",
    isActive: false,
    impressions: 890,
    clicks: 23,
    startDate: "2024-02-01",
    endDate: "2024-06-30",
  },
];

export default function AdManagementScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [ads, setAds] = useState<Ad[]>(MOCK_ADS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [placement, setPlacement] = useState<Ad["placement"]>("all");

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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImageUrl("");
    setLinkUrl("");
    setSponsor("");
    setPlacement("all");
    setEditingAd(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (ad: Ad) => {
    setTitle(ad.title);
    setDescription(ad.description);
    setImageUrl(ad.imageUrl);
    setLinkUrl(ad.linkUrl);
    setSponsor(ad.sponsor);
    setPlacement(ad.placement);
    setEditingAd(ad);
    setShowAddModal(true);
  };

  const handleSave = () => {
    if (!title || !linkUrl || !sponsor) {
      Alert.alert("Błąd", "Wypełnij wszystkie wymagane pola");
      return;
    }

    if (editingAd) {
      // Update existing ad
      setAds((prev) =>
        prev.map((ad) =>
          ad.id === editingAd.id
            ? { ...ad, title, description, imageUrl, linkUrl, sponsor, placement }
            : ad
        )
      );
      Alert.alert("Sukces", "Reklama została zaktualizowana");
    } else {
      // Add new ad
      const newAd: Ad = {
        id: Date.now().toString(),
        title,
        description,
        imageUrl,
        linkUrl,
        sponsor,
        placement,
        isActive: true,
        impressions: 0,
        clicks: 0,
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
      };
      setAds((prev) => [...prev, newAd]);
      Alert.alert("Sukces", "Reklama została dodana");
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleToggleActive = (adId: string) => {
    setAds((prev) =>
      prev.map((ad) => (ad.id === adId ? { ...ad, isActive: !ad.isActive } : ad))
    );
  };

  const handleDelete = (adId: string) => {
    Alert.alert("Usuń reklamę", "Czy na pewno chcesz usunąć tę reklamę?", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: () => {
          setAds((prev) => prev.filter((ad) => ad.id !== adId));
          Alert.alert("Sukces", "Reklama została usunięta");
        },
      },
    ]);
  };

  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.title}>Zarządzanie reklamami</ThemedText>
        <Pressable style={styles.addButton} onPress={handleOpenAdd}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{ads.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Reklamy</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{totalImpressions}</ThemedText>
            <ThemedText style={styles.statLabel}>Wyświetlenia</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{totalClicks}</ThemedText>
            <ThemedText style={styles.statLabel}>Kliknięcia</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{avgCtr}%</ThemedText>
            <ThemedText style={styles.statLabel}>CTR</ThemedText>
          </View>
        </View>

        {/* Performance Chart */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Wydajność w czasie</ThemedText>
          <View style={styles.chartContainer}>
            {/* Simple bar chart visualization */}
            <View style={styles.chartHeader}>
              <ThemedText style={styles.chartLabel}>Ostatnie 7 dni</ThemedText>
            </View>
            <View style={styles.chartBars}>
              {[65, 80, 45, 90, 75, 60, 85].map((value, index) => (
                <View key={index} style={styles.barContainer}>
                  <View style={[styles.bar, { height: value }]}>
                    <View style={[styles.barFill, { height: `${value}%` }]} />
                  </View>
                  <ThemedText style={styles.barLabel}>
                    {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'][index]}
                  </ThemedText>
                </View>
              ))}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: AppColors.primary }]} />
                <ThemedText style={styles.legendText}>Wyświetlenia</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: AppColors.secondary }]} />
                <ThemedText style={styles.legendText}>Kliknięcia</ThemedText>
              </View>
            </View>
          </View>

          {/* CTR Trend */}
          <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <MaterialIcons name="trending-up" size={24} color={AppColors.success} />
              <ThemedText style={styles.trendTitle}>Trend CTR</ThemedText>
            </View>
            <View style={styles.trendContent}>
              <ThemedText style={styles.trendValue}>+12.5%</ThemedText>
              <ThemedText style={styles.trendSubtext}>vs poprzedni tydzień</ThemedText>
            </View>
            <View style={styles.trendBars}>
              {[2.1, 2.8, 3.2, 2.9, 3.5, 3.8, 4.2].map((ctr, index) => (
                <View key={index} style={styles.trendBarContainer}>
                  <View style={[styles.trendBar, { height: ctr * 15 }]} />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Ads List */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Aktywne reklamy</ThemedText>
          {ads.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="campaign" size={48} color="#64748b" />
              <ThemedText style={styles.emptyText}>Brak reklam</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Dodaj pierwszą reklamę, aby rozpocząć
              </ThemedText>
            </View>
          ) : (
            ads.map((ad) => (
              <View key={ad.id} style={styles.adCard}>
                <View style={styles.adHeader}>
                  <View style={styles.adInfo}>
                    <ThemedText style={styles.adTitle}>{ad.title}</ThemedText>
                    <ThemedText style={styles.adSponsor}>
                      Sponsor: {ad.sponsor}
                    </ThemedText>
                  </View>
                  <Switch
                    value={ad.isActive}
                    onValueChange={() => handleToggleActive(ad.id)}
                    trackColor={{ false: "#475569", true: AppColors.primary + "80" }}
                    thumbColor={ad.isActive ? AppColors.primary : "#94a3b8"}
                  />
                </View>
                <ThemedText style={styles.adDescription} numberOfLines={2}>
                  {ad.description || "Brak opisu"}
                </ThemedText>
                <View style={styles.adMeta}>
                  <View style={styles.adMetaItem}>
                    <MaterialIcons name="visibility" size={14} color="#64748b" />
                    <ThemedText style={styles.adMetaText}>
                      {ad.impressions} wyświetleń
                    </ThemedText>
                  </View>
                  <View style={styles.adMetaItem}>
                    <MaterialIcons name="touch-app" size={14} color="#64748b" />
                    <ThemedText style={styles.adMetaText}>
                      {ad.clicks} kliknięć
                    </ThemedText>
                  </View>
                  <View style={styles.adMetaItem}>
                    <MaterialIcons name="place" size={14} color="#64748b" />
                    <ThemedText style={styles.adMetaText}>
                      {ad.placement === "all" ? "Wszędzie" : ad.placement}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.adActions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleOpenEdit(ad)}
                  >
                    <MaterialIcons name="edit" size={18} color={AppColors.primary} />
                    <ThemedText style={styles.actionText}>Edytuj</ThemedText>
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleDelete(ad.id)}
                  >
                    <MaterialIcons name="delete" size={18} color={AppColors.danger} />
                    <ThemedText style={[styles.actionText, { color: AppColors.danger }]}>
                      Usuń
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {editingAd ? "Edytuj reklamę" : "Dodaj reklamę"}
              </ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Tytuł *</ThemedText>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Tytuł reklamy"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Opis</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Opis reklamy"
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>URL obrazka</ThemedText>
                <TextInput
                  style={styles.input}
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>URL docelowy *</ThemedText>
                <TextInput
                  style={styles.input}
                  value={linkUrl}
                  onChangeText={setLinkUrl}
                  placeholder="https://example.com"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Sponsor *</ThemedText>
                <TextInput
                  style={styles.input}
                  value={sponsor}
                  onChangeText={setSponsor}
                  placeholder="Nazwa sponsora"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Umiejscowienie</ThemedText>
                <View style={styles.placementOptions}>
                  {(["all", "home", "matches", "players", "more"] as const).map((p) => (
                    <Pressable
                      key={p}
                      style={[
                        styles.placementOption,
                        placement === p && styles.placementOptionActive,
                      ]}
                      onPress={() => setPlacement(p)}
                    >
                      <ThemedText
                        style={[
                          styles.placementText,
                          placement === p && styles.placementTextActive,
                        ]}
                      >
                        {p === "all" ? "Wszędzie" : p.charAt(0).toUpperCase() + p.slice(1)}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <ThemedText style={styles.cancelText}>Anuluj</ThemedText>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleSave}>
                <ThemedText style={styles.saveText}>
                  {editingAd ? "Zapisz zmiany" : "Dodaj reklamę"}
                </ThemedText>
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
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "bold",
    color: "#fff",
  },
  addButton: {
    backgroundColor: AppColors.primary,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "bold",
    color: AppColors.primary,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: "#94a3b8",
    marginTop: 4,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#94a3b8",
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
    marginTop: Spacing.xs,
  },
  adCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  adHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  adInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  adTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  adSponsor: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
    marginTop: 2,
  },
  adDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#94a3b8",
    marginBottom: Spacing.sm,
  },
  adMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  adMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  adMetaText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
  },
  adActions: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: Spacing.xs,
  },
  actionText: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: AppColors.bgCard,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
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
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  placementOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  placementOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: AppColors.bgDark,
  },
  placementOptionActive: {
    backgroundColor: AppColors.primary,
  },
  placementText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#94a3b8",
  },
  placementTextActive: {
    color: "#fff",
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: "#334155",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  saveButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: AppColors.primary,
    alignItems: "center",
  },
  saveText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  // Chart styles
  chartContainer: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  chartHeader: {
    marginBottom: Spacing.md,
  },
  chartLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: "#94a3b8",
  },
  chartBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
    marginBottom: Spacing.md,
  },
  barContainer: {
    alignItems: "center",
    flex: 1,
  },
  bar: {
    width: 24,
    backgroundColor: AppColors.primary + "30",
    borderRadius: Radius.sm,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: {
    backgroundColor: AppColors.primary,
    width: "100%",
  },
  barLabel: {
    fontSize: 10,
    lineHeight: 14,
    color: "#64748b",
    marginTop: 4,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#94a3b8",
  },
  trendCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  trendHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  trendTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  trendContent: {
    marginBottom: Spacing.md,
  },
  trendValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "bold",
    color: AppColors.success,
  },
  trendSubtext: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
  },
  trendBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 60,
  },
  trendBarContainer: {
    flex: 1,
    alignItems: "center",
  },
  trendBar: {
    width: 16,
    backgroundColor: AppColors.success,
    borderRadius: Radius.sm,
  },
});
