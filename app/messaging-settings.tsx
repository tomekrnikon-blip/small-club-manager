import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";

type NotificationType = 
  | 'training_reminder'
  | 'match_reminder'
  | 'callup'
  | 'attendance'
  | 'payment_reminder'
  | 'general';

type Channel = 'push' | 'sms' | 'whatsapp' | 'email';

interface ChannelConfig {
  enabled: boolean;
  priority: number; // 1 = highest priority
}

interface NotificationConfig {
  type: NotificationType;
  label: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  channels: Record<Channel, ChannelConfig>;
}

const STORAGE_KEY = 'messaging_settings';

const DEFAULT_CONFIG: NotificationConfig[] = [
  {
    type: 'training_reminder',
    label: 'Przypomnienia o treningach',
    description: 'Powiadomienia przed zaplanowanymi treningami',
    icon: 'fitness-center',
    channels: {
      push: { enabled: true, priority: 1 },
      sms: { enabled: false, priority: 2 },
      whatsapp: { enabled: false, priority: 3 },
      email: { enabled: false, priority: 4 },
    },
  },
  {
    type: 'match_reminder',
    label: 'Przypomnienia o meczach',
    description: 'Powiadomienia przed meczami',
    icon: 'sports-soccer',
    channels: {
      push: { enabled: true, priority: 1 },
      sms: { enabled: true, priority: 2 },
      whatsapp: { enabled: false, priority: 3 },
      email: { enabled: false, priority: 4 },
    },
  },
  {
    type: 'callup',
    label: 'Powołania',
    description: 'Informacje o powołaniach na mecze',
    icon: 'person-add',
    channels: {
      push: { enabled: true, priority: 1 },
      sms: { enabled: true, priority: 2 },
      whatsapp: { enabled: true, priority: 3 },
      email: { enabled: false, priority: 4 },
    },
  },
  {
    type: 'attendance',
    label: 'Obecność',
    description: 'Przypomnienia o potwierdzeniu obecności',
    icon: 'how-to-reg',
    channels: {
      push: { enabled: true, priority: 1 },
      sms: { enabled: false, priority: 2 },
      whatsapp: { enabled: true, priority: 3 },
      email: { enabled: false, priority: 4 },
    },
  },
  {
    type: 'payment_reminder',
    label: 'Przypomnienia o płatnościach',
    description: 'Powiadomienia o zaległych płatnościach',
    icon: 'payment',
    channels: {
      push: { enabled: true, priority: 1 },
      sms: { enabled: true, priority: 2 },
      whatsapp: { enabled: false, priority: 3 },
      email: { enabled: true, priority: 4 },
    },
  },
  {
    type: 'general',
    label: 'Ogólne powiadomienia',
    description: 'Inne powiadomienia z klubu',
    icon: 'notifications',
    channels: {
      push: { enabled: true, priority: 1 },
      sms: { enabled: false, priority: 2 },
      whatsapp: { enabled: false, priority: 3 },
      email: { enabled: true, priority: 4 },
    },
  },
];

const CHANNEL_INFO: Record<Channel, { label: string; icon: keyof typeof MaterialIcons.glyphMap; color: string }> = {
  push: { label: 'Push', icon: 'notifications-active', color: '#3b82f6' },
  sms: { label: 'SMS', icon: 'sms', color: '#22c55e' },
  whatsapp: { label: 'WhatsApp', icon: 'chat', color: '#25D366' },
  email: { label: 'Email', icon: 'email', color: '#f59e0b' },
};

