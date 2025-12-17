import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColors, Spacing, Radius } from '@/constants/theme';

type AlertType = 'new_registration' | 'trial_expiring' | 'trial_expired' | 'subscription' | 'system';

type AdminAlert = {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  clubName?: string;
  managerEmail?: string;
};

type AlertSettings = {
  newRegistrations: boolean;
  trialExpiring7Days: boolean;
  trialExpiring3Days: boolean;
  trialExpiring1Day: boolean;
  trialExpired: boolean;
  newSubscriptions: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
};

export default function AdminAlertsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [settings, setSettings] = useState<AlertSettings>({
    newRegistrations: true,
    trialExpiring7Days: true,
    trialExpiring3Days: true,
    trialExpiring1Day: true,
    trialExpired: true,
    newSubscriptions: true,
    systemAlerts: true,
    emailNotifications: true,
    pushNotifications: true,
  });

  // Mock alerts - replace with actual API call
  const [alerts, setAlerts] = useState<AdminAlert[]>([
    {
      id: '1',
      type: 'new_registration',
      title: 'Nowa rejestracja',
      message: 'Klub "KS Orzeł Warszawa" został zarejestrowany',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false,
      clubName: 'KS Orzeł Warszawa',
      managerEmail: 'jan@orzel.pl',
    },
    {
      id: '2',
      type: 'trial_expiring',
      title: 'Trial wygasa za 3 dni',
      message: 'Klub "LKS Sokół Kraków" - trial kończy się 20.12.2024',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: false,
      clubName: 'LKS Sokół Kraków',
      managerEmail: 'anna@sokol.pl',
    },
    {
      id: '3',
      type: 'subscription',
      title: 'Nowa subskrypcja',
      message: 'Klub "GKS Piast Gliwice" wykupił plan Premium',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      read: true,
      clubName: 'GKS Piast Gliwice',
      managerEmail: 'piotr@piast.pl',
    },
    {
      id: '4',
      type: 'trial_expired',
      title: 'Trial wygasł',
      message: 'Klub "MKS Huragan Poznań" - trial wygasł wczoraj',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
      read: true,
      clubName: 'MKS Huragan Poznań',
      managerEmail: 'tomek@huragan.pl',
    },
  ]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'new_registration': return 'person-add';
      case 'trial_expiring': return 'timer';
      case 'trial_expired': return 'timer-off';
      case 'subscription': return 'star';
      case 'system': return 'info';
      default: return 'notifications';
    }
  };

  const getAlertColor = (type: AlertType) => {
    switch (type) {
      case 'new_registration': return AppColors.primary;
      case 'trial_expiring': return '#f59e0b';
      case 'trial_expired': return AppColors.danger;
      case 'subscription': return AppColors.secondary;
      case 'system': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} min temu`;
    if (hours < 24) return `${hours} godz. temu`;
    return `${days} dni temu`;
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  const toggleSetting = (key: keyof AlertSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText type="title" style={styles.title}>Alerty Admina</ThemedText>
        <Pressable onPress={() => setShowSettings(!showSettings)} style={styles.settingsButton}>
          <MaterialIcons name={showSettings ? 'close' : 'settings'} size={24} color="#fff" />
        </Pressable>
      </View>

      {showSettings ? (
        <ScrollView style={styles.settingsContent}>
          <View style={styles.settingsSection}>
            <ThemedText style={styles.settingsSectionTitle}>Typy alertów</ThemedText>
            
            <SettingRow
              label="Nowe rejestracje"
              value={settings.newRegistrations}
              onToggle={() => toggleSetting('newRegistrations')}
            />
            <SettingRow
              label="Trial wygasa za 7 dni"
              value={settings.trialExpiring7Days}
              onToggle={() => toggleSetting('trialExpiring7Days')}
            />
            <SettingRow
              label="Trial wygasa za 3 dni"
              value={settings.trialExpiring3Days}
              onToggle={() => toggleSetting('trialExpiring3Days')}
            />
            <SettingRow
              label="Trial wygasa za 1 dzień"
              value={settings.trialExpiring1Day}
              onToggle={() => toggleSetting('trialExpiring1Day')}
            />
            <SettingRow
              label="Trial wygasł"
              value={settings.trialExpired}
              onToggle={() => toggleSetting('trialExpired')}
            />
            <SettingRow
              label="Nowe subskrypcje"
              value={settings.newSubscriptions}
              onToggle={() => toggleSetting('newSubscriptions')}
            />
            <SettingRow
              label="Alerty systemowe"
              value={settings.systemAlerts}
              onToggle={() => toggleSetting('systemAlerts')}
            />
          </View>

          <View style={styles.settingsSection}>
            <ThemedText style={styles.settingsSectionTitle}>Kanały powiadomień</ThemedText>
            
            <SettingRow
              label="Powiadomienia email"
              value={settings.emailNotifications}
              onToggle={() => toggleSetting('emailNotifications')}
            />
            <SettingRow
              label="Powiadomienia push"
              value={settings.pushNotifications}
              onToggle={() => toggleSetting('pushNotifications')}
            />
          </View>
        </ScrollView>
      ) : (
        <>
          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{unreadCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Nieprzeczytane</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{alerts.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Wszystkie</ThemedText>
            </View>
            {unreadCount > 0 && (
              <Pressable style={styles.markAllButton} onPress={markAllAsRead}>
                <ThemedText style={styles.markAllText}>Oznacz wszystkie</ThemedText>
              </Pressable>
            )}
          </View>

          {/* Alerts List */}
          <ScrollView
            style={styles.alertsList}
            contentContainerStyle={styles.alertsContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {alerts.map((alert) => (
              <Pressable
                key={alert.id}
                style={[styles.alertCard, !alert.read && styles.alertCardUnread]}
                onPress={() => markAsRead(alert.id)}
              >
                <View style={[styles.alertIcon, { backgroundColor: getAlertColor(alert.type) + '20' }]}>
                  <MaterialIcons
                    name={getAlertIcon(alert.type) as any}
                    size={24}
                    color={getAlertColor(alert.type)}
                  />
                </View>
                <View style={styles.alertContent}>
                  <View style={styles.alertHeader}>
                    <ThemedText style={styles.alertTitle}>{alert.title}</ThemedText>
                    {!alert.read && <View style={styles.unreadDot} />}
                  </View>
                  <ThemedText style={styles.alertMessage}>{alert.message}</ThemedText>
                  {alert.managerEmail && (
                    <ThemedText style={styles.alertEmail}>{alert.managerEmail}</ThemedText>
                  )}
                  <ThemedText style={styles.alertTime}>{formatTimestamp(alert.timestamp)}</ThemedText>
                </View>
              </Pressable>
            ))}

            {alerts.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialIcons name="notifications-none" size={48} color="#475569" />
                <ThemedText style={styles.emptyText}>Brak alertów</ThemedText>
              </View>
            )}
          </ScrollView>
        </>
      )}
    </ThemedView>
  );
}

function SettingRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <View style={styles.settingRow}>
      <ThemedText style={styles.settingLabel}>{label}</ThemedText>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#334155', true: AppColors.primary + '80' }}
        thumbColor={value ? AppColors.primary : '#64748b'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 24,
    lineHeight: 32,
    marginLeft: 8,
  },
  settingsButton: {
    padding: 8,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: AppColors.bgCard,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  statItem: {
    marginRight: 24,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  markAllButton: {
    marginLeft: 'auto',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: AppColors.primary + '20',
    borderRadius: Radius.sm,
  },
  markAllText: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: '500',
  },
  alertsList: {
    flex: 1,
  },
  alertsContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  alertCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
  },
  alertMessage: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  alertEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  alertTime: {
    fontSize: 11,
    color: '#475569',
    marginTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
  settingsContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  settingsSection: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingLabel: {
    fontSize: 14,
    color: '#fff',
  },
});
