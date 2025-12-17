import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { AppColors, Spacing, Radius } from '@/constants/theme';
import { getLeagueTable, PzpnLeagueTable, PzpnTeamStanding } from '@/lib/pzpn-client';

interface LeagueTableProps {
  teamId: string;
  highlightTeamId?: string;
  compact?: boolean;
}

export function LeagueTable({ teamId, highlightTeamId, compact = false }: LeagueTableProps) {
  const [table, setTable] = useState<PzpnLeagueTable | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTable = async () => {
    try {
      setError(null);
      const data = await getLeagueTable(teamId);
      setTable(data);
    } catch (err) {
      setError('Nie udało się pobrać tabeli');
      console.error('League table error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTable();
  }, [teamId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTable();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <ThemedText style={styles.loadingText}>Ładowanie tabeli...</ThemedText>
      </View>
    );
  }

  if (error || !table) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={40} color={AppColors.danger} />
        <ThemedText style={styles.errorText}>{error || 'Brak danych'}</ThemedText>
        <Pressable style={styles.retryButton} onPress={fetchTable}>
          <ThemedText style={styles.retryButtonText}>Spróbuj ponownie</ThemedText>
        </Pressable>
      </View>
    );
  }

  const displayStandings = compact ? table.standings.slice(0, 6) : table.standings;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.leagueName}>{table.leagueName}</ThemedText>
          <ThemedText style={styles.season}>Sezon {table.season}</ThemedText>
        </View>
        <Pressable onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={AppColors.textSecondary} />
        </Pressable>
      </View>

      {/* Table */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />
        }
      >
        <View>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <ThemedText style={[styles.headerCell, styles.positionCell]}>#</ThemedText>
            <ThemedText style={[styles.headerCell, styles.teamCell]}>Drużyna</ThemedText>
            <ThemedText style={[styles.headerCell, styles.statCell]}>M</ThemedText>
            <ThemedText style={[styles.headerCell, styles.statCell]}>W</ThemedText>
            <ThemedText style={[styles.headerCell, styles.statCell]}>R</ThemedText>
            <ThemedText style={[styles.headerCell, styles.statCell]}>P</ThemedText>
            <ThemedText style={[styles.headerCell, styles.goalsCell]}>Bramki</ThemedText>
            <ThemedText style={[styles.headerCell, styles.statCell]}>Pkt</ThemedText>
            {!compact && <ThemedText style={[styles.headerCell, styles.formCell]}>Forma</ThemedText>}
          </View>

          {/* Table Rows */}
          {displayStandings.map((team, index) => (
            <TableRow
              key={team.teamId}
              team={team}
              isHighlighted={team.teamId === highlightTeamId}
              isEven={index % 2 === 0}
              compact={compact}
            />
          ))}
        </View>
      </ScrollView>

      {compact && table.standings.length > 6 && (
        <View style={styles.showMoreContainer}>
          <ThemedText style={styles.showMoreText}>
            + {table.standings.length - 6} więcej drużyn
          </ThemedText>
        </View>
      )}
    </View>
  );
}

interface TableRowProps {
  team: PzpnTeamStanding;
  isHighlighted: boolean;
  isEven: boolean;
  compact: boolean;
}

function TableRow({ team, isHighlighted, isEven, compact }: TableRowProps) {
  const getPositionStyle = () => {
    if (team.position <= 2) return styles.positionPromotion;
    if (team.position >= 15) return styles.positionRelegation;
    return null;
  };

  return (
    <View
      style={[
        styles.tableRow,
        isEven && styles.tableRowEven,
        isHighlighted && styles.tableRowHighlighted,
      ]}
    >
      <View style={styles.positionCellContainer}>
        <View style={[styles.positionBadge, getPositionStyle()]}>
          <ThemedText style={styles.positionText}>{team.position}</ThemedText>
        </View>
      </View>
      <ThemedText
        style={[styles.cell, styles.teamCell, isHighlighted && styles.highlightedText]}
        numberOfLines={1}
      >
        {team.teamName}
      </ThemedText>
      <ThemedText style={[styles.cell, styles.statCell]}>{team.matches}</ThemedText>
      <ThemedText style={[styles.cell, styles.statCell]}>{team.wins}</ThemedText>
      <ThemedText style={[styles.cell, styles.statCell]}>{team.draws}</ThemedText>
      <ThemedText style={[styles.cell, styles.statCell]}>{team.losses}</ThemedText>
      <ThemedText style={[styles.cell, styles.goalsCell]}>
        {team.goalsFor}:{team.goalsAgainst}
      </ThemedText>
      <ThemedText style={[styles.cell, styles.statCell, styles.pointsCell]}>
        {team.points}
      </ThemedText>
      {!compact && (
        <View style={[styles.formContainer]}>
          {team.form.map((result, i) => (
            <View
              key={i}
              style={[
                styles.formBadge,
                result === 'W' && styles.formWin,
                result === 'D' && styles.formDraw,
                result === 'L' && styles.formLoss,
              ]}
            >
              <ThemedText style={styles.formText}>{result}</ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: AppColors.textSecondary,
  },
  errorContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorText: {
    color: AppColors.danger,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  season: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  refreshButton: {
    padding: Spacing.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: AppColors.bgElevated,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: `${AppColors.bgElevated}50`,
  },
  tableRowHighlighted: {
    backgroundColor: `${AppColors.primary}20`,
  },
  cell: {
    fontSize: 13,
    color: AppColors.textPrimary,
    textAlign: 'center',
  },
  highlightedText: {
    fontWeight: '700',
    color: AppColors.primary,
  },
  positionCell: {
    width: 36,
  },
  positionCellContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamCell: {
    width: 140,
    textAlign: 'left',
    paddingLeft: Spacing.sm,
  },
  statCell: {
    width: 32,
  },
  goalsCell: {
    width: 50,
  },
  formCell: {
    width: 100,
  },
  pointsCell: {
    fontWeight: '700',
  },
  positionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionPromotion: {
    backgroundColor: AppColors.success,
  },
  positionRelegation: {
    backgroundColor: AppColors.danger,
  },
  positionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  formContainer: {
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
  },
  formBadge: {
    width: 18,
    height: 18,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formWin: {
    backgroundColor: AppColors.success,
  },
  formDraw: {
    backgroundColor: AppColors.warning,
  },
  formLoss: {
    backgroundColor: AppColors.danger,
  },
  formText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  showMoreContainer: {
    padding: Spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
  },
  showMoreText: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
});
