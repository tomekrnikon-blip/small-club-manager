import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { trpc } from "@/lib/trpc";
import { useClubRole, ROLE_LABELS, ClubRole, getRoleLabel } from "@/hooks/use-club-role";

const ROLES = [
  { id: "manager", name: "Manager", description: "Pełny dostęp, może usuwać użytkowników", icon: "shield" },
  { id: "board_member", name: "Członek Zarządu", description: "Dostęp bez finansów, może usunąć Managera", icon: "briefcase" },
  { id: "board_member_finance", name: "Zarząd - Finanse", description: "Dostęp z finansami", icon: "cash" },
  { id: "coach", name: "Trener", description: "Edycja zawodników, meczów i treningów", icon: "fitness" },
  { id: "player", name: "Zawodnik", description: "Tylko podgląd statystyk", icon: "person" },
];

export default function ClubStructureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clubId: string }>();
  const insets = useSafeAreaInsets();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<ClubRole>("player");
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedMemberRole, setSelectedMemberRole] = useState<ClubRole>("player");

  // Get club ID from params or first club
  const { data: clubs } = trpc.clubs.list.useQuery();
  const clubId = params.clubId ? parseInt(params.clubId) : clubs?.[0]?.id;

  // Get user's role and permissions
  const { permissions, isLoading: roleLoading } = useClubRole(clubId);

  // Get club members
  const { data: members, isLoading: membersLoading, refetch: refetchMembers } = trpc.clubMembers.list.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId }
  );

  // Get invitations (only if user can invite)
  const { data: invitations, isLoading: invitationsLoading, refetch: refetchInvitations } = trpc.invitations.list.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId && permissions.canInviteUsers }
  );

  // Mutations
  const createInvitation = trpc.invitations.create.useMutation({
    onSuccess: () => {
      setShowInviteModal(false);
      setInviteEmail("");
      setSelectedRole("player");
      refetchInvitations();
      Alert.alert("Sukces", "Zaproszenie zostało wysłane");
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const revokeInvitation = trpc.invitations.revoke.useMutation({
    onSuccess: () => {
      refetchInvitations();
      Alert.alert("Sukces", "Zaproszenie zostało anulowane");
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const updateMemberRole = trpc.clubMembers.updateRole.useMutation({
    onSuccess: () => {
      setShowRoleChangeModal(false);
      refetchMembers();
      Alert.alert("Sukces", "Rola została zmieniona");
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const removeMember = trpc.clubMembers.remove.useMutation({
    onSuccess: () => {
      refetchMembers();
      Alert.alert("Sukces", "Członek został usunięty z klubu");
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const handleInvite = () => {
    if (!inviteEmail.trim() || !clubId) return;
    createInvitation.mutate({
      clubId,
      email: inviteEmail.trim(),
      role: selectedRole,
    });
  };

  const handleRevoke = (invitationId: number) => {
    Alert.alert(
      "Anuluj zaproszenie",
      "Czy na pewno chcesz anulować to zaproszenie?",
      [
        { text: "Nie", style: "cancel" },
        { text: "Tak", style: "destructive", onPress: () => revokeInvitation.mutate({ id: invitationId }) },
      ]
    );
  };

  const handleRemoveMember = (memberId: number, memberName: string) => {
    Alert.alert(
      "Usuń członka",
      `Czy na pewno chcesz usunąć ${memberName} z klubu?`,
      [
        { text: "Nie", style: "cancel" },
        { text: "Tak", style: "destructive", onPress: () => removeMember.mutate({ memberId }) },
      ]
    );
  };

  const openRoleChangeModal = (memberId: number, currentRole: ClubRole) => {
    setSelectedMemberId(memberId);
    setSelectedMemberRole(currentRole);
    setShowRoleChangeModal(true);
  };

  const handleUpdateRole = () => {
    if (!selectedMemberId) return;
    updateMemberRole.mutate({
      memberId: selectedMemberId,
      role: selectedMemberRole,
    });
  };

  const getRoleInfo = (roleId: string) => {
    return ROLES.find((r) => r.id === roleId) || ROLES[4];
  };

  const isLoading = roleLoading || membersLoading || invitationsLoading;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Struktura Klubu</ThemedText>
        {permissions.canInviteUsers && (
          <Pressable onPress={() => setShowInviteModal(true)} style={styles.addButton}>
            <Ionicons name="person-add" size={22} color="#22c55e" />
          </Pressable>
        )}
      </View>

      {/* Roles Legend */}
      <View style={styles.rolesSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Role w klubie</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rolesScroll}>
          {ROLES.map((role) => (
            <View key={role.id} style={styles.roleCard}>
              <View style={styles.roleIcon}>
                <Ionicons name={role.icon as any} size={20} color="#22c55e" />
              </View>
              <ThemedText style={styles.roleName}>{role.name}</ThemedText>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Members Section */}
            <View style={styles.membersSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Członkowie ({members?.length || 0})
              </ThemedText>

              {members && members.length > 0 ? (
                members.map((member: any) => {
                  const roleInfo = getRoleInfo(member.role);
                  return (
                    <View key={member.id} style={styles.memberCard}>
                      <View style={styles.memberAvatar}>
                        <Ionicons name={roleInfo.icon as any} size={24} color="#22c55e" />
                      </View>
                      <View style={styles.memberInfo}>
                        <ThemedText style={styles.memberName}>
                          {member.user?.name || member.user?.email || "Nieznany użytkownik"}
                        </ThemedText>
                        <ThemedText style={styles.memberRole}>{getRoleLabel(member.role)}</ThemedText>
                        {member.user?.email && (
                          <ThemedText style={styles.memberEmail}>{member.user.email}</ThemedText>
                        )}
                      </View>
                      {permissions.canAssignRoles && member.role !== "manager" && (
                        <View style={styles.memberActions}>
                          <Pressable
                            onPress={() => openRoleChangeModal(member.id, member.role)}
                            style={styles.actionButton}
                          >
                            <Ionicons name="create-outline" size={20} color="#22c55e" />
                          </Pressable>
                          {permissions.canManageMembers && (
                            <Pressable
                              onPress={() => handleRemoveMember(member.id, member.user?.name || "tego członka")}
                              style={styles.actionButton}
                            >
                              <Ionicons name="person-remove-outline" size={20} color="#ef4444" />
                            </Pressable>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color="#64748b" />
                  <ThemedText style={styles.emptyText}>Brak członków</ThemedText>
                </View>
              )}
            </View>

            {/* Invitations Section */}
            {permissions.canInviteUsers && (
              <View style={styles.membersSection}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Oczekujące zaproszenia ({invitations?.filter((i: any) => i.status === "pending").length || 0})
                </ThemedText>

                {invitations && invitations.filter((i: any) => i.status === "pending").length > 0 ? (
                  invitations
                    .filter((i: any) => i.status === "pending")
                    .map((invitation: any) => {
                      const roleInfo = getRoleInfo(invitation.role);
                      return (
                        <View key={invitation.id} style={styles.memberCard}>
                          <View style={styles.memberAvatar}>
                            <Ionicons name="mail-outline" size={24} color="#fbbf24" />
                          </View>
                          <View style={styles.memberInfo}>
                            <ThemedText style={styles.memberName}>{invitation.email}</ThemedText>
                            <ThemedText style={styles.memberRole}>{roleInfo.name}</ThemedText>
                            <View style={styles.statusBadge}>
                              <ThemedText style={styles.statusText}>
                                Wygasa: {new Date(invitation.expiresAt).toLocaleDateString("pl-PL")}
                              </ThemedText>
                            </View>
                          </View>
                          <Pressable onPress={() => handleRevoke(invitation.id)} style={styles.revokeButton}>
                            <Ionicons name="close-circle" size={24} color="#ef4444" />
                          </Pressable>
                        </View>
                      );
                    })
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="mail-outline" size={48} color="#64748b" />
                    <ThemedText style={styles.emptyText}>Brak oczekujących zaproszeń</ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Role Descriptions */}
            <View style={styles.membersSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Opis ról</ThemedText>
              {ROLES.map((role) => (
                <View key={role.id} style={styles.roleDescCard}>
                  <View style={styles.roleDescHeader}>
                    <Ionicons name={role.icon as any} size={20} color="#22c55e" />
                    <ThemedText style={styles.roleDescName}>{role.name}</ThemedText>
                  </View>
                  <ThemedText style={styles.roleDescText}>{role.description}</ThemedText>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>

      {/* Invite Modal */}
      <Modal visible={showInviteModal} animationType="slide" transparent onRequestClose={() => setShowInviteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>Zaproś do klubu</ThemedText>
              <Pressable onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Adres email</ThemedText>
              <TextInput
                style={styles.input}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="email@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Rola</ThemedText>
              <Pressable style={styles.selectButton} onPress={() => setShowRolePicker(!showRolePicker)}>
                <ThemedText style={styles.selectText}>{getRoleInfo(selectedRole).name}</ThemedText>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </Pressable>
              {showRolePicker && (
                <View style={styles.pickerOptions}>
                  {ROLES.filter((r) => r.id !== "manager").map((role) => (
                    <Pressable
                      key={role.id}
                      style={[styles.pickerOption, selectedRole === role.id && styles.pickerOptionSelected]}
                      onPress={() => {
                        setSelectedRole(role.id as ClubRole);
                        setShowRolePicker(false);
                      }}
                    >
                      <View style={styles.pickerOptionContent}>
                        <Ionicons name={role.icon as any} size={20} color={selectedRole === role.id ? "#22c55e" : "#94a3b8"} />
                        <View style={styles.pickerOptionText}>
                          <ThemedText style={[styles.pickerOptionName, selectedRole === role.id && styles.pickerOptionNameSelected]}>
                            {role.name}
                          </ThemedText>
                          <ThemedText style={styles.pickerOptionDesc}>{role.description}</ThemedText>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Pressable
              style={[styles.submitButton, !inviteEmail.trim() && styles.submitButtonDisabled]}
              onPress={handleInvite}
              disabled={!inviteEmail.trim() || createInvitation.isPending}
            >
              {createInvitation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Wyślij zaproszenie</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Change Role Modal */}
      <Modal visible={showRoleChangeModal} animationType="slide" transparent onRequestClose={() => setShowRoleChangeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>Zmień rolę</ThemedText>
              <Pressable onPress={() => setShowRoleChangeModal(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <View style={styles.pickerOptions}>
              {ROLES.map((role) => (
                <Pressable
                  key={role.id}
                  style={[styles.pickerOption, selectedMemberRole === role.id && styles.pickerOptionSelected]}
                  onPress={() => setSelectedMemberRole(role.id as ClubRole)}
                >
                  <View style={styles.pickerOptionContent}>
                    <Ionicons name={role.icon as any} size={20} color={selectedMemberRole === role.id ? "#22c55e" : "#94a3b8"} />
                    <View style={styles.pickerOptionText}>
                      <ThemedText style={[styles.pickerOptionName, selectedMemberRole === role.id && styles.pickerOptionNameSelected]}>
                        {role.name}
                      </ThemedText>
                      <ThemedText style={styles.pickerOptionDesc}>{role.description}</ThemedText>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.submitButton}
              onPress={handleUpdateRole}
              disabled={updateMemberRole.isPending}
            >
              {updateMemberRole.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Zapisz</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 28,
    color: "#fff",
  },
  addButton: {
    padding: 8,
  },
  rolesSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: "#fff",
    marginBottom: 12,
  },
  rolesScroll: {
    flexDirection: "row",
  },
  roleCard: {
    alignItems: "center",
    marginRight: 16,
    width: 80,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  roleName: {
    fontSize: 11,
    lineHeight: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  contentScroll: {
    flex: 1,
  },
  membersSection: {
    padding: 16,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 15,
    lineHeight: 20,
    color: "#fff",
  },
  memberRole: {
    fontSize: 13,
    lineHeight: 18,
    color: "#22c55e",
    marginTop: 2,
  },
  memberEmail: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
    marginTop: 2,
  },
  memberActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(251, 191, 36, 0.2)",
  },
  statusText: {
    fontSize: 11,
    lineHeight: 14,
    color: "#fbbf24",
  },
  revokeButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
    marginTop: 12,
  },
  roleDescCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  roleDescHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  roleDescName: {
    fontSize: 14,
    lineHeight: 20,
    color: "#fff",
    fontWeight: "600",
  },
  roleDescText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#94a3b8",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    lineHeight: 28,
    color: "#fff",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    color: "#94a3b8",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#334155",
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  selectText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#fff",
  },
  pickerOptions: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#334155",
    maxHeight: 300,
  },
  pickerOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  pickerOptionSelected: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  pickerOptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickerOptionText: {
    marginLeft: 12,
  },
  pickerOptionName: {
    fontSize: 15,
    lineHeight: 20,
    color: "#fff",
  },
  pickerOptionNameSelected: {
    color: "#22c55e",
  },
  pickerOptionDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
});
