/**
 * Data Export Service
 * Exports all club data for backup before account deletion
 */

import * as db from "../db";

export interface ExportedClubData {
  exportedAt: string;
  club: {
    name: string;
    description: string | null;
    createdAt: Date;
  };
  players: Array<{
    firstName: string;
    lastName: string;
    position: string | null;
    jerseyNumber: number | null;
    dateOfBirth: string | null;
    email: string | null;
    phone: string | null;
  }>;
  matches: Array<{
    opponent: string;
    date: string;
    location: string | null;
    homeScore: number | null;
    awayScore: number | null;
    type: string | null;
    status: string;
  }>;
  trainings: Array<{
    title: string;
    date: string;
    location: string | null;
    duration: number | null;
    notes: string | null;
  }>;
  finances: Array<{
    type: string;
    amount: number;
    description: string | null;
    date: string;
    category: string | null;
  }>;
  playerStats: Array<{
    playerName: string;
    season: string;
    goals: number;
    assists: number;
    minutesPlayed: number;
    yellowCards: number;
    redCards: number;
  }>;
  academyStudents: Array<{
    firstName: string;
    lastName: string;
    dateOfBirth: string | null;
    parentName: string | null;
    parentPhone: string | null;
    monthlyFee: number;
    enrollmentDate: string;
  }>;
}

export async function exportClubData(clubId: number): Promise<ExportedClubData> {
  // Get club info
  const club = await db.getClubById(clubId);
  if (!club) {
    throw new Error("Klub nie istnieje");
  }

  // Get all players
  const players = await db.getPlayersByClubId(clubId);
  
  // Get all matches
  const matches = await db.getMatchesByClubId(clubId);
  
  // Get all trainings
  const trainings = await db.getTrainingsByClubId(clubId);
  
  // Get all finances
  const finances = await db.getFinancesByClubId(clubId);
  
  // Get academy students
  const academyStudents = await db.getAcademyStudentsByClubId(clubId);

  // Build player stats
  const playerStats: ExportedClubData["playerStats"] = [];
  for (const player of players) {
    const stats = await db.getPlayerStats(player.id);
    for (const stat of stats) {
      playerStats.push({
        playerName: player.name,
        season: stat.season,
        goals: stat.goals || 0,
        assists: stat.assists || 0,
        minutesPlayed: stat.minutesPlayed || 0,
        yellowCards: stat.yellowCards || 0,
        redCards: stat.redCards || 0,
      });
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    club: {
      name: club.name,
      description: club.description,
      createdAt: club.createdAt,
    },
    players: players.map((p) => {
      // Parse name into first/last name
      const nameParts = (p.name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      return {
        firstName,
        lastName,
        position: p.position,
        jerseyNumber: p.jerseyNumber,
        dateOfBirth: p.dateOfBirth?.toString() || null,
        email: p.email,
        phone: p.phone,
      };
    }),
    matches: matches.map((m) => ({
      opponent: m.opponent,
      date: m.matchDate?.toString() || "",
      location: m.location,
      homeScore: m.goalsScored,
      awayScore: m.goalsConceded,
      type: m.homeAway,
      status: m.result || "scheduled",
    })),
    trainings: trainings.map((t) => ({
      title: `Trening ${t.trainingDate?.toISOString().split('T')[0] || ''}`,
      date: t.trainingDate?.toISOString() || "",
      location: t.location,
      duration: t.duration,
      notes: t.notes,
    })),
    finances: finances.map((f) => ({
      type: f.type,
      amount: Number(f.amount),
      description: f.description,
      date: f.transactionDate?.toISOString() || "",
      category: f.category,
    })),
    playerStats,
    academyStudents: academyStudents.map((s) => {
      // Parse name into first/last name
      const nameParts = (s.name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      return {
        firstName,
        lastName,
        dateOfBirth: s.dateOfBirth?.toISOString() || null,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        monthlyFee: Number(s.monthlyFee) || 0,
        enrollmentDate: s.createdAt?.toISOString() || new Date().toISOString(),
      };
    }),
  };
}

export function convertToCSV(data: ExportedClubData): string {
  const lines: string[] = [];
  
  // Club info
  lines.push("=== INFORMACJE O KLUBIE ===");
  lines.push(`Nazwa,${data.club.name}`);
  lines.push(`Opis,${data.club.description || ""}`);
  lines.push(`Data eksportu,${data.exportedAt}`);
  lines.push("");
  
  // Players
  lines.push("=== ZAWODNICY ===");
  lines.push("Imię,Nazwisko,Pozycja,Numer,Data urodzenia,Email,Telefon");
  for (const p of data.players) {
    lines.push(`${p.firstName},${p.lastName},${p.position || ""},${p.jerseyNumber || ""},${p.dateOfBirth || ""},${p.email || ""},${p.phone || ""}`);
  }
  lines.push("");
  
  // Matches
  lines.push("=== MECZE ===");
  lines.push("Przeciwnik,Data,Lokalizacja,Wynik dom,Wynik gość,Typ,Status");
  for (const m of data.matches) {
    lines.push(`${m.opponent},${m.date},${m.location || ""},${m.homeScore ?? ""},${m.awayScore ?? ""},${m.type || ""},${m.status}`);
  }
  lines.push("");
  
  // Player Stats
  lines.push("=== STATYSTYKI ZAWODNIKÓW ===");
  lines.push("Zawodnik,Sezon,Bramki,Asysty,Minuty,Żółte kartki,Czerwone kartki");
  for (const s of data.playerStats) {
    lines.push(`${s.playerName},${s.season},${s.goals},${s.assists},${s.minutesPlayed},${s.yellowCards},${s.redCards}`);
  }
  lines.push("");
  
  // Finances
  lines.push("=== FINANSE ===");
  lines.push("Typ,Kwota,Opis,Data");
  for (const f of data.finances) {
    lines.push(`${f.type},${f.amount},${f.description || ""},${f.date}`);
  }
  lines.push("");
  
  // Academy
  lines.push("=== SZKÓŁKA PIŁKARSKA ===");
  lines.push("Imię,Nazwisko,Data urodzenia,Rodzic,Telefon rodzica,Opłata miesięczna,Data zapisania");
  for (const s of data.academyStudents) {
    lines.push(`${s.firstName},${s.lastName},${s.dateOfBirth || ""},${s.parentName || ""},${s.parentPhone || ""},${s.monthlyFee},${s.enrollmentDate}`);
  }
  
  return lines.join("\n");
}
