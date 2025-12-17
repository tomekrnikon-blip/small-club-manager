import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";

type ExpirationOption = "1day" | "7days" | "30days" | "never";

export default function ShareAlbumScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ albumId?: string; albumTitle?: string }>();
  
  const [expiration, setExpiration] = useState<ExpirationOption>("7days");
  const [allowDownload, setAllowDownload] = useState(true);
  const [showPhotos, setShowPhotos] = useState(true);
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const albumTitle = params.albumTitle || "Album";

  const expirationOptions: { key: ExpirationOption; label: string }[] = [
    { key: "1day", label: "1 dzień" },
    { key: "7days", label: "7 dni" },
    { key: "30days", label: "30 dni" },
    { key: "never", label: "Bez limitu" },
  ];

  const generateLink = () => {
    // Generate a mock shareable link
    const linkId = Math.random().toString(36).substring(2, 10);
    const link = `https://club.app/album/${linkId}`;
    setShareLink(link);
    setLinkGenerated(true);
  };

  const handleCopyLink = async () => {
    if (shareLink) {
      await Clipboard.setStringAsync(shareLink);
      Alert.alert("Skopiowano", "Link został skopiowany do schowka");
    }
  };

  const handleShare = async () => {
    if (shareLink) {
      try {
        await Share.share({
          message: `Zobacz album "${albumTitle}": ${shareLink}`,
          url: shareLink,
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    }
  };

  const handleShareVia = (platform: string) => {
    if (!shareLink) {
      generateLink();
    }
    
    // In a real app, these would open specific apps
    Alert.alert(
      `Udostępnij przez ${platform}`,
      `Link zostanie udostępniony przez ${platform}`,
      [
        { text: "Anuluj", style: "cancel" },
        { text: "Udostępnij", onPress: handleShare },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Udostępnij album</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Album Info */}
        <View style={styles.albumInfo}>
          <View style={styles.albumIcon}>
            <MaterialIcons name="photo-library" size={32} color={AppColors.primary} />
          </View>
          <ThemedText style={styles.albumTitle}>{albumTitle}</ThemedText>
          <ThemedText style={styles.albumSubtitle}>
            Utwórz link do udostępnienia albumu
          </ThemedText>
        </View>

        {/* Settings */}
        <ThemedText style={styles.sectionTitle}>Ustawienia linku</ThemedText>
        
        {/* Expiration */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <MaterialIcons name="schedule" size={20} color="#64748b" />
            <ThemedText style={styles.settingLabel}>Ważność linku</ThemedText>
          </View>
          <View style={styles.expirationOptions}>
            {expirationOptions.map(option => (
              <Pressable
                key={option.key}
                style={[
                  styles.expirationChip,
                  expiration === option.key && styles.expirationChipActive,
                ]}
                onPress={() => setExpiration(option.key)}
              >
                <ThemedText style={[
                  styles.expirationText,
                  expiration === option.key && styles.expirationTextActive,
                ]}>
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Toggle Options */}
        <View style={styles.settingCard}>
          <Pressable 
            style={styles.toggleRow}
            onPress={() => setAllowDownload(!allowDownload)}
          >
            <View style={styles.toggleInfo}>
              <MaterialIcons name="download" size={20} color="#64748b" />
              <ThemedText style={styles.toggleLabel}>Pozwól na pobieranie</ThemedText>
            </View>
            <View style={[styles.toggle, allowDownload && styles.toggleActive]}>
              <View style={[styles.toggleKnob, allowDownload && styles.toggleKnobActive]} />
            </View>
          </Pressable>

          <View style={styles.divider} />

          <Pressable 
            style={styles.toggleRow}
            onPress={() => setShowPhotos(!showPhotos)}
          >
            <View style={styles.toggleInfo}>
              <MaterialIcons name="visibility" size={20} color="#64748b" />
              <ThemedText style={styles.toggleLabel}>Pokaż wszystkie zdjęcia</ThemedText>
            </View>
            <View style={[styles.toggle, showPhotos && styles.toggleActive]}>
              <View style={[styles.toggleKnob, showPhotos && styles.toggleKnobActive]} />
            </View>
          </Pressable>
        </View>

        {/* Generate Link */}
        {!linkGenerated ? (
          <Pressable style={styles.generateBtn} onPress={generateLink}>
            <MaterialIcons name="link" size={20} color="#fff" />
            <ThemedText style={styles.generateBtnText}>Wygeneruj link</ThemedText>
          </Pressable>
        ) : (
          <View style={styles.linkSection}>
            <ThemedText style={styles.sectionTitle}>Link do udostępnienia</ThemedText>
            
            <View style={styles.linkCard}>
              <ThemedText style={styles.linkText} numberOfLines={1}>
                {shareLink}
              </ThemedText>
              <Pressable style={styles.copyBtn} onPress={handleCopyLink}>
                <MaterialIcons name="content-copy" size={20} color={AppColors.primary} />
              </Pressable>
            </View>

            {/* Share Options */}
            <ThemedText style={styles.sectionTitle}>Udostępnij przez</ThemedText>
            
            <View style={styles.shareOptions}>
              <Pressable style={styles.shareOption} onPress={() => handleShareVia("WhatsApp")}>
                <View style={[styles.shareIcon, { backgroundColor: "#25D36620" }]}>
                  <MaterialIcons name="chat" size={24} color="#25D366" />
                </View>
                <ThemedText style={styles.shareLabel}>WhatsApp</ThemedText>
              </Pressable>

              <Pressable style={styles.shareOption} onPress={() => handleShareVia("Messenger")}>
                <View style={[styles.shareIcon, { backgroundColor: "#006AFF20" }]}>
                  <MaterialIcons name="message" size={24} color="#006AFF" />
                </View>
                <ThemedText style={styles.shareLabel}>Messenger</ThemedText>
              </Pressable>

              <Pressable style={styles.shareOption} onPress={() => handleShareVia("Email")}>
                <View style={[styles.shareIcon, { backgroundColor: "#EA433520" }]}>
                  <MaterialIcons name="email" size={24} color="#EA4335" />
                </View>
                <ThemedText style={styles.shareLabel}>Email</ThemedText>
              </Pressable>

              <Pressable style={styles.shareOption} onPress={handleShare}>
                <View style={[styles.shareIcon, { backgroundColor: "#64748b20" }]}>
                  <MaterialIcons name="more-horiz" size={24} color="#64748b" />
                </View>
                <ThemedText style={styles.shareLabel}>Więcej</ThemedText>
              </Pressable>
            </View>

            {/* Regenerate */}
            <Pressable style={styles.regenerateBtn} onPress={generateLink}>
              <MaterialIcons name="refresh" size={18} color="#64748b" />
              <ThemedText style={styles.regenerateBtnText}>Wygeneruj nowy link</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={18} color="#64748b" />
          <ThemedText style={styles.infoText}>
            Osoby z linkiem będą mogły przeglądać album bez logowania. 
            Możesz w każdej chwili dezaktywować link w ustawieniach albumu.
          </ThemedText>
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
  albumInfo: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  albumIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  albumTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  albumSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  settingCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  settingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  settingLabel: {
    fontSize: 14,
    color: "#94a3b8",
  },
  expirationOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  expirationChip: {
    backgroundColor: "#0f172a",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "transparent",
  },
  expirationChipActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "20",
  },
  expirationText: {
    fontSize: 13,
    color: "#64748b",
  },
  expirationTextActive: {
    color: AppColors.primary,
    fontWeight: "600",
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
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: Spacing.sm,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  generateBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkSection: {
    marginTop: Spacing.md,
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.primary,
    marginRight: Spacing.sm,
  },
  copyBtn: {
    padding: Spacing.xs,
  },
  shareOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.lg,
  },
  shareOption: {
    alignItems: "center",
  },
  shareIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  shareLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  regenerateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  regenerateBtnText: {
    fontSize: 13,
    color: "#64748b",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
});
