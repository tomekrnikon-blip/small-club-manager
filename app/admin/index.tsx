import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function AdminPanelScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();

  const [searchQuery, setSearchQuery] = useState("");
  const [showGrantProModal, setShowGrantProModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Check if user is master admin
  const isMasterAdmin = user?.isMasterAdmin;

  const { data: allUsers, isLoading } = trpc.masterAdmin.getAllUsers.useQuery(undefined, {
    enabled: isAuthenticated && isMasterAdmin,
  });

  const { data: allClubs } = trpc.masterAdmin.getAllClubs.useQuery(undefined, {
    enabled: isAuthenticated && isMasterAdmin,
  });

  const grantProMutation = trpc.masterAdmin.grantPro.useMutation({
    onSuccess: () => {
      utils.masterAdmin.getAllUsers.invalidate();
      setShowGrantProModal(false);
      setSelectedUserId(null);
      Alert.alert("Sukces", "Status PRO został przyznany!");
    },
    onError: (error: any) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const revokeProMutation = trpc.masterAdmin.revokePro.useMutation({
    onSuccess: () => {
      utils.masterAdmin.getAllUsers.invalidate();
      Alert.alert("Sukces", "Status PRO został odebrany!");
    },
    onError: (error: any) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const filteredUsers = allUsers?.filter((u: any) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.openId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGrantPro = (userId: number) => {
    setSelectedUserId(userId);
    setShowGrantProModal(true);
  };

  const handleRevokePro = (userId: number) => {
    Alert.alert(
      "Odebierz PRO",
      "Czy na pewno chcesz odebrać status PRO temu użytkownikowi?",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Odbierz",
          style: "destructive",
          onPress: () => revokeProMutation.mutate({ userId }),
        },
      ]
    );
  };

  const confirmGrantPro = () => {
    if (selectedUserId) {
      grantProMutation.mutate({ userId: selectedUserId });
    }
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Zaloguj się, aby uzyskać dostęp</ThemedText>
      </ThemedView>
    );
  }

  if (!isMasterAdmin) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <MaterialIcons name="lock" size={64} color="#334155" />
        <ThemedText style={styles.accessDeniedTitle}>Brak dostępu</ThemedText>
        <ThemedText style={styles.accessDeniedText}>
          Panel administracyjny jest dostępny tylko dla Master Admin
        </ThemedText>
        <Pressable style={styles.backButtonLarge} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Wróć</ThemedText>
        </Pressable>
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
        <ThemedText style={styles.title}>Panel Master Admin</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="people" size={24} color={AppColors.primary} />
          <ThemedText style={styles.statValue}>{allUsers?.length || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Użytkownicy</ThemedText>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="star" size={24} color={AppColors.warning} />
          <ThemedText style={styles.statValue}>{allUsers?.filter((u: any) => u.isPro).length || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>PRO</ThemedText>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="business" size={24} color={AppColors.secondary} />
          <ThemedText style={styles.statValue}>{allClubs?.length || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Kluby</ThemedText>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj użytkownika..."
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

      {/* Users list */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              onGrantPro={() => handleGrantPro(item.id)}
              onRevokePro={() => handleRevokePro(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="person-search" size={64} color="#334155" />
              <ThemedText style={styles.emptyTitle}>Brak użytkowników</ThemedText>
            </View>
          }
        />
      )}

      {/* Grant PRO Modal */}
      <Modal
        visible={showGrantProModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowGrantProModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <MaterialIcons name="star" size={48} color={AppColors.warning} />
            </View>
            <ThemedText style={styles.modalTitle}>Przyznaj status PRO</ThemedText>
            <ThemedText style={styles.modalText}>
              Czy na pewno chcesz przyznać status PRO temu użytkownikowi?
              Będzie miał dostęp do wszystkich funkcji premium.
            </ThemedText>
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalButtonCancel}
                onPress={() => setShowGrantProModal(false)}
              >
                <ThemedText style={styles.modalButtonCancelText}>Anuluj</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButtonConfirm, grantProMutation.isPending && styles.buttonDisabled]}
                onPress={confirmGrantPro}
                disabled={grantProMutation.isPending}
              >
                {grantProMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.modalButtonConfirmText}>Przyznaj PRO</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

function UserCard({
  user,
  onGrantPro,
  onRevokePro,
}: {
  user: any;
  onGrantPro: () => void;
  onRevokePro: () => void;
}) {
  return (
    <View style={styles.userCard}>
      <View style={styles.userAvatar}>
        <MaterialIcons name="person" size={24} color={AppColors.primary} />
      </View>
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <ThemedText style={styles.userName}>{user.name || "Użytkownik"}</ThemedText>
          {user.isPro && (
            <View style={styles.proBadge}>
              <MaterialIcons name="star" size={12} color="#fff" />
              <ThemedText style={styles.proText}>PRO</ThemedText>
            </View>
          )}
          {user.isMasterAdmin && (
            <View style={styles.adminBadge}>
              <ThemedText style={styles.adminText}>ADMIN</ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={styles.userEmail}>{user.email || user.openId}</ThemedText>
        <ThemedText style={styles.userDate}>
          Dołączył: {new Date(user.createdAt).toLocaleDateString("pl-PL")}
        </ThemedText>
      </View>
      {!user.isMasterAdmin && (
        <View style={styles.userActions}>
          {user.isPro ? (
            <Pressable style={styles.revokeButton} onPress={onRevokePro}>
              <MaterialIcons name="star-border" size={20} color={AppColors.danger} />
            </Pressable>
          ) : (
            <Pressable style={styles.grantButton} onPress={onGrantPro}>
              <MaterialIcons name="star" size={20} color={AppColors.warning} />
            </Pressable>
          )}
        </View>
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
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: Spacing.xs,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    color: "#fff",
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: AppColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    gap: 2,
  },
  proText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  adminBadge: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  adminText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  userEmail: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  userDate: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  userActions: {
    marginLeft: Spacing.sm,
  },
  grantButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: AppColors.warning + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  revokeButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: AppColors.danger + "20",
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
  },
  emptyText: {
    fontSize: 14,
    color: "#475569",
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#64748b",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  accessDeniedText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  backButtonLarge: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.xl,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: AppColors.warning + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: Spacing.sm,
  },
  modalText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: AppColors.bgElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  modalButtonCancelText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: AppColors.warning,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  modalButtonConfirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
