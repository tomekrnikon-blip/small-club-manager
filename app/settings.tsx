import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, View, Switch, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { languages, changeLanguage, getCurrentLanguage, type LanguageCode } from "@/lib/i18n";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [currentLang, setCurrentLang] = useState<LanguageCode>(getCurrentLanguage());
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('common.confirm') + '?',
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('auth.logout'),
          style: "destructive",
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleLanguageChange = async (langCode: LanguageCode) => {
    await changeLanguage(langCode);
    setCurrentLang(langCode);
    setShowLanguageModal(false);
  };

  const currentLanguage = languages.find(l => l.code === currentLang);

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>{t('auth.login')}</ThemedText>
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
        <ThemedText style={styles.title}>{t('settings.title')}</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.account')}</ThemedText>
          <View style={styles.card}>
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <MaterialIcons name="person" size={28} color={AppColors.primary} />
              </View>
              <View style={styles.userInfo}>
                <ThemedText style={styles.userName}>{user?.name || "Użytkownik"}</ThemedText>
                <ThemedText style={styles.userEmail}>{user?.email || user?.openId}</ThemedText>
              </View>
              {user?.isPro && (
                <View style={styles.proBadge}>
                  <MaterialIcons name="star" size={12} color="#fff" />
                  <ThemedText style={styles.proText}>PRO</ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.language')}</ThemedText>
          <View style={styles.card}>
            <Pressable style={styles.menuRow} onPress={() => setShowLanguageModal(true)}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="language" size={22} color="#64748b" />
                <ThemedText style={styles.settingLabel}>{t('settings.language')}</ThemedText>
              </View>
              <View style={styles.languageValue}>
                <ThemedText style={styles.languageText}>
                  {currentLanguage?.flag} {currentLanguage?.name}
                </ThemedText>
                <MaterialIcons name="chevron-right" size={22} color="#64748b" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.notifications')}</ThemedText>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="notifications" size={22} color="#64748b" />
                <ThemedText style={styles.settingLabel}>Push</ThemedText>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: "#475569", true: AppColors.primary + "50" }}
                thumbColor={pushNotifications ? AppColors.primary : "#94a3b8"}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="email" size={22} color="#64748b" />
                <ThemedText style={styles.settingLabel}>Email</ThemedText>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: "#475569", true: AppColors.primary + "50" }}
                thumbColor={emailNotifications ? AppColors.primary : "#94a3b8"}
              />
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.theme')}</ThemedText>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="dark-mode" size={22} color="#64748b" />
                <ThemedText style={styles.settingLabel}>Dark Mode</ThemedText>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: "#475569", true: AppColors.primary + "50" }}
                thumbColor={darkMode ? AppColors.primary : "#94a3b8"}
              />
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('help.title')}</ThemedText>
          <View style={styles.card}>
            <Pressable style={styles.menuRow}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="info" size={22} color="#64748b" />
                <ThemedText style={styles.settingLabel}>Wersja</ThemedText>
              </View>
              <ThemedText style={styles.versionText}>1.0.0</ThemedText>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.menuRow} onPress={() => router.push('/help')}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="help" size={22} color="#64748b" />
                <ThemedText style={styles.settingLabel}>{t('help.faq')}</ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#64748b" />
            </Pressable>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={AppColors.danger} />
          <ThemedText style={styles.logoutText}>{t('auth.logout')}</ThemedText>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLanguageModal(false)}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>{t('settings.language')}</ThemedText>
            {languages.map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLang === lang.code && styles.languageOptionActive
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <ThemedText style={styles.languageFlag}>{lang.flag}</ThemedText>
                <ThemedText style={[
                  styles.languageName,
                  currentLang === lang.code && styles.languageNameActive
                ]}>
                  {lang.name}
                </ThemedText>
                {currentLang === lang.code && (
                  <MaterialIcons name="check" size={22} color={AppColors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: AppColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  userEmail: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 2,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    gap: 4,
  },
  proText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    color: "#e2e8f0",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  versionText: {
    fontSize: 14,
    color: "#64748b",
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.bgElevated,
    marginHorizontal: Spacing.lg,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.danger + "15",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.danger,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
  },
  languageValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  languageText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  languageOptionActive: {
    backgroundColor: AppColors.primary + "20",
  },
  languageFlag: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  languageName: {
    fontSize: 16,
    color: "#e2e8f0",
    flex: 1,
  },
  languageNameActive: {
    color: AppColors.primary,
    fontWeight: "600",
  },
});
