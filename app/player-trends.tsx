import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Svg, { Path, Circle, Line, Text as SvgText, Rect } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 180;
const CHART_PADDING = 40;

type TimeRange = "3m" | "6m" | "1y" | "all";

export default function PlayerTrendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  
  const [timeRange, setTimeRange] = useState<TimeRange>("6m");

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const { data: players } = trpc.players.list.useQuery(
    { clubId: club?.id ?? 0 },
    { enabled: !!club?.id }
  );
  
  const player = playerId 
    ? players?.find(p => p.id === parseInt(playerId)) 
    : players?.[0];

  // Get player ratings for trends
  const { data: ratings, isLoading } = trpc.playerRatings.listByPlayer.useQuery(
    { playerId: player?.id ?? 0 },
    { enabled: !!player?.id }
  );

  // Generate mock trend data based on ratings
  const generateTrendData = (count: number) => {
    const data = [];
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      
      // Use actual ratings if available, otherwise generate sample data
      const rating = ratings?.[i];
      data.push({
        date: date.toLocaleDateString('pl-PL', { month: 'short' }),
        rating: rating ? Number(rating.overall) : 3 + Math.random() * 2,
        goals: Math.floor(Math.random() * 5),
        assists: Math.floor(Math.random() * 3),
        attendance: 70 + Math.floor(Math.random() * 30),
      });
    }
    return data;
  };

  const getDataPoints = () => {
    switch (timeRange) {
      case "3m": return 3;
      case "6m": return 6;
      case "1y": return 12;
      case "all": return 24;
    }
  };

  const trendData = generateTrendData(getDataPoints());

  // Generate SVG path for line chart
  const generateLinePath = (data: number[], maxValue: number) => {
    const width = CHART_WIDTH - CHART_PADDING * 2;
    const height = CHART_HEIGHT - 40;
    const stepX = width / (data.length - 1);
    
    let path = "";
    data.forEach((value, i) => {
      const x = CHART_PADDING + i * stepX;
      const y = 20 + height - (value / maxValue) * height;
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return path;
  };

  // Generate area path (filled below line)
  const generateAreaPath = (data: number[], maxValue: number) => {
    const width = CHART_WIDTH - CHART_PADDING * 2;
    const height = CHART_HEIGHT - 40;
    const stepX = width / (data.length - 1);
    
    let path = `M ${CHART_PADDING} ${20 + height}`;
    
    data.forEach((value, i) => {
      const x = CHART_PADDING + i * stepX;
      const y = 20 + height - (value / maxValue) * height;
      path += ` L ${x} ${y}`;
    });
    
    path += ` L ${CHART_PADDING + (data.length - 1) * stepX} ${20 + height} Z`;
    
    return path;
  };

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: "3m", label: "3 mies." },
    { value: "6m", label: "6 mies." },
    { value: "1y", label: "1 rok" },
    { value: "all", label: "Wszystko" },
  ];

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
        <ThemedText style={styles.headerTitle}>Trendy rozwoju</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Player Info */}
        {player && (
          <View style={styles.playerCard}>
            <View style={styles.playerAvatar}>
              <ThemedText style={styles.avatarText}>
                {player.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </ThemedText>
            </View>
            <View style={styles.playerInfo}>
              <ThemedText style={styles.playerName}>{player.name}</ThemedText>
              <ThemedText style={styles.playerPosition}>{player.position}</ThemedText>
            </View>
          </View>
        )}

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {timeRanges.map(range => (
            <Pressable
              key={range.value}
              style={[
                styles.timeRangeBtn,
                timeRange === range.value && styles.timeRangeBtnActive,
              ]}
              onPress={() => setTimeRange(range.value)}
            >
              <ThemedText style={[
                styles.timeRangeText,
                timeRange === range.value && styles.timeRangeTextActive,
              ]}>
                {range.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Rating Trend Chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <ThemedText style={styles.chartTitle}>Trend ocen</ThemedText>
            <View style={styles.chartValue}>
              <ThemedText style={styles.chartValueText}>
                {(trendData.reduce((sum, d) => sum + d.rating, 0) / trendData.length).toFixed(1)}
              </ThemedText>
              <ThemedText style={styles.chartValueLabel}>średnia</ThemedText>
            </View>
          </View>
          
          <View style={styles.chartContainer}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              {/* Grid lines */}
              {[1, 2, 3, 4, 5].map(v => {
                const y = 20 + (CHART_HEIGHT - 40) - ((v / 5) * (CHART_HEIGHT - 40));
                return (
                  <Line
                    key={v}
                    x1={CHART_PADDING}
                    y1={y}
                    x2={CHART_WIDTH - CHART_PADDING}
                    y2={y}
                    stroke="#1e293b"
                    strokeWidth={1}
                  />
                );
              })}
              
              {/* Area fill */}
              <Path
                d={generateAreaPath(trendData.map(d => d.rating), 5)}
                fill={AppColors.primary + "20"}
              />
              
              {/* Line */}
              <Path
                d={generateLinePath(trendData.map(d => d.rating), 5)}
                stroke={AppColors.primary}
                strokeWidth={2}
                fill="none"
              />
              
              {/* Data points */}
              {trendData.map((d, i) => {
                const width = CHART_WIDTH - CHART_PADDING * 2;
                const height = CHART_HEIGHT - 40;
                const stepX = width / (trendData.length - 1);
                const x = CHART_PADDING + i * stepX;
                const y = 20 + height - (d.rating / 5) * height;
                
                return (
                  <Circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={4}
                    fill={AppColors.primary}
                  />
                );
              })}
              
              {/* X-axis labels */}
              {trendData.map((d, i) => {
                const width = CHART_WIDTH - CHART_PADDING * 2;
                const stepX = width / (trendData.length - 1);
                const x = CHART_PADDING + i * stepX;
                
                return (
                  <SvgText
                    key={i}
                    x={x}
                    y={CHART_HEIGHT - 5}
                    fill="#64748b"
                    fontSize={10}
                    textAnchor="middle"
                  >
                    {d.date}
                  </SvgText>
                );
              })}
              
              {/* Y-axis labels */}
              {[1, 3, 5].map(v => {
                const y = 20 + (CHART_HEIGHT - 40) - ((v / 5) * (CHART_HEIGHT - 40));
                return (
                  <SvgText
                    key={v}
                    x={15}
                    y={y + 4}
                    fill="#64748b"
                    fontSize={10}
                    textAnchor="middle"
                  >
                    {v}
                  </SvgText>
                );
              })}
            </Svg>
          </View>
        </View>

        {/* Goals & Assists Trend */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <ThemedText style={styles.chartTitle}>Bramki i asysty</ThemedText>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} />
                <ThemedText style={styles.legendText}>Bramki</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#3b82f6" }]} />
                <ThemedText style={styles.legendText}>Asysty</ThemedText>
              </View>
            </View>
          </View>
          
          <View style={styles.chartContainer}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              {/* Bar chart */}
              {trendData.map((d, i) => {
                const width = CHART_WIDTH - CHART_PADDING * 2;
                const barWidth = (width / trendData.length) * 0.35;
                const stepX = width / trendData.length;
                const x = CHART_PADDING + i * stepX + stepX / 2;
                const maxVal = 8;
                const height = CHART_HEIGHT - 40;
                
                const goalsHeight = (d.goals / maxVal) * height;
                const assistsHeight = (d.assists / maxVal) * height;
                
                return (
                  <React.Fragment key={i}>
                    {/* Goals bar */}
                    <Rect
                      x={x - barWidth - 2}
                      y={20 + height - goalsHeight}
                      width={barWidth}
                      height={goalsHeight}
                      fill="#22c55e"
                      rx={4}
                    />
                    {/* Assists bar */}
                    <Rect
                      x={x + 2}
                      y={20 + height - assistsHeight}
                      width={barWidth}
                      height={assistsHeight}
                      fill="#3b82f6"
                      rx={4}
                    />
                    {/* X-axis label */}
                    <SvgText
                      x={x}
                      y={CHART_HEIGHT - 5}
                      fill="#64748b"
                      fontSize={10}
                      textAnchor="middle"
                    >
                      {d.date}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        </View>

        {/* Attendance Trend */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <ThemedText style={styles.chartTitle}>Frekwencja</ThemedText>
            <View style={styles.chartValue}>
              <ThemedText style={[styles.chartValueText, { color: "#a855f7" }]}>
                {Math.round(trendData.reduce((sum, d) => sum + d.attendance, 0) / trendData.length)}%
              </ThemedText>
              <ThemedText style={styles.chartValueLabel}>średnia</ThemedText>
            </View>
          </View>
          
          <View style={styles.chartContainer}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              {/* Grid lines */}
              {[25, 50, 75, 100].map(v => {
                const y = 20 + (CHART_HEIGHT - 40) - ((v / 100) * (CHART_HEIGHT - 40));
                return (
                  <Line
                    key={v}
                    x1={CHART_PADDING}
                    y1={y}
                    x2={CHART_WIDTH - CHART_PADDING}
                    y2={y}
                    stroke="#1e293b"
                    strokeWidth={1}
                  />
                );
              })}
              
              {/* Area fill */}
              <Path
                d={generateAreaPath(trendData.map(d => d.attendance), 100)}
                fill="#a855f720"
              />
              
              {/* Line */}
              <Path
                d={generateLinePath(trendData.map(d => d.attendance), 100)}
                stroke="#a855f7"
                strokeWidth={2}
                fill="none"
              />
              
              {/* Data points */}
              {trendData.map((d, i) => {
                const width = CHART_WIDTH - CHART_PADDING * 2;
                const height = CHART_HEIGHT - 40;
                const stepX = width / (trendData.length - 1);
                const x = CHART_PADDING + i * stepX;
                const y = 20 + height - (d.attendance / 100) * height;
                
                return (
                  <Circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={4}
                    fill="#a855f7"
                  />
                );
              })}
              
              {/* X-axis labels */}
              {trendData.map((d, i) => {
                const width = CHART_WIDTH - CHART_PADDING * 2;
                const stepX = width / (trendData.length - 1);
                const x = CHART_PADDING + i * stepX;
                
                return (
                  <SvgText
                    key={i}
                    x={x}
                    y={CHART_HEIGHT - 5}
                    fill="#64748b"
                    fontSize={10}
                    textAnchor="middle"
                  >
                    {d.date}
                  </SvgText>
                );
              })}
              
              {/* Y-axis labels */}
              {[25, 50, 75, 100].map(v => {
                const y = 20 + (CHART_HEIGHT - 40) - ((v / 100) * (CHART_HEIGHT - 40));
                return (
                  <SvgText
                    key={v}
                    x={15}
                    y={y + 4}
                    fill="#64748b"
                    fontSize={10}
                    textAnchor="middle"
                  >
                    {v}%
                  </SvgText>
                );
              })}
            </Svg>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <ThemedText style={styles.sectionTitle}>Podsumowanie okresu</ThemedText>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <MaterialIcons name="sports-soccer" size={24} color="#22c55e" />
              <ThemedText style={styles.summaryValue}>
                {trendData.reduce((sum, d) => sum + d.goals, 0)}
              </ThemedText>
              <ThemedText style={styles.summaryLabel}>Bramki</ThemedText>
            </View>
            <View style={styles.summaryCard}>
              <MaterialIcons name="handshake" size={24} color="#3b82f6" />
              <ThemedText style={styles.summaryValue}>
                {trendData.reduce((sum, d) => sum + d.assists, 0)}
              </ThemedText>
              <ThemedText style={styles.summaryLabel}>Asysty</ThemedText>
            </View>
            <View style={styles.summaryCard}>
              <MaterialIcons name="star" size={24} color="#eab308" />
              <ThemedText style={styles.summaryValue}>
                {(trendData.reduce((sum, d) => sum + d.rating, 0) / trendData.length).toFixed(1)}
              </ThemedText>
              <ThemedText style={styles.summaryLabel}>Śr. ocena</ThemedText>
            </View>
            <View style={styles.summaryCard}>
              <MaterialIcons name="fitness-center" size={24} color="#a855f7" />
              <ThemedText style={styles.summaryValue}>
                {Math.round(trendData.reduce((sum, d) => sum + d.attendance, 0) / trendData.length)}%
              </ThemedText>
              <ThemedText style={styles.summaryLabel}>Frekwencja</ThemedText>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

// Import React for Fragment
import React from "react";

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
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primary + "30",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.primary,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  playerPosition: {
    fontSize: 13,
    color: "#64748b",
  },
  timeRangeContainer: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  timeRangeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Radius.sm,
  },
  timeRangeBtnActive: {
    backgroundColor: AppColors.primary,
  },
  timeRangeText: {
    fontSize: 13,
    color: "#64748b",
  },
  timeRangeTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  chartSection: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  chartValue: {
    alignItems: "flex-end",
  },
  chartValueText: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.primary,
  },
  chartValueLabel: {
    fontSize: 11,
    color: "#64748b",
  },
  chartLegend: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: "#64748b",
  },
  chartContainer: {
    alignItems: "center",
  },
  summarySection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  summaryCard: {
    width: "48%",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748b",
  },
});
