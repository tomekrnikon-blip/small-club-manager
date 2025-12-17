import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Svg, { Polygon, Circle, Line, Text as SvgText } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

interface PlayerStats {
  id: number;
  name: string;
  position: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
  minutesPlayed: number;
  yellowCards: number;
  redCards: number;
}

export default function PlayerComparisonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [showSelector, setShowSelector] = useState(false);

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const { data: players, isLoading } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );

  // Get stats for selected players
  const { data: stats1 } = trpc.players.getStats.useQuery(
    { playerId: selectedPlayers[0] ?? 0 },
    { enabled: !!selectedPlayers[0] }
  );

  const { data: stats2 } = trpc.players.getStats.useQuery(
    { playerId: selectedPlayers[1] ?? 0 },
    { enabled: !!selectedPlayers[1] }
  );

  const player1 = players?.find(p => p.id === selectedPlayers[0]);
  const player2 = players?.find(p => p.id === selectedPlayers[1]);
  const playerStats1 = stats1?.[0];
  const playerStats2 = stats2?.[0];

  const togglePlayer = (playerId: number) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else if (selectedPlayers.length < 2) {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  // Radar chart data
  const radarMetrics = [
    { label: "Bramki", key: "goals", max: 50 },
    { label: "Asysty", key: "assists", max: 30 },
    { label: "Mecze", key: "matchesPlayed", max: 50 },
    { label: "Minuty", key: "minutesPlayed", max: 3000 },
    { label: "Dyscyplina", key: "discipline", max: 10 },
  ];

  const getRadarValue = (stats: any, key: string) => {
    if (!stats) return 0;
    if (key === "discipline") {
      return Math.max(0, 10 - (stats.yellowCards || 0) - (stats.redCards || 0) * 3);
    }
    return stats[key] || 0;
  };

  const normalizeValue = (value: number, max: number) => {
    return Math.min(value / max, 1);
  };

  // Generate radar polygon points
  const generateRadarPoints = (stats: any, radius: number, centerX: number, centerY: number) => {
    const points: string[] = [];
    const angleStep = (2 * Math.PI) / radarMetrics.length;
    
    radarMetrics.forEach((metric, i) => {
      const value = normalizeValue(getRadarValue(stats, metric.key), metric.max);
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * value * Math.cos(angle);
      const y = centerY + radius * value * Math.sin(angle);
      points.push(`${x},${y}`);
    });
    
    return points.join(" ");
  };

  const radarSize = 200;
  const radarCenter = radarSize / 2;
  const radarRadius = 80;

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Porównanie zawodników</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Player Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Wybierz zawodników (max 2)</ThemedText>
          
          <View style={styles.selectionRow}>
            <Pressable 
              style={[styles.playerSlot, player1 && styles.playerSlotFilled]}
              onPress={() => setShowSelector(true)}
            >
              {player1 ? (
                <>
                  <View style={[styles.slotAvatar, { backgroundColor: AppColors.primary + "30" }]}>
                    <ThemedText style={[styles.slotAvatarText, { color: AppColors.primary }]}>
                      {player1.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.slotName}>{player1.name}</ThemedText>
                  <Pressable 
                    style={styles.removeBtn}
                    onPress={() => setSelectedPlayers(selectedPlayers.filter(id => id !== player1.id))}
                  >
                    <MaterialIcons name="close" size={16} color="#ef4444" />
                  </Pressable>
                </>
              ) : (
                <>
                  <MaterialIcons name="person-add" size={24} color="#64748b" />
                  <ThemedText style={styles.slotPlaceholder}>Zawodnik 1</ThemedText>
                </>
              )}
            </Pressable>

            <View style={styles.vsContainer}>
              <ThemedText style={styles.vsText}>VS</ThemedText>
            </View>

            <Pressable 
              style={[styles.playerSlot, player2 && styles.playerSlotFilled]}
              onPress={() => setShowSelector(true)}
            >
              {player2 ? (
                <>
                  <View style={[styles.slotAvatar, { backgroundColor: "#a855f730" }]}>
                    <ThemedText style={[styles.slotAvatarText, { color: "#a855f7" }]}>
                      {player2.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.slotName}>{player2.name}</ThemedText>
                  <Pressable 
                    style={styles.removeBtn}
                    onPress={() => setSelectedPlayers(selectedPlayers.filter(id => id !== player2.id))}
                  >
                    <MaterialIcons name="close" size={16} color="#ef4444" />
                  </Pressable>
                </>
              ) : (
                <>
                  <MaterialIcons name="person-add" size={24} color="#64748b" />
                  <ThemedText style={styles.slotPlaceholder}>Zawodnik 2</ThemedText>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Player Selector */}
        {showSelector && (
          <View style={styles.selectorCard}>
            <View style={styles.selectorHeader}>
              <ThemedText style={styles.selectorTitle}>Wybierz zawodnika</ThemedText>
              <Pressable onPress={() => setShowSelector(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>
            <ScrollView style={styles.selectorList} nestedScrollEnabled>
              {players?.map(player => (
                <Pressable
                  key={player.id}
                  style={[
                    styles.selectorItem,
                    selectedPlayers.includes(player.id) && styles.selectorItemSelected,
                  ]}
                  onPress={() => {
                    togglePlayer(player.id);
                    if (selectedPlayers.length === 1 && !selectedPlayers.includes(player.id)) {
                      setShowSelector(false);
                    }
                  }}
                >
                  <View style={styles.selectorAvatar}>
                    <ThemedText style={styles.selectorAvatarText}>
                      {player.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </ThemedText>
                  </View>
                  <View style={styles.selectorInfo}>
                    <ThemedText style={styles.selectorName}>{player.name}</ThemedText>
                    <ThemedText style={styles.selectorPosition}>{player.position}</ThemedText>
                  </View>
                  {selectedPlayers.includes(player.id) && (
                    <MaterialIcons name="check-circle" size={24} color={AppColors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Radar Chart */}
        {selectedPlayers.length === 2 && playerStats1 && playerStats2 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Wykres radarowy</ThemedText>
            <View style={styles.radarContainer}>
              <Svg width={radarSize} height={radarSize}>
                {/* Grid circles */}
                {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                  <Circle
                    key={i}
                    cx={radarCenter}
                    cy={radarCenter}
                    r={radarRadius * scale}
                    fill="none"
                    stroke="#334155"
                    strokeWidth={1}
                  />
                ))}
                
                {/* Grid lines */}
                {radarMetrics.map((_, i) => {
                  const angle = (i * 2 * Math.PI) / radarMetrics.length - Math.PI / 2;
                  const x = radarCenter + radarRadius * Math.cos(angle);
                  const y = radarCenter + radarRadius * Math.sin(angle);
                  return (
                    <Line
                      key={i}
                      x1={radarCenter}
                      y1={radarCenter}
                      x2={x}
                      y2={y}
                      stroke="#334155"
                      strokeWidth={1}
                    />
                  );
                })}
                
                {/* Labels */}
                {radarMetrics.map((metric, i) => {
                  const angle = (i * 2 * Math.PI) / radarMetrics.length - Math.PI / 2;
                  const x = radarCenter + (radarRadius + 20) * Math.cos(angle);
                  const y = radarCenter + (radarRadius + 20) * Math.sin(angle);
                  return (
                    <SvgText
                      key={i}
                      x={x}
                      y={y}
                      fill="#94a3b8"
                      fontSize={10}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {metric.label}
                    </SvgText>
                  );
                })}
                
                {/* Player 1 polygon */}
                <Polygon
                  points={generateRadarPoints(playerStats1, radarRadius, radarCenter, radarCenter)}
                  fill={AppColors.primary + "40"}
                  stroke={AppColors.primary}
                  strokeWidth={2}
                />
                
                {/* Player 2 polygon */}
                <Polygon
                  points={generateRadarPoints(playerStats2, radarRadius, radarCenter, radarCenter)}
                  fill="#a855f740"
                  stroke="#a855f7"
                  strokeWidth={2}
                />
              </Svg>
              
              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: AppColors.primary }]} />
                  <ThemedText style={styles.legendText}>{player1?.name}</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#a855f7" }]} />
                  <ThemedText style={styles.legendText}>{player2?.name}</ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Stats Comparison */}
        {selectedPlayers.length === 2 && playerStats1 && playerStats2 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Porównanie statystyk</ThemedText>
            
            <ComparisonRow 
              label="Bramki" 
              value1={playerStats1.goals} 
              value2={playerStats2.goals}
              color1={AppColors.primary}
              color2="#a855f7"
            />
            <ComparisonRow 
              label="Asysty" 
              value1={playerStats1.assists} 
              value2={playerStats2.assists}
              color1={AppColors.primary}
              color2="#a855f7"
            />
            <ComparisonRow 
              label="Mecze" 
              value1={playerStats1.matchesPlayed} 
              value2={playerStats2.matchesPlayed}
              color1={AppColors.primary}
              color2="#a855f7"
            />
            <ComparisonRow 
              label="Minuty" 
              value1={playerStats1.minutesPlayed} 
              value2={playerStats2.minutesPlayed}
              color1={AppColors.primary}
              color2="#a855f7"
            />
            <ComparisonRow 
              label="Żółte kartki" 
              value1={playerStats1.yellowCards} 
              value2={playerStats2.yellowCards}
              color1={AppColors.primary}
              color2="#a855f7"
              lowerIsBetter
            />
            <ComparisonRow 
              label="Czerwone kartki" 
              value1={playerStats1.redCards} 
              value2={playerStats2.redCards}
              color1={AppColors.primary}
              color2="#a855f7"
              lowerIsBetter
            />
          </View>
        )}

        {selectedPlayers.length < 2 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="compare-arrows" size={64} color="#334155" />
            <ThemedText style={styles.emptyText}>
              Wybierz dwóch zawodników do porównania
            </ThemedText>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

function ComparisonRow({ 
  label, 
  value1, 
  value2, 
  color1, 
  color2,
  lowerIsBetter = false,
}: { 
  label: string; 
  value1: number; 
  value2: number;
  color1: string;
  color2: string;
  lowerIsBetter?: boolean;
}) {
  const total = value1 + value2 || 1;
  const percent1 = (value1 / total) * 100;
  const percent2 = (value2 / total) * 100;
  
  const winner = lowerIsBetter 
    ? (value1 < value2 ? 1 : value1 > value2 ? 2 : 0)
    : (value1 > value2 ? 1 : value1 < value2 ? 2 : 0);

  return (
    <View style={styles.comparisonRow}>
      <View style={styles.comparisonValue}>
        <ThemedText style={[
          styles.comparisonValueText,
          winner === 1 && styles.comparisonWinner,
          { color: color1 },
        ]}>
          {value1}
        </ThemedText>
      </View>
      
      <View style={styles.comparisonCenter}>
        <ThemedText style={styles.comparisonLabel}>{label}</ThemedText>
        <View style={styles.comparisonBar}>
          <View style={[styles.comparisonBarLeft, { width: `${percent1}%`, backgroundColor: color1 }]} />
          <View style={[styles.comparisonBarRight, { width: `${percent2}%`, backgroundColor: color2 }]} />
        </View>
      </View>
      
      <View style={styles.comparisonValue}>
        <ThemedText style={[
          styles.comparisonValueText,
          winner === 2 && styles.comparisonWinner,
          { color: color2 },
        ]}>
          {value2}
        </ThemedText>
      </View>
    </View>
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
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  selectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  playerSlot: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    borderWidth: 2,
    borderColor: "#334155",
    borderStyle: "dashed",
  },
  playerSlotFilled: {
    borderStyle: "solid",
    borderColor: "transparent",
  },
  slotAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  slotAvatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  slotName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  slotPlaceholder: {
    fontSize: 13,
    color: "#64748b",
    marginTop: Spacing.xs,
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },
  vsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  vsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  selectorCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    maxHeight: 300,
  },
  selectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  selectorList: {
    maxHeight: 240,
  },
  selectorItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
  },
  selectorItemSelected: {
    backgroundColor: AppColors.primary + "10",
  },
  selectorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  selectorAvatarText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
  selectorInfo: {
    flex: 1,
  },
  selectorName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  selectorPosition: {
    fontSize: 12,
    color: "#64748b",
  },
  radarContainer: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
  },
  legend: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  comparisonValue: {
    width: 50,
    alignItems: "center",
  },
  comparisonValueText: {
    fontSize: 18,
    fontWeight: "700",
  },
  comparisonWinner: {
    fontSize: 20,
  },
  comparisonCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  comparisonLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 6,
  },
  comparisonBar: {
    flexDirection: "row",
    height: 8,
    width: "100%",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#0f172a",
  },
  comparisonBarLeft: {
    height: "100%",
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  comparisonBarRight: {
    height: "100%",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
});
