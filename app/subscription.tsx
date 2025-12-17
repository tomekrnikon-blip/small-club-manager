import { useRouter, Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

import { useTrialStatus } from "@/hooks/use-trial-status";
import { TrialBanner } from "@/components/trial-banner";

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

type BillingPeriod = 'monthly' | 'yearly';

export default function SubscriptionScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();
  
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const { data: plans, isLoading: loadingPlans } = trpc.subscriptions.getPlans.useQuery();
  const { data: currentSubscription } = trpc.subscriptions.getCurrentSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createCheckoutMutation = trpc.subscriptions.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        Linking.openURL(data.url);
      }
      setIsProcessing(false);
    },
    onError: (error: any) => {
      Alert.alert("Błąd", error.message || "Nie udało się utworzyć sesji płatności");
      setIsProcessing(false);
    },
  });

  const cancelSubscriptionMutation = trpc.subscriptions.cancelSubscription.useMutation({
    onSuccess: () => {
      utils.subscriptions.getCurrentSubscription.invalidate();
      Alert.alert("Sukces", "Subskrypcja została anulowana.");
    },
    onError: (error: any) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const handleSubscribe = async (planId: number) => {
    if (!isAuthenticated) {
      Alert.alert("Wymagane logowanie", "Zaloguj się, aby wykupić subskrypcję.");
      return;
    }
    setIsProcessing(true);
    setSelectedPlanId(planId);
    createCheckoutMutation.mutate({ planId, billingPeriod });
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      "Anuluj subskrypcję",
      "Czy na pewno chcesz anulować subskrypcję PRO?",
      [
        { text: "Nie", style: "cancel" },
        { text: "Tak, anuluj", style: "destructive", onPress: () => cancelSubscriptionMutation.mutate() },
      ]
    );
  };

  const isPro = user?.isPro;
  
  // Get trial status for first club (if any)
  const { data: clubs } = trpc.clubs.list.useQuery(undefined, { enabled: isAuthenticated });
  const firstClubId = clubs?.[0]?.id;
  const trialStatus = useTrialStatus(firstClubId);
  const hasActiveStripeSubscription = currentSubscription?.status === 'active' && currentSubscription?.stripeSubscriptionId;

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Zaloguj się, aby zobaczyć subskrypcję</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
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
              <Pressable 
                style={[styles.upgradeButton, isProcessing && styles.upgradeButtonDisabled]}
                onPress={() => {
                  // Use first plan from database or show contact message
                  if (plans && plans.length > 0) {
                    handleSubscribe(plans[0].id);
                  } else {
                    Alert.alert("Informacja", "Skontaktuj się z administratorem, aby aktywować plan PRO.");
                  }
                }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.upgradeButtonText}>Przejdź na PRO</ThemedText>
                )}
              </Pressable>
            )}
            {hasActiveStripeSubscription && (
              <Pressable style={styles.cancelSubButton} onPress={handleCancelSubscription}>
                <ThemedText style={styles.cancelSubButtonText}>Anuluj subskrypcję</ThemedText>
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
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  cancelSubButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: Radius.md,
  },
  cancelSubButtonText: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "500",
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
