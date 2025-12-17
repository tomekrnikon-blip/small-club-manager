import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";

type CloudProvider = "google_drive" | "dropbox" | "onedrive" | null;

interface CloudConfig {
  provider: CloudProvider;
  connected: boolean;
  email?: string;
  folderPath?: string;
  autoSync: boolean;
  syncOnWifi: boolean;
}

export default function CloudStorageSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [config, setConfig] = useState<CloudConfig>({
    provider: null,
    connected: false,
    autoSync: true,
    syncOnWifi: true,
  });

  const [selectedFolder, setSelectedFolder] = useState<string>("/ClubPhotos");

  const providers = [
    {
      id: "google_drive" as CloudProvider,
      name: "Google Drive",
      icon: "cloud",
      color: "#4285F4",
      description: "Przechowuj zdjęcia na swoim koncie Google",
    },
    {
      id: "dropbox" as CloudProvider,
      name: "Dropbox",
      icon: "cloud-queue",
      color: "#0061FF",
      description: "Synchronizuj z kontem Dropbox",
    },
    {
      id: "onedrive" as CloudProvider,
      name: "OneDrive",
      icon: "cloud-circle",
      color: "#0078D4",
      description: "Użyj konta Microsoft OneDrive",
    },
  ];

  const handleConnectProvider = async (providerId: CloudProvider) => {
    if (!providerId) return;

    // In a real app, this would initiate OAuth flow
    Alert.alert(
      "Połącz z chmurą",
      `Zostaniesz przekierowany do ${providers.find(p => p.id === providerId)?.name} aby autoryzować dostęp. Zdjęcia będą przechowywane na Twoim koncie.`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Połącz",
          onPress: () => {
            // Simulate successful connection
            setConfig({
              ...config,
              provider: providerId,
              connected: true,
              email: "user@example.com",
              folderPath: selectedFolder,
            });
            Alert.alert("Sukces", "Połączono z chmurą. Zdjęcia będą przechowywane na Twoim koncie.");
          },
        },
      ]
    );
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Rozłącz chmurę",
      "Czy na pewno chcesz rozłączyć konto? Zdjęcia pozostaną na Twoim koncie w chmurze.",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Rozłącz",
          style: "destructive",
          onPress: () => {
            setConfig({
              provider: null,
              connected: false,
              autoSync: true,
              syncOnWifi: true,
            });
          },
        },
      ]
    );
  };

  const handleSelectFolder = () => {
    Alert.alert(
      "Wybierz folder",
      "Wprowadź ścieżkę folderu w chmurze gdzie będą zapisywane zdjęcia:",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "/ClubPhotos",
          onPress: () => setSelectedFolder("/ClubPhotos"),
        },
        {
          text: "/Photos/Club",
          onPress: () => setSelectedFolder("/Photos/Club"),
        },
      ]
    );
  };

  const toggleSetting = (key: "autoSync" | "syncOnWifi") => {
    setConfig({ ...config, [key]: !config[key] });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Przechowywanie w chmurze</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialIcons name="info-outline" size={20} color={AppColors.primary} />
          <ThemedText style={styles.infoText}>
            Zdjęcia są przechowywane na Twoim własnym koncie w chmurze. 
            Aplikacja nie wykorzystuje swojej przestrzeni dyskowej - masz pełną kontrolę nad swoimi danymi.
          </ThemedText>
        </View>

        {/* Connected Provider */}
        {config.connected && config.provider && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Połączone konto</ThemedText>
            <View style={styles.connectedCard}>
              <View style={styles.connectedHeader}>
                <View style={[styles.providerIcon, { backgroundColor: providers.find(p => p.id === config.provider)?.color + "20" }]}>
                  <MaterialIcons 
                    name={providers.find(p => p.id === config.provider)?.icon as any || "cloud"} 
                    size={28} 
                    color={providers.find(p => p.id === config.provider)?.color} 
                  />
                </View>
                <View style={styles.connectedInfo}>
                  <ThemedText style={styles.connectedName}>
                    {providers.find(p => p.id === config.provider)?.name}
                  </ThemedText>
                  <ThemedText style={styles.connectedEmail}>{config.email}</ThemedText>
                </View>
                <View style={styles.connectedBadge}>
                  <MaterialIcons name="check-circle" size={16} color="#22c55e" />
                  <ThemedText style={styles.connectedBadgeText}>Połączono</ThemedText>
                </View>
              </View>

              {/* Folder Path */}
              <Pressable style={styles.folderRow} onPress={handleSelectFolder}>
                <View style={styles.folderInfo}>
                  <MaterialIcons name="folder" size={20} color="#64748b" />
                  <ThemedText style={styles.folderLabel}>Folder docelowy</ThemedText>
                </View>
                <View style={styles.folderValue}>
                  <ThemedText style={styles.folderPath}>{selectedFolder}</ThemedText>
                  <MaterialIcons name="chevron-right" size={20} color="#64748b" />
                </View>
              </Pressable>

              {/* Sync Settings */}
              <View style={styles.settingsDivider} />
              
              <Pressable style={styles.toggleRow} onPress={() => toggleSetting("autoSync")}>
                <View style={styles.toggleInfo}>
                  <MaterialIcons name="sync" size={20} color="#64748b" />
                  <ThemedText style={styles.toggleLabel}>Automatyczna synchronizacja</ThemedText>
                </View>
                <View style={[styles.toggle, config.autoSync && styles.toggleActive]}>
                  <View style={[styles.toggleKnob, config.autoSync && styles.toggleKnobActive]} />
                </View>
              </Pressable>

              <Pressable style={styles.toggleRow} onPress={() => toggleSetting("syncOnWifi")}>
                <View style={styles.toggleInfo}>
                  <MaterialIcons name="wifi" size={20} color="#64748b" />
                  <ThemedText style={styles.toggleLabel}>Tylko przez Wi-Fi</ThemedText>
                </View>
                <View style={[styles.toggle, config.syncOnWifi && styles.toggleActive]}>
                  <View style={[styles.toggleKnob, config.syncOnWifi && styles.toggleKnobActive]} />
                </View>
              </Pressable>

              {/* Disconnect */}
              <Pressable style={styles.disconnectBtn} onPress={handleDisconnect}>
                <MaterialIcons name="link-off" size={18} color="#ef4444" />
                <ThemedText style={styles.disconnectText}>Rozłącz konto</ThemedText>
              </Pressable>
            </View>
          </View>
        )}

        {/* Provider Selection */}
        {!config.connected && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Wybierz usługę chmury</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Zdjęcia będą przechowywane na Twoim koncie, nie na serwerach aplikacji
            </ThemedText>

            {providers.map(provider => (
              <Pressable
                key={provider.id}
                style={styles.providerCard}
                onPress={() => handleConnectProvider(provider.id)}
              >
                <View style={[styles.providerIcon, { backgroundColor: provider.color + "20" }]}>
                  <MaterialIcons name={provider.icon as any} size={28} color={provider.color} />
                </View>
                <View style={styles.providerInfo}>
                  <ThemedText style={styles.providerName}>{provider.name}</ThemedText>
                  <ThemedText style={styles.providerDesc}>{provider.description}</ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#64748b" />
              </Pressable>
            ))}
          </View>
        )}

        {/* Storage Info */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Jak to działa?</ThemedText>
          
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <ThemedText style={styles.stepNumberText}>1</ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Połącz swoje konto</ThemedText>
              <ThemedText style={styles.stepDesc}>
                Autoryzuj aplikację do zapisu zdjęć w wybranym folderze
              </ThemedText>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <ThemedText style={styles.stepNumberText}>2</ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Zdjęcia trafiają do Twojej chmury</ThemedText>
              <ThemedText style={styles.stepDesc}>
                Każde zdjęcie jest zapisywane bezpośrednio na Twoim koncie
              </ThemedText>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <ThemedText style={styles.stepNumberText}>3</ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Pełna kontrola nad danymi</ThemedText>
              <ThemedText style={styles.stepDesc}>
                Możesz w każdej chwili usunąć lub przenieść zdjęcia
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <ThemedText style={styles.benefitsTitle}>Korzyści</ThemedText>
          <View style={styles.benefitRow}>
            <MaterialIcons name="check" size={18} color="#22c55e" />
            <ThemedText style={styles.benefitText}>Brak limitów przestrzeni w aplikacji</ThemedText>
          </View>
          <View style={styles.benefitRow}>
            <MaterialIcons name="check" size={18} color="#22c55e" />
            <ThemedText style={styles.benefitText}>Twoje zdjęcia, Twoja chmura</ThemedText>
          </View>
          <View style={styles.benefitRow}>
            <MaterialIcons name="check" size={18} color="#22c55e" />
            <ThemedText style={styles.benefitText}>Dostęp z każdego urządzenia</ThemedText>
          </View>
          <View style={styles.benefitRow}>
            <MaterialIcons name="check" size={18} color="#22c55e" />
            <ThemedText style={styles.benefitText}>Automatyczne kopie zapasowe</ThemedText>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary + "15",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: AppColors.primary + "30",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: Spacing.md,
  },
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  providerDesc: {
    fontSize: 12,
    color: "#64748b",
  },
  connectedCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  connectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  connectedInfo: {
    flex: 1,
  },
  connectedName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  connectedEmail: {
    fontSize: 12,
    color: "#64748b",
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#22c55e20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  connectedBadgeText: {
    fontSize: 11,
    color: "#22c55e",
    fontWeight: "600",
  },
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0f172a",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  folderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  folderLabel: {
    fontSize: 14,
    color: "#94a3b8",
  },
  folderValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  folderPath: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "500",
  },
  settingsDivider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: Spacing.sm,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  toggleLabel: {
    fontSize: 14,
    color: "#e2e8f0",
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#334155",
    padding: 2,
  },
  toggleActive: {
    backgroundColor: AppColors.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  toggleKnobActive: {
    marginLeft: 20,
  },
  disconnectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  disconnectText: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "500",
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },
  benefitsCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  benefitText: {
    fontSize: 13,
    color: "#94a3b8",
  },
});
