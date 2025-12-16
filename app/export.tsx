import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

type ExportType = 'players' | 'stats' | 'matches' | 'trainings' | 'finances' | 'attendance';

const EXPORT_OPTIONS: { type: ExportType; title: string; icon: keyof typeof MaterialIcons.glyphMap; description: string }[] = [
  { type: 'players', title: 'Zawodnicy', icon: 'people', description: 'Lista wszystkich zawodników z danymi kontaktowymi' },
  { type: 'stats', title: 'Statystyki', icon: 'bar-chart', description: 'Statystyki zawodników (gole, asysty, kartki)' },
  { type: 'matches', title: 'Mecze', icon: 'sports-soccer', description: 'Historia meczów z wynikami' },
  { type: 'trainings', title: 'Treningi', icon: 'fitness-center', description: 'Lista treningów z lokalizacjami' },
  { type: 'finances', title: 'Finanse', icon: 'account-balance-wallet', description: 'Przychody i wydatki klubu' },
  { type: 'attendance', title: 'Frekwencja', icon: 'check-circle', description: 'Obecność zawodników na treningach' },
];

export default function ExportScreen() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [exporting, setExporting] = useState<ExportType | null>(null);

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  const exportMutation = trpc.exports.toCSV.useMutation({
    onSuccess: (data) => {
      if (Platform.OS === 'web') {
        const blob = new Blob([data.csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.filename}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Sukces', 'Plik został pobrany');
      } else {
        Alert.alert('Sukces', 'Dane zostały wyeksportowane');
      }
      setExporting(null);
    },
    onError: (error) => {
      Alert.alert('Błąd', error.message);
      setExporting(null);
    },
  });

  const handleExport = (type: ExportType) => {
    if (!club?.id) return;
    setExporting(type);
    exportMutation.mutate({ clubId: club.id, type });
  };

  if (!isAuthenticated || !club) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={styles.emptyText}>Zaloguj się i utwórz klub</ThemedText>
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
        <ThemedText style={styles.title}>Eksport danych</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color={AppColors.primary} />
          <ThemedText style={styles.infoText}>
            Eksportuj dane klubowe do plików CSV. Pliki można otworzyć w Excel, Google Sheets lub innych arkuszach kalkulacyjnych.
          </ThemedText>
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Wybierz dane do eksportu</ThemedText>
          
          {EXPORT_OPTIONS.map((option) => (
            <Pressable 
              key={option.type}
              style={[styles.exportOption, exporting === option.type && styles.exportOptionDisabled]} 
              onPress={() => handleExport(option.type)}
              disabled={exporting !== null}
            >
              <View style={styles.exportIcon}>
                <MaterialIcons name={option.icon} size={28} color={AppColors.primary} />
              </View>
              <View style={styles.exportInfo}>
                <ThemedText style={styles.exportTitle}>{option.title}</ThemedText>
                <ThemedText style={styles.exportDesc}>{option.description}</ThemedText>
              </View>
              {exporting === option.type ? (
                <MaterialIcons name="hourglass-empty" size={24} color={AppColors.primary} />
              ) : (
                <MaterialIcons name="file-download" size={24} color="#64748b" />
              )}
            </Pressable>
          ))}
        </View>

        {/* Format Info */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Format pliku</ThemedText>
          <View style={styles.formatCard}>
            <View style={styles.formatRow}>
              <MaterialIcons name="description" size={20} color="#64748b" />
              <ThemedText style={styles.formatText}>Format: CSV (Comma Separated Values)</ThemedText>
            </View>
            <View style={styles.formatRow}>
              <MaterialIcons name="text-fields" size={20} color="#64748b" />
              <ThemedText style={styles.formatText}>Kodowanie: UTF-8 (obsługa polskich znaków)</ThemedText>
            </View>
            <View style={styles.formatRow}>
              <MaterialIcons name="apps" size={20} color="#64748b" />
              <ThemedText style={styles.formatText}>Kompatybilność: Excel, Google Sheets, Numbers</ThemedText>
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
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: AppColors.primary + "15",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 20,
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
  exportOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  exportOptionDisabled: {
    opacity: 0.6,
  },
  exportIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: AppColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  exportInfo: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  exportDesc: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  formatCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  formatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  formatText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
  },
});
