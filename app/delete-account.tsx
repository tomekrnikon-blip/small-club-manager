import { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

const CONFIRM_TEXT = "USUŃ KONTO";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: accountInfo, isLoading } = trpc.account.getAccountInfo.useQuery();
  const deleteAccountMutation = trpc.account.deleteAccount.useMutation();

  const isManager = accountInfo?.isManager || false;
  const ownedClubs = accountInfo?.ownedClubs || [];

  const handleDelete = async () => {
    if (confirmText !== CONFIRM_TEXT) {
      Alert.alert("Błąd", `Wpisz "${CONFIRM_TEXT}" aby potwierdzić usunięcie konta`);
      return;
    }

    const warningMessage = isManager
      ? `Czy na pewno chcesz usunąć swoje konto?\n\nJako manager, usunięcie konta spowoduje również usunięcie:\n• Wszystkich klubów (${ownedClubs.length})\n• Wszystkich zawodników\n• Wszystkich meczów i statystyk\n• Wszystkich danych finansowych\n\nTej operacji nie można cofnąć!`
      : "Czy na pewno chcesz usunąć swoje konto?\n\nTwoje członkostwo w klubach zostanie anulowane, ale statystyki klubu pozostaną nienaruszone.\n\nTej operacji nie można cofnąć!";

    Alert.alert(
      "Ostateczne potwierdzenie",
      warningMessage,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń konto",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteAccountMutation.mutateAsync({ confirmText });
              await logout();
              Alert.alert(
                "Konto usunięte",
                "Twoje konto zostało pomyślnie usunięte. Dziękujemy za korzystanie z aplikacji.",
                [{ text: "OK", onPress: () => router.replace("/(tabs)" as any) }]
              );
            } catch (error: any) {
              Alert.alert("Błąd", error.message || "Nie udało się usunąć konta");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <ThemedText style={styles.title}>Usuń konto</ThemedText>
        </View>

        {/* Warning Section */}
        <View style={styles.warningSection}>
          <MaterialIcons name="warning" size={48} color={AppColors.danger} />
          <ThemedText style={styles.warningTitle}>Uwaga!</ThemedText>
          <ThemedText style={styles.warningText}>
            Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte.
          </ThemedText>
        </View>

        {/* Account Info */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.sectionTitle}>Informacje o koncie</ThemedText>
          
          <View style={styles.infoRow}>
            <MaterialIcons 
              name={isManager ? "admin-panel-settings" : "person"} 
              size={24} 
              color={isManager ? AppColors.warning : AppColors.primary} 
            />
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoLabel}>Typ konta</ThemedText>
              <ThemedText style={styles.infoValue}>
                {isManager ? "Manager klubu" : "Członek klubu"}
              </ThemedText>
            </View>
          </View>

          {isManager && ownedClubs.length > 0 && (
            <View style={styles.clubsList}>
              <ThemedText style={styles.clubsTitle}>Zarządzane kluby:</ThemedText>
              {ownedClubs.map((club) => (
                <View key={club.id} style={styles.clubItem}>
                  <MaterialIcons name="sports-soccer" size={20} color={AppColors.danger} />
                  <ThemedText style={styles.clubName}>{club.name}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* What will be deleted */}
        <View style={styles.deletionInfo}>
          <ThemedText style={styles.sectionTitle}>Co zostanie usunięte:</ThemedText>
          
          {isManager ? (
            <>
              <DeletionItem icon="group" text="Wszystkie kluby i ich dane" />
              <DeletionItem icon="people" text="Wszyscy zawodnicy i ich statystyki" />
              <DeletionItem icon="sports" text="Wszystkie mecze i wydarzenia" />
              <DeletionItem icon="fitness-center" text="Wszystkie treningi" />
              <DeletionItem icon="account-balance-wallet" text="Wszystkie dane finansowe" />
              <DeletionItem icon="school" text="Dane szkółki piłkarskiej" />
              <DeletionItem icon="photo-library" text="Wszystkie zdjęcia" />
            </>
          ) : (
            <>
              <DeletionItem icon="person-remove" text="Twoje członkostwo w klubach" />
              <DeletionItem icon="notifications-off" text="Twoje powiadomienia" />
              <DeletionItem icon="message" text="Twoje wiadomości" />
              <PreservedItem icon="bar-chart" text="Statystyki klubu (zachowane)" />
              <PreservedItem icon="sports-soccer" text="Historia meczów (zachowana)" />
            </>
          )}
        </View>

        {/* Confirmation Input */}
        <View style={styles.confirmSection}>
          <ThemedText style={styles.confirmLabel}>
            Wpisz <ThemedText style={styles.confirmTextHighlight}>{CONFIRM_TEXT}</ThemedText> aby potwierdzić:
          </ThemedText>
          <TextInput
            style={styles.confirmInput}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder={CONFIRM_TEXT}
            placeholderTextColor="#666"
            autoCapitalize="characters"
          />
        </View>

        {/* Delete Button */}
        <Pressable
          style={[
            styles.deleteButton,
            confirmText !== CONFIRM_TEXT && styles.deleteButtonDisabled,
          ]}
          onPress={handleDelete}
          disabled={confirmText !== CONFIRM_TEXT || isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="delete-forever" size={24} color="#fff" />
              <ThemedText style={styles.deleteButtonText}>Usuń konto na zawsze</ThemedText>
            </>
          )}
        </Pressable>

        {/* Cancel Button */}
        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <ThemedText style={styles.cancelButtonText}>Anuluj</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

function DeletionItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.listItem}>
      <MaterialIcons name={icon as any} size={20} color={AppColors.danger} />
      <ThemedText style={styles.listItemText}>{text}</ThemedText>
    </View>
  );
}

function PreservedItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.listItem}>
      <MaterialIcons name={icon as any} size={20} color={AppColors.success} />
      <ThemedText style={[styles.listItemText, { color: AppColors.success }]}>{text}</ThemedText>
    </View>
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  warningSection: {
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: AppColors.danger,
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.danger,
    marginTop: Spacing.md,
  },
  warningText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  infoSection: {
    backgroundColor: AppColors.bgCard,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  infoValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  clubsList: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  clubsTitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: Spacing.sm,
  },
  clubItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  clubName: {
    fontSize: 14,
    color: AppColors.danger,
  },
  deletionInfo: {
    backgroundColor: AppColors.bgCard,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xl,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  listItemText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  confirmSection: {
    marginBottom: Spacing.xl,
  },
  confirmLabel: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: Spacing.sm,
  },
  confirmTextHighlight: {
    color: AppColors.danger,
    fontWeight: "bold",
  },
  confirmInput: {
    backgroundColor: AppColors.bgCard,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: AppColors.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    padding: Spacing.md,
  },
  cancelButtonText: {
    color: "#94a3b8",
    fontSize: 16,
  },
});
