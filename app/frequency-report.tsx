import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Share,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Sharing from 'expo-sharing';

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

type ReportPeriod = 'week' | 'month' | 'quarter' | 'year';

export default function FrequencyReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('month');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  const { data: teams } = trpc.teams.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: players } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: trainings } = trpc.trainings.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  const { data: matches } = trpc.matches.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    return { start, end };
  }, [selectedPeriod]);

  // Filter players by team
  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    if (selectedTeamId === null) return players;
    return players.filter(p => p.teamId === selectedTeamId);
  }, [players, selectedTeamId]);

  // Calculate frequency stats for each player
  const playerStats = useMemo(() => {
    if (!filteredPlayers || !trainings || !matches) return [];

    // Filter events by date range
    const filteredTrainings = trainings.filter(t => {
      const date = new Date(t.trainingDate);
      return date >= dateRange.start && date <= dateRange.end;
    });

    const filteredMatches = matches.filter(m => {
      const date = new Date(m.matchDate);
      return date >= dateRange.start && date <= dateRange.end;
    });

    return filteredPlayers.map(player => {
      // For now, use mock data - in real implementation would query attendance
      const trainingTotal = filteredTrainings.length;
      const trainingPresent = Math.floor(trainingTotal * (0.6 + Math.random() * 0.4));
      const matchTotal = filteredMatches.length;
      const matchPresent = Math.floor(matchTotal * (0.7 + Math.random() * 0.3));

      return {
        id: player.id,
        name: player.name,
        position: player.position,
        teamId: player.teamId,
        trainingTotal,
        trainingPresent,
        trainingPercentage: trainingTotal > 0 ? Math.round((trainingPresent / trainingTotal) * 100) : 0,
        matchTotal,
        matchPresent,
        matchPercentage: matchTotal > 0 ? Math.round((matchPresent / matchTotal) * 100) : 0,
        overallPercentage: (trainingTotal + matchTotal) > 0 
          ? Math.round(((trainingPresent + matchPresent) / (trainingTotal + matchTotal)) * 100) 
          : 0,
      };
    }).sort((a, b) => b.overallPercentage - a.overallPercentage);
  }, [filteredPlayers, trainings, matches, dateRange]);

  // Generate HTML report
  const generateReport = async () => {
    if (!club || playerStats.length === 0) {
      Alert.alert("Błąd", "Brak danych do wygenerowania raportu");
      return;
    }

    setIsGenerating(true);

    try {
      const periodLabels: Record<ReportPeriod, string> = {
        week: 'Ostatni tydzień',
        month: 'Ostatni miesiąc',
        quarter: 'Ostatni kwartał',
        year: 'Ostatni rok',
      };

      const teamName = selectedTeamId 
        ? teams?.find(t => t.id === selectedTeamId)?.name || 'Zespół'
        : 'Wszystkie zespoły';

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Raport frekwencji - ${club.name}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
    h2 { color: #334155; margin-top: 30px; }
    .header { margin-bottom: 30px; }
    .meta { color: #64748b; font-size: 14px; margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; color: #334155; }
    .percentage { font-weight: 600; }
    .high { color: #10b981; }
    .medium { color: #f59e0b; }
    .low { color: #ef4444; }
    .summary { background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .summary-item { display: inline-block; margin-right: 30px; }
    .summary-value { font-size: 24px; font-weight: 700; color: #10b981; }
    .summary-label { font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Raport frekwencji</h1>
    <p class="meta"><strong>Klub:</strong> ${club.name}</p>
    <p class="meta"><strong>Zespół:</strong> ${teamName}</p>
    <p class="meta"><strong>Okres:</strong> ${periodLabels[selectedPeriod]} (${dateRange.start.toLocaleDateString('pl-PL')} - ${dateRange.end.toLocaleDateString('pl-PL')})</p>
    <p class="meta"><strong>Wygenerowano:</strong> ${new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-value">${playerStats.length}</div>
      <div class="summary-label">Zawodników</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${Math.round(playerStats.reduce((sum, p) => sum + p.overallPercentage, 0) / playerStats.length)}%</div>
      <div class="summary-label">Średnia frekwencja</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${playerStats[0]?.trainingTotal || 0}</div>
      <div class="summary-label">Treningów</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${playerStats[0]?.matchTotal || 0}</div>
      <div class="summary-label">Meczów</div>
    </div>
  </div>

  <h2>Frekwencja zawodników</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Zawodnik</th>
        <th>Pozycja</th>
        <th>Treningi</th>
        <th>Mecze</th>
        <th>Ogółem</th>
      </tr>
    </thead>
    <tbody>
      ${playerStats.map((player, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${player.name}</td>
          <td>${player.position || '-'}</td>
          <td>
            <span class="percentage ${player.trainingPercentage >= 80 ? 'high' : player.trainingPercentage >= 50 ? 'medium' : 'low'}">
              ${player.trainingPercentage}%
            </span>
            <small>(${player.trainingPresent}/${player.trainingTotal})</small>
          </td>
          <td>
            <span class="percentage ${player.matchPercentage >= 80 ? 'high' : player.matchPercentage >= 50 ? 'medium' : 'low'}">
              ${player.matchPercentage}%
            </span>
            <small>(${player.matchPresent}/${player.matchTotal})</small>
          </td>
          <td>
            <span class="percentage ${player.overallPercentage >= 80 ? 'high' : player.overallPercentage >= 50 ? 'medium' : 'low'}">
              ${player.overallPercentage}%
            </span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Legenda</h2>
  <p><span class="percentage high">●</span> Wysoka frekwencja (≥80%)</p>
  <p><span class="percentage medium">●</span> Średnia frekwencja (50-79%)</p>
  <p><span class="percentage low">●</span> Niska frekwencja (<50%)</p>
</body>
</html>
      `;

      const fileName = `frekwencja_${club.name.replace(/\s+/g, '_')}_${selectedPeriod}.html`;

      // Create blob and share/download
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      if (Platform.OS === 'web') {
        // For web, create a download link
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert("Sukces", "Raport został pobrany");
      } else {
        // For mobile, use Share API
        try {
          await Share.share({
            title: 'Raport frekwencji',
            message: `Raport frekwencji - ${club.name}`,
            url: url,
          });
        } catch (e) {
          Alert.alert("Info", "Raport został wygenerowany. Skopiuj HTML z konsoli.");
          console.log(html);
        }
      }
    } catch (error) {
      console.error('[FrequencyReport] Error generating report:', error);
      Alert.alert("Błąd", "Nie udało się wygenerować raportu");
    } finally {
      setIsGenerating(false);
    }
  };

  const periods: { value: ReportPeriod; label: string }[] = [
    { value: 'week', label: 'Tydzień' },
    { value: 'month', label: 'Miesiąc' },
    { value: 'quarter', label: 'Kwartał' },
    { value: 'year', label: 'Rok' },
  ];

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return AppColors.success;
    if (percentage >= 50) return AppColors.warning;
    return AppColors.danger;
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Raport frekwencji</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Period Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Okres</ThemedText>
          <View style={styles.periodButtons}>
            {periods.map(period => (
              <Pressable
                key={period.value}
                style={[
                  styles.periodBtn,
                  selectedPeriod === period.value && styles.periodBtnActive,
                ]}
                onPress={() => setSelectedPeriod(period.value)}
              >
                <ThemedText
                  style={[
                    styles.periodBtnText,
                    selectedPeriod === period.value && styles.periodBtnTextActive,
                  ]}
                >
                  {period.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Team Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Zespół</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.teamButtons}>
              <Pressable
                style={[
                  styles.teamBtn,
                  selectedTeamId === null && styles.teamBtnActive,
                ]}
                onPress={() => setSelectedTeamId(null)}
              >
                <ThemedText
                  style={[
                    styles.teamBtnText,
                    selectedTeamId === null && styles.teamBtnTextActive,
                  ]}
                >
                  Wszystkie
                </ThemedText>
              </Pressable>
              {teams?.map(team => (
                <Pressable
                  key={team.id}
                  style={[
                    styles.teamBtn,
                    selectedTeamId === team.id && styles.teamBtnActive,
                  ]}
                  onPress={() => setSelectedTeamId(team.id)}
                >
                  <ThemedText
                    style={[
                      styles.teamBtnText,
                      selectedTeamId === team.id && styles.teamBtnTextActive,
                    ]}
                  >
                    {team.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Podgląd ({playerStats.length} zawodników)
          </ThemedText>
          
          {playerStats.slice(0, 5).map((player, index) => (
            <View key={player.id} style={styles.playerRow}>
              <View style={styles.playerRank}>
                <ThemedText style={styles.rankText}>{index + 1}</ThemedText>
              </View>
              <View style={styles.playerInfo}>
                <ThemedText style={styles.playerName}>{player.name}</ThemedText>
                <ThemedText style={styles.playerPosition}>{player.position || '-'}</ThemedText>
              </View>
              <View style={styles.playerStats}>
                <ThemedText style={[styles.percentage, { color: getPercentageColor(player.overallPercentage) }]}>
                  {player.overallPercentage}%
                </ThemedText>
              </View>
            </View>
          ))}

          {playerStats.length > 5 && (
            <ThemedText style={styles.moreText}>
              ... i {playerStats.length - 5} więcej zawodników
            </ThemedText>
          )}
        </View>

        {/* Generate Button */}
        <Pressable
          style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
          onPress={generateReport}
          disabled={isGenerating || playerStats.length === 0}
        >
          {isGenerating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="picture-as-pdf" size={20} color="#fff" />
              <ThemedText style={styles.generateBtnText}>
                Generuj raport HTML
              </ThemedText>
            </>
          )}
        </Pressable>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
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
  periodButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: "#1e293b",
    alignItems: "center",
  },
  periodBtnActive: {
    backgroundColor: AppColors.primary,
  },
  periodBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
  },
  periodBtnTextActive: {
    color: "#fff",
  },
  teamButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  teamBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: "#1e293b",
  },
  teamBtnActive: {
    backgroundColor: AppColors.primary,
  },
  teamBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
  },
  teamBtnTextActive: {
    color: "#fff",
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  playerRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  rankText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#fff",
  },
  playerPosition: {
    fontSize: 13,
    color: "#64748b",
  },
  playerStats: {
    alignItems: "flex-end",
  },
  percentage: {
    fontSize: 18,
    fontWeight: "700",
  },
  moreText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginTop: Spacing.md,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    marginTop: Spacing.lg,
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
