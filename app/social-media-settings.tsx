import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

// Mock connected accounts (would come from API)
interface SocialAccount {
  id: string;
  platform: "facebook" | "instagram";
  name: string;
  username?: string;
  profileImage?: string;
  isPage?: boolean;
  pageName?: string;
  connectedAt: string;
}

export default function SocialMediaSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({ light: "#F5F5F5", dark: "#1C1C1E" }, "background");
  const borderColor = useThemeColor({ light: "#E0E0E0", dark: "#333" }, "icon");
  const dangerColor = "#FF3B30";

  const [isConnecting, setIsConnecting] = useState<"facebook" | "instagram" | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([
    // Mock data - would come from API
    // {
    //   id: "1",
    //   platform: "facebook",
    //   name: "KS Orzeł Białystok",
    //   pageName: "KS Orzeł Białystok - Oficjalna strona",
    //   isPage: true,
    //   connectedAt: "2024-01-15",
    // },
  ]);

  const handleConnectFacebook = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsConnecting("facebook");

    try {
      // In production, this would open Facebook OAuth flow
      // For now, show info about the feature
      Alert.alert(
        "Połącz z Facebook",
        "Aby połączyć konto Facebook:\n\n" +
          "1. Zaloguj się do swojego konta Facebook\n" +
          "2. Wybierz stronę klubu do połączenia\n" +
          "3. Zatwierdź uprawnienia do publikowania\n\n" +
          "Ta funkcja wymaga konta Facebook z uprawnieniami do zarządzania stroną.",
        [
          { text: "Anuluj", style: "cancel" },
          {
            text: "Połącz",
            onPress: () => {
              // Mock connection
              const newAccount: SocialAccount = {
                id: Date.now().toString(),
                platform: "facebook",
                name: "Moja Strona Klubu",
                pageName: "KS Przykład - Oficjalna strona",
                isPage: true,
                connectedAt: new Date().toISOString().split("T")[0],
              };
              setConnectedAccounts([...connectedAccounts, newAccount]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    } finally {
      setIsConnecting(null);
    }
  };

  const handleConnectInstagram = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsConnecting("instagram");

    try {
      Alert.alert(
        "Połącz z Instagram",
        "Aby połączyć konto Instagram:\n\n" +
          "1. Konto musi być kontem biznesowym lub twórcy\n" +
          "2. Konto musi być połączone ze stroną Facebook\n" +
          "3. Zaloguj się przez Facebook i wybierz konto Instagram\n\n" +
          "Instagram wymaga połączenia przez Facebook Business.",
        [
          { text: "Anuluj", style: "cancel" },
          {
            text: "Połącz",
            onPress: () => {
              const newAccount: SocialAccount = {
                id: Date.now().toString(),
                platform: "instagram",
                name: "ks_przyklad",
                username: "@ks_przyklad",
                connectedAt: new Date().toISOString().split("T")[0],
              };
              setConnectedAccounts([...connectedAccounts, newAccount]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnect = (account: SocialAccount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Odłącz konto",
      `Czy na pewno chcesz odłączyć ${account.platform === "facebook" ? "stronę Facebook" : "konto Instagram"} "${account.name}"?`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Odłącz",
          style: "destructive",
          onPress: () => {
            setConnectedAccounts(connectedAccounts.filter((a) => a.id !== account.id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const renderConnectedAccount = ({ item }: { item: SocialAccount }) => (
    <View style={[styles.accountCard, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.accountHeader}>
        <View
          style={[
            styles.platformIcon,
            {
              backgroundColor: item.platform === "facebook" ? "#1877F2" : "#E4405F",
            },
          ]}
        >
          <ThemedText style={styles.platformIconText}>
            {item.platform === "facebook" ? "f" : "📷"}
          </ThemedText>
        </View>
        <View style={styles.accountInfo}>
          <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
          {item.pageName && (
            <ThemedText style={styles.accountSubtext}>{item.pageName}</ThemedText>
          )}
          {item.username && (
            <ThemedText style={styles.accountSubtext}>{item.username}</ThemedText>
          )}
          <ThemedText style={styles.connectedDate}>
            Połączono: {item.connectedAt}
          </ThemedText>
        </View>
      </View>
      <View style={styles.accountActions}>
        <Pressable
          style={[styles.actionButton, { borderColor }]}
          onPress={() => router.push("/social-media-post" as any)}
        >
          <ThemedText style={{ color: tintColor }}>Utwórz post</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.disconnectButton]}
          onPress={() => handleDisconnect(item)}
        >
          <ThemedText style={{ color: dangerColor }}>Odłącz</ThemedText>
        </Pressable>
      </View>
    </View>
  );

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={{ fontSize: 24 }}>←</ThemedText>
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText type="subtitle">Media społecznościowe</ThemedText>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Section */}
        <View style={[styles.infoCard, { backgroundColor: "#E3F2FD", borderColor: "#90CAF9" }]}>
          <ThemedText style={styles.infoTitle}>📱 Udostępniaj treści klubowe</ThemedText>
          <ThemedText style={styles.infoText}>
            Połącz konta social media aby automatycznie udostępniać statystyki meczowe,
            zapowiedzi spotkań i osiągnięcia zawodników.
          </ThemedText>
        </View>

        {/* Connect Buttons */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Połącz konto
          </ThemedText>

          <Pressable
            style={[styles.connectButton, { backgroundColor: "#1877F2" }]}
            onPress={handleConnectFacebook}
            disabled={isConnecting !== null}
          >
            {isConnecting === "facebook" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <ThemedText style={styles.connectButtonIcon}>f</ThemedText>
                <ThemedText style={styles.connectButtonText}>
                  Połącz z Facebook
                </ThemedText>
              </>
            )}
          </Pressable>

          <Pressable
            style={[styles.connectButton, styles.instagramButton]}
            onPress={handleConnectInstagram}
            disabled={isConnecting !== null}
          >
            {isConnecting === "instagram" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <ThemedText style={styles.connectButtonIcon}>📷</ThemedText>
                <ThemedText style={styles.connectButtonText}>
                  Połącz z Instagram
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>

        {/* Connected Accounts */}
        {connectedAccounts.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Połączone konta
            </ThemedText>
            <FlatList
              data={connectedAccounts}
              keyExtractor={(item) => item.id}
              renderItem={renderConnectedAccount}
              scrollEnabled={false}
              contentContainerStyle={styles.accountsList}
            />
          </View>
        )}

        {/* Features */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Dostępne funkcje
          </ThemedText>

          <View style={[styles.featureCard, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.featureIcon}>⚽</ThemedText>
            <View style={styles.featureInfo}>
              <ThemedText type="defaultSemiBold">Wyniki meczów</ThemedText>
              <ThemedText style={styles.featureDescription}>
                Automatyczne posty z wynikami i statystykami po meczu
              </ThemedText>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.featureIcon}>📅</ThemedText>
            <View style={styles.featureInfo}>
              <ThemedText type="defaultSemiBold">Zapowiedzi meczów</ThemedText>
              <ThemedText style={styles.featureDescription}>
                Publikuj zapowiedzi nadchodzących spotkań
              </ThemedText>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.featureIcon}>🏆</ThemedText>
            <View style={styles.featureInfo}>
              <ThemedText type="defaultSemiBold">Osiągnięcia zawodników</ThemedText>
              <ThemedText style={styles.featureDescription}>
                Wyróżniaj zawodników za zdobyte odznaki i rekordy
              </ThemedText>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.featureIcon}>📊</ThemedText>
            <View style={styles.featureInfo}>
              <ThemedText type="defaultSemiBold">Statystyki sezonu</ThemedText>
              <ThemedText style={styles.featureDescription}>
                Podsumowania ligowe i klasyfikacje strzelców
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1565C0",
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#1565C0",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  instagramButton: {
    backgroundColor: "#E4405F",
  },
  connectButtonIcon: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  accountsList: {
    gap: 12,
  },
  accountCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  platformIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  platformIconText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  accountInfo: {
    flex: 1,
  },
  accountSubtext: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  connectedDate: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  accountActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  disconnectButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureInfo: {
    flex: 1,
  },
  featureDescription: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 4,
    lineHeight: 18,
  },
});
