import { StyleSheet, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

export type ChangeType = "date" | "time" | "venue" | "cancelled";

interface ScheduleChangeCardProps {
  changeType: ChangeType;
  opponent: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

const CHANGE_CONFIG: Record<ChangeType, { icon: string; label: string; color: string }> = {
  date: { icon: "event", label: "Zmiana terminu", color: AppColors.warning },
  time: { icon: "schedule", label: "Zmiana godziny", color: AppColors.info },
  venue: { icon: "location-on", label: "Zmiana miejsca", color: AppColors.primary },
  cancelled: { icon: "cancel", label: "Mecz odwołany", color: AppColors.danger },
};

export function ScheduleChangeCard({
  changeType,
  opponent,
  oldValue,
  newValue,
  timestamp,
}: ScheduleChangeCardProps) {
  const cardBg = useThemeColor({ light: "#F5F5F5", dark: "#1C1C1E" }, "background");
  const borderColor = useThemeColor({ light: "#E0E0E0", dark: "#333" }, "icon");

  const config = CHANGE_CONFIG[changeType];

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: config.color + "20" }]}>
          <MaterialIcons name={config.icon as any} size={20} color={config.color} />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="defaultSemiBold" style={{ color: config.color }}>
            {config.label}
          </ThemedText>
          <ThemedText style={styles.opponent}>vs {opponent}</ThemedText>
        </View>
        <ThemedText style={styles.timestamp}>{formatTimestamp(timestamp)}</ThemedText>
      </View>

      {/* Change Comparison */}
      {changeType !== "cancelled" ? (
        <View style={styles.comparison}>
          {/* Old Value */}
          <View style={styles.valueBox}>
            <View style={[styles.valueBadge, { backgroundColor: AppColors.danger + "15" }]}>
              <MaterialIcons name="close" size={14} color={AppColors.danger} />
              <ThemedText style={[styles.valueLabel, { color: AppColors.danger }]}>
                Było
              </ThemedText>
            </View>
            <ThemedText style={styles.valueText}>{oldValue}</ThemedText>
          </View>

          {/* Arrow */}
          <View style={styles.arrowContainer}>
            <MaterialIcons name="arrow-forward" size={20} color={AppColors.textSecondary} />
          </View>

          {/* New Value */}
          <View style={styles.valueBox}>
            <View style={[styles.valueBadge, { backgroundColor: AppColors.success + "15" }]}>
              <MaterialIcons name="check" size={14} color={AppColors.success} />
              <ThemedText style={[styles.valueLabel, { color: AppColors.success }]}>
                Jest
              </ThemedText>
            </View>
            <ThemedText style={[styles.valueText, styles.newValue]}>{newValue}</ThemedText>
          </View>
        </View>
      ) : (
        <View style={[styles.cancelledBox, { backgroundColor: AppColors.danger + "10" }]}>
          <ThemedText style={styles.cancelledText}>
            Mecz zaplanowany na {oldValue} został odwołany
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  opponent: {
    fontSize: 13,
    opacity: 0.7,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.5,
  },
  comparison: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueBox: {
    flex: 1,
  },
  valueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  valueLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  valueText: {
    fontSize: 14,
    opacity: 0.8,
    textDecorationLine: "line-through",
  },
  newValue: {
    textDecorationLine: "none",
    fontWeight: "600",
    opacity: 1,
  },
  arrowContainer: {
    paddingHorizontal: Spacing.sm,
    paddingTop: 20,
  },
  cancelledBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  cancelledText: {
    fontSize: 14,
    color: AppColors.danger,
    textAlign: "center",
  },
});
