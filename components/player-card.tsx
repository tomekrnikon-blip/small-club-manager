import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { AppColors, Spacing, Radius } from "@/constants/theme";

interface PlayerCardProps {
  playerId: number;
  name: string;
  position?: string;
  number?: number;
  teamName?: string;
  imageUrl?: string;
  stats?: {
    goals?: number;
    assists?: number;
    attendance?: number;
    rating?: number;
  };
  variant?: "compact" | "default" | "detailed";
  showArrow?: boolean;
  onPress?: () => void;
}

export function PlayerCard({
  playerId,
  name,
  position,
  number,
  teamName,
  stats,
  variant = "default",
  showArrow = true,
  onPress,
}: PlayerCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/player/${playerId}` as any);
    }
  };

  const getPositionColor = (pos?: string) => {
    switch (pos?.toLowerCase()) {
      case "bramkarz":
      case "gk":
        return "#f59e0b";
      case "obrońca":
      case "def":
        return "#3b82f6";
      case "pomocnik":
      case "mid":
        return "#22c55e";
      case "napastnik":
      case "fwd":
        return "#ef4444";
      default:
        return "#64748b";
    }
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  if (variant === "compact") {
    return (
      <Pressable style={styles.compactContainer} onPress={handlePress}>
        <View style={[styles.compactAvatar, { backgroundColor: getPositionColor(position) + "30" }]}>
          <ThemedText style={[styles.compactInitials, { color: getPositionColor(position) }]}>
            {number || getInitials(name)}
          </ThemedText>
        </View>
        <ThemedText style={styles.compactName} numberOfLines={1}>
          {name}
        </ThemedText>
      </Pressable>
    );
  }

  if (variant === "detailed") {
    return (
      <Pressable style={styles.detailedContainer} onPress={handlePress}>
        <View style={[styles.avatar, { backgroundColor: getPositionColor(position) + "20" }]}>
          <ThemedText style={[styles.initials, { color: getPositionColor(position) }]}>
            {getInitials(name)}
          </ThemedText>
          {number && (
            <View style={styles.numberBadge}>
              <ThemedText style={styles.numberText}>{number}</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <ThemedText style={styles.name}>{name}</ThemedText>
          <View style={styles.metaRow}>
            {position && (
              <View style={[styles.positionBadge, { backgroundColor: getPositionColor(position) + "20" }]}>
                <ThemedText style={[styles.positionText, { color: getPositionColor(position) }]}>
                  {position}
                </ThemedText>
              </View>
            )}
            {teamName && <ThemedText style={styles.teamName}>{teamName}</ThemedText>}
          </View>

          {stats && (
            <View style={styles.statsRow}>
              {stats.goals !== undefined && (
                <View style={styles.statItem}>
                  <MaterialIcons name="sports-soccer" size={14} color="#64748b" />
                  <ThemedText style={styles.statValue}>{stats.goals}</ThemedText>
                </View>
              )}
              {stats.assists !== undefined && (
                <View style={styles.statItem}>
                  <MaterialIcons name="handshake" size={14} color="#64748b" />
                  <ThemedText style={styles.statValue}>{stats.assists}</ThemedText>
                </View>
              )}
              {stats.attendance !== undefined && (
                <View style={styles.statItem}>
                  <MaterialIcons name="check-circle" size={14} color="#64748b" />
                  <ThemedText style={styles.statValue}>{stats.attendance}%</ThemedText>
                </View>
              )}
              {stats.rating !== undefined && (
                <View style={styles.statItem}>
                  <MaterialIcons name="star" size={14} color="#f59e0b" />
                  <ThemedText style={styles.statValue}>{stats.rating.toFixed(1)}</ThemedText>
                </View>
              )}
            </View>
          )}
        </View>

        {showArrow && <MaterialIcons name="chevron-right" size={24} color="#64748b" />}
      </Pressable>
    );
  }

  // Default variant
  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={[styles.avatar, { backgroundColor: getPositionColor(position) + "20" }]}>
        <ThemedText style={[styles.initials, { color: getPositionColor(position) }]}>
          {getInitials(name)}
        </ThemedText>
        {number && (
          <View style={styles.numberBadge}>
            <ThemedText style={styles.numberText}>{number}</ThemedText>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <ThemedText style={styles.name}>{name}</ThemedText>
        {(position || teamName) && (
          <ThemedText style={styles.subtitle}>
            {[position, teamName].filter(Boolean).join(" • ")}
          </ThemedText>
        )}
      </View>

      {showArrow && <MaterialIcons name="chevron-right" size={24} color="#64748b" />}
    </Pressable>
  );
}

// List item variant for FlatList
export function PlayerListItem({
  player,
  onPress,
}: {
  player: {
    id: number;
    firstName: string;
    lastName: string;
    position?: string | null;
    jerseyNumber?: number | null;
  };
  onPress?: () => void;
}) {
  return (
    <PlayerCard
      playerId={player.id}
      name={`${player.firstName} ${player.lastName}`}
      position={player.position || undefined}
      number={player.jerseyNumber || undefined}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  detailedContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  compactContainer: {
    alignItems: "center",
    padding: Spacing.sm,
    minWidth: 70,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    fontSize: 16,
    fontWeight: "700",
  },
  compactInitials: {
    fontSize: 14,
    fontWeight: "700",
  },
  numberBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  numberText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  infoContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  compactName: {
    fontSize: 12,
    color: "#fff",
    marginTop: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  positionText: {
    fontSize: 11,
    fontWeight: "600",
  },
  teamName: {
    fontSize: 12,
    color: "#64748b",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    color: "#94a3b8",
  },
});
