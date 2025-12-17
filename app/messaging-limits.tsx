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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";

const STORAGE_KEY = 'messaging_limits';

interface LimitConfig {
  sms: {
    enabled: boolean;
    monthlyLimit: number;
    warningThreshold: number; // percentage (e.g., 80 = 80%)
    currentUsage: number;
  };
  whatsapp: {
    enabled: boolean;
    monthlyLimit: number;
    warningThreshold: number;
    currentUsage: number;
  };
  alertEmail: string;
  alertPush: boolean;
}

const DEFAULT_CONFIG: LimitConfig = {
  sms: {
    enabled: false,
    monthlyLimit: 100,
    warningThreshold: 80,
    currentUsage: 0,
  },
  whatsapp: {
    enabled: false,
    monthlyLimit: 500,
    warningThreshold: 80,
    currentUsage: 0,
  },
  alertEmail: '',
  alertPush: true,
};

export default function MessagingLimitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<LimitConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('[Messaging Limits] Error loading:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newConfig: LimitConfig) => {
    try {
      setIsSaving(true);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
    } catch (error) {
      console.error('[Messaging Limits] Error saving:', error);
      Alert.alert('Błąd', 'Nie udało się zapisać ustawień');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSMSLimit = (field: keyof LimitConfig['sms'], value: any) => {
    const newConfig = {
      ...config,
      sms: { ...config.sms, [field]: value },
    };
    saveSettings(newConfig);
  };

  const updateWhatsAppLimit = (field: keyof LimitConfig['whatsapp'], value: any) => {
    const newConfig = {
      ...config,
      whatsapp: { ...config.whatsapp, [field]: value },
    };
    saveSettings(newConfig);
  };

  const getUsagePercentage = (current: number, limit: number): number => {
    if (limit === 0) return 0;
    return Math.min(100, Math.round((current / limit) * 100));
  };

  const getUsageColor = (percentage: number, threshold: number): string => {
    if (percentage >= 100) return '#ef4444';
    if (percentage >= threshold) return '#f59e0b';
    return '#22c55e';
  };

  const resetUsage = (type: 'sms' | 'whatsapp') => {
    Alert.alert(
      'Resetuj licznik',
      `Czy na pewno chcesz zresetować licznik ${type.toUpperCase()}? Ta operacja jest nieodwracalna.`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Resetuj',
          style: 'destructive',
          onPress: () => {
            if (type === 'sms') {
              updateSMSLimit('currentUsage', 0);
            } else {
              updateWhatsAppLimit('currentUsage', 0);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </ThemedView>
    );
  }

  const smsPercentage = getUsagePercentage(config.sms.currentUsage, config.sms.monthlyLimit);
  const whatsappPercentage = getUsagePercentage(config.whatsapp.currentUsage, config.whatsapp.monthlyLimit);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Limity kosztów</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={20} color="#3b82f6" />
          <ThemedText style={styles.infoText}>
            Ustaw miesięczne limity wysyłki wiadomości, aby kontrolować koszty. 
            Otrzymasz alert gdy zbliżysz się do limitu.
          </ThemedText>
        </View>

        {/* SMS Limits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="sms" size={24} color="#22c55e" />
              <ThemedText style={styles.sectionTitle}>Limity SMS</ThemedText>
            </View>
            <Switch
              value={config.sms.enabled}
              onValueChange={(value) => updateSMSLimit('enabled', value)}
              trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
              thumbColor={config.sms.enabled ? AppColors.primary : '#64748b'}
            />
          </View>

          {config.sms.enabled && (
            <View style={styles.sectionContent}>
              {/* Usage Progress */}
              <View style={styles.usageCard}>
                <View style={styles.usageHeader}>
                  <ThemedText style={styles.usageLabel}>Wykorzystanie w tym miesiącu</ThemedText>
                  <ThemedText style={[styles.usageValue, { color: getUsageColor(smsPercentage, config.sms.warningThreshold) }]}>
                    {config.sms.currentUsage} / {config.sms.monthlyLimit}
                  </ThemedText>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${smsPercentage}%`,
                        backgroundColor: getUsageColor(smsPercentage, config.sms.warningThreshold),
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.warningMarker,
                      { left: `${config.sms.warningThreshold}%` },
                    ]}
                  />
                </View>
                <ThemedText style={styles.usagePercent}>{smsPercentage}% wykorzystane</ThemedText>
              </View>

              {/* Monthly Limit */}
              <View style={styles.inputRow}>
                <ThemedText style={styles.inputLabel}>Miesięczny limit</ThemedText>
                <TextInput
                  style={styles.input}
                  value={String(config.sms.monthlyLimit)}
                  onChangeText={(text) => updateSMSLimit('monthlyLimit', parseInt(text) || 0)}
                  keyboardType="number-pad"
                  placeholder="100"
                  placeholderTextColor="#64748b"
                />
              </View>

              {/* Warning Threshold */}
              <View style={styles.inputRow}>
                <ThemedText style={styles.inputLabel}>Próg ostrzeżenia (%)</ThemedText>
                <TextInput
                  style={styles.input}
                  value={String(config.sms.warningThreshold)}
                  onChangeText={(text) => {
                    const val = parseInt(text) || 0;
                    updateSMSLimit('warningThreshold', Math.min(100, Math.max(0, val)));
                  }}
                  keyboardType="number-pad"
                  placeholder="80"
                  placeholderTextColor="#64748b"
                />
              </View>

              <Pressable style={styles.resetBtn} onPress={() => resetUsage('sms')}>
                <MaterialIcons name="refresh" size={16} color="#f59e0b" />
                <ThemedText style={styles.resetBtnText}>Resetuj licznik</ThemedText>
              </Pressable>
            </View>
          )}
        </View>

        {/* WhatsApp Limits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="chat" size={24} color="#25D366" />
              <ThemedText style={styles.sectionTitle}>Limity WhatsApp</ThemedText>
            </View>
            <Switch
              value={config.whatsapp.enabled}
              onValueChange={(value) => updateWhatsAppLimit('enabled', value)}
              trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
              thumbColor={config.whatsapp.enabled ? AppColors.primary : '#64748b'}
            />
          </View>

          {config.whatsapp.enabled && (
            <View style={styles.sectionContent}>
              {/* Usage Progress */}
              <View style={styles.usageCard}>
                <View style={styles.usageHeader}>
                  <ThemedText style={styles.usageLabel}>Wykorzystanie w tym miesiącu</ThemedText>
                  <ThemedText style={[styles.usageValue, { color: getUsageColor(whatsappPercentage, config.whatsapp.warningThreshold) }]}>
                    {config.whatsapp.currentUsage} / {config.whatsapp.monthlyLimit}
                  </ThemedText>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${whatsappPercentage}%`,
                        backgroundColor: getUsageColor(whatsappPercentage, config.whatsapp.warningThreshold),
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.warningMarker,
                      { left: `${config.whatsapp.warningThreshold}%` },
                    ]}
                  />
                </View>
                <ThemedText style={styles.usagePercent}>{whatsappPercentage}% wykorzystane</ThemedText>
              </View>

              {/* Monthly Limit */}
              <View style={styles.inputRow}>
                <ThemedText style={styles.inputLabel}>Miesięczny limit</ThemedText>
                <TextInput
                  style={styles.input}
                  value={String(config.whatsapp.monthlyLimit)}
                  onChangeText={(text) => updateWhatsAppLimit('monthlyLimit', parseInt(text) || 0)}
                  keyboardType="number-pad"
                  placeholder="500"
                  placeholderTextColor="#64748b"
                />
              </View>

              {/* Warning Threshold */}
              <View style={styles.inputRow}>
                <ThemedText style={styles.inputLabel}>Próg ostrzeżenia (%)</ThemedText>
                <TextInput
                  style={styles.input}
                  value={String(config.whatsapp.warningThreshold)}
                  onChangeText={(text) => {
                    const val = parseInt(text) || 0;
                    updateWhatsAppLimit('warningThreshold', Math.min(100, Math.max(0, val)));
                  }}
                  keyboardType="number-pad"
                  placeholder="80"
                  placeholderTextColor="#64748b"
                />
              </View>

              <Pressable style={styles.resetBtn} onPress={() => resetUsage('whatsapp')}>
                <MaterialIcons name="refresh" size={16} color="#f59e0b" />
                <ThemedText style={styles.resetBtnText}>Resetuj licznik</ThemedText>
              </Pressable>
            </View>
          )}
        </View>

        {/* Alert Settings */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Ustawienia alertów</ThemedText>
          <View style={styles.sectionContent}>
            <View style={styles.alertRow}>
              <View style={styles.alertInfo}>
                <MaterialIcons name="notifications" size={20} color="#3b82f6" />
                <ThemedText style={styles.alertLabel}>Powiadomienia push</ThemedText>
              </View>
              <Switch
                value={config.alertPush}
                onValueChange={(value) => saveSettings({ ...config, alertPush: value })}
                trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
                thumbColor={config.alertPush ? AppColors.primary : '#64748b'}
              />
            </View>

            <View style={styles.inputRow}>
              <ThemedText style={styles.inputLabel}>Email do alertów</ThemedText>
              <TextInput
                style={[styles.input, styles.inputWide]}
                value={config.alertEmail}
                onChangeText={(text) => saveSettings({ ...config, alertEmail: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="email@example.com"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>
        </View>

        {/* Cost Estimation */}
        <View style={styles.costCard}>
          <MaterialIcons name="calculate" size={24} color="#f59e0b" />
          <View style={styles.costInfo}>
            <ThemedText style={styles.costTitle}>Szacowany koszt miesięczny</ThemedText>
            <ThemedText style={styles.costValue}>
              SMS: ~{(config.sms.monthlyLimit * 0.07).toFixed(2)} PLN | 
              WhatsApp: ~{(config.whatsapp.monthlyLimit * 0.05).toFixed(2)} PLN
            </ThemedText>
            <ThemedText style={styles.costNote}>
              * Szacunki oparte na średnich cenach dostawców
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
          <ThemedText style={styles.savingText}>Zapisywanie...</ThemedText>
        </View>
      )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
  },
  section: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  sectionContent: {
    padding: Spacing.md,
  },
  usageCard: {
    backgroundColor: "#0f172a",
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  usageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  usageLabel: {
    fontSize: 13,
    color: "#94a3b8",
  },
  usageValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "visible",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  warningMarker: {
    position: "absolute",
    top: -2,
    width: 2,
    height: 12,
    backgroundColor: "#f59e0b",
  },
  usagePercent: {
    fontSize: 12,
    color: "#64748b",
    marginTop: Spacing.xs,
    textAlign: "right",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    color: "#94a3b8",
  },
  input: {
    backgroundColor: "#0f172a",
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: "#fff",
    fontSize: 14,
    width: 100,
    textAlign: "center",
  },
  inputWide: {
    width: 200,
    textAlign: "left",
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    marginTop: Spacing.sm,
  },
  resetBtnText: {
    fontSize: 13,
    color: "#f59e0b",
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  alertInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  alertLabel: {
    fontSize: 14,
    color: "#fff",
  },
  costCard: {
    flexDirection: "row",
    backgroundColor: "#422006",
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  costInfo: {
    flex: 1,
  },
  costTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fbbf24",
    marginBottom: 4,
  },
  costValue: {
    fontSize: 13,
    color: "#fcd34d",
    marginBottom: 4,
  },
  costNote: {
    fontSize: 11,
    color: "#a16207",
  },
  savingOverlay: {
    position: "absolute",
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "#334155",
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  savingText: {
    fontSize: 14,
    color: "#fff",
  },
});
