import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { trpc } from '@/lib/trpc';

const REPORT_TYPES = [
  {
    id: 'team_stats',
    icon: 'stats-chart',
    title: 'Statystyki drużyny',
    description: 'Podsumowanie wyników, goli, asyst i frekwencji',
    color: '#3b82f6',
  },
  {
    id: 'player_stats',
    icon: 'person',
    title: 'Statystyki zawodników',
    description: 'Indywidualne statystyki wszystkich graczy',
    color: '#22c55e',
  },
  {
    id: 'attendance',
    icon: 'calendar',
    title: 'Raport frekwencji',
    description: 'Obecność na treningach i meczach',
    color: '#f59e0b',
  },
  {
    id: 'finances',
    icon: 'cash',
    title: 'Raport finansowy',
    description: 'Przychody, wydatki i bilans klubu',
    color: '#8b5cf6',
  },
  {
    id: 'academy',
    icon: 'school',
    title: 'Raport szkółki',
    description: 'Statystyki młodzieży i płatności',
    color: '#ec4899',
  },
  {
    id: 'injuries',
    icon: 'medkit',
    title: 'Raport kontuzji',
    description: 'Historia kontuzji i czas powrotu',
    color: '#ef4444',
  },
];

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  // Get first club
  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const handleGenerateReport = (reportType: string) => {
    setGeneratingReport(reportType);
    
    // Simulate report generation
    setTimeout(() => {
      setGeneratingReport(null);
      Alert.alert(
        'Raport wygenerowany',
        'Raport PDF został przygotowany. Funkcja pobierania zostanie dodana w przyszłej aktualizacji.',
        [{ text: 'OK' }]
      );
    }, 2000);
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Raporty PDF</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Club Info */}
      {club && (
        <View style={styles.clubInfo}>
          <Ionicons name="business" size={20} color="#22c55e" />
          <ThemedText style={styles.clubName}>{club.name}</ThemedText>
        </View>
      )}

      {/* Report Types */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.sectionTitle}>Dostępne raporty</ThemedText>
        
        {REPORT_TYPES.map((report) => (
          <Pressable
            key={report.id}
            style={styles.reportCard}
            onPress={() => handleGenerateReport(report.id)}
            disabled={generatingReport !== null}
          >
            <View style={[styles.reportIcon, { backgroundColor: `${report.color}20` }]}>
              <Ionicons name={report.icon as any} size={28} color={report.color} />
            </View>
            <View style={styles.reportInfo}>
              <ThemedText type="defaultSemiBold" style={styles.reportTitle}>
                {report.title}
              </ThemedText>
              <ThemedText style={styles.reportDescription}>
                {report.description}
              </ThemedText>
            </View>
            {generatingReport === report.id ? (
              <ActivityIndicator color="#22c55e" />
            ) : (
              <View style={styles.downloadButton}>
                <Ionicons name="download" size={20} color="#22c55e" />
              </View>
            )}
          </Pressable>
        ))}

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={20} color="#64748b" />
          <ThemedText style={styles.infoText}>
            Raporty są generowane w formacie PDF i mogą być udostępniane lub drukowane.
          </ThemedText>
        </View>

        {/* Recent Reports */}
        <View style={styles.recentSection}>
          <ThemedText style={styles.sectionTitle}>Ostatnie raporty</ThemedText>
          <View style={styles.emptyRecent}>
            <Ionicons name="document-outline" size={48} color="#64748b" />
            <ThemedText style={styles.emptyText}>Brak wygenerowanych raportów</ThemedText>
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
    backgroundColor: '#0f172a',
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
  headerTitle: {
    fontSize: 20,
    color: '#fff',
  },
  clubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  clubName: {
    fontSize: 14,
    color: '#94a3b8',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reportIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reportTitle: {
    fontSize: 16,
    color: '#fff',
  },
  reportDescription: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  recentSection: {
    marginTop: 32,
  },
  emptyRecent: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
});
