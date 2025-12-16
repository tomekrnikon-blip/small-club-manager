import { useRouter, Stack } from "expo-router";
import { useState, useEffect } from "react";
import { 
  ActivityIndicator, 
  Alert, 
  FlatList, 
  Pressable, 
  StyleSheet, 
  TextInput, 
  View, 
  Modal,
  ScrollView,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

type TabType = 'users' | 'subscriptions' | 'settings';

export default function AdminPanelScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [searchQuery, setSearchQuery] = useState("");
  const [showGrantProModal, setShowGrantProModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Subscription plan editing
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planName, setPlanName] = useState("");
  const [planDisplayName, setPlanDisplayName] = useState("");
  const [planMonthlyPrice, setPlanMonthlyPrice] = useState("");
  const [planYearlyPrice, setPlanYearlyPrice] = useState("");
  const [planFeatures, setPlanFeatures] = useState("");
  const [planMaxPlayers, setPlanMaxPlayers] = useState("");
  const [planMaxTeams, setPlanMaxTeams] = useState("");
  const [planStripePriceMonthly, setPlanStripePriceMonthly] = useState("");
  const [planStripePriceYearly, setPlanStripePriceYearly] = useState("");
  
  // App settings
  const [stripePublicKey, setStripePublicKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Check if user is master admin
  const isMasterAdmin = user?.isMasterAdmin;

  const { data: allUsers, isLoading } = trpc.masterAdmin.getAllUsers.useQuery(undefined, {
    enabled: isAuthenticated && isMasterAdmin,
  });

  const { data: allClubs } = trpc.masterAdmin.getAllClubs.useQuery(undefined, {
    enabled: isAuthenticated && isMasterAdmin,
  });

  const { data: subscriptionPlans, isLoading: loadingPlans } = trpc.masterAdmin.getSubscriptionPlans.useQuery(undefined, {
    enabled: isAuthenticated && isMasterAdmin,
  });

  const { data: appSettings } = trpc.masterAdmin.getAppSettings.useQuery(undefined, {
    enabled: isAuthenticated && isMasterAdmin,
  });

  // Load app settings into state
  useEffect(() => {
    if (appSettings) {
      const stripePublic = appSettings.find((s: any) => s.key === 'stripe_public_key');
      const stripeSecret = appSettings.find((s: any) => s.key === 'stripe_secret_key');
      const stripeWebhook = appSettings.find((s: any) => s.key === 'stripe_webhook_secret');
      
      if (stripePublic) setStripePublicKey(stripePublic.value || '');
      if (stripeSecret) setStripeSecretKey(stripeSecret.value || '');
      if (stripeWebhook) setStripeWebhookSecret(stripeWebhook.value || '');
    }
  }, [appSettings]);

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

  const updatePlanMutation = trpc.masterAdmin.updateSubscriptionPlan.useMutation({
    onSuccess: () => {
      utils.masterAdmin.getSubscriptionPlans.invalidate();
      setEditingPlan(null);
      Alert.alert("Sukces", "Plan subskrypcji został zaktualizowany!");
    },
    onError: (error: any) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const createPlanMutation = trpc.masterAdmin.createSubscriptionPlan.useMutation({
    onSuccess: () => {
      utils.masterAdmin.getSubscriptionPlans.invalidate();
      setEditingPlan(null);
      Alert.alert("Sukces", "Plan subskrypcji został utworzony!");
    },
    onError: (error: any) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const saveAppSettingsMutation = trpc.masterAdmin.setAppSetting.useMutation({
    onSuccess: () => {
      utils.masterAdmin.getAppSettings.invalidate();
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

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanDisplayName(plan.displayName);
    setPlanMonthlyPrice(plan.price?.toString() || "");
    setPlanYearlyPrice(plan.yearlyPrice?.toString() || "");
    setPlanFeatures(plan.features || "");
    setPlanMaxPlayers(plan.maxPlayers?.toString() || "50");
    setPlanMaxTeams(plan.maxTeams?.toString() || "3");
    setPlanStripePriceMonthly(plan.stripePriceIdMonthly || "");
    setPlanStripePriceYearly(plan.stripePriceIdYearly || "");
  };

  const handleCreatePlan = () => {
    setEditingPlan({ isNew: true });
    setPlanName("");
    setPlanDisplayName("");
    setPlanMonthlyPrice("");
    setPlanYearlyPrice("");
    setPlanFeatures("");
    setPlanMaxPlayers("50");
    setPlanMaxTeams("3");
    setPlanStripePriceMonthly("");
    setPlanStripePriceYearly("");
  };

  const handleSavePlan = () => {
    if (!planName || !planDisplayName || !planMonthlyPrice) {
      Alert.alert("Błąd", "Wypełnij wymagane pola (nazwa, nazwa wyświetlana, cena miesięczna)");
      return;
    }

    const planData = {
      name: planName,
      displayName: planDisplayName,
      price: planMonthlyPrice,
      yearlyPrice: planYearlyPrice || undefined,
      features: planFeatures || undefined,
      maxPlayers: parseInt(planMaxPlayers) || 50,
      maxTeams: parseInt(planMaxTeams) || 3,
      stripePriceIdMonthly: planStripePriceMonthly || undefined,
      stripePriceIdYearly: planStripePriceYearly || undefined,
    };

    if (editingPlan?.isNew) {
      createPlanMutation.mutate(planData);
    } else {
      updatePlanMutation.mutate({ id: editingPlan.id, ...planData });
    }
  };

  const handleSaveStripeSettings = async () => {
    setIsSavingSettings(true);
    try {
      await saveAppSettingsMutation.mutateAsync({ 
        key: 'stripe_public_key', 
        value: stripePublicKey,
        description: 'Stripe Publishable Key (pk_...)'
      });
      await saveAppSettingsMutation.mutateAsync({ 
        key: 'stripe_secret_key', 
        value: stripeSecretKey,
        description: 'Stripe Secret Key (sk_...)'
      });
      await saveAppSettingsMutation.mutateAsync({ 
        key: 'stripe_webhook_secret', 
        value: stripeWebhookSecret,
        description: 'Stripe Webhook Signing Secret (whsec_...)'
      });
      Alert.alert("Sukces", "Ustawienia Stripe zostały zapisane!");
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText style={styles.emptyText}>Zaloguj się, aby uzyskać dostęp</ThemedText>
      </ThemedView>
    );
  }

  if (!isMasterAdmin) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ headerShown: false }} />
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
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.title}>Panel Master Admin</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <MaterialIcons name="people" size={20} color={activeTab === 'users' ? '#22c55e' : '#64748b'} />
          <ThemedText style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            Użytkownicy
          </ThemedText>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'subscriptions' && styles.tabActive]}
          onPress={() => setActiveTab('subscriptions')}
        >
          <MaterialIcons name="card-membership" size={20} color={activeTab === 'subscriptions' ? '#22c55e' : '#64748b'} />
          <ThemedText style={[styles.tabText, activeTab === 'subscriptions' && styles.tabTextActive]}>
            Subskrypcje
          </ThemedText>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <MaterialIcons name="settings" size={20} color={activeTab === 'settings' ? '#22c55e' : '#64748b'} />
          <ThemedText style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            Ustawienia
          </ThemedText>
        </Pressable>
      </View>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
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
        </>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Plany subskrypcji</ThemedText>
            <Pressable style={styles.addButton} onPress={handleCreatePlan}>
              <MaterialIcons name="add" size={20} color="#fff" />
              <ThemedText style={styles.addButtonText}>Nowy plan</ThemedText>
            </Pressable>
          </View>

          {loadingPlans ? (
            <ActivityIndicator size="large" color={AppColors.primary} />
          ) : (
            subscriptionPlans?.map((plan: any) => (
              <Pressable 
                key={plan.id} 
                style={styles.planCard}
                onPress={() => handleEditPlan(plan)}
              >
                <View style={styles.planHeader}>
                  <View>
                    <ThemedText style={styles.planName}>{plan.displayName}</ThemedText>
                    <ThemedText style={styles.planCode}>{plan.name}</ThemedText>
                  </View>
                  <View style={[styles.planBadge, !plan.isActive && styles.planBadgeInactive]}>
                    <ThemedText style={styles.planBadgeText}>
                      {plan.isActive ? 'Aktywny' : 'Nieaktywny'}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.planPrices}>
                  <View style={styles.priceItem}>
                    <ThemedText style={styles.priceLabel}>Miesięcznie</ThemedText>
                    <ThemedText style={styles.priceValue}>{plan.price} PLN</ThemedText>
                  </View>
                  {plan.yearlyPrice && (
                    <View style={styles.priceItem}>
                      <ThemedText style={styles.priceLabel}>Rocznie</ThemedText>
                      <ThemedText style={styles.priceValue}>{plan.yearlyPrice} PLN</ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.planLimits}>
                  <View style={styles.limitItem}>
                    <MaterialIcons name="people" size={16} color="#64748b" />
                    <ThemedText style={styles.limitText}>Max {plan.maxPlayers} zawodników</ThemedText>
                  </View>
                  <View style={styles.limitItem}>
                    <MaterialIcons name="groups" size={16} color="#64748b" />
                    <ThemedText style={styles.limitText}>Max {plan.maxTeams} zespołów</ThemedText>
                  </View>
                </View>
                {plan.stripePriceIdMonthly && (
                  <View style={styles.stripeInfo}>
                    <MaterialIcons name="credit-card" size={14} color="#22c55e" />
                    <ThemedText style={styles.stripeText}>Stripe skonfigurowany</ThemedText>
                  </View>
                )}
              </Pressable>
            ))
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Security Section */}
          <View style={styles.settingsSection}>
            <View style={styles.settingsSectionHeader}>
              <MaterialIcons name="analytics" size={24} color="#3b82f6" />
              <ThemedText style={styles.settingsSectionTitle}>Analityka</ThemedText>
            </View>
            <ThemedText style={styles.settingsDescription}>
              Przeglądaj statystyki użytkowników, klubów i przychodów.
            </ThemedText>
            <Pressable 
              style={styles.securityLink}
              onPress={() => router.push('/admin/analytics' as any)}
            >
              <View style={styles.securityLinkContent}>
                <MaterialIcons name="bar-chart" size={24} color="#3b82f6" />
                <View>
                  <ThemedText style={styles.securityLinkTitle}>Dashboard Analityczny</ThemedText>
                  <ThemedText style={styles.securityLinkDesc}>Wykresy, statystyki, przychody</ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#64748b" />
            </Pressable>
          </View>
          
          <View style={styles.settingsSection}>
            <View style={styles.settingsSectionHeader}>
              <MaterialIcons name="campaign" size={24} color="#f59e0b" />
              <ThemedText style={styles.settingsSectionTitle}>Reklamy</ThemedText>
            </View>
            <ThemedText style={styles.settingsDescription}>
              Zarządzaj reklamami i partnerami afiliacyjnymi wyświetlanymi w aplikacji.
            </ThemedText>
            <Pressable 
              style={styles.securityLink}
              onPress={() => router.push('/admin/ads' as any)}
            >
              <View style={styles.securityLinkContent}>
                <MaterialIcons name="ads-click" size={24} color="#f59e0b" />
                <View>
                  <ThemedText style={styles.securityLinkTitle}>Zarządzanie reklamami</ThemedText>
                  <ThemedText style={styles.securityLinkDesc}>Dodawaj, edytuj i monitoruj reklamy</ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#64748b" />
            </Pressable>
            <Pressable 
              style={styles.securityLink}
              onPress={() => router.push('/admin/ab-testing' as any)}
            >
              <View style={styles.securityLinkContent}>
                <MaterialIcons name="science" size={24} color="#8b5cf6" />
                <View>
                  <ThemedText style={styles.securityLinkTitle}>Testy A/B</ThemedText>
                  <ThemedText style={styles.securityLinkDesc}>Testuj warianty reklam i optymalizuj CTR</ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#64748b" />
            </Pressable>
            <Pressable 
              style={styles.securityLink}
              onPress={() => router.push('/admin/notification-segments' as any)}
            >
              <View style={styles.securityLinkContent}>
                <MaterialIcons name="segment" size={24} color="#06b6d4" />
                <View>
                  <ThemedText style={styles.securityLinkTitle}>Segmenty powiadomień</ThemedText>
                  <ThemedText style={styles.securityLinkDesc}>Targetuj powiadomienia do grup użytkowników</ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#64748b" />
            </Pressable>
            <Pressable 
              style={styles.securityLink}
              onPress={() => router.push('/admin/campaigns' as any)}
            >
              <View style={styles.securityLinkContent}>
                <MaterialIcons name="campaign" size={24} color="#f59e0b" />
                <View>
                  <ThemedText style={styles.securityLinkTitle}>Kampanie powiadomień</ThemedText>
                  <ThemedText style={styles.securityLinkDesc}>Twórz i planuj kampanie push</ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#64748b" />
            </Pressable>
            <Pressable 
              style={styles.securityLink}
              onPress={() => router.push('/admin/ad-roi' as any)}
            >
              <View style={styles.securityLinkContent}>
                <MaterialIcons name="insights" size={24} color="#10b981" />
                <View>
                  <ThemedText style={styles.securityLinkTitle}>ROI Reklam</ThemedText>
                  <ThemedText style={styles.securityLinkDesc}>Analiza zwrotu z inwestycji reklamowych</ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#64748b" />
            </Pressable>
          </View>

          <View style={styles.settingsSection}>
            <View style={styles.settingsSectionHeader}>
              <MaterialIcons name="security" size={24} color="#22c55e" />
              <ThemedText style={styles.settingsSectionTitle}>Bezpieczeństwo</ThemedText>
            </View>
            <ThemedText style={styles.settingsDescription}>
              Zarządzaj dwuskładnikowym uwierzytelnianiem (2FA) i przeglądaj logi audytu.
            </ThemedText>
            <Pressable 
              style={styles.securityLink}
              onPress={() => router.push('/admin/security' as any)}
            >
              <View style={styles.securityLinkContent}>
                <MaterialIcons name="shield" size={24} color="#22c55e" />
                <View>
                  <ThemedText style={styles.securityLinkTitle}>2FA i Logi Audytu</ThemedText>
                  <ThemedText style={styles.securityLinkDesc}>Włącz 2FA, przeglądaj historię działań</ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#64748b" />
            </Pressable>
          </View>

          <View style={styles.settingsSection}>
            <View style={styles.settingsSectionHeader}>
              <MaterialIcons name="credit-card" size={24} color="#22c55e" />
              <ThemedText style={styles.settingsSectionTitle}>Konfiguracja Stripe</ThemedText>
            </View>
            <ThemedText style={styles.settingsDescription}>
              Skonfiguruj klucze API Stripe do obsługi płatności za subskrypcje PRO.
              Klucze znajdziesz w panelu Stripe Dashboard → Developers → API keys.
            </ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Publishable Key (pk_...)</ThemedText>
              <TextInput
                style={styles.settingsInput}
                value={stripePublicKey}
                onChangeText={setStripePublicKey}
                placeholder="pk_live_... lub pk_test_..."
                placeholderTextColor="#64748b"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Secret Key (sk_...)</ThemedText>
              <TextInput
                style={styles.settingsInput}
                value={stripeSecretKey}
                onChangeText={setStripeSecretKey}
                placeholder="sk_live_... lub sk_test_..."
                placeholderTextColor="#64748b"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Webhook Secret (whsec_...)</ThemedText>
              <TextInput
                style={styles.settingsInput}
                value={stripeWebhookSecret}
                onChangeText={setStripeWebhookSecret}
                placeholder="whsec_..."
                placeholderTextColor="#64748b"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <Pressable 
              style={[styles.saveSettingsButton, isSavingSettings && styles.buttonDisabled]}
              onPress={handleSaveStripeSettings}
              disabled={isSavingSettings}
            >
              {isSavingSettings ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="#fff" />
                  <ThemedText style={styles.saveSettingsText}>Zapisz ustawienia Stripe</ThemedText>
                </>
              )}
            </Pressable>

            <View style={styles.helpBox}>
              <MaterialIcons name="info" size={20} color="#3b82f6" />
              <View style={styles.helpContent}>
                <ThemedText style={styles.helpTitle}>Jak skonfigurować Stripe?</ThemedText>
                <ThemedText style={styles.helpText}>
                  1. Zaloguj się do stripe.com{'\n'}
                  2. Przejdź do Developers → API keys{'\n'}
                  3. Skopiuj Publishable key i Secret key{'\n'}
                  4. Utwórz webhook endpoint dla /api/stripe/webhook{'\n'}
                  5. Skopiuj Webhook signing secret
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
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
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowGrantProModal(false)}
              >
                <ThemedText style={styles.modalButtonCancelText}>Anuluj</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmGrantPro}
                disabled={grantProMutation.isPending}
              >
                {grantProMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.modalButtonConfirmText}>Przyznaj PRO</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal
        visible={!!editingPlan}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingPlan(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.modalContentLarge]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.modalTitle}>
                {editingPlan?.isNew ? 'Nowy plan subskrypcji' : 'Edytuj plan subskrypcji'}
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Nazwa (kod) *</ThemedText>
                <TextInput
                  style={styles.modalInput}
                  value={planName}
                  onChangeText={setPlanName}
                  placeholder="np. pro, premium"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Nazwa wyświetlana *</ThemedText>
                <TextInput
                  style={styles.modalInput}
                  value={planDisplayName}
                  onChangeText={setPlanDisplayName}
                  placeholder="np. Plan PRO"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={styles.inputLabel}>Cena miesięczna (PLN) *</ThemedText>
                  <TextInput
                    style={styles.modalInput}
                    value={planMonthlyPrice}
                    onChangeText={setPlanMonthlyPrice}
                    placeholder="49.99"
                    placeholderTextColor="#64748b"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                  <ThemedText style={styles.inputLabel}>Cena roczna (PLN)</ThemedText>
                  <TextInput
                    style={styles.modalInput}
                    value={planYearlyPrice}
                    onChangeText={setPlanYearlyPrice}
                    placeholder="499.99"
                    placeholderTextColor="#64748b"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={styles.inputLabel}>Max zawodników</ThemedText>
                  <TextInput
                    style={styles.modalInput}
                    value={planMaxPlayers}
                    onChangeText={setPlanMaxPlayers}
                    placeholder="50"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                  <ThemedText style={styles.inputLabel}>Max zespołów</ThemedText>
                  <TextInput
                    style={styles.modalInput}
                    value={planMaxTeams}
                    onChangeText={setPlanMaxTeams}
                    placeholder="3"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Stripe Price ID (miesięczny)</ThemedText>
                <TextInput
                  style={styles.modalInput}
                  value={planStripePriceMonthly}
                  onChangeText={setPlanStripePriceMonthly}
                  placeholder="price_..."
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Stripe Price ID (roczny)</ThemedText>
                <TextInput
                  style={styles.modalInput}
                  value={planStripePriceYearly}
                  onChangeText={setPlanStripePriceYearly}
                  placeholder="price_..."
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Funkcje (JSON array)</ThemedText>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={planFeatures}
                  onChangeText={setPlanFeatures}
                  placeholder='["Nielimitowani zawodnicy", "SMS powiadomienia"]'
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setEditingPlan(null)}
                >
                  <ThemedText style={styles.modalButtonCancelText}>Anuluj</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleSavePlan}
                  disabled={updatePlanMutation.isPending || createPlanMutation.isPending}
                >
                  {(updatePlanMutation.isPending || createPlanMutation.isPending) ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={styles.modalButtonConfirmText}>Zapisz</ThemedText>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

// User Card Component
function UserCard({ user, onGrantPro, onRevokePro }: { 
  user: any; 
  onGrantPro: () => void; 
  onRevokePro: () => void;
}) {
  return (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <ThemedText style={styles.userAvatarText}>
            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
          </ThemedText>
        </View>
        <View style={styles.userDetails}>
          <ThemedText style={styles.userName}>{user.name || 'Bez nazwy'}</ThemedText>
          <ThemedText style={styles.userEmail}>{user.email || user.openId}</ThemedText>
          <View style={styles.userBadges}>
            {user.isPro && (
              <View style={styles.proBadge}>
                <MaterialIcons name="star" size={12} color="#f59e0b" />
                <ThemedText style={styles.proBadgeText}>PRO</ThemedText>
              </View>
            )}
            {user.isMasterAdmin && (
              <View style={styles.adminBadge}>
                <MaterialIcons name="admin-panel-settings" size={12} color="#ef4444" />
                <ThemedText style={styles.adminBadgeText}>Admin</ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={styles.userActions}>
        {user.isPro ? (
          <Pressable style={styles.revokeButton} onPress={onRevokePro}>
            <MaterialIcons name="remove-circle" size={20} color="#ef4444" />
          </Pressable>
        ) : (
          <Pressable style={styles.grantButton} onPress={onGrantPro}>
            <MaterialIcons name="star" size={20} color="#f59e0b" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  tabActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  tabText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#22c55e',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: '#94a3b8',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 20,
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#fff',
  },
  userEmail: {
    fontSize: 13,
    lineHeight: 18,
    color: '#94a3b8',
  },
  userBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  grantButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revokeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
    fontWeight: '600',
  },
  planCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  planCode: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },
  planBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planBadgeInactive: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  planBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#22c55e',
    fontWeight: '500',
  },
  planPrices: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  priceItem: {},
  priceLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: '#64748b',
  },
  priceValue: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  planLimits: {
    flexDirection: 'row',
    gap: 16,
  },
  limitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  limitText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#94a3b8',
  },
  stripeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  stripeText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#22c55e',
  },
  settingsSection: {
    marginTop: 8,
  },
  settingsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  settingsSectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: '#94a3b8',
    marginBottom: 6,
  },
  settingsInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 20,
    color: '#fff',
  },
  saveSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 8,
  },
  saveSettingsText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#fff',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  helpBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#94a3b8',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#64748b',
  },
  accessDeniedTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  accessDeniedText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  backButtonLarge: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#22c55e',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalContentLarge: {
    maxHeight: '80%',
  },
  modalIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 20,
    color: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#334155',
  },
  modalButtonCancelText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#fff',
    fontWeight: '500',
  },
  modalButtonConfirm: {
    backgroundColor: '#22c55e',
  },
  modalButtonConfirmText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#fff',
    fontWeight: '600',
  },
  securityLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  securityLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityLinkTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#fff',
  },
  securityLinkDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: '#94a3b8',
    marginTop: 2,
  },
});
