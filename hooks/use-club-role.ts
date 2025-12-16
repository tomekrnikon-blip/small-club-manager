import { trpc } from "@/lib/trpc";

export type ClubRole = "manager" | "board_member" | "board_member_finance" | "coach" | "player";

export interface ClubPermissions {
  canManageMembers: boolean;
  canRemoveManager: boolean;
  canEditClub: boolean;
  canViewFinances: boolean;
  canEditFinances: boolean;
  canEditPlayers: boolean;
  canEditMatches: boolean;
  canEditTrainings: boolean;
  canManageCallups: boolean;
  canInviteUsers: boolean;
  canAssignRoles: boolean;
}

const DEFAULT_PERMISSIONS: ClubPermissions = {
  canManageMembers: false,
  canRemoveManager: false,
  canEditClub: false,
  canViewFinances: false,
  canEditFinances: false,
  canEditPlayers: false,
  canEditMatches: false,
  canEditTrainings: false,
  canManageCallups: false,
  canInviteUsers: false,
  canAssignRoles: false,
};

export const ROLE_LABELS: Record<ClubRole, string> = {
  manager: "Manager",
  board_member: "Członek Zarządu",
  board_member_finance: "Członek Zarządu (Finanse)",
  coach: "Trener",
  player: "Zawodnik",
};

export function useClubRole(clubId: number | undefined) {
  const { data, isLoading, error } = trpc.clubMembers.getMyRole.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId }
  );

  return {
    role: data?.role as ClubRole | undefined,
    permissions: data?.permissions || DEFAULT_PERMISSIONS,
    isOwner: data?.isOwner || false,
    hasAccess: data?.hasAccess || false,
    isLoading,
    error,
  };
}

export function getRoleLabel(role: ClubRole | undefined): string {
  if (!role) return "Brak roli";
  return ROLE_LABELS[role] || role;
}
