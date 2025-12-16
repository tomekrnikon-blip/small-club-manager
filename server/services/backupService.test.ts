import { describe, it, expect } from 'vitest';
import { validateBackup, estimateBackupSize, formatBackupSize, ClubBackup } from './backupService';

describe('backupService', () => {
  describe('validateBackup', () => {
    it('should validate a correct backup structure', () => {
      const validBackup = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        clubId: 1,
        clubName: 'Test Club',
        data: {
          club: { name: 'Test Club' },
          teams: [],
          players: [],
          matches: [],
          trainings: [],
          finances: [],
          academyStudents: [],
          photos: [],
          notifications: [],
        },
      };

      const result = validateBackup(validBackup);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing version', () => {
      const invalidBackup = {
        createdAt: new Date().toISOString(),
        clubId: 1,
        clubName: 'Test Club',
        data: {
          club: { name: 'Test Club' },
          teams: [],
          players: [],
          matches: [],
          trainings: [],
          finances: [],
        },
      };

      const result = validateBackup(invalidBackup);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing version field');
    });

    it('should reject missing createdAt', () => {
      const invalidBackup = {
        version: '1.0.0',
        clubId: 1,
        clubName: 'Test Club',
        data: {
          club: { name: 'Test Club' },
          teams: [],
          players: [],
          matches: [],
          trainings: [],
          finances: [],
        },
      };

      const result = validateBackup(invalidBackup);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing createdAt field');
    });

    it('should reject missing clubName', () => {
      const invalidBackup = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        clubId: 1,
        data: {
          club: { name: 'Test Club' },
          teams: [],
          players: [],
          matches: [],
          trainings: [],
          finances: [],
        },
      };

      const result = validateBackup(invalidBackup);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing clubName field');
    });

    it('should reject missing data field', () => {
      const invalidBackup = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        clubId: 1,
        clubName: 'Test Club',
      };

      const result = validateBackup(invalidBackup);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing data field');
    });

    it('should reject non-array teams', () => {
      const invalidBackup = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        clubId: 1,
        clubName: 'Test Club',
        data: {
          club: { name: 'Test Club' },
          teams: 'not an array',
          players: [],
          matches: [],
          trainings: [],
          finances: [],
        },
      };

      const result = validateBackup(invalidBackup);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid or missing teams array');
    });

    it('should reject non-array players', () => {
      const invalidBackup = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        clubId: 1,
        clubName: 'Test Club',
        data: {
          club: { name: 'Test Club' },
          teams: [],
          players: { invalid: true },
          matches: [],
          trainings: [],
          finances: [],
        },
      };

      const result = validateBackup(invalidBackup);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid or missing players array');
    });
  });

  describe('estimateBackupSize', () => {
    it('should estimate size of empty backup', () => {
      const emptyBackup: ClubBackup = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        clubId: 1,
        clubName: 'Test',
        data: {
          club: { name: 'Test' },
          teams: [],
          players: [],
          matches: [],
          trainings: [],
          finances: [],
          academyStudents: [],
          photos: [],
          notifications: [],
        },
      };

      const size = estimateBackupSize(emptyBackup);
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(1000); // Empty backup should be small
    });

    it('should estimate larger size for backup with data', () => {
      const backupWithData: ClubBackup = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        clubId: 1,
        clubName: 'Test Club',
        data: {
          club: { name: 'Test Club' },
          teams: [{ name: 'Team 1' }, { name: 'Team 2' }],
          players: Array.from({ length: 20 }, (_, i) => ({
            name: `Player ${i}`,
            position: 'midfielder',
          })),
          matches: Array.from({ length: 10 }, (_, i) => ({
            opponent: `Opponent ${i}`,
            matchDate: new Date().toISOString(),
          })),
          trainings: [],
          finances: [],
          academyStudents: [],
          photos: [],
          notifications: [],
        },
      };

      const size = estimateBackupSize(backupWithData);
      expect(size).toBeGreaterThan(500);
    });
  });

  describe('formatBackupSize', () => {
    it('should format bytes correctly', () => {
      expect(formatBackupSize(500)).toBe('500 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatBackupSize(1024)).toBe('1.0 KB');
      expect(formatBackupSize(2048)).toBe('2.0 KB');
      expect(formatBackupSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatBackupSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatBackupSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });
  });
});
