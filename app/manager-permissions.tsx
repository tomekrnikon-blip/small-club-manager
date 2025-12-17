import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

type MemberRole = "manager" | "board_member" | "board_member_finance" | "coach" | "player";

interface ClubMember {
  id: number;
  userId: number;
  user?: {
    name: string | null;
    email: string | null;
  };
  role: string;
  createdAt: Date;
  invitedBy?: string;
}

const ROLE_LABELS: Record<MemberRole, string> = {
  manager: "Właściciel/Manager",
  board_member: "Zarząd",
  board_member_finance: "Zarząd (Finanse)",
  coach: "Trener",
  player: "Zawodnik",
};

const ROLE_COLORS: Record<MemberRole, string> = {
  manager: "#8b5cf6",
  board_member: "#3b82f6",
  board_member_finance: "#3b82f6",
  coach: "#22c55e",
  player: "#f59e0b",
};

const ROLE_HIERARCHY: MemberRole[] = ["manager", "board_member", "board_member_finance", "coach", "player"];

// Roles that can be assigned by each role
const ASSIGNABLE_ROLES: Record<MemberRole, MemberRole[]> = {
  manager: ["board_member", "board_member_finance", "coach", "player"],
  board_member: ["player"],
  board_member_finance: ["player"],
  coach: ["player"],
  player: [],
};

