import { createContext, useContext } from "react";
import { trpc } from "@/lib/trpc";

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

const defaultStatus: TrialStatus = {
  isInTrial: true,
  isTrialExpired: false,
  hasActiveSubscription: false,
  canEdit: true,
  daysRemaining: 30,
  trialEndDate: null,
  showAds: true,
  requiresSubscription: false,
};

export function useTrialStatus(clubId: number | undefined) {
  const { data, isLoading, refetch } = trpc.trial.getStatus.useQuery(
    { clubId: clubId || 0 },
    { 
      enabled: !!clubId && clubId > 0,
      staleTime: 60000, // Cache for 1 minute
    }
  );

  const status: TrialStatus = data ? {
    ...data,
    trialEndDate: data.trialEndDate ? new Date(data.trialEndDate) : null,
  } : defaultStatus;

  return {
    ...status,
    isLoading,
    refetch,
  };
}

export function useCanEdit(clubId: number | undefined) {
  const { data, isLoading } = trpc.trial.canEdit.useQuery(
    { clubId: clubId || 0 },
    { 
      enabled: !!clubId && clubId > 0,
      staleTime: 60000,
    }
  );

  return {
    canEdit: data?.allowed ?? true,
    reason: data?.reason,
    isLoading,
  };
}
