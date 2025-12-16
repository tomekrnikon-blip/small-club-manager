/**
 * Audit Logging Service
 * Tracks sensitive operations for security monitoring and compliance
 */

import { getDb } from "../db";
import { auditLogs } from "../../drizzle/schema";
import { desc, eq, and, gte, lte, like } from "drizzle-orm";

export type AuditCategory = "auth" | "club" | "member" | "finance" | "config" | "admin" | "subscription";
export type AuditStatus = "success" | "failure" | "warning";

export interface AuditLogEntry {
  userId?: number;
  userEmail?: string;
  action: string;
  category: AuditCategory;
  targetType?: string;
  targetId?: number;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status?: AuditStatus;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    await db.insert(auditLogs).values({
      userId: entry.userId,
      userEmail: entry.userEmail,
      action: entry.action,
      category: entry.category,
      targetType: entry.targetType,
      targetId: entry.targetId,
      details: entry.details ? JSON.stringify(entry.details) : null,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      status: entry.status || "success",
    });
  } catch (error) {
    // Don't throw - audit logging should not break the main operation
    console.error("[Audit] Failed to log event:", error);
  }
}

/**
 * Predefined audit actions
 */
export const AuditActions = {
  // Auth
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  TWO_FACTOR_ENABLED: "TWO_FACTOR_ENABLED",
  TWO_FACTOR_DISABLED: "TWO_FACTOR_DISABLED",
  TWO_FACTOR_VERIFIED: "TWO_FACTOR_VERIFIED",
  TWO_FACTOR_FAILED: "TWO_FACTOR_FAILED",
  
  // Club
  CLUB_CREATED: "CLUB_CREATED",
  CLUB_UPDATED: "CLUB_UPDATED",
  CLUB_DELETED: "CLUB_DELETED",
  SMS_CONFIG_UPDATED: "SMS_CONFIG_UPDATED",
  EMAIL_CONFIG_UPDATED: "EMAIL_CONFIG_UPDATED",
  
  // Member
  MEMBER_INVITED: "MEMBER_INVITED",
  MEMBER_JOINED: "MEMBER_JOINED",
  MEMBER_REMOVED: "MEMBER_REMOVED",
  ROLE_CHANGED: "ROLE_CHANGED",
  
  // Finance
  FINANCE_CREATED: "FINANCE_CREATED",
  FINANCE_UPDATED: "FINANCE_UPDATED",
  FINANCE_DELETED: "FINANCE_DELETED",
  FINANCE_EXPORTED: "FINANCE_EXPORTED",
  
  // Config
  APP_SETTING_UPDATED: "APP_SETTING_UPDATED",
  STRIPE_CONFIG_UPDATED: "STRIPE_CONFIG_UPDATED",
  
  // Admin
  USER_PRO_GRANTED: "USER_PRO_GRANTED",
  USER_PRO_REVOKED: "USER_PRO_REVOKED",
  SUBSCRIPTION_PLAN_CREATED: "SUBSCRIPTION_PLAN_CREATED",
  SUBSCRIPTION_PLAN_UPDATED: "SUBSCRIPTION_PLAN_UPDATED",
  
  // Subscription
  SUBSCRIPTION_STARTED: "SUBSCRIPTION_STARTED",
  SUBSCRIPTION_CANCELLED: "SUBSCRIPTION_CANCELLED",
  SUBSCRIPTION_RENEWED: "SUBSCRIPTION_RENEWED",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
} as const;

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(options: {
  userId?: number;
  category?: AuditCategory;
  action?: string;
  status?: AuditStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];
  
  if (options.userId) {
    conditions.push(eq(auditLogs.userId, options.userId));
  }
  if (options.category) {
    conditions.push(eq(auditLogs.category, options.category));
  }
  if (options.action) {
    conditions.push(like(auditLogs.action, `%${options.action}%`));
  }
  if (options.status) {
    conditions.push(eq(auditLogs.status, options.status));
  }
  if (options.startDate) {
    conditions.push(gte(auditLogs.createdAt, options.startDate));
  }
  if (options.endDate) {
    conditions.push(lte(auditLogs.createdAt, options.endDate));
  }
  
  const db = await getDb();
  if (!db) return [];
  const query = db
    .select()
    .from(auditLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(options.limit || 100)
    .offset(options.offset || 0);
  
  return query;
}

/**
 * Get audit log statistics
 */
export async function getAuditStats(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const db = await getDb();
  if (!db) return { total: 0, byCategory: {}, byStatus: {}, byAction: {} };
  const logs = await db
    .select()
    .from(auditLogs)
    .where(gte(auditLogs.createdAt, startDate));
  
  const stats = {
    total: logs.length,
    byCategory: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    byAction: {} as Record<string, number>,
  };
  
  for (const log of logs) {
    stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
    stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
  }
  
  return stats;
}

/**
 * Helper to create audit context from request
 */
export function createAuditContext(req: { headers?: Record<string, string | string[] | undefined> }) {
  const headers = req.headers || {};
  return {
    ipAddress: (headers["x-forwarded-for"] as string)?.split(",")[0] || 
               (headers["x-real-ip"] as string) || 
               "unknown",
    userAgent: (headers["user-agent"] as string) || "unknown",
  };
}
