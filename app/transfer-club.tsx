import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

export default function TransferClubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ clubId: string; clubName: string }>();
  const clubId = parseInt(params.clubId || "0", 10);
  const clubName = params.clubName || "Klub";

  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const { data: candidates, isLoading: loadingCandidates } = trpc.account.getTransferCandidates.useQuery(
    { clubId },
    { enabled: clubId > 0 }
  );

  const transferMutation = trpc.account.transferClubOwnership.useMutation({
    onSuccess: (data) => {
      Alert.alert(
        "Sukces",
        data.message,
        [{ text: "OK", onPress: () => router.back() }]
      );
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
      setIsTransferring(false);
    },
  });

  const handleTransfer = () => {
    if (!newOwnerEmail.trim()) {
      Alert.alert("Błąd", "Wprowadź adres email nowego właściciela");
      return;
    }

    if (confirmText !== "PRZEKAZ KLUB") {
      Alert.alert("Błąd", "Wpisz 'PRZEKAZ KLUB' aby potwierdzić");
      return;
    }

    Alert.alert(
      "Potwierdź przekazanie",
      `Czy na pewno chcesz przekazać klub "${clubName}" do ${newOwnerEmail}?\n\nTa operacja jest nieodwracalna.`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Przekaż",
          style: "destructive",
          onPress: () => {
            setIsTransferring(true);
            transferMutation.mutate({
              clubId,
              newOwnerEmail: newOwnerEmail.trim(),
              confirmText,
            });
          },
        },
      ]
    );
  };

  const selectCandidate = (email: string) => {
    setNewOwnerEmail(email);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={AppColors.textPrimary} />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>
          Przekaż klub
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 20 }}
      >
        <View style={styles.warningCard}>
          <MaterialIcons name="warning" size={32} color={AppColors.warning} />
          <ThemedText style={styles.warningTitle}>Uwaga!</ThemedText>
          <ThemedText style={styles.warningText}>
            Przekazanie klubu przeniesie wszystkie uprawnienia właściciela na nową osobę.
            Stracisz możliwość zarządzania klubem jako właściciel.
          </ThemedText>
        </View>

        <View style={styles.clubInfo}>
          <ThemedText style={styles.label}>Klub do przekazania:</ThemedText>
          <ThemedText type="subtitle" style={styles.clubName}>{clubName}</ThemedText>
        </View>

        {candidates && candidates.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Członkowie klubu:</ThemedText>
            <ThemedText style={styles.sectionHint}>
              Kliknij aby wybrać nowego właściciela
            </ThemedText>
            {candidates.map((candidate) => (
              <Pressable
                key={candidate.userId}
                style={[
                  styles.candidateCard,
                  newOwnerEmail === candidate.email && styles.candidateSelected,
                ]}
                onPress={() => selectCandidate(candidate.email || "")}
              >
                <View style={styles.candidateInfo}>
                  <ThemedText style={styles.candidateName}>
                    {candidate.name || "Bez nazwy"}
                  </ThemedText>
                  <ThemedText style={styles.candidateEmail}>
                    {candidate.email}
                  </ThemedText>
                  <ThemedText style={styles.candidateRole}>
                    {candidate.role === "board_member" ? "Członek zarządu" :
                     candidate.role === "coach" ? "Trener" :
                     candidate.role === "player" ? "Zawodnik" : candidate.role}
                  </ThemedText>
                </View>
                {newOwnerEmail === candidate.email && (
                  <MaterialIcons name="check-circle" size={24} color={AppColors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <ThemedText style={styles.label}>Email nowego właściciela:</ThemedText>
          <TextInput
            style={styles.input}
            value={newOwnerEmail}
            onChangeText={setNewOwnerEmail}
            placeholder="email@example.com"
            placeholderTextColor={AppColors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>
            Wpisz "PRZEKAZ KLUB" aby potwierdzić:
          </ThemedText>
          <TextInput
            style={styles.input}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="PRZEKAZ KLUB"
            placeholderTextColor={AppColors.textSecondary}
            autoCapitalize="characters"
          />
        </View>

        <Pressable
          style={[
            styles.transferButton,
            (confirmText !== "PRZEKAZ KLUB" || !newOwnerEmail.trim() || isTransferring) &&
              styles.transferButtonDisabled,
          ]}
          onPress={handleTransfer}
          disabled={confirmText !== "PRZEKAZ KLUB" || !newOwnerEmail.trim() || isTransferring}
        >
          {isTransferring ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="swap-horiz" size={24} color="#fff" />
              <ThemedText style={styles.transferButtonText}>Przekaż klub</ThemedText>
            </>
          )}
        </Pressable>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.bgElevated,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  warningCard: {
    backgroundColor: `${AppColors.warning}15`,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${AppColors.warning}30`,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.warning,
    marginTop: 8,
    marginBottom: 8,
  },
  warningText: {
    textAlign: "center",
    color: AppColors.textSecondary,
    lineHeight: 22,
  },
  clubInfo: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  clubName: {
    fontSize: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 12,
  },
  candidateCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  candidateSelected: {
    borderColor: AppColors.primary,
    backgroundColor: `${AppColors.primary}10`,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  candidateEmail: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  candidateRole: {
    fontSize: 12,
    color: AppColors.primary,
  },
  input: {
    backgroundColor: AppColors.bgCard,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: AppColors.textPrimary,
    borderWidth: 1,
    borderColor: AppColors.bgElevated,
  },
  transferButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.warning,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 16,
  },
  transferButtonDisabled: {
    opacity: 0.5,
  },
  transferButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
