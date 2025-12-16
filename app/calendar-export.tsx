import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function CalendarExportScreen() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [exporting, setExporting] = useState(false);

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  const exportMutation = trpc.calendar.exportICS.useMutation({
    onSuccess: (data) => {
      // Create a blob and download
      if (Platform.OS === 'web') {
        const blob = new Blob([data.icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${club?.name || 'calendar'}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Sukces', 'Kalendarz został wyeksportowany');
      } else {
        Alert.alert('Sukces', 'Kalendarz został wyeksportowany. Możesz go zaimportować do swojej aplikacji kalendarza.');
      }
      setExporting(false);
    },
    onError: (error) => {
      Alert.alert('Błąd', error.message);
      setExporting(false);
    },
  });

  const handleExportICS = () => {
    if (!club?.id) return;
    setExporting(true);
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    
    exportMutation.mutate({
      clubId: club.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  };

  const handleOpenGoogleCalendar = () => {
    Linking.openURL('https://calendar.google.com');
  };

  const handleOpenAppleCalendar = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('calshow://');
    } else {
      Alert.alert('Info', 'Kalendarz Apple jest dostępny tylko na urządzeniach iOS');
    }
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
        <ThemedText style={styles.title}>Eksport kalendarza</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color={AppColors.primary} />
          <ThemedText style={styles.infoText}>
            Eksportuj wydarzenia klubowe do swojego kalendarza. Możesz pobrać plik ICS lub dodać bezpośrednio do Google Calendar.
          </ThemedText>
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Opcje eksportu</ThemedText>
          
          {/* ICS Export */}
          <Pressable 
            style={[styles.exportOption, exporting && styles.exportOptionDisabled]} 
            onPress={handleExportICS}
            disabled={exporting}
          >
            <View style={styles.exportIcon}>
              <MaterialIcons name="file-download" size={28} color={AppColors.primary} />
            </View>
            <View style={styles.exportInfo}>
              <ThemedText style={styles.exportTitle}>Pobierz plik ICS</ThemedText>
              <ThemedText style={styles.exportDesc}>
                Uniwersalny format kalendarza. Importuj do dowolnej aplikacji.
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#64748b" />
          </Pressable>

          {/* Google Calendar */}
          <Pressable style={styles.exportOption} onPress={handleOpenGoogleCalendar}>
            <View style={[styles.exportIcon, { backgroundColor: '#4285f420' }]}>
              <MaterialIcons name="event" size={28} color="#4285f4" />
            </View>
            <View style={styles.exportInfo}>
              <ThemedText style={styles.exportTitle}>Google Calendar</ThemedText>
              <ThemedText style={styles.exportDesc}>
                Otwórz Google Calendar, aby zaimportować plik ICS.
              </ThemedText>
            </View>
            <MaterialIcons name="open-in-new" size={24} color="#64748b" />
          </Pressable>

          {/* Apple Calendar */}
          {Platform.OS === 'ios' && (
            <Pressable style={styles.exportOption} onPress={handleOpenAppleCalendar}>
              <View style={[styles.exportIcon, { backgroundColor: '#ff375f20' }]}>
                <MaterialIcons name="event" size={28} color="#ff375f" />
              </View>
              <View style={styles.exportInfo}>
                <ThemedText style={styles.exportTitle}>Kalendarz Apple</ThemedText>
                <ThemedText style={styles.exportDesc}>
                  Otwórz natywny kalendarz iOS.
                </ThemedText>
              </View>
              <MaterialIcons name="open-in-new" size={24} color="#64748b" />
            </Pressable>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Jak zaimportować?</ThemedText>
          <View style={styles.instructionsCard}>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <ThemedText style={styles.stepNumberText}>1</ThemedText>
              </View>
              <ThemedText style={styles.stepText}>Pobierz plik ICS klikając przycisk powyżej</ThemedText>
            </View>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <ThemedText style={styles.stepNumberText}>2</ThemedText>
              </View>
              <ThemedText style={styles.stepText}>Otwórz aplikację kalendarza (Google, Apple, Outlook)</ThemedText>
            </View>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <ThemedText style={styles.stepNumberText}>3</ThemedText>
              </View>
              <ThemedText style={styles.stepText}>Znajdź opcję "Importuj" i wybierz pobrany plik</ThemedText>
            </View>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <ThemedText style={styles.stepNumberText}>4</ThemedText>
              </View>
              <ThemedText style={styles.stepText}>Wszystkie mecze i treningi pojawią się w kalendarzu!</ThemedText>
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
  instructionsCard: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  instructionStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#e2e8f0",
    lineHeight: 20,
    paddingTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
  },
});
