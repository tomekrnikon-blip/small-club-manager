import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import {
  setFacebookConfig,
  getFacebookOAuthUrl,
  getFacebookPages,
  getInstagramAccount,
  saveSelectedPage,
  getSavedPageInfo,
  disconnectAccounts,
  isFacebookConnected,
  isInstagramConnected,
  FacebookPage,
  InstagramAccount,
} from "@/lib/facebook-oauth";

interface ConnectedAccount {
  platform: "facebook" | "instagram";
  name: string;
  username?: string;
  pageId?: string;
  igAccountId?: string;
}

export default function SocialMediaSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  
  // Facebook App Config Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [fbAppId, setFbAppId] = useState("");
  const [fbAppSecret, setFbAppSecret] = useState("");
  
  // Page Selection Modal
  const [showPageModal, setShowPageModal] = useState(false);
  const [availablePages, setAvailablePages] = useState<FacebookPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  const [linkedInstagram, setLinkedInstagram] = useState<InstagramAccount | null>(null);

  // Load connected accounts on mount
  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    setIsLoading(true);
    try {
      const pageInfo = await getSavedPageInfo();
      const accounts: ConnectedAccount[] = [];

      if (pageInfo.pageId && pageInfo.pageName) {
        accounts.push({
          platform: "facebook",
          name: pageInfo.pageName,
          pageId: pageInfo.pageId,
        });
      }

      if (pageInfo.igAccountId && pageInfo.igUsername) {
        accounts.push({
          platform: "instagram",
          name: pageInfo.igUsername,
          username: `@${pageInfo.igUsername}`,
          igAccountId: pageInfo.igAccountId,
        });
      }

      setConnectedAccounts(accounts);
    } catch (error) {
      console.error("[SocialMedia] Error loading accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectFacebook = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowConfigModal(true);
  };

  const handleStartOAuth = async () => {
    if (!fbAppId.trim()) {
      Alert.alert("Błąd", "Wprowadź Facebook App ID");
      return;
    }

    setShowConfigModal(false);
    setIsConnecting(true);

    try {
      // Set Facebook config
      setFacebookConfig({
        appId: fbAppId.trim(),
      });

      // Generate state for CSRF protection
      const state = Math.random().toString(36).substring(7);
      
      // Get OAuth URL
      const oauthUrl = getFacebookOAuthUrl(state);

      // Open OAuth in browser
      const result = await WebBrowser.openAuthSessionAsync(
        oauthUrl,
        undefined,
        { preferEphemeralSession: false }
      );

      if (result.type === "success" && result.url) {
        // Parse the callback URL
        const url = new URL(result.url);
        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");

        if (code && returnedState === state) {
          // In production, exchange code for token via backend
          // For now, show page selection with mock data
          Alert.alert(
            "Autoryzacja udana",
            "Kod autoryzacyjny otrzymany. W produkcji zostanie wymieniony na token dostępu przez backend.\n\nAby dokończyć konfigurację, wprowadź App Secret w panelu Master Admin.",
            [{ text: "OK" }]
          );
          
          // Mock: Show page selection
          setAvailablePages([
            {
              id: "mock_page_1",
              name: "Moja Strona Klubu",
              access_token: "mock_token",
              category: "Sports Team",
            },
          ]);
          setShowPageModal(true);
        }
      } else if (result.type === "cancel") {
        Alert.alert("Anulowano", "Autoryzacja została anulowana");
      }
    } catch (error: any) {
      console.error("[SocialMedia] OAuth error:", error);
      Alert.alert("Błąd", error.message || "Nie udało się połączyć z Facebook");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectPage = async (page: FacebookPage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPage(page);

    try {
      // Save selected page
      await saveSelectedPage(page);

      // Try to get linked Instagram account
      const igAccount = await getInstagramAccount(page.id, page.access_token);
      setLinkedInstagram(igAccount);

      // Update connected accounts
      const newAccounts: ConnectedAccount[] = [
        {
          platform: "facebook",
          name: page.name,
          pageId: page.id,
        },
      ];

      if (igAccount) {
        newAccounts.push({
          platform: "instagram",
          name: igAccount.username,
          username: `@${igAccount.username}`,
          igAccountId: igAccount.id,
        });
      }

      setConnectedAccounts(newAccounts);
      setShowPageModal(false);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Sukces",
        igAccount
          ? `Połączono stronę "${page.name}" oraz konto Instagram @${igAccount.username}`
          : `Połączono stronę "${page.name}". Konto Instagram nie zostało znalezione.`
      );
    } catch (error: any) {
      console.error("[SocialMedia] Page selection error:", error);
      Alert.alert("Błąd", error.message);
    }
  };

  const handleDisconnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Odłącz konta",
      "Czy na pewno chcesz odłączyć wszystkie połączone konta social media?",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Odłącz",
          style: "destructive",
          onPress: async () => {
            await disconnectAccounts();
            setConnectedAccounts([]);
            setSelectedPage(null);
            setLinkedInstagram(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const renderConnectedAccount = ({ item }: { item: ConnectedAccount }) => (
    <View style={styles.accountCard}>
      <View style={styles.accountHeader}>
        <View
          style={[
            styles.platformIcon,
            {
              backgroundColor: item.platform === "facebook" ? "#1877F2" : "#E4405F",
            },
          ]}
        >
          <MaterialIcons
            name={item.platform === "facebook" ? "facebook" : "photo-camera"}
            size={24}
            color="#fff"
          />
        </View>
        <View style={styles.accountInfo}>
          <ThemedText style={styles.accountName}>{item.name}</ThemedText>
          {item.username && (
            <ThemedText style={styles.accountUsername}>{item.username}</ThemedText>
          )}
          <ThemedText style={styles.connectedLabel}>
            ✓ Połączono
          </ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Media społecznościowe</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <MaterialIcons name="info-outline" size={24} color={AppColors.primary} />
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoTitle}>Udostępniaj treści klubowe</ThemedText>
              <ThemedText style={styles.infoText}>
                Połącz konta social media aby publikować statystyki meczowe, zapowiedzi i osiągnięcia z logo SKM.
              </ThemedText>
            </View>
          </View>

          {/* Connected Accounts */}
          {connectedAccounts.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Połączone konta</ThemedText>
              <FlatList
                data={connectedAccounts}
                renderItem={renderConnectedAccount}
                keyExtractor={(item) => `${item.platform}-${item.pageId || item.igAccountId}`}
                scrollEnabled={false}
              />
              <Pressable style={styles.disconnectButton} onPress={handleDisconnect}>
                <MaterialIcons name="link-off" size={20} color={AppColors.danger} />
                <ThemedText style={styles.disconnectText}>Odłącz wszystkie konta</ThemedText>
              </Pressable>
            </View>
          )}

          {/* Connect Buttons */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {connectedAccounts.length > 0 ? "Połącz inne konto" : "Połącz konto"}
            </ThemedText>

            <Pressable
              style={[styles.connectButton, { backgroundColor: "#1877F2" }]}
              onPress={handleConnectFacebook}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="facebook" size={24} color="#fff" />
                  <ThemedText style={styles.connectButtonText}>
                    Połącz z Facebook
                  </ThemedText>
                </>
              )}
            </Pressable>

            <ThemedText style={styles.helpText}>
              Połączenie z Facebook automatycznie wykryje powiązane konto Instagram Business.
            </ThemedText>
          </View>

          {/* Requirements */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Wymagania</ThemedText>
            <View style={styles.requirementsList}>
              <View style={styles.requirementItem}>
                <MaterialIcons name="check-circle" size={20} color={AppColors.primary} />
                <ThemedText style={styles.requirementText}>
                  Konto Facebook z uprawnieniami do zarządzania stroną
                </ThemedText>
              </View>
              <View style={styles.requirementItem}>
                <MaterialIcons name="check-circle" size={20} color={AppColors.primary} />
                <ThemedText style={styles.requirementText}>
                  Strona Facebook klubu (nie profil osobisty)
                </ThemedText>
              </View>
              <View style={styles.requirementItem}>
                <MaterialIcons name="check-circle" size={20} color={AppColors.primary} />
                <ThemedText style={styles.requirementText}>
                  Instagram Business połączony ze stroną Facebook (opcjonalnie)
                </ThemedText>
              </View>
              <View style={styles.requirementItem}>
                <MaterialIcons name="settings" size={20} color={AppColors.secondary} />
                <ThemedText style={styles.requirementText}>
                  Facebook App ID i App Secret w panelu Master Admin
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Facebook Config Modal */}
      <Modal
        visible={showConfigModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Konfiguracja Facebook</ThemedText>
              <Pressable onPress={() => setShowConfigModal(false)}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <ThemedText style={styles.inputLabel}>Facebook App ID</ThemedText>
              <TextInput
                style={styles.textInput}
                value={fbAppId}
                onChangeText={setFbAppId}
                placeholder="Wprowadź App ID"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
              />

              <ThemedText style={styles.inputHint}>
                App ID znajdziesz w Facebook Developers → Twoja aplikacja → Ustawienia → Podstawowe
              </ThemedText>

              <Pressable
                style={[styles.modalButton, !fbAppId.trim() && styles.modalButtonDisabled]}
                onPress={handleStartOAuth}
                disabled={!fbAppId.trim()}
              >
                <ThemedText style={styles.modalButtonText}>Rozpocznij autoryzację</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Page Selection Modal */}
      <Modal
        visible={showPageModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Wybierz stronę</ThemedText>
              <Pressable onPress={() => setShowPageModal(false)}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <ThemedText style={styles.pageSelectHint}>
                Wybierz stronę Facebook klubu, na której będą publikowane posty:
              </ThemedText>

              {availablePages.map((page) => (
                <Pressable
                  key={page.id}
                  style={styles.pageOption}
                  onPress={() => handleSelectPage(page)}
                >
                  <View style={styles.pageIconContainer}>
                    <MaterialIcons name="facebook" size={32} color="#1877F2" />
                  </View>
                  <View style={styles.pageInfo}>
                    <ThemedText style={styles.pageName}>{page.name}</ThemedText>
                    {page.category && (
                      <ThemedText style={styles.pageCategory}>{page.category}</ThemedText>
                    )}
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#64748b" />
                </Pressable>
              ))}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: AppColors.primary + "15",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  accountCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  accountUsername: {
    fontSize: 14,
    color: "#94a3b8",
  },
  connectedLabel: {
    fontSize: 12,
    color: AppColors.success,
    marginTop: Spacing.xs,
  },
  disconnectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.danger + "15",
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  disconnectText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.danger,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  helpText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
  requirementsList: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    color: "#e2e8f0",
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: AppColors.bgDark,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  modalBody: {
    padding: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: "#fff",
    marginBottom: Spacing.md,
  },
  inputHint: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: Spacing.xl,
  },
  modalButton: {
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  pageSelectHint: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: Spacing.lg,
  },
  pageOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  pageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: "#1877F2" + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  pageInfo: {
    flex: 1,
  },
  pageName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  pageCategory: {
    fontSize: 13,
    color: "#64748b",
  },
});
