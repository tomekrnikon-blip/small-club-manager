/**
 * Notification Segmentation Service
 * 
 * Provides functionality to target notifications to specific user groups
 * such as parents, coaches, players, and custom segments.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SEGMENTS_KEY = 'notification_segments';
const USER_SEGMENTS_KEY = 'user_segment_memberships';

export type UserRole = 'owner' | 'admin' | 'coach' | 'player' | 'parent' | 'viewer';

export type SegmentType = 
  | 'role'      // Based on user role
  | 'team'      // Based on team membership
  | 'age'       // Based on player age group
  | 'custom';   // Custom defined segment

export type NotificationSegment = {
  id: string;
  name: string;
  description: string;
  type: SegmentType;
  criteria: SegmentCriteria;
  userCount: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
};

export type SegmentCriteria = {
  roles?: UserRole[];
  teamIds?: number[];
  ageGroups?: string[];  // e.g., 'U10', 'U12', 'U14'
  customUserIds?: number[];
  hasProSubscription?: boolean;
  joinedAfter?: string;
  joinedBefore?: string;
};

export type TargetedNotification = {
  id: string;
  title: string;
  body: string;
  segmentIds: string[];
  scheduledAt?: string;
  sentAt?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  stats: {
    targetedUsers: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
};

// Predefined segments
export const PREDEFINED_SEGMENTS: Omit<NotificationSegment, 'userCount' | 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'seg_all_users',
    name: 'Wszyscy użytkownicy',
    description: 'Wszyscy zarejestrowani użytkownicy',
    type: 'role',
    criteria: {},
    isActive: true,
  },
  {
    id: 'seg_coaches',
    name: 'Trenerzy',
    description: 'Użytkownicy z rolą trenera',
    type: 'role',
    criteria: { roles: ['coach'] },
    isActive: true,
  },
  {
    id: 'seg_players',
    name: 'Zawodnicy',
    description: 'Użytkownicy z rolą zawodnika',
    type: 'role',
    criteria: { roles: ['player'] },
    isActive: true,
  },
  {
    id: 'seg_parents',
    name: 'Rodzice',
    description: 'Użytkownicy z rolą rodzica',
    type: 'role',
    criteria: { roles: ['parent'] },
    isActive: true,
  },
  {
    id: 'seg_admins',
    name: 'Administratorzy',
    description: 'Właściciele i administratorzy klubów',
    type: 'role',
    criteria: { roles: ['owner', 'admin'] },
    isActive: true,
  },
  {
    id: 'seg_pro_users',
    name: 'Użytkownicy PRO',
    description: 'Użytkownicy z aktywną subskrypcją PRO',
    type: 'custom',
    criteria: { hasProSubscription: true },
    isActive: true,
  },
];

/**
 * Get all notification segments
 */