export default function ManagerPermissionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<MemberRole | "all">("all");
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("player");
  
  // Get clubs first
  const { data: clubs } = trpc.clubs.list.useQuery();
  const clubId = clubs?.[0]?.id;
  
  // Get current user's role
  const { data: myRole } = trpc.clubMembers.getMyRole.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId }
  );
  const currentUserRole = (myRole?.role as MemberRole) || "player";
  
  // Get all club members
  const { data: members, isLoading, refetch } = trpc.clubMembers.list.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId }
  );
  
  // Mutations
  const updateRoleMutation = trpc.clubMembers.updateRole.useMutation({
    onSuccess: () => {
      refetch();
      setShowRoleModal(false);
      setSelectedMember(null);
      Alert.alert("Sukces", "Uprawnienia zostały zmienione");
    },
    onError: (error: any) => {
      Alert.alert("Błąd", error.message);
    },
  });
  
  const removeMemberMutation = trpc.clubMembers.remove.useMutation({
    onSuccess: () => {
      refetch();
      setShowRoleModal(false);
      setSelectedMember(null);
      Alert.alert("Sukces", "Członek został usunięty z klubu");
    },
    onError: (error: any) => {
      Alert.alert("Błąd", error.message);
    },
  });
  
  const createInvitationMutation = trpc.invitations.create.useMutation({
    onSuccess: () => {
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("player");
      Alert.alert("Sukces", "Zaproszenie zostało wysłane");
    },
    onError: (error: any) => {
      Alert.alert("Błąd", error.message);
    },
  });
  
  // Filter members based on search and role
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    
    return members.filter((member: ClubMember) => {
      const userName = member.user?.name || '';
      const userEmail = member.user?.email || '';
      const matchesSearch = 
        userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === "all" || member.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, selectedRole]);
  
  // Check if current user can manage a member
  const canManageMember = (member: ClubMember): boolean => {
    if (currentUserRole === "manager") return member.role !== "manager";
    const myIndex = ROLE_HIERARCHY.indexOf(currentUserRole);
    const memberIndex = ROLE_HIERARCHY.indexOf(member.role as MemberRole);
    return myIndex < memberIndex;
  };
  
  // Get roles that current user can assign
  const getAssignableRoles = (): MemberRole[] => {
    return ASSIGNABLE_ROLES[currentUserRole] || [];
  };
  
  const handleChangeRole = (newRole: MemberRole) => {
    if (!selectedMember) return;
    
    Alert.alert(
      "Zmiana uprawnień",
      `Czy na pewno chcesz zmienić rolę ${selectedMember.user?.name || 'tego użytkownika'} na "${ROLE_LABELS[newRole]}"?`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Zmień",
          onPress: () => {
            updateRoleMutation.mutate({
              memberId: selectedMember.id,
              role: newRole,
            });
          },
        },
      ]
    );
  };
  
  const handleRemoveMember = () => {
    if (!selectedMember) return;
    
    Alert.alert(
      "Usunięcie członka",
      `Czy na pewno chcesz usunąć ${selectedMember.user?.name || 'tego użytkownika'} z klubu?`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: () => {
            removeMemberMutation.mutate({ memberId: selectedMember.id });
          },
        },
      ]
    );
  };
  
  const handleSendInvitation = () => {
    if (!inviteEmail.trim()) {
      Alert.alert("Błąd", "Wprowadź adres email");
      return;
    }
    
    // Check if user can invite this role
    const assignableRoles = getAssignableRoles();
    if (!assignableRoles.includes(inviteRole)) {
      Alert.alert("Błąd", "Nie masz uprawnień do zapraszania osób z tą rolą");
      return;
    }
    
    if (!clubId) {
      Alert.alert("Błąd", "Nie znaleziono klubu");
      return;
    }
    
    createInvitationMutation.mutate({
      clubId,
      email: inviteEmail.trim(),
      role: inviteRole,
    });
  };
  
  const renderMember = ({ item }: { item: ClubMember }) => {
    const userName = item.user?.name || 'Nieznany';
    const userEmail = item.user?.email || '';
    const memberRole = (item.role as MemberRole) || 'player';
    const roleColor = ROLE_COLORS[memberRole] || '#64748b';
    const roleLabel = ROLE_LABELS[memberRole] || item.role;
    
    return (
      <Pressable
        style={styles.memberCard}
        onPress={() => {
          if (canManageMember(item)) {
            setSelectedMember(item);
            setShowRoleModal(true);
          }
        }}
      >
        <View style={styles.memberAvatar}>
          <ThemedText style={styles.avatarText}>
            {userName.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        
        <View style={styles.memberInfo}>
          <ThemedText style={styles.memberName}>{userName}</ThemedText>
          <ThemedText style={styles.memberEmail}>{userEmail}</ThemedText>
          <View style={styles.memberMeta}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + "20" }]}>
              <ThemedText style={[styles.roleText, { color: roleColor }]}>
                {roleLabel}
              </ThemedText>
            </View>
            <ThemedText style={styles.joinedDate}>
              od {new Date(item.createdAt).toLocaleDateString('pl-PL')}
            </ThemedText>
          </View>
        </View>
        
        {canManageMember(item) && (
          <MaterialIcons name="chevron-right" size={24} color="#64748b" />
        )}
      </Pressable>
    );
  };
  
  const renderRoleFilter = (role: MemberRole | "all", label: string) => (
    <Pressable
      style={[
        styles.filterChip,
        selectedRole === role && styles.filterChipActive,
      ]}
      onPress={() => setSelectedRole(role)}
    >
      <ThemedText
        style={[
          styles.filterChipText,
          selectedRole === role && styles.filterChipTextActive,
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Zarządzanie uprawnieniami</ThemedText>
          <Pressable
            style={styles.addBtn}
            onPress={() => setShowInviteModal(true)}
          >
            <MaterialIcons name="person-add" size={24} color={AppColors.primary} />
          </Pressable>
        </View>
        
        {/* Current user role info */}
        <View style={styles.roleInfoCard}>
          <MaterialIcons name="admin-panel-settings" size={20} color={ROLE_COLORS[currentUserRole]} />
          <ThemedText style={styles.roleInfoText}>
            Twoja rola: <ThemedText style={{ color: ROLE_COLORS[currentUserRole], fontWeight: "600" }}>
              {ROLE_LABELS[currentUserRole]}
            </ThemedText>
          </ThemedText>
        </View>
        
        {/* Search */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj po nazwie lub email..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <MaterialIcons name="close" size={20} color="#64748b" />
            </Pressable>
          )}
        </View>
        
        {/* Role filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
          {renderRoleFilter("all", "Wszyscy")}
          {renderRoleFilter("manager", "Managerowie")}
          {renderRoleFilter("board_member", "Zarząd")}
          {renderRoleFilter("coach", "Trenerzy")}
          {renderRoleFilter("player", "Zawodnicy")}
        </ScrollView>
      </View>
      
      {/* Members list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          renderItem={renderMember}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people-outline" size={48} color="#64748b" />
              <ThemedText style={styles.emptyText}>
                {searchQuery ? "Nie znaleziono członków" : "Brak członków klubu"}
              </ThemedText>
            </View>
          }
        />
      )}
      
      {/* Role change modal */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Zarządzaj członkiem</ThemedText>
              <Pressable onPress={() => setShowRoleModal(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>
            
            {selectedMember && (
              <>
                <View style={styles.selectedMemberInfo}>
                  <View style={styles.memberAvatar}>
                    <ThemedText style={styles.avatarText}>
                      {(selectedMember.user?.name || 'N').charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <View>
                    <ThemedText style={styles.memberName}>{selectedMember.user?.name || 'Nieznany'}</ThemedText>
                    <ThemedText style={styles.memberEmail}>{selectedMember.user?.email || ''}</ThemedText>
                  </View>
                </View>
                
                <ThemedText style={styles.sectionTitle}>Zmień rolę</ThemedText>
                <View style={styles.rolesGrid}>
                  {getAssignableRoles().map((role) => (
                    <Pressable
                      key={role}
                      style={[
                        styles.roleOption,
                        selectedMember.role === role && styles.roleOptionActive,
                      ]}
                      onPress={() => handleChangeRole(role)}
                    >
                      <View style={[styles.roleIcon, { backgroundColor: ROLE_COLORS[role] + "20" }]}>
                        <MaterialIcons
                          name={
                            role === "board_member" || role === "board_member_finance" ? "business" :
                            role === "coach" ? "sports" :
                            role === "player" ? "person" : "admin-panel-settings"
                          }
                          size={24}
                          color={ROLE_COLORS[role]}
                        />
                      </View>
                      <ThemedText style={styles.roleOptionText}>{ROLE_LABELS[role]}</ThemedText>
                      {selectedMember.role === role && (
                        <MaterialIcons name="check-circle" size={20} color={AppColors.primary} />
                      )}
                    </Pressable>
                  ))}
                </View>
                
                <Pressable style={styles.removeBtn} onPress={handleRemoveMember}>
                  <MaterialIcons name="person-remove" size={20} color="#ef4444" />
                  <ThemedText style={styles.removeBtnText}>Usuń z klubu</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Invite modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Wyślij zaproszenie</ThemedText>
              <Pressable onPress={() => setShowInviteModal(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>
            
            <ThemedText style={styles.inputLabel}>Email</ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="adres@email.com"
              placeholderTextColor="#64748b"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <ThemedText style={styles.inputLabel}>Rola</ThemedText>
            <View style={styles.rolesGrid}>
              {getAssignableRoles().map((role) => (
                <Pressable
                  key={role}
                  style={[
                    styles.roleOption,
                    inviteRole === role && styles.roleOptionActive,
                  ]}
                  onPress={() => setInviteRole(role)}
                >
                  <View style={[styles.roleIcon, { backgroundColor: ROLE_COLORS[role] + "20" }]}>
                    <MaterialIcons
                      name={
                        role === "board_member" || role === "board_member_finance" ? "business" :
                        role === "coach" ? "sports" :
                        role === "player" ? "person" : "admin-panel-settings"
                      }
                      size={24}
                      color={ROLE_COLORS[role]}
                    />
                  </View>
                  <ThemedText style={styles.roleOptionText}>{ROLE_LABELS[role]}</ThemedText>
                  {inviteRole === role && (
                    <MaterialIcons name="check-circle" size={20} color={AppColors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
            
            {getAssignableRoles().length === 0 && (
              <View style={styles.noPermissionBox}>
                <MaterialIcons name="lock" size={24} color="#f59e0b" />
                <ThemedText style={styles.noPermissionText}>
                  Nie masz uprawnień do wysyłania zaproszeń
                </ThemedText>
              </View>
            )}
            
            <Pressable
              style={[
                styles.sendBtn,
                (getAssignableRoles().length === 0 || createInvitationMutation.isPending) && styles.sendBtnDisabled,
              ]}
              onPress={handleSendInvitation}
              disabled={getAssignableRoles().length === 0 || createInvitationMutation.isPending}
            >
              {createInvitationMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color="#fff" />
                  <ThemedText style={styles.sendBtnText}>Wyślij zaproszenie</ThemedText>
                </>
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
    backgroundColor: AppColors.bgDark,
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  addBtn: {
    padding: Spacing.xs,
  },
  roleInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#1e293b",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  roleInfoText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: "#fff",
    fontSize: 14,
  },
  filtersRow: {
    marginTop: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: "#1e293b",
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: AppColors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: Spacing.lg,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primary + "30",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  memberEmail: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  memberMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
  },
  joinedDate: {
    fontSize: 11,
    color: "#475569",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  selectedMemberInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: Spacing.md,
  },
  rolesGrid: {
    gap: Spacing.sm,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  roleOptionActive: {
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  roleOptionText: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "#ef444420",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.lg,
  },
  removeBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  textInput: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: "#fff",
    fontSize: 14,
  },
  noPermissionBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#f59e0b20",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  noPermissionText: {
    flex: 1,
    fontSize: 13,
    color: "#f59e0b",
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.lg,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