export default function MessagingSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<NotificationConfig[]>(DEFAULT_CONFIG);
  const [expandedType, setExpandedType] = useState<NotificationType | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch (error) {
      console.error('[Messaging Settings] Error loading:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newConfig: NotificationConfig[]) => {
    try {
      setIsSaving(true);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
    } catch (error) {
      console.error('[Messaging Settings] Error saving:', error);
      Alert.alert('Błąd', 'Nie udało się zapisać ustawień');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleChannel = (type: NotificationType, channel: Channel) => {
    const newConfig = config.map(item => {
      if (item.type === type) {
        return {
          ...item,
          channels: {
            ...item.channels,
            [channel]: {
              ...item.channels[channel],
              enabled: !item.channels[channel].enabled,
            },
          },
        };
      }
      return item;
    });
    saveSettings(newConfig);
  };

  const getEnabledChannels = (item: NotificationConfig): Channel[] => {
    return (Object.keys(item.channels) as Channel[])
      .filter(ch => item.channels[ch].enabled)
      .sort((a, b) => item.channels[a].priority - item.channels[b].priority);
  };

  const enableAllForType = (type: NotificationType) => {
    const newConfig = config.map(item => {
      if (item.type === type) {
        const newChannels = { ...item.channels };
        (Object.keys(newChannels) as Channel[]).forEach(ch => {
          newChannels[ch] = { ...newChannels[ch], enabled: true };
        });
        return { ...item, channels: newChannels };
      }
      return item;
    });
    saveSettings(newConfig);
  };

  const disableAllForType = (type: NotificationType) => {
    const newConfig = config.map(item => {
      if (item.type === type) {
        const newChannels = { ...item.channels };
        (Object.keys(newChannels) as Channel[]).forEach(ch => {
          newChannels[ch] = { ...newChannels[ch], enabled: false };
        });
        return { ...item, channels: newChannels };
      }
      return item;
    });
    saveSettings(newConfig);
  };

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
        <ThemedText style={styles.headerTitle}>Kanały powiadomień</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={20} color="#3b82f6" />
          <ThemedText style={styles.infoText}>
            Wybierz preferowane kanały dla każdego typu powiadomień. Wiadomości będą wysyłane
            przez wszystkie włączone kanały.
          </ThemedText>
        </View>

        {/* Channel Legend */}
        <View style={styles.legendRow}>
          {(Object.keys(CHANNEL_INFO) as Channel[]).map(channel => (
            <View key={channel} style={styles.legendItem}>
              <MaterialIcons
                name={CHANNEL_INFO[channel].icon}
                size={16}
                color={CHANNEL_INFO[channel].color}
              />
              <ThemedText style={styles.legendLabel}>{CHANNEL_INFO[channel].label}</ThemedText>
            </View>
          ))}
        </View>

        {/* Notification Types */}
        {config.map(item => {
          const enabledChannels = getEnabledChannels(item);
          const isExpanded = expandedType === item.type;

          return (
            <View key={item.type} style={styles.typeCard}>
              <Pressable
                style={styles.typeHeader}
                onPress={() => setExpandedType(isExpanded ? null : item.type)}
              >
                <View style={styles.typeInfo}>
                  <View style={styles.typeIconContainer}>
                    <MaterialIcons name={item.icon} size={24} color={AppColors.primary} />
                  </View>
                  <View style={styles.typeText}>
                    <ThemedText style={styles.typeLabel}>{item.label}</ThemedText>
                    <ThemedText style={styles.typeDescription}>{item.description}</ThemedText>
                  </View>
                </View>
                <View style={styles.typeRight}>
                  {/* Active channels badges */}
                  <View style={styles.channelBadges}>
                    {enabledChannels.slice(0, 3).map(ch => (
                      <View
                        key={ch}
                        style={[styles.channelBadge, { backgroundColor: CHANNEL_INFO[ch].color + '30' }]}
                      >
                        <MaterialIcons
                          name={CHANNEL_INFO[ch].icon}
                          size={14}
                          color={CHANNEL_INFO[ch].color}
                        />
                      </View>
                    ))}
                    {enabledChannels.length > 3 && (
                      <ThemedText style={styles.moreBadge}>+{enabledChannels.length - 3}</ThemedText>
                    )}
                  </View>
                  <MaterialIcons
                    name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={24}
                    color="#64748b"
                  />
                </View>
              </Pressable>

              {isExpanded && (
                <View style={styles.channelList}>
                  {(Object.keys(item.channels) as Channel[]).map(channel => (
                    <View key={channel} style={styles.channelRow}>
                      <View style={styles.channelInfo}>
                        <MaterialIcons
                          name={CHANNEL_INFO[channel].icon}
                          size={20}
                          color={CHANNEL_INFO[channel].color}
                        />
                        <ThemedText style={styles.channelLabel}>
                          {CHANNEL_INFO[channel].label}
                        </ThemedText>
                      </View>
                      <Switch
                        value={item.channels[channel].enabled}
                        onValueChange={() => toggleChannel(item.type, channel)}
                        trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
                        thumbColor={item.channels[channel].enabled ? AppColors.primary : '#64748b'}
                      />
                    </View>
                  ))}

                  <View style={styles.quickActions}>
                    <Pressable
                      style={styles.quickBtn}
                      onPress={() => enableAllForType(item.type)}
                    >
                      <ThemedText style={styles.quickBtnText}>Włącz wszystkie</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[styles.quickBtn, styles.quickBtnDanger]}
                      onPress={() => disableAllForType(item.type)}
                    >
                      <ThemedText style={[styles.quickBtnText, styles.quickBtnTextDanger]}>
                        Wyłącz wszystkie
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Quick Links */}
        <View style={styles.linksSection}>
          <ThemedText style={styles.linksTitle}>Konfiguracja kanałów</ThemedText>
          <Pressable
            style={styles.linkRow}
            onPress={() => router.push('/sms-settings' as any)}
          >
            <MaterialIcons name="sms" size={20} color="#22c55e" />
            <ThemedText style={styles.linkText}>Ustawienia SMS</ThemedText>
            <MaterialIcons name="chevron-right" size={20} color="#64748b" />
          </Pressable>
          <Pressable
            style={styles.linkRow}
            onPress={() => router.push('/whatsapp-settings' as any)}
          >
            <MaterialIcons name="chat" size={20} color="#25D366" />
            <ThemedText style={styles.linkText}>Ustawienia WhatsApp</ThemedText>
            <MaterialIcons name="chevron-right" size={20} color="#64748b" />
          </Pressable>
          <Pressable
            style={styles.linkRow}
            onPress={() => router.push('/notification-preferences' as any)}
          >
            <MaterialIcons name="notifications" size={20} color="#3b82f6" />
            <ThemedText style={styles.linkText}>Ustawienia Push</ThemedText>
            <MaterialIcons name="chevron-right" size={20} color="#64748b" />
          </Pressable>
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
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  typeCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  typeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  typeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  typeText: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  typeDescription: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  typeRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  channelBadges: {
    flexDirection: "row",
    gap: 4,
  },
  channelBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  moreBadge: {
    fontSize: 10,
    color: "#64748b",
    marginLeft: 2,
  },
  channelList: {
    borderTopWidth: 1,
    borderTopColor: "#334155",
    padding: Spacing.md,
  },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  channelInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  channelLabel: {
    fontSize: 14,
    color: "#fff",
  },
  quickActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  quickBtn: {
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: AppColors.primary + "20",
    alignItems: "center",
  },
  quickBtnDanger: {
    backgroundColor: "#ef444420",
  },
  quickBtnText: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: "500",
  },
  quickBtnTextDanger: {
    color: "#ef4444",
  },
  linksSection: {
    marginTop: Spacing.lg,
  },
  linksTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: Spacing.md,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
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
