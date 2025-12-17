import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
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
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

type ReportType = 'frequency' | 'players' | 'finances' | 'attendance';
type ExportFormat = 'pdf' | 'html' | 'csv' | 'excel';

interface ReportOption {
  type: ReportType;
  title: string;
  description: string;
  icon: string;
  formats: ExportFormat[];
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    type: 'frequency',
    title: 'Raport frekwencji',
    description: 'Szczegółowa analiza obecności na treningach i meczach',
    icon: 'bar-chart',
    formats: ['pdf', 'html', 'csv', 'excel'],
  },
  {
    type: 'players',
    title: 'Statystyki zawodników',
    description: 'Gole, asysty, kartki i inne statystyki',
    icon: 'people',
    formats: ['pdf', 'html', 'csv'],
  },
  {
    type: 'finances',
    title: 'Raport finansowy',
    description: 'Przychody, wydatki i bilans',
    icon: 'attach-money',
    formats: ['pdf', 'html', 'csv', 'excel'],
  },
  {
    type: 'attendance',
    title: 'Lista obecności',
    description: 'Obecności na poszczególnych treningach',
    icon: 'how-to-reg',
    formats: ['pdf', 'html'],
  },
];

export default function PDFExportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedReport, setSelectedReport] = useState<ReportType>('frequency');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [includeMatches, setIncludeMatches] = useState(true);
  const [includeTrainings, setIncludeTrainings] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  // Get club
  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  // Get teams
  const { data: teams } = trpc.teams.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const currentReportOption = REPORT_OPTIONS.find(r => r.type === selectedReport);

  const handleGenerateReport = async () => {
    if (!club) {
      Alert.alert('Błąd', 'Nie znaleziono klubu');
      return;
    }

    setGenerating(true);

    try {
      // Generate report HTML (in real app, this would call the API)
      const reportHTML = generateMockReportHTML(selectedReport, club.name);

      if (Platform.OS === 'web') {
        // On web, open in new window or download
        const blob = new Blob([reportHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        if (selectedFormat === 'html') {
          window.open(url, '_blank');
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.download = `raport_${selectedReport}_${Date.now()}.${selectedFormat === 'pdf' ? 'html' : selectedFormat}`;
          a.click();
        }
        
        Alert.alert('Sukces', 'Raport został wygenerowany');
      } else {
        // On mobile, save to file and share
        const fileName = `raport_${selectedReport}_${Date.now()}.html`;
        const filePath = `${FileSystem.documentDirectory}${fileName}`;
        
        await FileSystem.writeAsStringAsync(filePath, reportHTML);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath, {
            mimeType: 'text/html',
            dialogTitle: 'Eksportuj raport',
          });
        } else {
          Alert.alert('Sukces', `Raport zapisany: ${fileName}`);
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Błąd', 'Nie udało się wygenerować raportu');
    } finally {
      setGenerating(false);
    }
  };

  const generateMockReportHTML = (type: ReportType, clubName: string): string => {
    const date = new Date().toLocaleDateString('pl-PL');
    const titles: Record<ReportType, string> = {
      frequency: 'Raport Frekwencji',
      players: 'Statystyki Zawodników',
      finances: 'Raport Finansowy',
      attendance: 'Lista Obecności',
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${titles[type]} - ${clubName}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
    h1 { color: #22c55e; margin-bottom: 5px; }
    h2 { color: #64748b; font-weight: normal; margin-top: 0; }
    .header { border-bottom: 3px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; }
    .meta { color: #64748b; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #22c55e; color: white; padding: 12px; text-align: left; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .summary { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; display: flex; gap: 40px; }
    .summary-item { }
    .summary-label { color: #64748b; font-size: 14px; }
    .summary-value { font-size: 24px; font-weight: bold; color: #22c55e; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${titles[type]}</h1>
    <h2>Sezon ${new Date().getFullYear()}</h2>
    <div class="meta">
      <strong>${clubName}</strong> | Wygenerowano: ${date}
    </div>
  </div>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Zawodników</div>
      <div class="summary-value">24</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Treningów</div>
      <div class="summary-value">48</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Meczów</div>
      <div class="summary-value">16</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Średnia frekwencja</div>
      <div class="summary-value">78.5%</div>
    </div>
  </div>

  <h3>Szczegółowe dane</h3>
  <table>
    <tr>
      <th>Zawodnik</th>
      <th>Drużyna</th>
      <th>Treningi</th>
      <th>Mecze</th>
      <th>Ogółem</th>
    </tr>
    <tr><td>Jan Kowalski</td><td>Senior</td><td>42/48 (87.5%)</td><td>14/16 (87.5%)</td><td>87.5%</td></tr>
    <tr><td>Adam Nowak</td><td>Senior</td><td>40/48 (83.3%)</td><td>15/16 (93.8%)</td><td>85.9%</td></tr>
    <tr><td>Piotr Wiśniewski</td><td>Junior</td><td>38/48 (79.2%)</td><td>12/16 (75.0%)</td><td>78.1%</td></tr>
    <tr><td>Michał Wójcik</td><td>Junior</td><td>35/48 (72.9%)</td><td>13/16 (81.3%)</td><td>75.0%</td></tr>
    <tr><td>Tomasz Kamiński</td><td>Senior</td><td>44/48 (91.7%)</td><td>16/16 (100%)</td><td>93.8%</td></tr>
  </table>

  <div class="footer">
    Raport wygenerowany przez Small Club Manager | ${new Date().getFullYear()}
    <br>
    <button class="no-print" onclick="window.print()">Drukuj / Zapisz jako PDF</button>
  </div>
</body>
</html>`;
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Eksport PDF</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Report Type Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Wybierz typ raportu</ThemedText>
          {REPORT_OPTIONS.map(option => (
            <Pressable
              key={option.type}
              style={[
                styles.reportOption,
                selectedReport === option.type && styles.reportOptionSelected,
              ]}
              onPress={() => {
                setSelectedReport(option.type);
                if (!option.formats.includes(selectedFormat)) {
                  setSelectedFormat(option.formats[0]);
                }
              }}
            >
              <View style={[
                styles.reportIcon,
                selectedReport === option.type && styles.reportIconSelected,
              ]}>
                <MaterialIcons 
                  name={option.icon as any} 
                  size={24} 
                  color={selectedReport === option.type ? '#fff' : '#64748b'} 
                />
              </View>
              <View style={styles.reportInfo}>
                <ThemedText style={styles.reportTitle}>{option.title}</ThemedText>
                <ThemedText style={styles.reportDesc}>{option.description}</ThemedText>
              </View>
              {selectedReport === option.type && (
                <MaterialIcons name="check-circle" size={24} color={AppColors.primary} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Format Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Format eksportu</ThemedText>
          <View style={styles.formatGrid}>
            {currentReportOption?.formats.map(format => (
              <Pressable
                key={format}
                style={[
                  styles.formatBtn,
                  selectedFormat === format && styles.formatBtnSelected,
                ]}
                onPress={() => setSelectedFormat(format)}
              >
                <MaterialIcons 
                  name={getFormatIcon(format)} 
                  size={20} 
                  color={selectedFormat === format ? '#fff' : '#94a3b8'} 
                />
                <ThemedText style={[
                  styles.formatText,
                  selectedFormat === format && styles.formatTextSelected,
                ]}>
                  {format.toUpperCase()}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Options for frequency report */}
        {selectedReport === 'frequency' && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Opcje raportu</ThemedText>
            
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <MaterialIcons name="fitness-center" size={20} color="#f59e0b" />
                <ThemedText style={styles.optionLabel}>Uwzględnij treningi</ThemedText>
              </View>
              <Switch
                value={includeTrainings}
                onValueChange={setIncludeTrainings}
                trackColor={{ false: '#3e3e3e', true: AppColors.primary + '50' }}
                thumbColor={includeTrainings ? AppColors.primary : '#f4f3f4'}
              />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <MaterialIcons name="sports-soccer" size={20} color="#a855f7" />
                <ThemedText style={styles.optionLabel}>Uwzględnij mecze</ThemedText>
              </View>
              <Switch
                value={includeMatches}
                onValueChange={setIncludeMatches}
                trackColor={{ false: '#3e3e3e', true: AppColors.primary + '50' }}
                thumbColor={includeMatches ? AppColors.primary : '#f4f3f4'}
              />
            </View>

            {/* Team filter */}
            <View style={styles.teamFilter}>
              <ThemedText style={styles.optionLabel}>Filtruj po drużynie:</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamScroll}>
                <Pressable
                  style={[
                    styles.teamChip,
                    selectedTeamId === null && styles.teamChipSelected,
                  ]}
                  onPress={() => setSelectedTeamId(null)}
                >
                  <ThemedText style={[
                    styles.teamChipText,
                    selectedTeamId === null && styles.teamChipTextSelected,
                  ]}>
                    Wszystkie
                  </ThemedText>
                </Pressable>
                {teams?.map((team: any) => (
                  <Pressable
                    key={team.id}
                    style={[
                      styles.teamChip,
                      selectedTeamId === team.id && styles.teamChipSelected,
                    ]}
                    onPress={() => setSelectedTeamId(team.id)}
                  >
                    <ThemedText style={[
                      styles.teamChipText,
                      selectedTeamId === team.id && styles.teamChipTextSelected,
                    ]}>
                      {team.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Generate Button */}
        <Pressable
          style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
          onPress={handleGenerateReport}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="file-download" size={24} color="#fff" />
              <ThemedText style={styles.generateBtnText}>
                Generuj raport
              </ThemedText>
            </>
          )}
        </Pressable>

        {/* Info */}
        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={20} color="#3b82f6" />
          <ThemedText style={styles.infoText}>
            Raporty PDF można otworzyć w przeglądarce i wydrukować lub zapisać 
            jako plik PDF używając opcji "Drukuj → Zapisz jako PDF".
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function getFormatIcon(format: ExportFormat): any {
  switch (format) {
    case 'pdf': return 'picture-as-pdf';
    case 'html': return 'code';
    case 'csv': return 'table-chart';
    case 'excel': return 'grid-on';
    default: return 'file-download';
  }
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  reportOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  reportOptionSelected: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + '10',
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  reportIconSelected: {
    backgroundColor: AppColors.primary,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  reportDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  formatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  formatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  formatBtnSelected: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary,
  },
  formatText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
  },
  formatTextSelected: {
    color: "#fff",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  optionLabel: {
    fontSize: 14,
    color: "#e2e8f0",
  },
  teamFilter: {
    marginTop: Spacing.sm,
  },
  teamScroll: {
    marginTop: Spacing.sm,
  },
  teamChip: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
  },
  teamChipSelected: {
    backgroundColor: AppColors.primary,
  },
  teamChipText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  teamChipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  generateBtnDisabled: {
    backgroundColor: "#334155",
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  infoBox: {
    flexDirection: "row",
    gap: Spacing.sm,
    backgroundColor: "#1e3a5f",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 18,
  },
});
