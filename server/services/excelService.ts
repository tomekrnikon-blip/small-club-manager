/**
 * Excel Export Service
 * 
 * Generates CSV files for data export (compatible with Excel, Google Sheets, etc.)
 */

import * as db from '../db';

export interface ExportOptions {
  clubId: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Export players to CSV
 */
export async function exportPlayersToCSV(clubId: number): Promise<string> {
  const players = await db.getPlayersByClubId(clubId);
  
  const headers = ['ID', 'Imię i Nazwisko', 'Pozycja', 'Numer', 'Data urodzenia', 'Email', 'Telefon'];
  const rows = players.map(p => [
    p.id,
    p.name,
    p.position || '',
    p.jerseyNumber || '',
    p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('pl-PL') : '',
    p.email || '',
    p.phone || '',
  ]);
  
  return generateCSV(headers, rows);
}

/**
 * Export player statistics to CSV
 */
export async function exportPlayerStatsToCSV(clubId: number): Promise<string> {
  const players = await db.getPlayersByClubId(clubId);
  
  const headers = ['Zawodnik', 'Pozycja', 'Mecze', 'Gole', 'Asysty', 'Żółte kartki', 'Czerwone kartki', 'Minuty'];
  const rows: (string | number)[][] = [];
  
  for (const player of players) {
    const stats = await db.getPlayerStats(player.id);
    type StatAcc = { matches: number; goals: number; assists: number; yellowCards: number; redCards: number; minutes: number };
    const totalStats = (stats || []).reduce((acc: StatAcc, s: any) => ({
      matches: acc.matches + (s.matchesPlayed || 0),
      goals: acc.goals + (s.goals || 0),
      assists: acc.assists + (s.assists || 0),
      yellowCards: acc.yellowCards + (s.yellowCards || 0),
      redCards: acc.redCards + (s.redCards || 0),
      minutes: acc.minutes + (s.minutesPlayed || 0),
    }), { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutes: 0 });
    
    rows.push([
      player.name,
      player.position || '',
      totalStats.matches,
      totalStats.goals,
      totalStats.assists,
      totalStats.yellowCards,
      totalStats.redCards,
      totalStats.minutes,
    ]);
  }
  
  return generateCSV(headers, rows);
}

/**
 * Export matches to CSV
 */
export async function exportMatchesToCSV(clubId: number): Promise<string> {
  const matches = await db.getMatchesByClubId(clubId);
  
  const headers = ['Data', 'Godzina', 'Przeciwnik', 'Dom/Wyjazd', 'Wynik', 'Lokalizacja', 'Sezon'];
  const rows = matches.map(m => [
    new Date(m.matchDate).toLocaleDateString('pl-PL'),
    m.matchTime || '',
    m.opponent,
    m.homeAway === 'home' ? 'Dom' : 'Wyjazd',
    m.goalsScored !== null && m.goalsConceded !== null 
      ? `${m.goalsScored}:${m.goalsConceded}` 
      : 'Do rozegrania',
    m.location || '',
    m.season,
  ]);
  
  return generateCSV(headers, rows);
}

/**
 * Export trainings to CSV
 */
export async function exportTrainingsToCSV(clubId: number): Promise<string> {
  const trainings = await db.getTrainingsByClubId(clubId);
  
  const headers = ['Data', 'Godzina', 'Lokalizacja', 'Czas trwania (min)', 'Notatki'];
  const rows = trainings.map(t => [
    new Date(t.trainingDate).toLocaleDateString('pl-PL'),
    t.trainingTime || '',
    t.location || '',
    t.duration || '',
    t.notes || '',
  ]);
  
  return generateCSV(headers, rows);
}

/**
 * Export finances to CSV
 */
export async function exportFinancesToCSV(clubId: number): Promise<string> {
  const finances = await db.getFinancesByClubId(clubId);
  
  const headers = ['Data', 'Typ', 'Kategoria', 'Kwota (PLN)', 'Opis'];
  const rows = finances.map(f => [
    new Date(f.transactionDate).toLocaleDateString('pl-PL'),
    f.type === 'income' ? 'Przychód' : 'Wydatek',
    f.category || '',
    f.amount,
    f.description || '',
  ]);
  
  return generateCSV(headers, rows);
}

/**
 * Export attendance to CSV
 */
export async function exportAttendanceToCSV(clubId: number): Promise<string> {
  const trainings = await db.getTrainingsByClubId(clubId);
  const players = await db.getPlayersByClubId(clubId);
  
  // Create header with player names
  const headers = ['Data treningu', ...players.map(p => p.name)];
  const rows: (string | number)[][] = [];
  
  for (const training of trainings) {
    const attendance = await db.getTrainingAttendance(training.id);
    const row: (string | number)[] = [new Date(training.trainingDate).toLocaleDateString('pl-PL')];
    
    for (const player of players) {
      const playerAttendance = attendance.find(a => a.playerId === player.id);
      row.push(playerAttendance?.attended ? 'Obecny' : 'Nieobecny');
    }
    
    rows.push(row);
  }
  
  return generateCSV(headers, rows);
}

/**
 * Generate CSV string from headers and rows
 */
function generateCSV(headers: string[], rows: (string | number)[][]): string {
  const escapeCSV = (value: string | number): string => {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row => row.map(escapeCSV).join(','));
  
  // Add BOM for Excel UTF-8 compatibility
  return '\ufeff' + [headerLine, ...dataLines].join('\n');
}
