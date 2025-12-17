import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useClubRole } from "@/hooks/use-club-role";
import { SponsoredSection } from "@/components/ad-banner";

export default function MoreScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];
  const { permissions, role } = useClubRole(club?.id);

  const handleLogout = () => {
    Alert.alert(
      "Wylogowanie",
      "Czy na pewno chcesz się wylogować?",
      [
        { text: "Anuluj", style: "cancel" },
        { text: "Wyloguj", style: "destructive", onPress: logout },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Zaloguj się, aby zobaczyć więcej opcji</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Więcej</ThemedText>
        </View>

        {/* User Profile Card */}
        <Pressable
          style={styles.profileCard}
          onPress={() => router.push("/profile" as any)}
        >
          <View style={styles.profileAvatar}>
            <MaterialIcons name="person" size={32} color={AppColors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName}>{user?.name || "Użytkownik"}</ThemedText>
            <ThemedText style={styles.profileEmail}>{user?.email || ""}</ThemedText>
            {user?.isPro && (
              <View style={styles.proBadge}>
                <MaterialIcons name="star" size={12} color="#fff" />
                <ThemedText style={styles.proText}>PRO</ThemedText>
              </View>
            )}
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#64748b" />
        </Pressable>

        {/* Club Section */}
        {club && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Klub</ThemedText>
            <MenuItem
              icon="business"
              label="Ustawienia klubu"
              onPress={() => router.push("/club/settings" as any)}
            />
            {permissions.canInviteUsers && (
            <MenuItem
              icon="people"
              label="Struktura klubu"
              onPress={() => router.push("/club-structure" as any)}
            />
          )}
            <MenuItem
              icon="groups"
              label="Drużyny"
              onPress={() => router.push("/teams" as any)}
            />
          </View>
        )}

        {/* Features Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Funkcje</ThemedText>
          <MenuItem
            icon="sports-soccer"
            label="Moje powołania"
            onPress={() => router.push("/my-callups" as any)}
          />
          <MenuItem
            icon="fitness-center"
            label="Treningi"
            onPress={() => router.push("/trainings" as any)}
          />
{permissions.canViewFinances && (
            <MenuItem
              icon="attach-money"
              label="Finanse"
              onPress={() => router.push("/finances" as any)}
            />
          )}
          <MenuItem
            icon="school"
            label="Szkółka"
            onPress={() => router.push("/academy" as any)}
          />
          <MenuItem
            icon="healing"
            label="Kontuzje"
            onPress={() => router.push("/injuries" as any)}
          />
          <MenuItem
            icon="photo-library"
            label="Galeria"
            onPress={() => router.push("/gallery" as any)}
          />
          <MenuItem
            icon="picture-as-pdf"
            label="Raporty PDF"
            onPress={() => router.push("/reports" as any)}
          />
          <MenuItem
            icon="bar-chart"
            label="Raport frekwencji"
            onPress={() => router.push("/frequency-report" as any)}
          />
          <MenuItem
            icon="file-download"
            label="Eksport danych (CSV)"
            onPress={() => router.push("/export" as any)}
          />
          <MenuItem
            icon="event"
            label="Eksport kalendarza (ICS)"
            onPress={() => router.push("/calendar-export" as any)}
          />
          <MenuItem
            icon="sync"
            label="Synchronizacja kalendarza"
            onPress={() => router.push("/calendar-sync" as any)}
          />
          <MenuItem
            icon="event"
            label="Google Calendar"
            onPress={() => router.push("/google-calendar-settings" as any)}
          />
          <MenuItem
            icon="date-range"
            label="Apple Calendar"
            onPress={() => router.push("/apple-calendar-settings" as any)}
          />
          {club && permissions.canEditClub && (
            <MenuItem
              icon="backup"
              label="Kopia zapasowa"
              onPress={() => router.push({ pathname: "/club/backup", params: { clubId: club.id.toString() } } as any)}
            />
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Ustawienia</ThemedText>
          <MenuItem
            icon="notifications"
            label="Powiadomienia"
            onPress={() => router.push("/notifications/settings" as any)}
          />
          <MenuItem
            icon="tune"
            label="Ustawienia przypomnień"
            onPress={() => router.push("/notification-preferences" as any)}
          />
          <MenuItem
            icon="chat"
            label="Integracja WhatsApp"
            onPress={() => router.push("/whatsapp-settings" as any)}
          />
          <MenuItem
            icon="analytics"
            label="Statystyki WhatsApp"
            onPress={() => router.push("/whatsapp-stats" as any)}
          />
          <MenuItem
            icon="sms"
            label="Integracja SMS"
            onPress={() => router.push("/sms-settings" as any)}
          />
          <MenuItem
            icon="bar-chart"
            label="Statystyki SMS"
            onPress={() => router.push("/sms-stats" as any)}
          />
          <MenuItem
            icon="tune"
            label="Kanały powiadomień"
            onPress={() => router.push("/messaging-settings" as any)}
          />
          <MenuItem
            icon="account-balance-wallet"
            label="Limity kosztów"
            onPress={() => router.push("/messaging-limits" as any)}
          />
          <MenuItem
            icon="sports"
            label="Dashboard Trenera"
            onPress={() => router.push("/coach-dashboard" as any)}
          />
          <MenuItem
            icon="family-restroom"
            label="Powiadomienia dla rodziców"
            onPress={() => router.push("/parent-notifications" as any)}
          />
          <MenuItem
            icon="picture-as-pdf"
            label="Eksport PDF"
            onPress={() => router.push("/pdf-export" as any)}
          />
<MenuItem
            icon="sports-soccer"
            label="Panel zawodnika"
            onPress={() => router.push("/player-dashboard" as any)}
          />
          <MenuItem
            icon="person"
            label="Panel rodzica"
            onPress={() => router.push("/parent-panel" as any)}
          />
          <MenuItem
            icon="star-rate"
            label="Oceny zawodników"
            onPress={() => router.push("/player-ratings" as any)}
          />
          <MenuItem
            icon="leaderboard"
            label="Statystyki drużyny"
            onPress={() => router.push("/team-statistics" as any)}
          />
          <MenuItem
            icon="chat"
            label="Wiadomości"
            onPress={() => router.push("/messages" as any)}
          />
          <MenuItem
            icon="notifications-active"
            label="Powiadomienia push"
            onPress={() => router.push("/push-settings" as any)}
          />
          <MenuItem
            icon="email"
            label="Powiadomienia email"
            onPress={() => router.push("/email-settings" as any)}
          />
          <MenuItem
            icon="poll"
            label="Ankiety i głosowania"
            onPress={() => router.push("/surveys" as any)}
          />
          <MenuItem
            icon="history"
            label="Historia zmian"
            onPress={() => router.push("/change-history" as any)}
          />
          <MenuItem
            icon="assessment"
            label="Eksport statystyk"
            onPress={() => router.push("/statistics-export" as any)}
          />
          <MenuItem
            icon="schedule"
            label="Automatyczne przypomnienia"
            onPress={() => router.push("/auto-reminders" as any)}
          />
          <MenuItem
            icon="bar-chart"
            label="Porównanie frekwencji"
            onPress={() => router.push("/team-frequency" as any)}
          />
          <MenuItem
            icon="history"
            label="Historia powiadomień"
            onPress={() => router.push("/notification-history" as any)}
          />
          <MenuItem
            icon="card-membership"
            label="Subskrypcja"
            onPress={() => router.push("/subscription" as any)}
          />
          <MenuItem
            icon="help"
            label="Pomoc"
            onPress={() => router.push("/help" as any)}
          />
          <MenuItem
            icon="cloud-off"
            label="Tryb offline"
            onPress={() => router.push("/offline-settings" as any)}
          />
        </View>

        {/* Master Admin Section */}
        {user?.isMasterAdmin && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Master Admin</ThemedText>
            <MenuItem
              icon="admin-panel-settings"
              label="Panel administracyjny"
              onPress={() => router.push("/admin" as any)}
              highlight
            />
          </View>
        )}

        {/* Logout */}
        <View style={styles.section}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color={AppColors.danger} />
            <ThemedText style={styles.logoutText}>Wyloguj się</ThemedText>
          </Pressable>
        </View>

        {/* Sponsored Section */}
        <SponsoredSection />

        {/* App Info */}
        <View style={styles.appInfo}>
          <ThemedText style={styles.appName}>Small Club Manager</ThemedText>
          <ThemedText style={styles.appVersion}>Wersja 1.0.0</ThemedText>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  highlight = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  highlight?: boolean;
}) {
  return (
    <Pressable
      style={[styles.menuItem, highlight && styles.menuItemHighlight]}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, highlight && styles.menuIconHighlight]}>
        <MaterialIcons
          name={icon as any}
          size={22}
          color={highlight ? AppColors.primary : "#94a3b8"}
        />
      </View>
      <ThemedText style={[styles.menuLabel, highlight && styles.menuLabelHighlight]}>
        {label}
      </ThemedText>
      <MaterialIcons name="chevron-right" size={22} color="#64748b" />
    </Pressable>
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: AppColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: "#94a3b8",
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
    alignSelf: "flex-start",
    gap: 4,
  },
  proText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  menuItemHighlight: {
    backgroundColor: AppColors.primary + "10",
    borderWidth: 1,
    borderColor: AppColors.primary + "30",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: AppColors.bgElevated,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  menuIconHighlight: {
    backgroundColor: AppColors.primary + "20",
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: "#e2e8f0",
  },
  menuLabelHighlight: {
    color: AppColors.primary,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.danger + "10",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.danger,
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  appName: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: Spacing.xs,
  },
  appVersion: {
    fontSize: 12,
    color: "#475569",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
  },
});
