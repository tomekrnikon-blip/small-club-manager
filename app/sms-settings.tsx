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
  SMSConfig,
  SMSProvider,
  getSMSConfig,
  saveSMSConfig,
  verifySMSConfig,
  sendSMS,
} from "@/lib/sms-user-service";

export default function SMSSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Config state
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<SMSProvider>('smsapi');
  const [testMode, setTestMode] = useState(true);
  const [defaultCountryCode, setDefaultCountryCode] = useState('+48');
  const [lastVerified, setLastVerified] = useState<string | undefined>();
  const [balance, setBalance] = useState<number | undefined>();

  // SMSAPI.pl
  const [smsapiToken, setSmsapiToken] = useState('');
  const [smsapiFrom, setSmsapiFrom] = useState('');

  // SMSLabs
  const [smslabsAppKey, setSmslabsAppKey] = useState('');
  const [smslabsSecretKey, setSmslabsSecretKey] = useState('');
  const [smslabsFrom, setSmslabsFrom] = useState('');

  // Twilio
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');

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
      const config = await getSMSConfig();
      setEnabled(config.enabled);
      setProvider(config.provider);
      setTestMode(config.testMode);
      setDefaultCountryCode(config.defaultCountryCode);
      setLastVerified(config.lastVerified);
      
      // SMSAPI
      setSmsapiToken(config.smsapiToken || '');
      setSmsapiFrom(config.smsapiFrom || '');
      
      // SMSLabs
      setSmslabsAppKey(config.smslabsAppKey || '');
      setSmslabsSecretKey(config.smslabsSecretKey || '');
      setSmslabsFrom(config.smslabsFrom || '');
      
      // Twilio
      setTwilioAccountSid(config.twilioAccountSid || '');
      setTwilioAuthToken(config.twilioAuthToken || '');
      setTwilioPhoneNumber(config.twilioPhoneNumber || '');
      
      // Custom
      setCustomApiUrl(config.customApiUrl || '');
      setCustomApiKey(config.customApiKey || '');
    } catch (error) {
      console.error('[SMS] Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildConfig = (): SMSConfig => ({
    enabled,
    provider,
    testMode,
    defaultCountryCode,
    lastVerified,
    smsapiToken: smsapiToken || undefined,
    smsapiFrom: smsapiFrom || undefined,
    smslabsAppKey: smslabsAppKey || undefined,
    smslabsSecretKey: smslabsSecretKey || undefined,
    smslabsFrom: smslabsFrom || undefined,
    twilioAccountSid: twilioAccountSid || undefined,
    twilioAuthToken: twilioAuthToken || undefined,
    twilioPhoneNumber: twilioPhoneNumber || undefined,
    customApiUrl: customApiUrl || undefined,
    customApiKey: customApiKey || undefined,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSMSConfig(buildConfig());
      Alert.alert("Sukces", "Konfiguracja SMS została zapisana");
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
      const result = await verifySMSConfig(config);
      
      if (result.valid) {
        const now = new Date().toISOString();
        setLastVerified(now);
        setBalance(result.balance);
        await saveSMSConfig({ ...config, lastVerified: now });
        Alert.alert(
          "Sukces",
          result.balance !== undefined
            ? `Konfiguracja jest poprawna!\nSaldo: ${result.balance} punktów`
            : "Konfiguracja jest poprawna!"
        );
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
      const result = await sendSMS(
        testPhone,
        "Test wiadomości SMS z Small Club Manager 🏆",
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

  const providers: { value: SMSProvider; label: string; description: string; docsUrl: string }[] = [
    { 
      value: 'smsapi', 
      label: 'SMSAPI.pl', 
      description: 'Polski dostawca SMS z konkurencyjnymi cenami',
      docsUrl: 'https://www.smsapi.pl/docs',
    },
    { 
      value: 'smslabs', 
      label: 'SMSLabs', 
      description: 'Alternatywny polski dostawca SMS',
      docsUrl: 'https://www.smslabs.pl/dokumentacja-api',
    },
    { 
      value: 'twilio', 
      label: 'Twilio', 
      description: 'Globalny dostawca komunikacji',
      docsUrl: 'https://www.twilio.com/docs/sms',
    },
    { 
      value: 'custom', 
      label: 'Własne API', 
      description: 'Własny dostawca lub gateway',
      docsUrl: '',
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
        <ThemedText style={styles.headerTitle}>Integracja SMS</ThemedText>
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
            Połącz własne konto SMS. Koszty wysyłki wiadomości są po Twojej stronie.
          </ThemedText>
        </View>

        {/* Enable Switch */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <ThemedText style={styles.switchLabel}>Włącz SMS</ThemedText>
              <ThemedText style={styles.switchDescription}>
                Wysyłaj powiadomienia przez SMS
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
              <ThemedText style={styles.sectionTitle}>Dostawca SMS</ThemedText>
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
                  {p.docsUrl && (
                    <Pressable onPress={() => openDocs(p.docsUrl)} style={styles.docsBtn}>
                      <MaterialIcons name="open-in-new" size={16} color="#64748b" />
                    </Pressable>
                  )}
                </Pressable>
              ))}
            </View>

            {/* Provider-specific config */}
            {provider === 'smsapi' && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>SMSAPI.pl</ThemedText>
                
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Token API</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={smsapiToken}
                    onChangeText={setSmsapiToken}
                    placeholder="Twój token API z SMSAPI.pl"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Nazwa nadawcy</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={smsapiFrom}
                    onChangeText={setSmsapiFrom}
                    placeholder="np. MojKlub (max 11 znaków)"
                    placeholderTextColor="#64748b"
                    maxLength={11}
                  />
                </View>
              </View>
            )}

            {provider === 'smslabs' && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>SMSLabs</ThemedText>
                
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>App Key</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={smslabsAppKey}
                    onChangeText={setSmslabsAppKey}
                    placeholder="Klucz aplikacji"
                    placeholderTextColor="#64748b"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Secret Key</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={smslabsSecretKey}
                    onChangeText={setSmslabsSecretKey}
                    placeholder="Klucz tajny"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Nazwa nadawcy</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={smslabsFrom}
                    onChangeText={setSmslabsFrom}
                    placeholder="np. MojKlub"
                    placeholderTextColor="#64748b"
                    maxLength={11}
                  />
                </View>
              </View>
            )}

            {provider === 'twilio' && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Twilio</ThemedText>
                
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
                    placeholder="Twój Auth Token"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Numer telefonu</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={twilioPhoneNumber}
                    onChangeText={setTwilioPhoneNumber}
                    placeholder="+1234567890"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
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
                    placeholder="https://api.example.com/sms"
                    placeholderTextColor="#64748b"
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Klucz API (opcjonalnie)</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={customApiKey}
                    onChangeText={setCustomApiKey}
                    placeholder="Bearer token lub API key"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                  />
                </View>
              </View>
            )}

            {/* Test Mode */}
            <View style={styles.section}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <ThemedText style={styles.switchLabel}>Tryb testowy</ThemedText>
                  <ThemedText style={styles.switchDescription}>
                    Symuluj wysyłkę bez faktycznego wysyłania SMS
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

            {/* Country Code */}
            <View style={styles.section}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Domyślny kod kraju</ThemedText>
                <TextInput
                  style={styles.input}
                  value={defaultCountryCode}
                  onChangeText={setDefaultCountryCode}
                  placeholder="+48"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Verify & Test */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Weryfikacja i test</ThemedText>
              
              <Pressable
                style={[styles.actionBtn, styles.verifyBtn]}
                onPress={handleVerify}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="verified" size={20} color="#fff" />
                    <ThemedText style={styles.actionBtnText}>Zweryfikuj konfigurację</ThemedText>
                  </>
                )}
              </Pressable>

              {lastVerified && (
                <View style={styles.verifiedInfo}>
                  <MaterialIcons name="check-circle" size={16} color="#22c55e" />
                  <ThemedText style={styles.verifiedText}>
                    Zweryfikowano: {new Date(lastVerified).toLocaleDateString('pl-PL')}
                    {balance !== undefined && ` • Saldo: ${balance} pkt`}
                  </ThemedText>
                </View>
              )}

              <View style={styles.testSection}>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Numer do testu</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={testPhone}
                    onChangeText={setTestPhone}
                    placeholder="+48123456789"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
                  />
                </View>

                <Pressable
                  style={[styles.actionBtn, styles.testBtn]}
                  onPress={handleTestMessage}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="send" size={20} color="#fff" />
                      <ThemedText style={styles.actionBtnText}>Wyślij testowy SMS</ThemedText>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
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
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  switchInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 13,
    color: "#64748b",
  },
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  providerCardActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "10",
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
  docsBtn: {
    padding: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: "#0f172a",
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#334155",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  verifyBtn: {
    backgroundColor: AppColors.primary,
  },
  testBtn: {
    backgroundColor: "#22c55e",
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  verifiedInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  verifiedText: {
    fontSize: 13,
    color: "#22c55e",
  },
  testSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
});
