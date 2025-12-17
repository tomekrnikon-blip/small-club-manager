import * as db from "../db";

const TRIAL_DURATION_DAYS = 30;

export interface TrialStatus {
  isInTrial: boolean;
  isTrialExpired: boolean;
  hasActiveSubscription: boolean;
  canEdit: boolean;
  daysRemaining: number;
  trialEndDate: Date | null;
  showAds: boolean;
  requiresSubscription: boolean;
}

/**
 * Calculate trial end date from start date
 */
export function calculateTrialEndDate(startDate: Date): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS);
  return endDate;
}

/**
 * Get trial status for a club
 */
export async function getTrialStatus(clubId: number, userId: number): Promise<TrialStatus> {
  const club = await db.getClubById(clubId);
  if (!club) {
    return {
      isInTrial: false,
      isTrialExpired: true,
      hasActiveSubscription: false,
      canEdit: false,
      daysRemaining: 0,
      trialEndDate: null,
      showAds: true,
      requiresSubscription: true,
    };
  }

  // Check if user has active subscription
  const user = await db.getUserById(userId);
  const hasActiveSubscription = user?.isPro === true;

  // Calculate trial dates
  const trialStartDate = club.trialStartDate || club.createdAt;
  const trialEndDate = club.trialEndDate || calculateTrialEndDate(trialStartDate);
  const now = new Date();
  
  const isTrialExpired = now > trialEndDate;
  const isInTrial = !isTrialExpired && club.isTrialActive;
  
  // Calculate days remaining
  const msRemaining = trialEndDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  // Determine if user can edit
  // Can edit if: in trial OR has active subscription
  const canEdit = isInTrial || hasActiveSubscription;

  // Show ads during trial, no ads with subscription
  const showAds = !hasActiveSubscription;

  // Requires subscription if trial expired and no subscription
  const requiresSubscription = isTrialExpired && !hasActiveSubscription;

  return {
    isInTrial,
    isTrialExpired,
    hasActiveSubscription,
    canEdit,
    daysRemaining,
    trialEndDate,
    showAds,
    requiresSubscription,
  };
}

/**
 * Initialize trial period for a new club
 */
export async function initializeTrialPeriod(clubId: number): Promise<void> {
  const now = new Date();
  const trialEndDate = calculateTrialEndDate(now);
  
  await db.updateClub(clubId, {
    trialStartDate: now,
    trialEndDate: trialEndDate,
    isTrialActive: true,
    subscriptionRequired: false,
  });
}

/**
 * Check and update expired trials (called by cron job)
 */
export async function processExpiredTrials(): Promise<{ processed: number; expired: number }> {
  const allClubs = await db.getAllClubs();
  const now = new Date();
  let processed = 0;
  let expired = 0;

  for (const club of allClubs) {
    processed++;
    
    // Skip clubs that already have subscription required flag
    if (club.subscriptionRequired) continue;
    
    // Skip clubs without trial dates
    if (!club.trialStartDate) continue;
    
    const trialEndDate = club.trialEndDate || calculateTrialEndDate(club.trialStartDate);
    
    if (now > trialEndDate && club.isTrialActive) {
      // Trial has expired
      await db.updateClub(club.id, {
        isTrialActive: false,
        subscriptionRequired: true,
      });
      
      // Send notification to club owner if not already notified
      if (!club.trialExpiredNotified) {
        await db.createNotification({
          clubId: club.id,
          userId: club.userId,
          type: "general",
          title: "Okres próbny zakończony",
          message: "Twój 30-dniowy okres próbny dobiegł końca. Wykup subskrypcję aby kontynuować edycję danych klubu.",
        });
        
        await db.updateClub(club.id, {
          trialExpiredNotified: true,
        });
      }
      
      expired++;
    }
  }

  return { processed, expired };
}

/**
 * Extend trial period (admin function)
 */
export async function extendTrialPeriod(clubId: number, additionalDays: number): Promise<void> {
  const club = await db.getClubById(clubId);
  if (!club) return;

  const currentEndDate = club.trialEndDate || calculateTrialEndDate(club.trialStartDate || club.createdAt);
  const newEndDate = new Date(currentEndDate);
  newEndDate.setDate(newEndDate.getDate() + additionalDays);

  await db.updateClub(clubId, {
    trialEndDate: newEndDate,
    isTrialActive: true,
    subscriptionRequired: false,
    trialExpiredNotified: false,
  });
}

/**
 * Activate subscription for a club (removes trial restrictions)
 */
export async function activateSubscription(userId: number): Promise<void> {
  // Update user's isPro status
  await db.updateUser(userId, {
    isPro: true,
  });
}

/**
 * Check if action is allowed based on trial/subscription status
 */
export async function canPerformEditAction(clubId: number, userId: number): Promise<{ allowed: boolean; reason?: string }> {
  const status = await getTrialStatus(clubId, userId);
  
  if (status.canEdit) {
    return { allowed: true };
  }
  
  if (status.requiresSubscription) {
    return { 
      allowed: false, 
      reason: "Okres próbny zakończony. Wykup subskrypcję aby edytować dane klubu." 
    };
  }
  
  return { 
    allowed: false, 
    reason: "Brak uprawnień do edycji." 
  };
}


/**
 * Send reminders to clubs whose trial is about to expire (7 days, 3 days, 1 day before)
 */
export async function sendTrialExpirationReminders(): Promise<{ sent: number; skipped: number }> {
  const allClubs = await db.getAllClubs();
  const now = new Date();
  let sent = 0;
  let skipped = 0;

  for (const club of allClubs) {
    // Skip clubs without active trial
    if (!club.isTrialActive || !club.trialEndDate) {
      skipped++;
      continue;
    }

    // Calculate days remaining
    const msRemaining = club.trialEndDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    // Send reminders at 7, 3, and 1 day(s) before expiration
    const reminderDays = [7, 3, 1];
    
    if (reminderDays.includes(daysRemaining)) {
      // Send reminder notification
      let message = "";
      if (daysRemaining === 7) {
        message = "Twój okres próbny kończy się za 7 dni. Wykup subskrypcję aby zachować pełny dostęp do wszystkich funkcji.";
      } else if (daysRemaining === 3) {
        message = "Pozostały tylko 3 dni okresu próbnego! Nie czekaj - wykup subskrypcję już teraz.";
      } else if (daysRemaining === 1) {
        message = "OSTATNI DZIEŃ okresu próbnego! Jutro stracisz możliwość edycji danych. Wykup subskrypcję aby kontynuować.";
      }

      await db.createNotification({
        clubId: club.id,
        userId: club.userId,
        type: "general",
        title: `Okres próbny kończy się za ${daysRemaining} ${daysRemaining === 1 ? 'dzień' : 'dni'}`,
        message: message,
      });

      sent++;
    }
  }

  return { sent, skipped };
}
