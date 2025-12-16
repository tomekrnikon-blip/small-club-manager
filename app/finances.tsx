import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View, Alert, TextInput, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

type TransactionType = "income" | "expense";

export default function FinancesScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();

  const [showAddModal, setShowAddModal] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState("");

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  const { data: transactions, isLoading } = trpc.finances.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: summary } = trpc.finances.getSummary.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const createMutation = trpc.finances.create.useMutation({
    onSuccess: () => {
      utils.finances.list.invalidate();
      utils.finances.getSummary.invalidate();
      setShowAddModal(false);
      resetForm();
      Alert.alert("Sukces", "Transakcja została dodana!");
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const resetForm = () => {
    setAmount("");
    setCategory("");
    setDescription("");
    setTransactionDate("");
    setTransactionType("income");
  };

  const handleCreate = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Błąd", "Podaj prawidłową kwotę");
      return;
    }

    if (!club?.id) {
      Alert.alert("Błąd", "Nie znaleziono klubu");
      return;
    }

    createMutation.mutate({
      clubId: club.id,
      type: transactionType,
      amount: parseFloat(amount),
      category: category.trim() || "Inne",
      description: description.trim() || undefined,
      transactionDate: transactionDate || new Date().toISOString().split("T")[0],
    });
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Zaloguj się, aby zobaczyć finanse</ThemedText>
      </ThemedView>
    );
  }

  if (!club) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Utwórz klub, aby zarządzać finansami</ThemedText>
      </ThemedView>
    );
  }

  const balance = (summary?.totalIncome || 0) - (summary?.totalExpense || 0);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.title}>Finanse</ThemedText>
        <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.balanceCard}>
          <ThemedText style={styles.balanceLabel}>Saldo</ThemedText>
          <ThemedText style={[styles.balanceValue, { color: balance >= 0 ? AppColors.success : AppColors.danger }]}>
            {balance >= 0 ? "+" : ""}{balance.toFixed(2)} zł
          </ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: AppColors.success + "15" }]}>
            <MaterialIcons name="arrow-downward" size={20} color={AppColors.success} />
            <ThemedText style={styles.summaryLabel}>Przychody</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: AppColors.success }]}>
              +{(summary?.totalIncome || 0).toFixed(2)} zł
            </ThemedText>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: AppColors.danger + "15" }]}>
            <MaterialIcons name="arrow-upward" size={20} color={AppColors.danger} />
            <ThemedText style={styles.summaryLabel}>Wydatki</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: AppColors.danger }]}>
              -{(summary?.totalExpense || 0).toFixed(2)} zł
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Transactions list */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <TransactionCard transaction={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="account-balance-wallet" size={64} color="#334155" />
              <ThemedText style={styles.emptyTitle}>Brak transakcji</ThemedText>
              <ThemedText style={styles.emptyText}>
                Dodaj pierwszą transakcję
              </ThemedText>
            </View>
          }
        />
      )}

      {/* Add Transaction Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Dodaj transakcję</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <MaterialIcons name="close" size={24} color="#94a3b8" />
              </Pressable>
            </View>

            {/* Transaction Type Toggle */}
            <View style={styles.typeToggle}>
              <Pressable
                style={[styles.typeButton, transactionType === "income" && styles.typeButtonIncome]}
                onPress={() => setTransactionType("income")}
              >
                <MaterialIcons
                  name="arrow-downward"
                  size={20}
                  color={transactionType === "income" ? "#fff" : "#64748b"}
                />
                <ThemedText style={[styles.typeText, transactionType === "income" && styles.typeTextActive]}>
                  Przychód
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.typeButton, transactionType === "expense" && styles.typeButtonExpense]}
                onPress={() => setTransactionType("expense")}
              >
                <MaterialIcons
                  name="arrow-upward"
                  size={20}
                  color={transactionType === "expense" ? "#fff" : "#64748b"}
                />
                <ThemedText style={[styles.typeText, transactionType === "expense" && styles.typeTextActive]}>
                  Wydatek
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Kwota *</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#64748b"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Kategoria</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="np. Składki, Wynajem boiska"
                  placeholderTextColor="#64748b"
                  value={category}
                  onChangeText={setCategory}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Opis</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Opis transakcji..."
                  placeholderTextColor="#64748b"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Data</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="RRRR-MM-DD"
                  placeholderTextColor="#64748b"
                  value={transactionDate}
                  onChangeText={setTransactionDate}
                />
              </View>
            </View>

            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: transactionType === "income" ? AppColors.success : AppColors.danger },
                createMutation.isPending && styles.submitButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitText}>
                  Dodaj {transactionType === "income" ? "przychód" : "wydatek"}
                </ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

function TransactionCard({ transaction }: { transaction: any }) {
  const isIncome = transaction.type === "income";
  const transactionDate = new Date(transaction.transactionDate);

  return (
    <View style={styles.transactionCard}>
      <View style={[styles.transactionIcon, { backgroundColor: isIncome ? AppColors.success + "20" : AppColors.danger + "20" }]}>
        <MaterialIcons
          name={isIncome ? "arrow-downward" : "arrow-upward"}
          size={20}
          color={isIncome ? AppColors.success : AppColors.danger}
        />
      </View>
      <View style={styles.transactionInfo}>
        <ThemedText style={styles.transactionCategory}>
          {transaction.category || (isIncome ? "Przychód" : "Wydatek")}
        </ThemedText>
        {transaction.description && (
          <ThemedText style={styles.transactionDescription} numberOfLines={1}>
            {transaction.description}
          </ThemedText>
        )}
        <ThemedText style={styles.transactionDate}>
          {transactionDate.toLocaleDateString("pl-PL")}
        </ThemedText>
      </View>
      <ThemedText style={[styles.transactionAmount, { color: isIncome ? AppColors.success : AppColors.danger }]}>
        {isIncome ? "+" : "-"}{transaction.amount.toFixed(2)} zł
      </ThemedText>
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
  summaryContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  balanceCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: Spacing.xs,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: Spacing.xs,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  transactionDescription: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
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
  typeToggle: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.bgElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  typeButtonIncome: {
    backgroundColor: AppColors.success,
  },
  typeButtonExpense: {
    backgroundColor: AppColors.danger,
  },
  typeText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  typeTextActive: {
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
  submitButton: {
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
