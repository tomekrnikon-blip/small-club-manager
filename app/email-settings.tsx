import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";

export default function EmailSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Email preferences (would be stored in user settings)
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [trainingReminders, setTrainingReminders] = useState(true);
  const [matchReminders, setMatchReminders] = useState(true);
  const [scheduleChanges, setScheduleChanges] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [clubAnnouncements, setClubAnnouncements] = useState(true);

  const handleSave = () => {
    // In production, save to user settings via API
    Alert.alert('Sukces', 'Ustawienia email zostały zapisane');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Powiadomienia email</ThemedText>
        <Pressable onPress={handleSave} style={styles.saveBtn}>
          <ThemedText style={styles.saveBtnText}>Zapisz</ThemedText>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="email" size={24} color={AppColors.primary} />
          <View style={styles.infoContent}>
            <ThemedText style={styles.infoTitle}>Powiadomienia email</ThemedText>
            <ThemedText style={styles.infoDesc}>
              Wybierz jakie powiadomienia chcesz otrzymywać na swój adres email.
            </ThemedText>
          </View>
        </View>

        {/* Weekly Summary */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Podsumowania</ThemedText>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialIcons name="summarize" size={20} color="#22c55e" />
            </View>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Podsumowanie tygodniowe</ThemedText>
              <ThemedText style={styles.settingDesc}>
                Wysyłane w każdy poniedziałek rano
              </ThemedText>
            </View>
            <Switch
              value={weeklySummary}
              onValueChange={setWeeklySummary}
              trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
              thumbColor={weeklySummary ? AppColors.primary : '#64748b'}
            />
          </View>
        </View>

        {/* Reminders */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Przypomnienia</ThemedText>
          
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
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialIcons name="payments" size={20} color="#ef4444" />
            </View>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Przypomnienia o płatnościach</ThemedText>
              <ThemedText style={styles.settingDesc}>Gdy zbliża się termin płatności</ThemedText>
            </View>
            <Switch
              value={paymentReminders}
              onValueChange={setPaymentReminders}
              trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
              thumbColor={paymentReminders ? AppColors.primary : '#64748b'}
            />
          </View>
        </View>

        {/* Updates */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Aktualizacje</ThemedText>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialIcons name="event-busy" size={20} color="#ef4444" />
            </View>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Zmiany w harmonogramie</ThemedText>
              <ThemedText style={styles.settingDesc}>Odwołania i przesunięcia terminów</ThemedText>
            </View>
            <Switch
              value={scheduleChanges}
              onValueChange={setScheduleChanges}
              trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
              thumbColor={scheduleChanges ? AppColors.primary : '#64748b'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialIcons name="campaign" size={20} color="#3b82f6" />
            </View>
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Ogłoszenia klubowe</ThemedText>
              <ThemedText style={styles.settingDesc}>Ważne informacje od klubu</ThemedText>
            </View>
            <Switch
              value={clubAnnouncements}
              onValueChange={setClubAnnouncements}
              trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
              thumbColor={clubAnnouncements ? AppColors.primary : '#64748b'}
            />
          </View>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Podgląd</ThemedText>
          
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <MaterialIcons name="email" size={20} color="#22c55e" />
              <ThemedText style={styles.previewTitle}>Przykładowe podsumowanie</ThemedText>
            </View>
            <View style={styles.previewContent}>
              <ThemedText style={styles.previewSubject}>
                📊 Podsumowanie tygodnia - Jan Kowalski | Akademia Piłkarska
              </ThemedText>
              <ThemedText style={styles.previewBody}>
                Cześć! Oto podsumowanie tygodnia dla Jana...{'\n\n'}
                • Frekwencja: 85%{'\n'}
                • Nadchodzące treningi: 2{'\n'}
                • Nadchodzące mecze: 1
              </ThemedText>
            </View>
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
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary + "15",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  infoDesc: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
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
  previewCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  previewContent: {
    padding: Spacing.md,
  },
  previewSubject: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e2e8f0",
    marginBottom: Spacing.sm,
  },
  previewBody: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 18,
  },
});
