import { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { trpc } from "@/lib/trpc";
import { AdBanner } from "@/components/ad-banner";

type SeasonData = {
  season: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  attendance: number;
  trainings: number;
};

export default function SeasonComparisonScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(["2024/25", "2023/24"]);
  
  const { data: clubs } = trpc.clubs.list.useQuery();
  const clubId = clubs?.[0]?.id;
  
  const { data: teams } = trpc.teams.list.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId }
  );
  
  // Mock season data - in real app would come from API
  const seasonsData: SeasonData[] = [
    {
      season: "2024/25",
      matches: 18,
      wins: 12,
      draws: 4,
      losses: 2,
      goalsFor: 45,
      goalsAgainst: 18,
      attendance: 87,
      trainings: 42,
    },
    {
      season: "2023/24",
      matches: 24,
      wins: 14,
      draws: 5,
      losses: 5,
      goalsFor: 52,
      goalsAgainst: 28,
      attendance: 82,
      trainings: 56,
    },
    {
      season: "2022/23",
      matches: 22,
      wins: 10,
      draws: 6,
      losses: 6,
      goalsFor: 38,
      goalsAgainst: 32,
      attendance: 78,
      trainings: 48,
    },
  ];
  
  const availableSeasons = ["2024/25", "2023/24", "2022/23", "2021/22"];
  
  const toggleSeason = (season: string) => {
    if (selectedSeasons.includes(season)) {
      if (selectedSeasons.length > 1) {
        setSelectedSeasons(selectedSeasons.filter(s => s !== season));
      }
    } else if (selectedSeasons.length < 3) {
      setSelectedSeasons([...selectedSeasons, season]);
    }
  };
  
  const getSeasonData = (season: string) => {
    return seasonsData.find(s => s.season === season) || seasonsData[0];
  };
  
  const getComparisonColor = (current: number, previous: number) => {
    if (current > previous) return "#4ade80";
    if (current < previous) return "#ef4444";
    return "#94a3b8";
  };
  
  const getComparisonIcon = (current: number, previous: number) => {
    if (current > previous) return "↑";
    if (current < previous) return "↓";
    return "=";
  };
  
  const renderBar = (value: number, maxValue: number, color: string) => {
    const width = Math.min((value / maxValue) * 100, 100);
    return (
      <View style={styles.barContainer}>
        <View style={[styles.bar, { width: `${width}%`, backgroundColor: color }]} />
      </View>
    );
  };
  
  const renderComparison = (label: string, getValue: (d: SeasonData) => number, maxValue: number, suffix: string = "") => {
    const data = selectedSeasons.map(s => ({
      season: s,
      value: getValue(getSeasonData(s)),
    }));
    
    const colors = ["#3b82f6", "#f59e0b", "#10b981"];
    
    return (
      <View style={styles.comparisonCard}>
        <ThemedText style={styles.comparisonLabel}>{label}</ThemedText>
        {data.map((d, index) => (
          <View key={d.season} style={styles.comparisonRow}>
            <ThemedText style={[styles.seasonLabel, { color: colors[index] }]}>
              {d.season}
            </ThemedText>
            <View style={styles.barWrapper}>
              {renderBar(d.value, maxValue, colors[index])}
            </View>
            <ThemedText style={styles.valueText}>
              {d.value}{suffix}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  };
  
  const selectedData = selectedSeasons.map(s => getSeasonData(s));
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText>← Wróć</ThemedText>
        </Pressable>
        <ThemedText type="title" style={styles.title}>Porównanie sezonów</ThemedText>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Team Selection */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Drużyna</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.teamRow}>
              <Pressable
                style={[styles.teamBtn, !selectedTeamId && styles.teamBtnActive]}
                onPress={() => setSelectedTeamId(null)}
              >
                <ThemedText style={!selectedTeamId ? styles.teamBtnTextActive : undefined}>
                  Wszystkie
                </ThemedText>
              </Pressable>
              {teams?.map((team: any) => (
                <Pressable
                  key={team.id}
                  style={[styles.teamBtn, selectedTeamId === team.id && styles.teamBtnActive]}
                  onPress={() => setSelectedTeamId(team.id)}
                >
                  <ThemedText style={selectedTeamId === team.id ? styles.teamBtnTextActive : undefined}>
                    {team.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
        
        {/* Season Selection */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Sezony do porównania (max 3)
          </ThemedText>
          <View style={styles.seasonGrid}>
            {availableSeasons.map((season, index) => {
              const isSelected = selectedSeasons.includes(season);
              const colors = ["#3b82f6", "#f59e0b", "#10b981"];
              const selectedIndex = selectedSeasons.indexOf(season);
              return (
                <Pressable
                  key={season}
                  style={[
                    styles.seasonBtn,
                    isSelected && { backgroundColor: colors[selectedIndex] + "20", borderColor: colors[selectedIndex] },
                  ]}
                  onPress={() => toggleSeason(season)}
                >
                  {isSelected && (
                    <View style={[styles.seasonDot, { backgroundColor: colors[selectedIndex] }]} />
                  )}
                  <ThemedText style={isSelected ? { color: colors[selectedIndex], fontWeight: "600" } : undefined}>
                    {season}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
        
        {/* Summary Cards */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Podsumowanie</ThemedText>
          <View style={styles.summaryGrid}>
            {selectedData.map((data, index) => {
              const colors = ["#3b82f6", "#f59e0b", "#10b981"];
              const winRate = data.matches > 0 ? Math.round((data.wins / data.matches) * 100) : 0;
              return (
                <View key={data.season} style={[styles.summaryCard, { borderLeftColor: colors[index] }]}>
                  <ThemedText style={[styles.summarySeasonTitle, { color: colors[index] }]}>
                    {data.season}
                  </ThemedText>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Mecze</ThemedText>
                    <ThemedText style={styles.summaryValue}>{data.matches}</ThemedText>
                  </View>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>W/R/P</ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      {data.wins}/{data.draws}/{data.losses}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Skuteczność</ThemedText>
                    <ThemedText style={[styles.summaryValue, { color: winRate >= 50 ? "#4ade80" : "#ef4444" }]}>
                      {winRate}%
                    </ThemedText>
                  </View>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Bramki</ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      {data.goalsFor}:{data.goalsAgainst}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Comparison Charts */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Porównanie statystyk</ThemedText>
          {renderComparison("Wygrane mecze", d => d.wins, 20)}
          {renderComparison("Bramki strzelone", d => d.goalsFor, 60)}
          {renderComparison("Bramki stracone", d => d.goalsAgainst, 40)}
          {renderComparison("Frekwencja", d => d.attendance, 100, "%")}
          {renderComparison("Treningi", d => d.trainings, 60)}
        </View>
        
        {/* Goal Difference Chart */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Bilans bramek</ThemedText>
          <View style={styles.goalDiffContainer}>
            {selectedData.map((data, index) => {
              const colors = ["#3b82f6", "#f59e0b", "#10b981"];
              const diff = data.goalsFor - data.goalsAgainst;
              return (
                <View key={data.season} style={styles.goalDiffCard}>
                  <ThemedText style={[styles.goalDiffSeason, { color: colors[index] }]}>
                    {data.season}
                  </ThemedText>
                  <ThemedText style={[
                    styles.goalDiffValue,
                    { color: diff >= 0 ? "#4ade80" : "#ef4444" }
                  ]}>
                    {diff >= 0 ? "+" : ""}{diff}
                  </ThemedText>
                  <ThemedText style={styles.goalDiffLabel}>
                    {data.goalsFor} - {data.goalsAgainst}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      <AdBanner placement="more" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  teamRow: {
    flexDirection: "row",
    gap: 8,
  },
  teamBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  teamBtnActive: {
    backgroundColor: "#1a73e8",
  },
  teamBtnTextActive: {
    color: "#fff",
  },
  seasonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  seasonBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    borderWidth: 2,
    borderColor: "transparent",
  },
  seasonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  summaryGrid: {
    gap: 12,
  },
  summaryCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  summarySeasonTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    color: "#666",
  },
  summaryValue: {
    fontWeight: "600",
  },
  comparisonCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  comparisonLabel: {
    fontWeight: "600",
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  seasonLabel: {
    width: 60,
    fontSize: 12,
    fontWeight: "600",
  },
  barWrapper: {
    flex: 1,
  },
  barContainer: {
    height: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 10,
  },
  valueText: {
    width: 50,
    textAlign: "right",
    fontWeight: "600",
  },
  goalDiffContainer: {
    flexDirection: "row",
    gap: 12,
  },
  goalDiffCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  goalDiffSeason: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  goalDiffValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  goalDiffLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
});