export async function getAllSegments(): Promise<NotificationSegment[]> {
  try {
    const value = await AsyncStorage.getItem(SEGMENTS_KEY);
    const customSegments: NotificationSegment[] = value ? JSON.parse(value) : [];
    
    // Combine predefined and custom segments
    const predefinedWithMeta = PREDEFINED_SEGMENTS.map((seg) => ({
      ...seg,
      userCount: 0, // Would be calculated from actual user data
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    return [...predefinedWithMeta, ...customSegments];
  } catch {
    return PREDEFINED_SEGMENTS.map((seg) => ({
      ...seg,
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }
}

/**
 * Get segment by ID
 */
export async function getSegment(segmentId: string): Promise<NotificationSegment | null> {
  const segments = await getAllSegments();
  return segments.find((s) => s.id === segmentId) || null;
}

/**
 * Create a custom segment
 */
export async function createSegment(
  name: string,
  description: string,
  type: SegmentType,
  criteria: SegmentCriteria
): Promise<NotificationSegment> {
  const segment: NotificationSegment = {
    id: `seg_custom_${Date.now()}`,
    name,
    description,
    type,
    criteria,
    userCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  try {
    const value = await AsyncStorage.getItem(SEGMENTS_KEY);
    const segments: NotificationSegment[] = value ? JSON.parse(value) : [];
    segments.push(segment);
    await AsyncStorage.setItem(SEGMENTS_KEY, JSON.stringify(segments));
  } catch (error) {
    console.error('[Segments] Error creating segment:', error);
  }

  return segment;
}

/**
 * Update a segment
 */
export async function updateSegment(
  segmentId: string,
  updates: Partial<Omit<NotificationSegment, 'id' | 'createdAt'>>
): Promise<NotificationSegment | null> {
  try {
    const value = await AsyncStorage.getItem(SEGMENTS_KEY);
    const segments: NotificationSegment[] = value ? JSON.parse(value) : [];
    
    const index = segments.findIndex((s) => s.id === segmentId);
    if (index === -1) return null;
    
    segments[index] = {
      ...segments[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(SEGMENTS_KEY, JSON.stringify(segments));
    return segments[index];
  } catch (error) {
    console.error('[Segments] Error updating segment:', error);
    return null;
  }
}

/**
 * Delete a segment
 */
export async function deleteSegment(segmentId: string): Promise<boolean> {
  // Cannot delete predefined segments
  if (PREDEFINED_SEGMENTS.some((s) => s.id === segmentId)) {
    return false;
  }

  try {
    const value = await AsyncStorage.getItem(SEGMENTS_KEY);
    const segments: NotificationSegment[] = value ? JSON.parse(value) : [];
    const filtered = segments.filter((s) => s.id !== segmentId);
    await AsyncStorage.setItem(SEGMENTS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('[Segments] Error deleting segment:', error);
    return false;
  }
}

/**
 * Check if a user matches segment criteria
 */
export function userMatchesSegment(
  user: {
    id: number;
    role?: UserRole;
    teamIds?: number[];
    ageGroup?: string;
    hasProSubscription?: boolean;
    joinedAt?: string;
  },
  criteria: SegmentCriteria
): boolean {
  // Empty criteria matches all users
  if (Object.keys(criteria).length === 0) {
    return true;
  }

  // Check role
  if (criteria.roles && criteria.roles.length > 0) {
    if (!user.role || !criteria.roles.includes(user.role)) {
      return false;
    }
  }

  // Check team membership
  if (criteria.teamIds && criteria.teamIds.length > 0) {
    if (!user.teamIds || !user.teamIds.some((id) => criteria.teamIds!.includes(id))) {
      return false;
    }
  }

  // Check age group
  if (criteria.ageGroups && criteria.ageGroups.length > 0) {
    if (!user.ageGroup || !criteria.ageGroups.includes(user.ageGroup)) {
      return false;
    }
  }

  // Check custom user IDs
  if (criteria.customUserIds && criteria.customUserIds.length > 0) {
    if (!criteria.customUserIds.includes(user.id)) {
      return false;
    }
  }

  // Check PRO subscription
  if (criteria.hasProSubscription !== undefined) {
    if (user.hasProSubscription !== criteria.hasProSubscription) {
      return false;
    }
  }

  // Check join date
  if (criteria.joinedAfter && user.joinedAt) {
    if (new Date(user.joinedAt) < new Date(criteria.joinedAfter)) {
      return false;
    }
  }

  if (criteria.joinedBefore && user.joinedAt) {
    if (new Date(user.joinedAt) > new Date(criteria.joinedBefore)) {
      return false;
    }
  }

  return true;
}

/**
 * Get users matching a segment
 */
export function filterUsersBySegment<T extends { id: number; role?: UserRole }>(
  users: T[],
  segment: NotificationSegment
): T[] {
  return users.filter((user) => userMatchesSegment(user, segment.criteria));
}

/**
 * Get users matching multiple segments (union)
 */
export function filterUsersBySegments<T extends { id: number; role?: UserRole }>(
  users: T[],
  segments: NotificationSegment[]
): T[] {
  const matchedUserIds = new Set<number>();
  
  for (const segment of segments) {
    const matched = filterUsersBySegment(users, segment);
    matched.forEach((user) => matchedUserIds.add(user.id));
  }
  
  return users.filter((user) => matchedUserIds.has(user.id));
}

/**
 * Calculate segment statistics
 */
export function calculateSegmentStats(
  users: Array<{ id: number; role?: UserRole }>,
  segment: NotificationSegment
): { totalUsers: number; matchedUsers: number; percentage: number } {
  const matched = filterUsersBySegment(users, segment);
  const percentage = users.length > 0 ? (matched.length / users.length) * 100 : 0;
  
  return {
    totalUsers: users.length,
    matchedUsers: matched.length,
    percentage,
  };
}

/**
 * Create a targeted notification
 */
export async function createTargetedNotification(
  title: string,
  body: string,
  segmentIds: string[],
  scheduledAt?: string
): Promise<TargetedNotification> {
  const notification: TargetedNotification = {
    id: `notif_${Date.now()}`,
    title,
    body,
    segmentIds,
    scheduledAt,
    status: scheduledAt ? 'scheduled' : 'draft',
    stats: {
      targetedUsers: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
    },
  };

  // In a real implementation, this would save to backend
  console.log('[Segments] Created targeted notification:', notification);
  
  return notification;
}

/**
 * Get segment display info for UI
 */
export function getSegmentDisplayInfo(segment: NotificationSegment): {
  icon: string;
  color: string;
} {
  switch (segment.type) {
    case 'role':
      if (segment.criteria.roles?.includes('coach')) {
        return { icon: 'sports', color: '#3b82f6' };
      }
      if (segment.criteria.roles?.includes('player')) {
        return { icon: 'person', color: '#22c55e' };
      }
      if (segment.criteria.roles?.includes('parent')) {
        return { icon: 'family-restroom', color: '#f59e0b' };
      }
      if (segment.criteria.roles?.includes('owner') || segment.criteria.roles?.includes('admin')) {
        return { icon: 'admin-panel-settings', color: '#8b5cf6' };
      }
      return { icon: 'group', color: '#64748b' };
    case 'team':
      return { icon: 'groups', color: '#06b6d4' };
    case 'age':
      return { icon: 'cake', color: '#ec4899' };
    case 'custom':
      if (segment.criteria.hasProSubscription) {
        return { icon: 'star', color: '#fbbf24' };
      }
      return { icon: 'tune', color: '#94a3b8' };
    default:
      return { icon: 'group', color: '#64748b' };
  }
}
