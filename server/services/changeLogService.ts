/**
 * Change Logging Service
 * Automatically logs changes to trainings, matches, players, and finances
 */

import * as db from "../db";

type EntityType = "training" | "match" | "player" | "team" | "finance";
type ActionType = "create" | "update" | "delete";

interface ChangeLogParams {
  clubId: number;
  userId: number;
  entityType: EntityType;
  entityId: number;
  action: ActionType;
  fieldName?: string;
  oldValue?: string | number | null;
  newValue?: string | number | null;
  description?: string;
  canRevert?: boolean;
}

/**
 * Log a single change
 */
export async function logChange(params: ChangeLogParams): Promise<number> {
  const {
    clubId,
    userId,
    entityType,
    entityId,
    action,
    fieldName,
    oldValue,
    newValue,
    description,
    canRevert = true,
  } = params;

  return db.createChangeHistory({
    clubId,
    userId,
    entityType,
    entityId,
    action,
    fieldName: fieldName || null,
    oldValue: oldValue !== undefined ? String(oldValue) : null,
    newValue: newValue !== undefined ? String(newValue) : null,
    description: description || generateDescription(entityType, action, fieldName),
    canRevert,
  });
}

/**
 * Log creation of an entity
 */
export async function logCreate(
  clubId: number,
  userId: number,
  entityType: EntityType,
  entityId: number,
  entityName?: string
): Promise<number> {
  const entityNames: Record<EntityType, string> = {
    training: "Trening",
    match: "Mecz",
    player: "Zawodnik",
    team: "Drużyna",
    finance: "Transakcja",
  };

  return logChange({
    clubId,
    userId,
    entityType,
    entityId,
    action: "create",
    description: `Utworzono ${entityNames[entityType]}${entityName ? `: ${entityName}` : ""}`,
    canRevert: false, // Can't revert creation easily
  });
}

/**
 * Log update of an entity with field-level tracking
 */
export async function logUpdate(
  clubId: number,
  userId: number,
  entityType: EntityType,
  entityId: number,
  changes: Array<{ field: string; oldValue: any; newValue: any }>
): Promise<void> {
  for (const change of changes) {
    if (change.oldValue !== change.newValue) {
      await logChange({
        clubId,
        userId,
        entityType,
        entityId,
        action: "update",
        fieldName: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        description: `Zmieniono ${translateField(change.field)}`,
        canRevert: true,
      });
    }
  }
}

/**
 * Log deletion of an entity
 */
export async function logDelete(
  clubId: number,
  userId: number,
  entityType: EntityType,
  entityId: number,
  entityName?: string
): Promise<number> {
  const entityNames: Record<EntityType, string> = {
    training: "Trening",
    match: "Mecz",
    player: "Zawodnik",
    team: "Drużyna",
    finance: "Transakcja",
  };

  return logChange({
    clubId,
    userId,
    entityType,
    entityId,
    action: "delete",
    description: `Usunięto ${entityNames[entityType]}${entityName ? `: ${entityName}` : ""}`,
    canRevert: false, // Can't revert deletion
  });
}

/**
 * Log training schedule change
 */
export async function logTrainingChange(
  clubId: number,
  userId: number,
  trainingId: number,
  oldData: { date?: string; time?: string; location?: string },
  newData: { date?: string; time?: string; location?: string }
): Promise<void> {
  const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

  if (oldData.date !== newData.date) {
    changes.push({ field: "trainingDate", oldValue: oldData.date, newValue: newData.date });
  }
  if (oldData.time !== newData.time) {
    changes.push({ field: "trainingTime", oldValue: oldData.time, newValue: newData.time });
  }
  if (oldData.location !== newData.location) {
    changes.push({ field: "location", oldValue: oldData.location, newValue: newData.location });
  }

  if (changes.length > 0) {
    await logUpdate(clubId, userId, "training", trainingId, changes);
  }
}

/**
 * Log match schedule change
 */
export async function logMatchChange(
  clubId: number,
  userId: number,
  matchId: number,
  oldData: { date?: string; time?: string; location?: string; opponent?: string },
  newData: { date?: string; time?: string; location?: string; opponent?: string }
): Promise<void> {
  const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

  if (oldData.date !== newData.date) {
    changes.push({ field: "matchDate", oldValue: oldData.date, newValue: newData.date });
  }
  if (oldData.time !== newData.time) {
    changes.push({ field: "matchTime", oldValue: oldData.time, newValue: newData.time });
  }
  if (oldData.location !== newData.location) {
    changes.push({ field: "location", oldValue: oldData.location, newValue: newData.location });
  }
  if (oldData.opponent !== newData.opponent) {
    changes.push({ field: "opponent", oldValue: oldData.opponent, newValue: newData.opponent });
  }

  if (changes.length > 0) {
    await logUpdate(clubId, userId, "match", matchId, changes);
  }
}

/**
 * Generate description for a change
 */
function generateDescription(
  entityType: EntityType,
  action: ActionType,
  fieldName?: string
): string {
  const entityNames: Record<EntityType, string> = {
    training: "trening",
    match: "mecz",
    player: "zawodnika",
    team: "drużynę",
    finance: "transakcję",
  };

  const actionNames: Record<ActionType, string> = {
    create: "Utworzono",
    update: "Zaktualizowano",
    delete: "Usunięto",
  };

  if (action === "update" && fieldName) {
    return `Zmieniono ${translateField(fieldName)} w ${entityNames[entityType]}`;
  }

  return `${actionNames[action]} ${entityNames[entityType]}`;
}

/**
 * Translate field names to Polish
 */
function translateField(field: string): string {
  const translations: Record<string, string> = {
    trainingDate: "datę treningu",
    trainingTime: "godzinę treningu",
    matchDate: "datę meczu",
    matchTime: "godzinę meczu",
    location: "miejsce",
    opponent: "przeciwnika",
    name: "nazwę",
    position: "pozycję",
    jerseyNumber: "numer",
    amount: "kwotę",
    category: "kategorię",
    description: "opis",
    notes: "notatki",
  };

  return translations[field] || field;
}
