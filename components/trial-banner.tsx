import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View, StyleSheet, Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { AppColors } from "@/constants/theme";

interface TrialBannerProps {
  daysRemaining: number;
  isTrialExpired: boolean;
  requiresSubscription: boolean;
}

export function TrialBanner({ daysRemaining, isTrialExpired, requiresSubscription }: TrialBannerProps) {
  const router = useRouter();

  if (requiresSubscription) {
    return (
      <Pressable 
        style={[styles.banner, styles.expiredBanner]}
        onPress={() => router.push("/subscription" as any)}
      >
        <MaterialIcons name="lock" size={20} color="#fff" />
        <View style={styles.textContainer}>
          <ThemedText style={styles.expiredTitle}>Okres próbny zakończony</ThemedText>
          <ThemedText style={styles.expiredSubtitle}>
            Wykup subskrypcję aby edytować dane
          </ThemedText>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#fff" />
      </Pressable>
    );
  }

  if (isTrialExpired) {
    return null;
  }

  // Show trial banner with days remaining
  const isUrgent = daysRemaining <= 7;
  
  return (
    <Pressable 
      style={[styles.banner, isUrgent ? styles.urgentBanner : styles.trialBanner]}
      onPress={() => router.push("/subscription" as any)}
    >
      <MaterialIcons 
        name={isUrgent ? "warning" : "access-time"} 
        size={20} 
        color={isUrgent ? "#fff" : AppColors.textPrimary} 
      />
      <View style={styles.textContainer}>
        <ThemedText style={[styles.trialTitle, isUrgent && styles.urgentText]}>
          {isUrgent ? `Tylko ${daysRemaining} dni próbnych!` : `Okres próbny: ${daysRemaining} dni`}
        </ThemedText>
        <ThemedText style={[styles.trialSubtitle, isUrgent && styles.urgentSubtext]}>
          Dotknij aby zobaczyć plany subskrypcji
        </ThemedText>
      </View>
      <MaterialIcons 
        name="chevron-right" 
        size={24} 
        color={isUrgent ? "#fff" : AppColors.textSecondary} 
      />
    </Pressable>
  );
}

interface ReadOnlyBannerProps {
  onUpgrade: () => void;
}

export function ReadOnlyBanner({ onUpgrade }: ReadOnlyBannerProps) {
  return (
    <Pressable style={styles.readOnlyBanner} onPress={onUpgrade}>
      <MaterialIcons name="visibility" size={20} color={AppColors.warning} />
      <ThemedText style={styles.readOnlyText}>
        Tryb tylko do odczytu - wykup subskrypcję aby edytować
      </ThemedText>
      <MaterialIcons name="arrow-forward" size={20} color={AppColors.warning} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    gap: 12,
  },
  trialBanner: {
    backgroundColor: `${AppColors.primary}15`,
    borderWidth: 1,
    borderColor: `${AppColors.primary}30`,
  },
  urgentBanner: {
    backgroundColor: AppColors.warning,
  },
  expiredBanner: {
    backgroundColor: AppColors.danger,
  },
  textContainer: {
    flex: 1,
  },
  trialTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textPrimary,
  },
  trialSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  urgentText: {
    color: "#fff",
  },
  urgentSubtext: {
    color: "rgba(255,255,255,0.8)",
  },
  expiredTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  expiredSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  readOnlyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: `${AppColors.warning}15`,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: `${AppColors.warning}30`,
    gap: 8,
  },
  readOnlyText: {
    fontSize: 13,
    color: AppColors.warning,
    fontWeight: "500",
  },
});
