import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import {
  WhatsAppConfig,
  getWhatsAppConfig,
  saveWhatsAppConfig,
  verifyWhatsAppConfig,
  sendWhatsAppMessage,
} from "@/lib/whatsapp-service";

type Provider = 'meta' | 'twilio' | 'custom';

export default function WhatsAppSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Config state
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<Provider>('meta');
  const [testMode, setTestMode] = useState(true);
  const [defaultCountryCode, setDefaultCountryCode] = useState('+48');
  const [lastVerified, setLastVerified] = useState<string | undefined>();

  // Meta API
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');

  // Twilio
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioWhatsAppNumber, setTwilioWhatsAppNumber] = useState('');

  // Custom
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');

  // Test phone
  const [testPhone, setTestPhone] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await getWhatsAppConfig();
      setEnabled(config.enabled);
      setProvider(config.provider);
      setTestMode(config.testMode);
      setDefaultCountryCode(config.defaultCountryCode);
      setLastVerified(config.lastVerified);
      
      // Meta
      setPhoneNumberId(config.phoneNumberId || '');
      setAccessToken(config.accessToken || '');
      setBusinessAccountId(config.businessAccountId || '');
      
      // Twilio
      setTwilioAccountSid(config.twilioAccountSid || '');
      setTwilioAuthToken(config.twilioAuthToken || '');
      setTwilioWhatsAppNumber(config.twilioWhatsAppNumber || '');
      
      // Custom
      setCustomApiUrl(config.customApiUrl || '');
      setCustomApiKey(config.customApiKey || '');
    } catch (error) {
      console.error('[WhatsApp] Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildConfig = (): WhatsAppConfig => ({
    enabled,
    provider,
    testMode,
    defaultCountryCode,
    lastVerified,
    phoneNumberId: phoneNumberId || undefined,
    accessToken: accessToken || undefined,
    businessAccountId: businessAccountId || undefined,
    twilioAccountSid: twilioAccountSid || undefined,
    twilioAuthToken: twilioAuthToken || undefined,
    twilioWhatsAppNumber: twilioWhatsAppNumber || undefined,
    customApiUrl: customApiUrl || undefined,
    customApiKey: customApiKey || undefined,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveWhatsAppConfig(buildConfig());
      Alert.alert("Sukces", "Konfiguracja WhatsApp została zapisana");
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się zapisać konfiguracji");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const config = buildConfig();
      const result = await verifyWhatsAppConfig(config);
      
      if (result.valid) {
        const now = new Date().toISOString();
        setLastVerified(now);
        await saveWhatsAppConfig({ ...config, lastVerified: now });
        Alert.alert("Sukces", "Konfiguracja jest poprawna!");
      } else {
        Alert.alert("Błąd weryfikacji", result.error || "Nieprawidłowa konfiguracja");
      }
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się zweryfikować konfiguracji");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTestMessage = async () => {
    if (!testPhone) {
      Alert.alert("Błąd", "Wprowadź numer telefonu do testu");
      return;
    }

    setIsTesting(true);
    try {
      const result = await sendWhatsAppMessage(
        testPhone,
        "Test wiadomości WhatsApp z Small Club Manager 🏆",
        buildConfig()
      );
      
      if (result.success) {
        Alert.alert("Sukces", `Wiadomość wysłana!\nID: ${result.messageId}`);
      } else {
        Alert.alert("Błąd wysyłki", result.error || "Nie udało się wysłać wiadomości");
      }
    } catch (error) {
      Alert.alert("Błąd", "Wystąpił błąd podczas wysyłania");
    } finally {
      setIsTesting(false);
    }
  };

  const openDocs = (url: string) => {
    Linking.openURL(url);
  };

  const providers: { value: Provider; label: string; description: string }[] = [
    { 
      value: 'meta', 
      label: 'Meta Cloud API', 
      description: 'Oficjalne API WhatsApp Business od Meta' 
    },
    { 
      value: 'twilio', 
      label: 'Twilio', 
      description: 'WhatsApp przez platformę Twilio' 
    },
    { 
      value: 'custom', 
      label: 'Własne API', 
      description: 'Własny dostawca lub gateway' 
    },
  ];

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Integracja WhatsApp</ThemedText>
        <Pressable onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={styles.saveBtnText}>Zapisz</ThemedText>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialIcons name="info" size={20} color="#60a5fa" />
          <ThemedText style={styles.infoText}>
            Połącz własne konto WhatsApp Business API. Koszty wysyłki wiadomości są po Twojej stronie.
          </ThemedText>
        </View>

        {/* Enable Switch */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <ThemedText style={styles.switchLabel}>Włącz WhatsApp</ThemedText>
              <ThemedText style={styles.switchDescription}>
                Wysyłaj powiadomienia przez WhatsApp
              </ThemedText>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: '#334155', true: AppColors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {enabled && (
          <>
            {/* Provider Selection */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Dostawca API</ThemedText>
              {providers.map((p) => (
                <Pressable
                  key={p.value}
                  style={[
                    styles.providerCard,
                    provider === p.value && styles.providerCardActive,
                  ]}
                  onPress={() => setProvider(p.value)}
                >
                  <View style={styles.providerRadio}>
                    <View style={[
                      styles.radioOuter,
                      provider === p.value && styles.radioOuterActive,
                    ]}>
                      {provider === p.value && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <View style={styles.providerInfo}>
                    <ThemedText style={styles.providerLabel}>{p.label}</ThemedText>
                    <ThemedText style={styles.providerDescription}>{p.description}</ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Provider-specific config */}
            {provider === 'meta' && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Meta Cloud API</ThemedText>
                  <Pressable 
                    onPress={() => openDocs('https://developers.facebook.com/docs/whatsapp/cloud-api')}
                    style={styles.docsLink}
                  >
                    <MaterialIcons name="open-in-new" size={16} color={AppColors.primary} />
                    <ThemedText style={styles.docsLinkText}>Dokumentacja</ThemedText>
                  </Pressable>
                </View>
                
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Phone Number ID</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={phoneNumberId}
                    onChangeText={setPhoneNumberId}
                    placeholder="np. 123456789012345"
                    placeholderTextColor="#64748b"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Access Token</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={accessToken}
                    onChangeText={setAccessToken}
                    placeholder="Token dostępu z Meta"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Business Account ID (opcjonalnie)</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={businessAccountId}
                    onChangeText={setBusinessAccountId}
                    placeholder="ID konta biznesowego"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>
            )}

            {provider === 'twilio' && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Twilio</ThemedText>
                  <Pressable 
                    onPress={() => openDocs('https://www.twilio.com/docs/whatsapp')}
                    style={styles.docsLink}
                  >
                    <MaterialIcons name="open-in-new" size={16} color={AppColors.primary} />
                    <ThemedText style={styles.docsLinkText}>Dokumentacja</ThemedText>
                  </Pressable>
                </View>
                
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Account SID</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={twilioAccountSid}
                    onChangeText={setTwilioAccountSid}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    placeholderTextColor="#64748b"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Auth Token</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={twilioAuthToken}
                    onChangeText={setTwilioAuthToken}
                    placeholder="Token autoryzacji"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Numer WhatsApp</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={twilioWhatsAppNumber}
                    onChangeText={setTwilioWhatsAppNumber}
                    placeholder="+14155238886"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>
            )}

            {provider === 'custom' && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Własne API</ThemedText>
                
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>URL API</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={customApiUrl}
                    onChangeText={setCustomApiUrl}
                    placeholder="https://api.example.com/whatsapp/send"
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Klucz API</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={customApiKey}
                    onChangeText={setCustomApiKey}
                    placeholder="Twój klucz API"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                  />
                </View>
              </View>
            )}

            {/* General Settings */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Ustawienia ogólne</ThemedText>
              
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Domyślny kod kraju</ThemedText>
                <TextInput
                  style={styles.input}
                  value={defaultCountryCode}
                  onChangeText={setDefaultCountryCode}
                  placeholder="+48"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <ThemedText style={styles.switchLabel}>Tryb testowy</ThemedText>
                  <ThemedText style={styles.switchDescription}>
                    Wiadomości nie będą wysyłane, tylko logowane
                  </ThemedText>
                </View>
                <Switch
                  value={testMode}
                  onValueChange={setTestMode}
                  trackColor={{ false: '#334155', true: '#f59e0b' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Verification */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Weryfikacja</ThemedText>
              
              {lastVerified && (
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="check-circle" size={16} color="#22c55e" />
                  <ThemedText style={styles.verifiedText}>
                    Zweryfikowano: {new Date(lastVerified).toLocaleString('pl-PL')}
                  </ThemedText>
                </View>
              )}

              <Pressable
                style={[styles.verifyBtn, isVerifying && styles.btnDisabled]}
                onPress={handleVerify}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="verified" size={20} color="#fff" />
                    <ThemedText style={styles.btnText}>Zweryfikuj konfigurację</ThemedText>
                  </>
                )}
              </Pressable>
            </View>

            {/* Test Message */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Wyślij testową wiadomość</ThemedText>
              
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Numer telefonu</ThemedText>
                <TextInput
                  style={styles.input}
                  value={testPhone}
                  onChangeText={setTestPhone}
                  placeholder="np. 500123456"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                />
              </View>

              <Pressable
                style={[styles.testBtn, isTesting && styles.btnDisabled]}
                onPress={handleTestMessage}
                disabled={isTesting || !testPhone}
              >
                {isTesting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="send" size={20} color="#fff" />
                    <ThemedText style={styles.btnText}>Wyślij test</ThemedText>
                  </>
                )}
              </Pressable>
            </View>

            {/* Templates Link */}
            <Pressable
              style={styles.templatesLink}
              onPress={() => router.push('/whatsapp-templates' as any)}
            >
              <MaterialIcons name="description" size={24} color={AppColors.primary} />
              <View style={styles.templatesInfo}>
                <ThemedText style={styles.templatesLabel}>Szablony wiadomości</ThemedText>
                <ThemedText style={styles.templatesDescription}>
                  Zarządzaj szablonami powiadomień WhatsApp
                </ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#64748b" />
            </Pressable>
          </>
        )}
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
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  saveBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#60a5fa",
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  docsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  docsLinkText: {
    fontSize: 13,
    color: AppColors.primary,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  switchInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#fff",
  },
  switchDescription: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  providerCardActive: {
    borderColor: AppColors.primary,
  },
  providerRadio: {
    marginRight: Spacing.md,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#64748b",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterActive: {
    borderColor: AppColors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.primary,
  },
  providerInfo: {
    flex: 1,
  },
  providerLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#fff",
  },
  providerDescription: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: "#fff",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  verifiedText: {
    fontSize: 13,
    color: "#22c55e",
  },
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "#22c55e",
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  templatesLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  templatesInfo: {
    flex: 1,
  },
  templatesLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#fff",
  },
  templatesDescription: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
});
