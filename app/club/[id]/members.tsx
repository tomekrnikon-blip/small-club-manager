import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

const roleLabels: Record<string, string> = {
  manager: "Manager",
  coach: "Trener",
  player: "Zawodnik",
  board_member: "Członek zarządu",
  board_finance: "Zarząd - Finanse",
};

const roleColors: Record<string, string> = {
  manager: AppColors.warning,
  coach: AppColors.primary,
  player: AppColors.secondary,
  board_member: "#8b5cf6",
  board_finance: AppColors.success,
};

export default function ClubMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();

  const clubId = parseInt(id || "0", 10);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("player");

  // Note: Club members functionality needs to be added to the backend
  // For now, we'll show a placeholder
  const members: any[] = [];
  const isLoading = false;

  const inviteMutation = {
    mutate: (_data: any) => {
      Alert.alert("Info", "Funkcja zapraszania członków będzie dostępna wkrótce");
    },
    isPending: false,
  };

  const handleInviteSuccess = () => {
      setShowInviteModal(false);
    setInviteEmail("");
    setInviteRole("player");
    Alert.alert("Sukces", "Zaproszenie zostało wysłane!");
  };

  const removeMutation = {
    mutate: (_data: any) => {
      Alert.alert("Info", "Funkcja usuwania członków będzie dostępna wkrótce");
    },
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      Alert.alert("Błąd", "Podaj adres email");
      return;
    }

    Alert.alert("Info", "Funkcja zapraszania członków będzie dostępna wkrótce");
  };

  const handleRemove = (memberId: number, memberName: string) => {
    Alert.alert(
      "Usuń członka",
      `Czy na pewno chcesz usunąć ${memberName} z klubu?`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: () => removeMutation.mutate({ clubId, userId: memberId }),
        },
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.title}>Członkowie klubu</ThemedText>
        <Pressable style={styles.addButton} onPress={() => setShowInviteModal(true)}>
          <MaterialIcons name="person-add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Members list */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MemberCard
              member={item}
              onRemove={() => handleRemove(item.userId, item.user?.name || "tego użytkownika")}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people-outline" size={64} color="#334155" />
              <ThemedText style={styles.emptyTitle}>Brak członków</ThemedText>
              <ThemedText style={styles.emptyText}>
                Zaproś pierwszego członka do klubu
              </ThemedText>
            </View>
          }
        />
      )}

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Zaproś członka</ThemedText>
              <Pressable onPress={() => setShowInviteModal(false)}>
                <MaterialIcons name="close" size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Email *</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  placeholderTextColor="#64748b"
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Rola</ThemedText>
                <View style={styles.roleSelector}>
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <Pressable
                      key={key}
                      style={[
                        styles.roleOption,
                        inviteRole === key && { backgroundColor: roleColors[key] + "30", borderColor: roleColors[key] },
                      ]}
                      onPress={() => setInviteRole(key)}
                    >
                      <ThemedText
                        style={[
                          styles.roleOptionText,
                          inviteRole === key && { color: roleColors[key] },
                        ]}
                      >
                        {label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <Pressable
              style={[styles.submitButton, inviteMutation.isPending && styles.submitButtonDisabled]}
              onPress={handleInvite}
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitText}>Wyślij zaproszenie</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

function MemberCard({ member, onRemove }: { member: any; onRemove: () => void }) {
  const roleColor = roleColors[member.role] || "#64748b";

  return (
    <View style={styles.memberCard}>
      <View style={[styles.memberAvatar, { backgroundColor: roleColor + "20" }]}>
        <MaterialIcons name="person" size={24} color={roleColor} />
      </View>
      <View style={styles.memberInfo}>
        <ThemedText style={styles.memberName}>
          {member.user?.name || "Użytkownik"}
        </ThemedText>
        <ThemedText style={styles.memberEmail}>
          {member.user?.email || member.user?.openId}
        </ThemedText>
        <View style={[styles.roleBadge, { backgroundColor: roleColor + "20" }]}>
          <ThemedText style={[styles.roleText, { color: roleColor }]}>
            {roleLabels[member.role] || member.role}
          </ThemedText>
        </View>
      </View>
      {member.role !== "manager" && (
        <Pressable style={styles.removeButton} onPress={onRemove}>
          <MaterialIcons name="close" size={20} color={AppColors.danger} />
        </Pressable>
      )}
    </View>
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
  addButton: {
    backgroundColor: AppColors.primary,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  memberEmail: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: AppColors.danger + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: AppColors.bgCard,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  modalForm: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
  },
  input: {
    backgroundColor: AppColors.bgElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: "#fff",
    fontSize: 16,
  },
  roleSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  roleOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#475569",
    backgroundColor: AppColors.bgElevated,
  },
  roleOptionText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
