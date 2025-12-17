/**
 * Goal Notification Service
 * Tracks player goal progress and sends notifications when milestones are reached
 */

import { getDb } from "../db";
import { trainingGoals } from "../../drizzle/schema";
import { eq, and, lt, gte } from "drizzle-orm";

interface GoalProgress {
  goalId: number;
  playerId: number;
  title: string;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  milestone: "approaching" | "almost" | "completed" | null;
}

/**
 * Check goal progress and determine if notification should be sent
 */
export function checkGoalMilestone(
  currentValue: number,
  targetValue: number,
  previousValue: number
): "approaching" | "almost" | "completed" | null {
  const currentPercent = (currentValue / targetValue) * 100;
  const previousPercent = (previousValue / targetValue) * 100;

  // Check if goal was just completed
  if (currentValue >= targetValue && previousValue < targetValue) {
    return "completed";
  }

  // Check if crossed 90% threshold
  if (currentPercent >= 90 && previousPercent < 90) {
    return "almost";
  }

  // Check if crossed 75% threshold
  if (currentPercent >= 75 && previousPercent < 75) {
    return "approaching";
  }

  return null;
}

/**
 * Get notification message based on milestone
 */
export function getGoalNotificationMessage(
  milestone: "approaching" | "almost" | "completed",
  goalTitle: string,
  currentValue: number,
  targetValue: number
): { title: string; body: string } {
  switch (milestone) {
    case "approaching":
      return {
        title: "🎯 Zbliżasz się do celu!",
        body: `Osiągnąłeś 75% celu "${goalTitle}" (${currentValue}/${targetValue})`,
      };
    case "almost":
      return {
        title: "🔥 Prawie na miejscu!",
        body: `Jesteś o krok od celu "${goalTitle}" (${currentValue}/${targetValue})`,
      };
    case "completed":
      return {
        title: "🏆 Cel osiągnięty!",
        body: `Gratulacje! Ukończyłeś cel "${goalTitle}"!`,
      };
  }
}

/**
 * Update goal progress and check for notifications
 */
export async function updateGoalProgress(
  goalId: number,
  newValue: number
): Promise<GoalProgress | null> {
  try {
    // Get current goal
    const db = await getDb();
    if (!db) return null;
    const goals = await db
      .select()
      .from(trainingGoals)
      .where(eq(trainingGoals.id, goalId));

    if (goals.length === 0) {
      return null;
    }

    const goal = goals[0];
    const previousValue = goal.currentValue;

    // Update goal value
    await db
      .update(trainingGoals)
      .set({
        currentValue: newValue,
        status: newValue >= goal.targetValue ? "completed" : "active",
        completedAt: newValue >= goal.targetValue ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(trainingGoals.id, goalId));

    // Check for milestone
    const milestone = checkGoalMilestone(newValue, goal.targetValue, previousValue);

    return {
      goalId: goal.id,
      playerId: goal.playerId,
      title: goal.title,
      currentValue: newValue,
      targetValue: goal.targetValue,
      progressPercent: Math.min((newValue / goal.targetValue) * 100, 100),
      milestone,
    };
  } catch (error) {
    console.error("[GoalNotification] Error updating goal progress:", error);
    return null;
  }
}

/**
 * Get all active goals for a player
 */
export async function getPlayerActiveGoals(playerId: number): Promise<GoalProgress[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    const goals = await db
      .select()
      .from(trainingGoals)
      .where(
        and(
          eq(trainingGoals.playerId, playerId),
          eq(trainingGoals.status, "active")
        )
      );

    return goals.map((goal: any) => ({
      goalId: goal.id,
      playerId: goal.playerId,
      title: goal.title,
      currentValue: goal.currentValue,
      targetValue: goal.targetValue,
      progressPercent: Math.min((goal.currentValue / goal.targetValue) * 100, 100),
      milestone: null,
    }));
  } catch (error) {
    console.error("[GoalNotification] Error getting player goals:", error);
    return [];
  }
}

/**
 * Check all goals approaching deadline
 */
export async function checkGoalsNearDeadline(daysAhead: number = 7): Promise<GoalProgress[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const goals = await db
      .select()
      .from(trainingGoals)
      .where(
        and(
          eq(trainingGoals.status, "active"),
          lt(trainingGoals.endDate, futureDate),
          gte(trainingGoals.endDate, new Date())
        )
      );

    return goals.map((goal: any) => ({
      goalId: goal.id,
      playerId: goal.playerId,
      title: goal.title,
      currentValue: goal.currentValue,
      targetValue: goal.targetValue,
      progressPercent: Math.min((goal.currentValue / goal.targetValue) * 100, 100),
      milestone: null,
    }));
  } catch (error) {
    console.error("[GoalNotification] Error checking goals near deadline:", error);
    return [];
  }
}
