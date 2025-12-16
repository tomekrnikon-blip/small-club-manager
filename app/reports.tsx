import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { trpc } from '@/lib/trpc';

const REPORT_TYPES = [
  {
    id: 'player_stats',
    icon: 'person',
    title: 'Statystyki zawodników',
    description: 'Indywidualne statystyki wszystkich graczy',
    color: '#22c55e',
    endpoint: 'generatePlayerStats',
  },
  {
    id: 'attendance',
    icon: 'calendar',
    title: 'Raport frekwencji',
    description: 'Obecność na treningach i meczach',
    color: '#f59e0b',
    endpoint: 'generateAttendance',
  },
  {
    id: 'finances',
    icon: 'cash',
    title: 'Raport finansowy',
    description: 'Przychody, wydatki i bilans klubu',
    color: '#8b5cf6',
    endpoint: 'generateFinancial',
  },
];

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Get first club
  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const generatePlayerStats = trpc.reports.generatePlayerStats.useMutation();
  const generateAttendance = trpc.reports.generateAttendance.useMutation();
  const generateFinancial = trpc.reports.generateFinancial.useMutation();

  const handleGenerateReport = async (reportType: typeof REPORT_TYPES[0]) => {
    if (!club) {
      Alert.alert('Błąd', 'Nie znaleziono klubu');
      return;
    }

    setGeneratingReport(reportType.id);

    try {
      let result: { html: string; title: string };

      switch (reportType.endpoint) {
        case 'generatePlayerStats':
          result = await generatePlayerStats.mutateAsync({ clubId: club.id });
          break;
        case 'generateAttendance':
          result = await generateAttendance.mutateAsync({ clubId: club.id });
          break;
        case 'generateFinancial':
          result = await generateFinancial.mutateAsync({ clubId: club.id });
          break;
        default:
          throw new Error('Nieznany typ raportu');
      }

      setPreviewTitle(result.title);
      setPreviewHtml(result.html);
    } catch (error: any) {
      Alert.alert('Błąd', error.message || 'Nie udało się wygenerować raportu');
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleShareReport = async () => {
    if (!previewHtml) {
      return;
    }

    if (Platform.OS === 'web') {
      // On web, open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(previewHtml);
        printWindow.document.close();
        printWindow.print();
      }
    } else {
      // On mobile, show info that sharing requires native build
      Alert.alert(
        'Raport gotowy',
        'Raport został wygenerowany. W pełnej wersji aplikacji będzie można go udostępnić lub wydrukować.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>Raporty PDF</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3b82f6" />
          <View style={styles.infoContent}>
            <ThemedText style={styles.infoTitle}>Generowanie raportów</ThemedText>
            <ThemedText style={styles.infoText}>
              Wybierz typ raportu, aby wygenerować dokument HTML z danymi klubu.
              Raport można udostępnić lub wydrukować.
            </ThemedText>
          </View>
        </View>

        {/* Report Types */}
        <View style={styles.reportsList}>
          {REPORT_TYPES.map((report) => (
            <Pressable
              key={report.id}
              style={styles.reportCard}
              onPress={() => handleGenerateReport(report)}
              disabled={!!generatingReport}
            >
              <View style={[styles.reportIcon, { backgroundColor: report.color + '20' }]}>
                <Ionicons name={report.icon as any} size={28} color={report.color} />
              </View>
              <View style={styles.reportInfo}>
                <ThemedText style={styles.reportTitle}>{report.title}</ThemedText>
                <ThemedText style={styles.reportDescription}>{report.description}</ThemedText>
              </View>
              {generatingReport === report.id ? (
                <ActivityIndicator size="small" color="#22c55e" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              )}
            </Pressable>
          ))}
        </View>

        {/* Recent Reports Placeholder */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Ostatnie raporty</ThemedText>
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#64748b" />
            <ThemedText style={styles.emptyText}>Brak wygenerowanych raportów</ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Preview Modal */}
      <Modal
        visible={!!previewHtml}
        animationType="slide"
        onRequestClose={() => setPreviewHtml(null)}
      >
        <ThemedView style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setPreviewHtml(null)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
            <ThemedText style={styles.modalTitle}>{previewTitle}</ThemedText>
            <Pressable onPress={handleShareReport} style={styles.modalShare}>
              <Ionicons name="share-outline" size={24} color="#22c55e" />
            </Pressable>
          </View>
          
          {Platform.OS === 'web' ? (
            <View style={styles.webPreview}>
              <iframe
                srcDoc={previewHtml || ''}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </View>
          ) : (
            <ScrollView style={styles.previewContent}>
              <View style={styles.previewPlaceholder}>
                <Ionicons name="document-text" size={64} color="#22c55e" />
                <ThemedText style={styles.previewText}>
                  Raport został wygenerowany.
                </ThemedText>
                <ThemedText style={styles.previewSubtext}>
                  Użyj przycisku udostępniania, aby zapisać lub wydrukować raport.
                </ThemedText>
                <Pressable style={styles.shareButton} onPress={handleShareReport}>
                  <Ionicons name="share-outline" size={20} color="#fff" />
                  <ThemedText style={styles.shareButtonText}>Udostępnij raport</ThemedText>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </ThemedView>
      </Modal>
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
  },
  reportsList: {
    gap: 12,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    gap: 16,
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
  },
  reportTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#fff',
  },
  reportDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    marginTop: 2,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalClose: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: '#fff',
  },
  modalShare: {
    padding: 8,
  },
  webPreview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  previewContent: {
    flex: 1,
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 400,
  },
  previewText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  previewSubtext: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
  },
});
