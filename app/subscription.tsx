import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";

const features = {
  free: [
    "1 klub",
    "Do 15 zawodników",
    "Podstawowe statystyki",
    "Kalendarz meczów",
    "Podstawowe powiadomienia",
  ],
  pro: [
    "Nieograniczona liczba klubów",
    "Nieograniczona liczba zawodników",
    "Zaawansowane statystyki",
    "Moduł finansów",
    "Szkółka piłkarska",
    "Raporty PDF",
    "Galeria zdjęć",
    "Powiadomienia SMS",
    "Priorytetowe wsparcie",
  ],
};

export default function SubscriptionScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isPro = user?.isPro;

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Zaloguj się, aby zobaczyć subskrypcję</ThemedText>
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
        <ThemedText style={styles.title}>Subskrypcja</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Current Plan */}
        <View style={styles.currentPlan}>
          <View style={styles.currentPlanHeader}>
            <MaterialIcons
              name={isPro ? "star" : "person"}
              size={32}
              color={isPro ? AppColors.warning : "#64748b"}
            />
            <View>
              <ThemedText style={styles.currentPlanLabel}>Aktualny plan</ThemedText>
              <ThemedText style={styles.currentPlanName}>
                {isPro ? "PRO" : "Darmowy"}
              </ThemedText>
            </View>
          </View>
          {isPro && (
            <View style={styles.proBadge}>
              <ThemedText style={styles.proBadgeText}>AKTYWNY</ThemedText>
            </View>
          )}
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {/* Free Plan */}
          <View style={[styles.planCard, !isPro && styles.planCardActive]}>
            <View style={styles.planHeader}>
              <ThemedText style={styles.planName}>Darmowy</ThemedText>
              <ThemedText style={styles.planPrice}>0 zł</ThemedText>
              <ThemedText style={styles.planPeriod}>na zawsze</ThemedText>
            </View>
            <View style={styles.planFeatures}>
              {features.free.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <MaterialIcons name="check" size={18} color={AppColors.success} />
                  <ThemedText style={styles.featureText}>{feature}</ThemedText>
                </View>
              ))}
            </View>
            {!isPro && (
              <View style={styles.currentPlanBadge}>
                <ThemedText style={styles.currentPlanBadgeText}>Twój plan</ThemedText>
              </View>
            )}
          </View>

          {/* Pro Plan */}
          <View style={[styles.planCard, styles.planCardPro, isPro && styles.planCardActive]}>
            <View style={styles.popularBadge}>
              <MaterialIcons name="star" size={14} color="#fff" />
              <ThemedText style={styles.popularText}>POLECANY</ThemedText>
            </View>
            <View style={styles.planHeader}>
              <ThemedText style={styles.planName}>PRO</ThemedText>
              <View style={styles.priceRow}>
                <ThemedText style={styles.planPrice}>29 zł</ThemedText>
                <ThemedText style={styles.planPeriod}>/miesiąc</ThemedText>
              </View>
              <ThemedText style={styles.yearlyPrice}>lub 249 zł/rok (oszczędź 17%)</ThemedText>
            </View>
            <View style={styles.planFeatures}>
              {features.pro.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <MaterialIcons name="check" size={18} color={AppColors.warning} />
                  <ThemedText style={styles.featureText}>{feature}</ThemedText>
                </View>
              ))}
            </View>
            {isPro ? (
              <View style={styles.currentPlanBadge}>
                <ThemedText style={styles.currentPlanBadgeText}>Twój plan</ThemedText>
              </View>
            ) : (
              <Pressable style={styles.upgradeButton}>
                <ThemedText style={styles.upgradeButtonText}>Przejdź na PRO</ThemedText>
              </Pressable>
            )}
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <ThemedText style={styles.faqTitle}>Często zadawane pytania</ThemedText>
          
          <View style={styles.faqItem}>
            <ThemedText style={styles.faqQuestion}>Czy mogę anulować w każdej chwili?</ThemedText>
            <ThemedText style={styles.faqAnswer}>
              Tak, możesz anulować subskrypcję w dowolnym momencie. Twój plan PRO będzie aktywny do końca okresu rozliczeniowego.
            </ThemedText>
          </View>

          <View style={styles.faqItem}>
            <ThemedText style={styles.faqQuestion}>Jakie metody płatności akceptujecie?</ThemedText>
            <ThemedText style={styles.faqAnswer}>
              Akceptujemy karty kredytowe/debetowe (Visa, Mastercard) oraz BLIK przez bezpieczną bramkę Stripe.
            </ThemedText>
          </View>

          <View style={styles.faqItem}>
            <ThemedText style={styles.faqQuestion}>Co się stanie z moimi danymi po anulowaniu?</ThemedText>
            <ThemedText style={styles.faqAnswer}>
              Twoje dane pozostaną bezpieczne. Wrócisz do planu darmowego z ograniczeniami, ale nic nie zostanie usunięte.
            </ThemedText>
          </View>
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
  currentPlan: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  currentPlanHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  currentPlanLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  proBadge: {
    backgroundColor: AppColors.success + "20",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.success,
  },
  plansContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  planCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: "transparent",
  },
  planCardActive: {
    borderColor: AppColors.primary,
  },
  planCardPro: {
    backgroundColor: AppColors.bgCard,
    position: "relative",
    overflow: "hidden",
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.warning,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: Radius.md,
    gap: 4,
  },
  popularText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  planHeader: {
    marginBottom: Spacing.lg,
  },
  planName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: Spacing.xs,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  planPrice: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  planPeriod: {
    fontSize: 14,
    color: "#94a3b8",
    marginLeft: 4,
  },
  yearlyPrice: {
    fontSize: 13,
    color: AppColors.success,
    marginTop: Spacing.xs,
  },
  planFeatures: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: 14,
    color: "#e2e8f0",
  },
  currentPlanBadge: {
    backgroundColor: AppColors.primary + "20",
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  currentPlanBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
  },
  upgradeButton: {
    backgroundColor: AppColors.warning,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: "center",
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  faqSection: {
    marginBottom: Spacing.xl,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: Spacing.lg,
  },
  faqItem: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.sm,
  },
  faqAnswer: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
  },
});
