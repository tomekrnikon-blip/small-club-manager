/**
 * Automatic Awards Service
 * Detects milestone achievements and automatically awards badges to players
 */

// Milestone thresholds for automatic awards
const MILESTONES = {
  goals: [5, 10, 25, 50, 100],
  assists: [5, 10, 25, 50],
  attendance: [10, 25, 50, 100],
  cleanSheets: [5, 10, 25],
  minutesPlayed: [500, 1000, 2500, 5000],
  rating: [4.0, 4.5, 4.8],
};

// Badge definitions for each milestone
const BADGE_DEFINITIONS: Record<string, Record<number, { name: string; icon: string; description: string }>> = {
  goals: {
    5: { name: "Strzelec", icon: "⚽", description: "Strzelił 5 bramek" },
    10: { name: "Snajper", icon: "🎯", description: "Strzelił 10 bramek" },
    25: { name: "Kanonir", icon: "💥", description: "Strzelił 25 bramek" },
    50: { name: "Legenda", icon: "🏆", description: "Strzelił 50 bramek" },
    100: { name: "Złota Piłka", icon: "🥇", description: "Strzelił 100 bramek" },
  },
  assists: {
    5: { name: "Asystent", icon: "🤝", description: "Zaliczył 5 asyst" },
    10: { name: "Rozgrywający", icon: "🎭", description: "Zaliczył 10 asyst" },
    25: { name: "Kreator", icon: "✨", description: "Zaliczył 25 asyst" },
    50: { name: "Mistrz podań", icon: "👑", description: "Zaliczył 50 asyst" },
  },
  attendance: {
    10: { name: "Regularny", icon: "📅", description: "Obecny na 10 zajęciach" },
    25: { name: "Zaangażowany", icon: "💪", description: "Obecny na 25 zajęciach" },
    50: { name: "Niezawodny", icon: "🔥", description: "Obecny na 50 zajęciach" },
    100: { name: "Żelazny", icon: "🛡️", description: "Obecny na 100 zajęciach" },
  },
  cleanSheets: {
    5: { name: "Czyste konto", icon: "🧤", description: "5 meczów bez straty gola" },
    10: { name: "Mur", icon: "🧱", description: "10 meczów bez straty gola" },
    25: { name: "Niepokonany", icon: "🏰", description: "25 meczów bez straty gola" },
  },
  minutesPlayed: {
    500: { name: "Debiutant", icon: "⏱️", description: "500 minut na boisku" },
    1000: { name: "Podstawowy", icon: "⚡", description: "1000 minut na boisku" },
    2500: { name: "Weteran", icon: "🎖️", description: "2500 minut na boisku" },
    5000: { name: "Legenda klubu", icon: "🏅", description: "5000 minut na boisku" },
  },
  rating: {
    4: { name: "Dobry zawodnik", icon: "⭐", description: "Średnia ocena 4.0+" },
    4.5: { name: "Wyróżniający się", icon: "🌟", description: "Średnia ocena 4.5+" },
    4.8: { name: "Gwiazda", icon: "💫", description: "Średnia ocena 4.8+" },
  },
};

export interface PlayerStats {
  playerId: number;
  goals: number;
  assists: number;
  attendance: number;
  cleanSheets: number;
  minutesPlayed: number;
  averageRating: number;
}

/**
 * Check if player has reached any new milestones
 * Returns list of newly achieved badges
 */
export function checkMilestones(
  stats: PlayerStats,
  existingAchievements: string[] = []
): { badge: string; icon: string; description: string }[] {
  const newAchievements: { badge: string; icon: string; description: string }[] = [];

  const categoryValues: { category: string; value: number }[] = [
    { category: "goals", value: stats.goals },
    { category: "assists", value: stats.assists },
    { category: "attendance", value: stats.attendance },
    { category: "cleanSheets", value: stats.cleanSheets },
    { category: "minutesPlayed", value: stats.minutesPlayed },
  ];

  for (const { category, value } of categoryValues) {
    const thresholds = MILESTONES[category as keyof typeof MILESTONES] as number[];
    
    for (const threshold of thresholds) {
      if (value >= threshold) {
        const badge = BADGE_DEFINITIONS[category]?.[threshold];
        if (badge && !existingAchievements.includes(badge.name)) {
          newAchievements.push({
            badge: badge.name,
            icon: badge.icon,
            description: badge.description,
          });
        }
      }
    }
  }

  // Check rating milestones
  for (const threshold of MILESTONES.rating) {
    if (stats.averageRating >= threshold) {
      const key = threshold === 4.0 ? 4 : threshold;
      const badge = BADGE_DEFINITIONS.rating?.[key];
      if (badge && !existingAchievements.includes(badge.name)) {
        newAchievements.push({
          badge: badge.name,
          icon: badge.icon,
          description: badge.description,
        });
      }
    }
  }

  return newAchievements;
}

/**
 * Get next milestone for a player in each category
 */
export function getNextMilestones(stats: PlayerStats): {
  category: string;
  categoryLabel: string;
  current: number;
  next: number;
  progress: number;
}[] {
  const nextMilestones: {
    category: string;
    categoryLabel: string;
    current: number;
    next: number;
    progress: number;
  }[] = [];

  const categoryLabels: Record<string, string> = {
    goals: "Bramki",
    assists: "Asysty",
    attendance: "Obecność",
    cleanSheets: "Czyste konta",
    minutesPlayed: "Minuty",
  };

  const categoryValues: { category: keyof typeof MILESTONES; value: number }[] = [
    { category: "goals", value: stats.goals },
    { category: "assists", value: stats.assists },
    { category: "attendance", value: stats.attendance },
    { category: "cleanSheets", value: stats.cleanSheets },
    { category: "minutesPlayed", value: stats.minutesPlayed },
  ];

  for (const { category, value } of categoryValues) {
    const thresholds = MILESTONES[category] as number[];
    const nextThreshold = thresholds.find(t => t > value);
    
    if (nextThreshold) {
      const prevThreshold = thresholds[thresholds.indexOf(nextThreshold) - 1] || 0;
      const progress = ((value - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
      
      nextMilestones.push({
        category,
        categoryLabel: categoryLabels[category] || category,
        current: value,
        next: nextThreshold,
        progress: Math.min(Math.max(progress, 0), 100),
      });
    }
  }

  return nextMilestones;
}

/**
 * Get all available badges
 */
export function getAllBadges(): {
  category: string;
  threshold: number;
  name: string;
  icon: string;
  description: string;
}[] {
  const badges: {
    category: string;
    threshold: number;
    name: string;
    icon: string;
    description: string;
  }[] = [];

  for (const [category, thresholds] of Object.entries(BADGE_DEFINITIONS)) {
    for (const [threshold, badge] of Object.entries(thresholds)) {
      badges.push({
        category,
        threshold: Number(threshold),
        name: badge.name,
        icon: badge.icon,
        description: badge.description,
      });
    }
  }

  return badges;
}

/**
 * Format notification message for new achievement
 */
export function formatAchievementNotification(
  playerName: string,
  badge: { badge: string; icon: string; description: string }
): string {
  return `${badge.icon} ${playerName} zdobył odznakę "${badge.badge}" - ${badge.description}`;
}
