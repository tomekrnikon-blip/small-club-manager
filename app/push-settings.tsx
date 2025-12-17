import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Notifications from "expo-notifications";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

export default function PushSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Notification preferences (stored locally)
  const [trainingReminders, setTrainingReminders] = useState(true);
  const [matchReminders, setMatchReminders] = useState(true);
  const [scheduleChanges, setScheduleChanges] = useState(true);
  const [newMessages, setNewMessages] = useState(true);

  const { data: subscriptions, refetch } = trpc.pushSubscriptions.getMySubscriptions.useQuery();
  const subscribe = trpc.pushSubscriptions.subscribe.useMutation();
  const unsubscribe = trpc.pushSubscriptions.unsubscribe.useMutation();

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (subscriptions) {
      setIsSubscribed(subscriptions.length > 0);
      setLoading(false);
    }
  }, [subscriptions]);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
    
    if (status === 'granted') {
      await enablePushNotifications();
    } else {
      Alert.alert(
        'Powiadomienia wyłączone',
        'Aby otrzymywać powiadomienia, włącz je w ustawieniach urządzenia.',
        [{ text: 'OK' }]
      );
    }
  };

  const enablePushNotifications = async () => {
    try {
      setLoading(true);
      
      // Get push token
      const token = await Notifications.getExpoPushTokenAsync();
      
      // Subscribe on server
      await subscribe.mutateAsync({
        endpoint: token.data,
        p256dh: 'expo-push', // Expo uses its own system
        auth: 'expo-push',
        deviceType: Platform.OS,
      });
      
      await refetch();
      setIsSubscribed(true);
      
      Alert.alert('Sukces', 'Powiadomienia push zostały włączone');
    } catch (error) {
      console.error('Error enabling push:', error);
      Alert.alert('Błąd', 'Nie udało się włączyć powiadomień');
    } finally {
      setLoading(false);
    }
  };

  const disablePushNotifications = async () => {
    try {
      setLoading(true);
      
      if (subscriptions && subscriptions.length > 0) {
        for (const sub of subscriptions) {
          await unsubscribe.mutateAsync({ endpoint: sub.endpoint });
        }
      }
      
      await refetch();
      setIsSubscribed(false);
      
      Alert.alert('Sukces', 'Powiadomienia push zostały wyłączone');
    } catch (error) {
      console.error('Error disabling push:', error);
      Alert.alert('Błąd', 'Nie udało się wyłączyć powiadomień');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePush = async (value: boolean) => {
    if (value) {
      if (permissionStatus !== 'granted') {
        await requestPermissions();
      } else {
        await enablePushNotifications();
      }
    } else {
      await disablePushNotifications();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Powiadomienia push</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <MaterialIcons 
              name={isSubscribed ? "notifications-active" : "notifications-off"} 
              size={32} 
              color={isSubscribed ? "#22c55e" : "#64748b"} 
            />
          </View>
          <View style={styles.statusInfo}>
            <ThemedText style={styles.statusTitle}>
              {isSubscribed ? 'Powiadomienia włączone' : 'Powiadomienia wyłączone'}
            </ThemedText>
            <ThemedText style={styles.statusDesc}>
              {isSubscribed 
                ? 'Otrzymujesz powiadomienia o wydarzeniach w klubie'
                : 'Włącz powiadomienia, aby być na bieżąco'}
            </ThemedText>
          </View>
          {loading ? (
            <ActivityIndicator color={AppColors.primary} />
          ) : (
            <Switch
              value={isSubscribed}
              onValueChange={handleTogglePush}
              trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
              thumbColor={isSubscribed ? AppColors.primary : '#64748b'}
            />
          )}
        </View>

        {/* Permission Status */}
        {permissionStatus && permissionStatus !== 'granted' && (
          <View style={styles.warningCard}>
            <MaterialIcons name="warning" size={20} color="#f59e0b" />
            <ThemedText style={styles.warningText}>
              Powiadomienia są zablokowane w ustawieniach urządzenia
            </ThemedText>
          </View>
        )}

        {/* Notification Types */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Typy powiadomień</ThemedText>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialIcons name="fitness-center" size={20} color="#f59e0b" />
            </View>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Przypomnienia o treningach</ThemedText>
              <ThemedText style={styles.settingDesc}>24h przed treningiem</ThemedText>
            </View>
            <Switch
              value={trainingReminders}
              onValueChange={setTrainingReminders}
              trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
              thumbColor={trainingReminders ? AppColors.primary : '#64748b'}
              disabled={!isSubscribed}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialIcons name="sports-soccer" size={20} color="#a855f7" />
            </View>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Przypomnienia o meczach</ThemedText>
              <ThemedText style={styles.settingDesc}>48h przed meczem</ThemedText>
            </View>
            <Switch
              value={matchReminders}
              onValueChange={setMatchReminders}
              trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
              thumbColor={matchReminders ? AppColors.primary : '#64748b'}
              disabled={!isSubscribed}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialIcons name="event-busy" size={20} color="#ef4444" />
            </View>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Zmiany w harmonogramie</ThemedText>
              <ThemedText style={styles.settingDesc}>Odwołania i przesunięcia</ThemedText>
            </View>
            <Switch
              value={scheduleChanges}
              onValueChange={setScheduleChanges}
              trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
              thumbColor={scheduleChanges ? AppColors.primary : '#64748b'}
              disabled={!isSubscribed}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialIcons name="chat" size={20} color="#22c55e" />
            </View>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Nowe wiadomości</ThemedText>
              <ThemedText style={styles.settingDesc}>Od trenerów i rodziców</ThemedText>
            </View>
            <Switch
              value={newMessages}
              onValueChange={setNewMessages}
              trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
              thumbColor={newMessages ? AppColors.primary : '#64748b'}
              disabled={!isSubscribed}
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={20} color="#64748b" />
          <ThemedText style={styles.infoText}>
            Powiadomienia push są wysyłane na to urządzenie. Jeśli korzystasz z aplikacji na wielu urządzeniach, włącz powiadomienia na każdym z nich osobno.
          </ThemedText>
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
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  statusDesc: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f59e0b20",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#f59e0b",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    color: "#fff",
  },
  settingDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#0f172a",
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
  },
});
