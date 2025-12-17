import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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

type ExportFormat = 'html' | 'csv';

export default function StatisticsExportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('html');
  const [isExporting, setIsExporting] = useState(false);

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const { data: teams } = trpc.teams.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: matches } = trpc.matches.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: players } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const generateReport = async () => {
    if (!club || !matches || !players) {
      Alert.alert('Błąd', 'Brak danych do wygenerowania raportu');
      return;
    }

    setIsExporting(true);

    try {
      // Filter matches by team if selected
      const filteredMatches = selectedTeamId 
        ? matches.filter((m: any) => m.teamId === selectedTeamId)
        : matches;

      // Calculate statistics
      const wins = filteredMatches.filter((m: any) => m.result === 'win').length;
      const draws = filteredMatches.filter((m: any) => m.result === 'draw').length;
      const losses = filteredMatches.filter((m: any) => m.result === 'loss').length;
      const totalMatches = wins + draws + losses;

      const goalsScored = filteredMatches.reduce((sum: number, m: any) => sum + (m.goalsScored || 0), 0);
      const goalsConceded = filteredMatches.reduce((sum: number, m: any) => sum + (m.goalsConceded || 0), 0);

      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      // Recent results
      const recentResults = filteredMatches
        .filter((m: any) => m.result)
        .sort((a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
        .slice(0, 10);

      const selectedTeam = selectedTeamId ? teams?.find((t: any) => t.id === selectedTeamId) : null;
      const reportTitle = selectedTeam ? `Statystyki: ${selectedTeam.name}` : 'Statystyki klubu';

      let content: string;
      let filename: string;
      let mimeType: string;

      if (exportFormat === 'html') {
        content = generateHtmlContent(
          reportTitle,
          club.name,
          { totalMatches, wins, draws, losses, goalsScored, goalsConceded, winRate },
          recentResults,
          players
        );
        filename = `statystyki_${Date.now()}.html`;
        mimeType = 'text/html';
      } else {
        content = generateCsvContent(
          reportTitle,
          club.name,
          { totalMatches, wins, draws, losses, goalsScored, goalsConceded, winRate },
          recentResults
        );
        filename = `statystyki_${Date.now()}.csv`;
        mimeType = 'text/csv';
      }

      // Save file
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: 'Eksportuj statystyki',
        });
      } else {
        Alert.alert('Sukces', `Raport zapisany: ${filename}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Błąd', 'Nie udało się wygenerować raportu');
    } finally {
      setIsExporting(false);
    }
  };

  const generateHtmlContent = (
    title: string,
    clubName: string,
    stats: any,
    results: any[],
    players: any[]
  ): string => {
    return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; padding: 30px; text-align: center; }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .meta { display: flex; justify-content: space-between; padding: 15px 30px; background: #f1f5f9; font-size: 12px; color: #64748b; }
    .content { padding: 30px; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 18px; color: #22c55e; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: #f8fafc; border-radius: 8px; padding: 15px; text-align: center; }
    .stat-card .value { font-size: 28px; font-weight: bold; color: #22c55e; }
    .stat-card .label { font-size: 12px; color: #64748b; margin-top: 5px; }
    .stat-card.win .value { color: #22c55e; }
    .stat-card.draw .value { color: #f59e0b; }
    .stat-card.loss .value { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b; }
    tr:hover { background: #f8fafc; }
    .result-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .result-win { background: #dcfce7; color: #16a34a; }
    .result-draw { background: #fef3c7; color: #d97706; }
    .result-loss { background: #fee2e2; color: #dc2626; }
    .footer { text-align: center; padding: 20px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
      <p>Sezon ${new Date().getFullYear()}</p>
    </div>
    <div class="meta">
      <span>Klub: ${clubName}</span>
      <span>Wygenerowano: ${new Date().toLocaleString('pl-PL')}</span>
    </div>
    <div class="content">
      <div class="section">
        <h2>Podsumowanie wyników</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="value">${stats.totalMatches}</div>
            <div class="label">Mecze</div>
          </div>
          <div class="stat-card win">
            <div class="value">${stats.wins}</div>
            <div class="label">Wygrane</div>
          </div>
          <div class="stat-card draw">
            <div class="value">${stats.draws}</div>
            <div class="label">Remisy</div>
          </div>
          <div class="stat-card loss">
            <div class="value">${stats.losses}</div>
            <div class="label">Porażki</div>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="value">${stats.winRate}%</div>
            <div class="label">Skuteczność</div>
          </div>
          <div class="stat-card">
            <div class="value">${stats.goalsScored}</div>
            <div class="label">Bramki strzelone</div>
          </div>
          <div class="stat-card">
            <div class="value">${stats.goalsConceded}</div>
            <div class="label">Bramki stracone</div>
          </div>
          <div class="stat-card">
            <div class="value">${stats.goalsScored - stats.goalsConceded > 0 ? '+' : ''}${stats.goalsScored - stats.goalsConceded}</div>
            <div class="label">Bilans</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2>Ostatnie wyniki</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Przeciwnik</th>
              <th>Wynik</th>
              <th>Rezultat</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(r => `
              <tr>
                <td>${new Date(r.matchDate).toLocaleDateString('pl-PL')}</td>
                <td>${r.opponent}</td>
                <td>${r.goalsScored || 0}:${r.goalsConceded || 0}</td>
                <td>
                  <span class="result-badge result-${r.result}">
                    ${r.result === 'win' ? 'Wygrana' : r.result === 'draw' ? 'Remis' : 'Porażka'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Informacje o drużynie</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="value">${players.length}</div>
            <div class="label">Zawodników</div>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      Small Club Manager - Raport wygenerowany automatycznie
    </div>
  </div>
</body>
</html>
    `;
  };

  const generateCsvContent = (
    title: string,
    clubName: string,
    stats: any,
    results: any[]
  ): string => {
    let csv = '';
    csv += `"${title}"\n`;
    csv += `"Klub: ${clubName}"\n`;
    csv += `"Wygenerowano: ${new Date().toLocaleString('pl-PL')}"\n\n`;

    csv += '"Podsumowanie wyników"\n';
    csv += `"Mecze","${stats.totalMatches}"\n`;
    csv += `"Wygrane","${stats.wins}"\n`;
    csv += `"Remisy","${stats.draws}"\n`;
    csv += `"Porażki","${stats.losses}"\n`;
    csv += `"Skuteczność","${stats.winRate}%"\n`;
    csv += `"Bramki strzelone","${stats.goalsScored}"\n`;
    csv += `"Bramki stracone","${stats.goalsConceded}"\n`;
    csv += `"Bilans bramek","${stats.goalsScored - stats.goalsConceded}"\n\n`;

    csv += '"Ostatnie wyniki"\n';
    csv += '"Data","Przeciwnik","Wynik","Rezultat"\n';
    for (const r of results) {
      csv += `"${new Date(r.matchDate).toLocaleDateString('pl-PL')}","${r.opponent}","${r.goalsScored || 0}:${r.goalsConceded || 0}","${r.result}"\n`;
    }

    return csv;
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Eksport statystyk</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Team Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Wybierz drużynę</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Pressable
              style={[styles.teamChip, !selectedTeamId && styles.teamChipActive]}
              onPress={() => setSelectedTeamId(null)}
            >
              <ThemedText style={[styles.teamChipText, !selectedTeamId && styles.teamChipTextActive]}>
                Wszystkie
              </ThemedText>
            </Pressable>
            {teams?.map((team: any) => (
              <Pressable
                key={team.id}
                style={[styles.teamChip, selectedTeamId === team.id && styles.teamChipActive]}
                onPress={() => setSelectedTeamId(team.id)}
              >
                <ThemedText style={[styles.teamChipText, selectedTeamId === team.id && styles.teamChipTextActive]}>
                  {team.name}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Format Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Format eksportu</ThemedText>
          
          <Pressable
            style={[styles.formatOption, exportFormat === 'html' && styles.formatOptionActive]}
            onPress={() => setExportFormat('html')}
          >
            <View style={styles.formatIcon}>
              <MaterialIcons name="code" size={24} color={exportFormat === 'html' ? AppColors.primary : '#64748b'} />
            </View>
            <View style={styles.formatInfo}>
              <ThemedText style={styles.formatTitle}>HTML</ThemedText>
              <ThemedText style={styles.formatDesc}>Raport z wykresami i tabelami, gotowy do wydruku</ThemedText>
            </View>
            <View style={[styles.formatRadio, exportFormat === 'html' && styles.formatRadioActive]}>
              {exportFormat === 'html' && <View style={styles.formatRadioDot} />}
            </View>
          </Pressable>

          <Pressable
            style={[styles.formatOption, exportFormat === 'csv' && styles.formatOptionActive]}
            onPress={() => setExportFormat('csv')}
          >
            <View style={styles.formatIcon}>
              <MaterialIcons name="table-chart" size={24} color={exportFormat === 'csv' ? AppColors.primary : '#64748b'} />
            </View>
            <View style={styles.formatInfo}>
              <ThemedText style={styles.formatTitle}>CSV</ThemedText>
              <ThemedText style={styles.formatDesc}>Dane tabelaryczne do Excela lub arkuszy</ThemedText>
            </View>
            <View style={[styles.formatRadio, exportFormat === 'csv' && styles.formatRadioActive]}>
              {exportFormat === 'csv' && <View style={styles.formatRadioDot} />}
            </View>
          </Pressable>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Zawartość raportu</ThemedText>
          <View style={styles.previewCard}>
            <View style={styles.previewItem}>
              <MaterialIcons name="check-circle" size={20} color="#22c55e" />
              <ThemedText style={styles.previewText}>Podsumowanie wyników (W/R/P)</ThemedText>
            </View>
            <View style={styles.previewItem}>
              <MaterialIcons name="check-circle" size={20} color="#22c55e" />
              <ThemedText style={styles.previewText}>Statystyki bramek</ThemedText>
            </View>
            <View style={styles.previewItem}>
              <MaterialIcons name="check-circle" size={20} color="#22c55e" />
              <ThemedText style={styles.previewText}>Ostatnie 10 wyników</ThemedText>
            </View>
            <View style={styles.previewItem}>
              <MaterialIcons name="check-circle" size={20} color="#22c55e" />
              <ThemedText style={styles.previewText}>Informacje o drużynie</ThemedText>
            </View>
          </View>
        </View>

        {/* Export Button */}
        <Pressable
          style={[styles.exportBtn, isExporting && styles.exportBtnDisabled]}
          onPress={generateReport}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="file-download" size={20} color="#fff" />
              <ThemedText style={styles.exportBtnText}>Generuj raport</ThemedText>
            </>
          )}
        </Pressable>

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
  teamChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: "#1e293b",
    marginRight: Spacing.sm,
  },
  teamChipActive: {
    backgroundColor: AppColors.primary,
  },
  teamChipText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  teamChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  formatOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  formatOptionActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "10",
  },
  formatIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  formatInfo: {
    flex: 1,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  formatDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  formatRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  formatRadioActive: {
    borderColor: AppColors.primary,
  },
  formatRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.primary,
  },
  previewCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  previewItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  previewText: {
    fontSize: 14,
    color: "#e2e8f0",
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  exportBtnDisabled: {
    opacity: 0.6,
  },
  exportBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
