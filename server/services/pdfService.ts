/**
 * PDF Report Generation Service
 * Generates PDF reports for club statistics, finances, and attendance
 */

import * as db from "../db";

interface ReportData {
  title: string;
  subtitle?: string;
  generatedAt: Date;
  clubName: string;
  sections: ReportSection[];
}

interface ReportSection {
  title: string;
  type: 'table' | 'summary' | 'chart';
  data: any;
}

/**
 * Generate player statistics report data
 */
export async function generatePlayerStatsReport(clubId: number): Promise<ReportData> {
  const club = await db.getClubById(clubId);
  const players = await db.getPlayersByClubId(clubId);
  const stats = await Promise.all(
    players.map(async (player) => {
      const playerStats = await db.getPlayerStats(player.id);
      return {
        name: player.name,
        position: player.position || '-',
        matches: playerStats[0]?.matchesPlayed || 0,
        goals: playerStats[0]?.goals || 0,
        assists: playerStats[0]?.assists || 0,
        yellowCards: playerStats[0]?.yellowCards || 0,
        redCards: playerStats[0]?.redCards || 0,
      };
    })
  );

  return {
    title: 'Raport Statystyk Zawodników',
    subtitle: `Sezon ${new Date().getFullYear()}`,
    generatedAt: new Date(),
    clubName: club?.name || 'Klub',
    sections: [
      {
        title: 'Statystyki indywidualne',
        type: 'table',
        data: {
          headers: ['Zawodnik', 'Pozycja', 'Mecze', 'Gole', 'Asysty', 'Żółte', 'Czerwone'],
          rows: stats.map(s => [
            s.name,
            s.position,
            s.matches.toString(),
            s.goals.toString(),
            s.assists.toString(),
            s.yellowCards.toString(),
            s.redCards.toString(),
          ]),
        },
      },
      {
        title: 'Podsumowanie',
        type: 'summary',
        data: {
          totalPlayers: players.length,
          totalGoals: stats.reduce((sum, s) => sum + s.goals, 0),
          totalAssists: stats.reduce((sum, s) => sum + s.assists, 0),
          topScorer: stats.sort((a, b) => b.goals - a.goals)[0]?.name || '-',
        },
      },
    ],
  };
}

/**
 * Generate financial report data
 */
export async function generateFinancialReport(
  clubId: number,
  startDate?: Date,
  endDate?: Date
): Promise<ReportData> {
  const club = await db.getClubById(clubId);
  const finances = await db.getFinancesByClubId(clubId);
  
  const start = startDate || new Date(new Date().getFullYear(), 0, 1);
  const end = endDate || new Date();
  
  const filteredFinances = finances.filter(f => {
    const date = new Date(f.transactionDate);
    return date >= start && date <= end;
  });

  const income = filteredFinances
    .filter(f => f.type === 'income')
    .reduce((sum, f) => sum + Number(f.amount), 0);
  
  const expenses = filteredFinances
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + Number(f.amount), 0);

  const byCategory: Record<string, number> = {};
  filteredFinances.forEach(f => {
    const cat = f.category || 'Inne';
    byCategory[cat] = (byCategory[cat] || 0) + Number(f.amount) * (f.type === 'expense' ? -1 : 1);
  });

  return {
    title: 'Raport Finansowy',
    subtitle: `${start.toLocaleDateString('pl-PL')} - ${end.toLocaleDateString('pl-PL')}`,
    generatedAt: new Date(),
    clubName: club?.name || 'Klub',
    sections: [
      {
        title: 'Podsumowanie',
        type: 'summary',
        data: {
          totalIncome: income,
          totalExpenses: expenses,
          balance: income - expenses,
          transactionCount: filteredFinances.length,
        },
      },
      {
        title: 'Transakcje',
        type: 'table',
        data: {
          headers: ['Data', 'Opis', 'Kategoria', 'Typ', 'Kwota'],
          rows: filteredFinances.map(f => [
            new Date(f.transactionDate).toLocaleDateString('pl-PL'),
            f.description || '-',
            f.category || 'Inne',
            f.type === 'income' ? 'Przychód' : 'Wydatek',
            `${f.type === 'expense' ? '-' : ''}${Number(f.amount).toFixed(2)} PLN`,
          ]),
        },
      },
      {
        title: 'Podział według kategorii',
        type: 'table',
        data: {
          headers: ['Kategoria', 'Kwota'],
          rows: Object.entries(byCategory).map(([cat, amount]) => [
            cat,
            `${amount.toFixed(2)} PLN`,
          ]),
        },
      },
    ],
  };
}

/**
 * Generate attendance report data
 */
export async function generateAttendanceReport(clubId: number): Promise<ReportData> {
  const club = await db.getClubById(clubId);
  const trainings = await db.getTrainingsByClubId(clubId);
  const players = await db.getPlayersByClubId(clubId);

  // Calculate attendance per player
  const attendanceByPlayer: Record<number, { present: number; total: number }> = {};
  players.forEach(p => {
    attendanceByPlayer[p.id] = { present: 0, total: trainings.length };
  });

  // Get attendance records for each training
  for (const training of trainings) {
    const attendance = await db.getTrainingAttendance(training.id);
    attendance.forEach(a => {
      if (attendanceByPlayer[a.playerId]) {
        if (a.attended === 1) {
          attendanceByPlayer[a.playerId].present++;
        }
      }
    });
  }

  const attendanceData = players.map(p => {
    const att = attendanceByPlayer[p.id];
    const percentage = att.total > 0 ? (att.present / att.total * 100).toFixed(1) : '0.0';
    return {
      name: p.name,
      present: att.present,
      total: att.total,
      percentage: `${percentage}%`,
    };
  });

  return {
    title: 'Raport Frekwencji',
    subtitle: `Stan na ${new Date().toLocaleDateString('pl-PL')}`,
    generatedAt: new Date(),
    clubName: club?.name || 'Klub',
    sections: [
      {
        title: 'Frekwencja zawodników',
        type: 'table',
        data: {
          headers: ['Zawodnik', 'Obecności', 'Treningi', 'Frekwencja'],
          rows: attendanceData.map(a => [
            a.name,
            a.present.toString(),
            a.total.toString(),
            a.percentage,
          ]),
        },
      },
      {
        title: 'Podsumowanie',
        type: 'summary',
        data: {
          totalTrainings: trainings.length,
          averageAttendance: attendanceData.length > 0
            ? (attendanceData.reduce((sum, a) => sum + parseFloat(a.percentage), 0) / attendanceData.length).toFixed(1) + '%'
            : '0%',
          bestAttendance: attendanceData.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))[0]?.name || '-',
        },
      },
    ],
  };
}

/**
 * Generate HTML from report data (for PDF conversion)
 */
export function generateReportHTML(report: ReportData): string {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
    h1 { color: #22c55e; margin-bottom: 5px; }
    h2 { color: #64748b; font-weight: normal; margin-top: 0; }
    h3 { color: #334155; border-bottom: 2px solid #22c55e; padding-bottom: 8px; margin-top: 30px; }
    .header { border-bottom: 3px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; }
    .meta { color: #64748b; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #22c55e; color: white; padding: 12px; text-align: left; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .summary { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary-item { display: inline-block; margin-right: 40px; }
    .summary-label { color: #64748b; font-size: 14px; }
    .summary-value { font-size: 24px; font-weight: bold; color: #22c55e; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.title}</h1>
    ${report.subtitle ? `<h2>${report.subtitle}</h2>` : ''}
    <div class="meta">
      <strong>${report.clubName}</strong> | 
      Wygenerowano: ${report.generatedAt.toLocaleString('pl-PL')}
    </div>
  </div>
`;

  for (const section of report.sections) {
    html += `<h3>${section.title}</h3>`;
    
    if (section.type === 'table') {
      html += '<table>';
      html += '<tr>' + section.data.headers.map((h: string) => `<th>${h}</th>`).join('') + '</tr>';
      for (const row of section.data.rows) {
        html += '<tr>' + row.map((cell: string) => `<td>${cell}</td>`).join('') + '</tr>';
      }
      html += '</table>';
    } else if (section.type === 'summary') {
      html += '<div class="summary">';
      for (const [key, value] of Object.entries(section.data)) {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        html += `<div class="summary-item"><div class="summary-label">${label}</div><div class="summary-value">${value}</div></div>`;
      }
      html += '</div>';
    }
  }

  html += `
  <div class="footer">
    Raport wygenerowany przez Small Club Manager | ${new Date().getFullYear()}
  </div>
</body>
</html>`;

  return html;
}


/**
 * Generate detailed frequency report data with team and period filters
 */
export async function generateFrequencyReport(
  clubId: number,
  options: {
    teamId?: number;
    startDate?: Date;
    endDate?: Date;
    includeMatches?: boolean;
    includeTrainings?: boolean;
  } = {}
): Promise<ReportData> {
  const club = await db.getClubById(clubId);
  const players = await db.getPlayersByClubId(clubId);
  const trainings = await db.getTrainingsByClubId(clubId);
  const matches = await db.getMatchesByClubId(clubId);

  const {
    teamId,
    startDate = new Date(new Date().getFullYear(), 0, 1),
    endDate = new Date(),
    includeMatches = true,
    includeTrainings = true,
  } = options;

  // Filter players by team if specified
  const filteredPlayers = teamId
    ? players.filter((p: any) => p.teamId === teamId)
    : players;

  // Filter events by date
  const filteredTrainings = trainings.filter((t: any) => {
    const date = new Date(t.trainingDate);
    return date >= startDate && date <= endDate;
  });

  const filteredMatches = matches.filter((m: any) => {
    const date = new Date(m.matchDate);
    return date >= startDate && date <= endDate;
  });

  // Calculate attendance per player
  const frequencyData: {
    playerId: number;
    name: string;
    team: string;
    trainingPresent: number;
    trainingTotal: number;
    trainingPercent: number;
    matchPresent: number;
    matchTotal: number;
    matchPercent: number;
    overallPercent: number;
  }[] = [];

  for (const player of filteredPlayers) {
    let trainingPresent = 0;
    let matchPresent = 0;

    // Get training attendance
    if (includeTrainings) {
      for (const training of filteredTrainings) {
        const attendance = await db.getTrainingAttendance(training.id);
        const playerAtt = attendance.find((a: any) => a.playerId === player.id);
        if (playerAtt?.attended === 1) {
          trainingPresent++;
        }
      }
    }

    // Get match attendance (from callups)
    if (includeMatches) {
      for (const match of filteredMatches) {
        const callups = await db.getMatchCallups(match.id);
        const playerCallup = callups.find((c: any) => c.playerId === player.id);
        if (playerCallup?.status === 'confirmed') {
          matchPresent++;
        }
      }
    }

    const trainingTotal = includeTrainings ? filteredTrainings.length : 0;
    const matchTotal = includeMatches ? filteredMatches.length : 0;
    const trainingPercent = trainingTotal > 0 ? (trainingPresent / trainingTotal) * 100 : 0;
    const matchPercent = matchTotal > 0 ? (matchPresent / matchTotal) * 100 : 0;
    const totalEvents = trainingTotal + matchTotal;
    const totalPresent = trainingPresent + matchPresent;
    const overallPercent = totalEvents > 0 ? (totalPresent / totalEvents) * 100 : 0;

    frequencyData.push({
      playerId: player.id,
      name: player.name,
      team: 'Brak drużyny',
      trainingPresent,
      trainingTotal,
      trainingPercent,
      matchPresent,
      matchTotal,
      matchPercent,
      overallPercent,
    });
  }

  // Sort by overall percentage descending
  frequencyData.sort((a, b) => b.overallPercent - a.overallPercent);

  // Calculate team averages
  const teamAverages: Record<string, { total: number; count: number }> = {};
  frequencyData.forEach(p => {
    if (!teamAverages[p.team]) {
      teamAverages[p.team] = { total: 0, count: 0 };
    }
    teamAverages[p.team].total += p.overallPercent;
    teamAverages[p.team].count++;
  });

  const teamStats = Object.entries(teamAverages).map(([team, data]) => ({
    team,
    average: data.count > 0 ? (data.total / data.count).toFixed(1) : '0.0',
    playerCount: data.count,
  }));

  return {
    title: 'Raport Frekwencji',
    subtitle: `${startDate.toLocaleDateString('pl-PL')} - ${endDate.toLocaleDateString('pl-PL')}`,
    generatedAt: new Date(),
    clubName: club?.name || 'Klub',
    sections: [
      {
        title: 'Podsumowanie',
        type: 'summary',
        data: {
          'Liczba zawodników': filteredPlayers.length,
          'Treningów w okresie': filteredTrainings.length,
          'Meczów w okresie': filteredMatches.length,
          'Średnia frekwencja': frequencyData.length > 0
            ? (frequencyData.reduce((sum, p) => sum + p.overallPercent, 0) / frequencyData.length).toFixed(1) + '%'
            : '0%',
          'Najlepsza frekwencja': frequencyData[0]?.name || '-',
        },
      },
      {
        title: 'Frekwencja według drużyn',
        type: 'table',
        data: {
          headers: ['Drużyna', 'Zawodników', 'Średnia frekwencja'],
          rows: teamStats.map(t => [
            t.team,
            t.playerCount.toString(),
            t.average + '%',
          ]),
        },
      },
      {
        title: 'Frekwencja indywidualna',
        type: 'table',
        data: {
          headers: ['Zawodnik', 'Drużyna', 'Treningi', 'Mecze', 'Ogółem'],
          rows: frequencyData.map(p => [
            p.name,
            p.team,
            `${p.trainingPresent}/${p.trainingTotal} (${p.trainingPercent.toFixed(1)}%)`,
            `${p.matchPresent}/${p.matchTotal} (${p.matchPercent.toFixed(1)}%)`,
            p.overallPercent.toFixed(1) + '%',
          ]),
        },
      },
    ],
  };
}

/**
 * Generate CSV from frequency data
 */
export function generateFrequencyCSV(frequencyData: any[]): string {
  const headers = ['Zawodnik', 'Drużyna', 'Treningi obecne', 'Treningi razem', 'Treningi %', 'Mecze obecne', 'Mecze razem', 'Mecze %', 'Ogółem %'];
  const rows = frequencyData.map(p => [
    p.name,
    p.team,
    p.trainingPresent,
    p.trainingTotal,
    p.trainingPercent.toFixed(1),
    p.matchPresent,
    p.matchTotal,
    p.matchPercent.toFixed(1),
    p.overallPercent.toFixed(1),
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Generate Excel-compatible data from frequency report
 */
export function generateFrequencyExcelData(frequencyData: any[]): {
  headers: string[];
  rows: (string | number)[][];
} {
  return {
    headers: ['Zawodnik', 'Drużyna', 'Treningi obecne', 'Treningi razem', 'Treningi %', 'Mecze obecne', 'Mecze razem', 'Mecze %', 'Ogółem %'],
    rows: frequencyData.map(p => [
      p.name,
      p.team,
      p.trainingPresent,
      p.trainingTotal,
      p.trainingPercent,
      p.matchPresent,
      p.matchTotal,
      p.matchPercent,
      p.overallPercent,
    ]),
  };
}


/**
 * Generate team statistics report data for PDF export
 */
export async function generateTeamStatisticsReport(
  clubId: number,
  teamId?: number,
  dateFrom?: Date,
  dateTo?: Date
): Promise<ReportData> {
  const club = await db.getClubById(clubId);
  const teams = await db.getTeamsByClubId(clubId);
  const players = await db.getPlayersByClubId(clubId);
  const matches = await db.getMatchesByClubId(clubId);
  const trainings = await db.getTrainingsByClubId(clubId);

  // Filter by team if specified
  const filteredMatches = teamId 
    ? matches.filter(m => m.teamId === teamId)
    : matches;

  // Filter by date range if specified
  const dateFilteredMatches = filteredMatches.filter(m => {
    const matchDate = new Date(m.matchDate);
    if (dateFrom && matchDate < dateFrom) return false;
    if (dateTo && matchDate > dateTo) return false;
    return true;
  });

  // Calculate match statistics
  const wins = dateFilteredMatches.filter(m => m.result === 'win').length;
  const draws = dateFilteredMatches.filter(m => m.result === 'draw').length;
  const losses = dateFilteredMatches.filter(m => m.result === 'loss').length;
  const totalMatches = wins + draws + losses;

  const goalsScored = dateFilteredMatches.reduce((sum, m) => sum + (m.goalsScored || 0), 0);
  const goalsConceded = dateFilteredMatches.reduce((sum, m) => sum + (m.goalsConceded || 0), 0);

  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const avgGoalsScored = totalMatches > 0 ? (goalsScored / totalMatches).toFixed(2) : '0';
  const avgGoalsConceded = totalMatches > 0 ? (goalsConceded / totalMatches).toFixed(2) : '0';

  // Get top scorers (from player stats)
  const playerStatsPromises = players.map(async (player) => {
    const stats = await db.getPlayerStats(player.id);
    return {
      name: player.name,
      position: player.position || '-',
      goals: stats[0]?.goals || 0,
      assists: stats[0]?.assists || 0,
      matches: stats[0]?.matchesPlayed || 0,
    };
  });
  const playerStats = await Promise.all(playerStatsPromises);
  const topScorers = playerStats
    .filter(p => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10);

  // Recent results
  const recentResults = dateFilteredMatches
    .filter(m => m.result)
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
    .slice(0, 10)
    .map(m => ({
      date: new Date(m.matchDate).toLocaleDateString('pl-PL'),
      opponent: m.opponent,
      result: m.result === 'win' ? 'W' : m.result === 'draw' ? 'R' : 'P',
      score: `${m.goalsScored || 0}:${m.goalsConceded || 0}`,
      location: m.homeAway === 'home' ? 'Dom' : 'Wyjazd',
    }));

  const selectedTeam = teamId ? teams.find(t => t.id === teamId) : null;
  const reportTitle = selectedTeam 
    ? `Statystyki drużyny: ${selectedTeam.name}`
    : 'Statystyki klubu';

  const dateRangeText = dateFrom || dateTo
    ? `Okres: ${dateFrom?.toLocaleDateString('pl-PL') || 'początek'} - ${dateTo?.toLocaleDateString('pl-PL') || 'teraz'}`
    : `Sezon ${new Date().getFullYear()}`;

  return {
    title: reportTitle,
    subtitle: dateRangeText,
    generatedAt: new Date(),
    clubName: club?.name || 'Klub',
    sections: [
      {
        title: 'Podsumowanie wyników',
        type: 'summary',
        data: {
          'Rozegrane mecze': totalMatches,
          'Wygrane': wins,
          'Remisy': draws,
          'Porażki': losses,
          'Skuteczność': `${winRate}%`,
          'Bramki strzelone': goalsScored,
          'Bramki stracone': goalsConceded,
          'Bilans bramek': goalsScored - goalsConceded,
          'Średnia bramek strzelonych': avgGoalsScored,
          'Średnia bramek straconych': avgGoalsConceded,
        },
      },
      {
        title: 'Najlepsi strzelcy',
        type: 'table',
        data: {
          headers: ['Lp.', 'Zawodnik', 'Pozycja', 'Gole', 'Asysty', 'Mecze'],
          rows: topScorers.map((p, i) => [
            (i + 1).toString(),
            p.name,
            p.position,
            p.goals.toString(),
            p.assists.toString(),
            p.matches.toString(),
          ]),
        },
      },
      {
        title: 'Ostatnie wyniki',
        type: 'table',
        data: {
          headers: ['Data', 'Przeciwnik', 'Wynik', 'Rezultat', 'Miejsce'],
          rows: recentResults.map(r => [
            r.date,
            r.opponent,
            r.score,
            r.result,
            r.location,
          ]),
        },
      },
      {
        title: 'Informacje o drużynie',
        type: 'summary',
        data: {
          'Liczba zawodników': players.length,
          'Liczba drużyn': teams.length,
          'Treningów w sezonie': trainings.length,
        },
      },
    ],
  };
}

/**
 * Generate HTML report from report data
 */
export function generateHtmlReport(report: ReportData): string {
  let html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; padding: 30px; text-align: center; }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .meta { display: flex; justify-content: space-between; padding: 15px 30px; background: #f1f5f9; font-size: 12px; color: #64748b; }
    .content { padding: 30px; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 18px; color: #22c55e; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
    .summary-item { background: #f8fafc; border-radius: 8px; padding: 15px; text-align: center; }
    .summary-item .value { font-size: 24px; font-weight: bold; color: #22c55e; }
    .summary-item .label { font-size: 12px; color: #64748b; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b; }
    tr:hover { background: #f8fafc; }
    .footer { text-align: center; padding: 20px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${report.title}</h1>
      <p>${report.subtitle || ''}</p>
    </div>
    <div class="meta">
      <span>Klub: ${report.clubName}</span>
      <span>Wygenerowano: ${report.generatedAt.toLocaleString('pl-PL')}</span>
    </div>
    <div class="content">
`;

  for (const section of report.sections) {
    html += `<div class="section"><h2>${section.title}</h2>`;
    
    if (section.type === 'summary') {
      html += '<div class="summary-grid">';
      for (const [label, value] of Object.entries(section.data)) {
        html += `<div class="summary-item"><div class="value">${value}</div><div class="label">${label}</div></div>`;
      }
      html += '</div>';
    } else if (section.type === 'table') {
      html += '<table><thead><tr>';
      for (const header of section.data.headers) {
        html += `<th>${header}</th>`;
      }
      html += '</tr></thead><tbody>';
      for (const row of section.data.rows) {
        html += '<tr>';
        for (const cell of row) {
          html += `<td>${cell}</td>`;
        }
        html += '</tr>';
      }
      html += '</tbody></table>';
    }
    
    html += '</div>';
  }

  html += `
    </div>
    <div class="footer">
      Small Club Manager - Raport wygenerowany automatycznie
    </div>
  </div>
</body>
</html>
`;

  return html;
}

/**
 * Generate CSV from report data
 */
export function generateCsvReport(report: ReportData): string {
  let csv = '';
  
  // Add header
  csv += `"${report.title}"\n`;
  csv += `"${report.subtitle || ''}"\n`;
  csv += `"Klub: ${report.clubName}"\n`;
  csv += `"Wygenerowano: ${report.generatedAt.toLocaleString('pl-PL')}"\n\n`;

  for (const section of report.sections) {
    csv += `"${section.title}"\n`;
    
    if (section.type === 'summary') {
      for (const [label, value] of Object.entries(section.data)) {
        csv += `"${label}","${value}"\n`;
      }
    } else if (section.type === 'table') {
      csv += section.data.headers.map((h: string) => `"${h}"`).join(',') + '\n';
      for (const row of section.data.rows) {
        csv += row.map((c: string) => `"${c}"`).join(',') + '\n';
      }
    }
    
    csv += '\n';
  }

  return csv;
}


/**
 * Season summary data structure
 */
export interface SeasonSummaryData {
  clubName: string;
  season: string;
  matches: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
  };
  goals: {
    scored: number;
    conceded: number;
  };
  attendance: {
    average: number;
    total: number;
  };
  trainings: number;
  topScorer: { name: string; goals: number };
  topAssister: { name: string; assists: number };
  bestAttendance: { name: string; percent: number };
  previousSeason?: {
    matches: { won: number };
    goals: { scored: number };
    attendance: { average: number };
    trainings: number;
  };
}

/**
 * Generate HTML report for season summary
 */
export function generateSeasonSummaryHtml(data: SeasonSummaryData): string {
  const winRate = data.matches.played > 0 
    ? Math.round((data.matches.won / data.matches.played) * 100) 
    : 0;
  
  const goalDiff = data.goals.scored - data.goals.conceded;
  const goalDiffStr = goalDiff > 0 ? `+${goalDiff}` : goalDiff.toString();

  let comparisonHtml = '';
  if (data.previousSeason) {
    const prev = data.previousSeason;
    const wonChange = data.matches.won - prev.matches.won;
    const goalsChange = data.goals.scored - prev.goals.scored;
    const attendanceChange = data.attendance.average - prev.attendance.average;
    const trainingsChange = data.trainings - prev.trainings;

    const formatChange = (val: number, suffix = '') => {
      const color = val >= 0 ? '#22c55e' : '#ef4444';
      const arrow = val >= 0 ? '↑' : '↓';
      return `<span style="color: ${color}">${arrow} ${Math.abs(val)}${suffix}</span>`;
    };

    comparisonHtml = `
      <div class="section">
        <h2>Porównanie z poprzednim sezonem</h2>
        <table class="comparison-table">
          <tr>
            <td>Wygrane mecze</td>
            <td><strong>${data.matches.won}</strong></td>
            <td>${formatChange(wonChange)}</td>
          </tr>
          <tr>
            <td>Bramki strzelone</td>
            <td><strong>${data.goals.scored}</strong></td>
            <td>${formatChange(goalsChange)}</td>
          </tr>
          <tr>
            <td>Średnia frekwencja</td>
            <td><strong>${data.attendance.average}%</strong></td>
            <td>${formatChange(attendanceChange, '%')}</td>
          </tr>
          <tr>
            <td>Sesje treningowe</td>
            <td><strong>${data.trainings}</strong></td>
            <td>${formatChange(trainingsChange)}</td>
          </tr>
        </table>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Podsumowanie sezonu ${data.season} - ${data.clubName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #1e293b;
    }
    .header h1 {
      font-size: 28px;
      color: #fff;
      margin-bottom: 8px;
    }
    .header .subtitle {
      font-size: 16px;
      color: #64748b;
    }
    .header .season {
      display: inline-block;
      background: #22c55e;
      color: #fff;
      padding: 4px 16px;
      border-radius: 20px;
      font-weight: 600;
      margin-top: 12px;
    }
    .section {
      background: #1e293b;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .section h2 {
      font-size: 14px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }
    .win-rate {
      text-align: center;
      margin-bottom: 24px;
    }
    .win-rate-circle {
      width: 120px;
      height: 120px;
      border-radius: 60px;
      background: #0f172a;
      border: 4px solid #22c55e;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .win-rate-value {
      font-size: 32px;
      font-weight: 700;
      color: #fff;
    }
    .win-rate-label {
      font-size: 12px;
      color: #64748b;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      text-align: center;
    }
    .stat-item .value {
      font-size: 24px;
      font-weight: 700;
    }
    .stat-item .label {
      font-size: 11px;
      color: #64748b;
    }
    .stat-item.won .value { color: #22c55e; }
    .stat-item.drawn .value { color: #f59e0b; }
    .stat-item.lost .value { color: #ef4444; }
    .progress-bar {
      height: 8px;
      background: #0f172a;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      margin-top: 16px;
    }
    .progress-bar .won { background: #22c55e; }
    .progress-bar .drawn { background: #f59e0b; }
    .progress-bar .lost { background: #ef4444; }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .goals-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }
    .goals-display .scored { color: #22c55e; font-size: 28px; font-weight: 700; }
    .goals-display .conceded { color: #ef4444; font-size: 28px; font-weight: 700; }
    .goals-display .separator { color: #64748b; font-size: 24px; }
    .goal-diff {
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
      margin-top: 8px;
    }
    .performers-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .performer-card {
      background: #0f172a;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .performer-card .icon {
      width: 48px;
      height: 48px;
      border-radius: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-bottom: 8px;
    }
    .performer-card .title {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
    }
    .performer-card .name {
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      margin: 4px 0;
    }
    .performer-card .stat {
      font-size: 11px;
      color: #22c55e;
      font-weight: 600;
    }
    .comparison-table {
      width: 100%;
    }
    .comparison-table td {
      padding: 12px 0;
      border-bottom: 1px solid #334155;
    }
    .comparison-table td:first-child {
      color: #94a3b8;
    }
    .comparison-table td:nth-child(2) {
      text-align: right;
      color: #fff;
    }
    .comparison-table td:nth-child(3) {
      text-align: right;
      width: 80px;
    }
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 12px;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.clubName}</h1>
    <div class="subtitle">Podsumowanie sezonu</div>
    <div class="season">${data.season}</div>
  </div>

  <div class="section">
    <h2>Wyniki meczów</h2>
    <div class="win-rate">
      <div class="win-rate-circle">
        <div class="win-rate-value">${winRate}%</div>
        <div class="win-rate-label">skuteczność</div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-item">
        <div class="value">${data.matches.played}</div>
        <div class="label">Mecze</div>
      </div>
      <div class="stat-item won">
        <div class="value">${data.matches.won}</div>
        <div class="label">Wygrane</div>
      </div>
      <div class="stat-item drawn">
        <div class="value">${data.matches.drawn}</div>
        <div class="label">Remisy</div>
      </div>
      <div class="stat-item lost">
        <div class="value">${data.matches.lost}</div>
        <div class="label">Przegrane</div>
      </div>
    </div>
    <div class="progress-bar">
      <div class="won" style="flex: ${data.matches.won}"></div>
      <div class="drawn" style="flex: ${data.matches.drawn}"></div>
      <div class="lost" style="flex: ${data.matches.lost}"></div>
    </div>
  </div>

  <div class="two-col">
    <div class="section">
      <h2>Bramki</h2>
      <div class="goals-display">
        <span class="scored">${data.goals.scored}</span>
        <span class="separator">:</span>
        <span class="conceded">${data.goals.conceded}</span>
      </div>
      <div class="goal-diff">Bilans: ${goalDiffStr}</div>
    </div>
    <div class="section">
      <h2>Treningi</h2>
      <div style="text-align: center">
        <div style="font-size: 32px; font-weight: 700; color: #fff">${data.trainings}</div>
        <div style="font-size: 11px; color: #64748b">sesji treningowych</div>
        <div style="margin-top: 8px; font-size: 12px; color: #94a3b8">
          Śr. frekwencja: ${data.attendance.average}%
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Najlepsi zawodnicy</h2>
    <div class="performers-grid">
      <div class="performer-card">
        <div class="icon" style="background: #22c55e20">⚽</div>
        <div class="title">Król strzelców</div>
        <div class="name">${data.topScorer.name}</div>
        <div class="stat">${data.topScorer.goals} bramek</div>
      </div>
      <div class="performer-card">
        <div class="icon" style="background: #3b82f620">🎯</div>
        <div class="title">Asystent</div>
        <div class="name">${data.topAssister.name}</div>
        <div class="stat">${data.topAssister.assists} asyst</div>
      </div>
      <div class="performer-card">
        <div class="icon" style="background: #f59e0b20">🏆</div>
        <div class="title">Frekwencja</div>
        <div class="name">${data.bestAttendance.name}</div>
        <div class="stat">${data.bestAttendance.percent}%</div>
      </div>
    </div>
  </div>

  ${comparisonHtml}

  <div class="footer">
    Wygenerowano: ${new Date().toLocaleString('pl-PL')} | Small Club Manager
  </div>
</body>
</html>
  `;
}

/**
 * Generate CSV for season summary
 */
export function generateSeasonSummaryCsv(data: SeasonSummaryData): string {
  let csv = '';
  
  csv += `"Podsumowanie sezonu ${data.season}"\n`;
  csv += `"Klub","${data.clubName}"\n\n`;
  
  csv += `"WYNIKI MECZÓW"\n`;
  csv += `"Rozegrane","${data.matches.played}"\n`;
  csv += `"Wygrane","${data.matches.won}"\n`;
  csv += `"Remisy","${data.matches.drawn}"\n`;
  csv += `"Przegrane","${data.matches.lost}"\n`;
  csv += `"Skuteczność","${Math.round((data.matches.won / data.matches.played) * 100)}%"\n\n`;
  
  csv += `"BRAMKI"\n`;
  csv += `"Strzelone","${data.goals.scored}"\n`;
  csv += `"Stracone","${data.goals.conceded}"\n`;
  csv += `"Bilans","${data.goals.scored - data.goals.conceded}"\n\n`;
  
  csv += `"TRENINGI"\n`;
  csv += `"Liczba sesji","${data.trainings}"\n`;
  csv += `"Średnia frekwencja","${data.attendance.average}%"\n\n`;
  
  csv += `"NAJLEPSI ZAWODNICY"\n`;
  csv += `"Król strzelców","${data.topScorer.name}","${data.topScorer.goals} bramek"\n`;
  csv += `"Asystent","${data.topAssister.name}","${data.topAssister.assists} asyst"\n`;
  csv += `"Najlepsza frekwencja","${data.bestAttendance.name}","${data.bestAttendance.percent}%"\n`;
  
  return csv;
}


/**
 * Match Report Data Interface
 */
export interface MatchReportData {
  match: {
    id: number;
    opponent: string;
    date: string;
    time?: string;
    location?: string;
    homeAway: 'home' | 'away';
    goalsScored: number;
    goalsConceded: number;
    result: 'win' | 'draw' | 'loss' | null;
  };
  clubName: string;
  teamName?: string;
  events: {
    minute: number;
    type: string;
    playerName: string;
    assistPlayerName?: string;
    half: string;
  }[];
  playerStats: {
    name: string;
    position: string;
    minutesPlayed: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    saves: number;
  }[];
  summary: {
    totalGoals: number;
    totalAssists: number;
    totalYellowCards: number;
    totalRedCards: number;
    totalSaves: number;
    possession?: number;
    shots?: number;
    shotsOnTarget?: number;
  };
}

/**
 * Generate match report data
 */
export async function generateMatchReportData(matchId: number): Promise<MatchReportData | null> {
  const match = await db.getMatchById(matchId);
  if (!match) return null;

  const club = await db.getClubById(match.clubId);
  const team = match.teamId ? await db.getTeamById(match.teamId) : null;
  const events = await db.getMatchEvents(matchId);
  const stats = await db.getMatchStats(matchId);
  const players = await db.getPlayersByClubId(match.clubId);

  // Map player IDs to names
  const playerMap = new Map(players.map(p => [p.id, p]));

  // Format events
  const formattedEvents = events.map((e: any) => ({
    minute: e.minute,
    type: e.eventType,
    playerName: playerMap.get(e.playerId)?.name || 'Nieznany',
    assistPlayerName: e.assistPlayerId ? playerMap.get(e.assistPlayerId)?.name : undefined,
    half: e.half === 'first' ? '1. połowa' : e.half === 'second' ? '2. połowa' : e.half,
  }));

  // Format player stats
  const formattedStats = stats.map((s: any) => {
    const player = playerMap.get(s.playerId);
    return {
      name: player?.name || 'Nieznany',
      position: player?.position || '-',
      minutesPlayed: s.minutesPlayed || 0,
      goals: s.goals || 0,
      assists: s.assists || 0,
      yellowCards: s.yellowCards || 0,
      redCards: s.redCards || 0,
      saves: s.saves || 0,
    };
  });

  // Calculate summary
  const summary = {
    totalGoals: formattedStats.reduce((sum, s) => sum + s.goals, 0),
    totalAssists: formattedStats.reduce((sum, s) => sum + s.assists, 0),
    totalYellowCards: formattedStats.reduce((sum, s) => sum + s.yellowCards, 0),
    totalRedCards: formattedStats.reduce((sum, s) => sum + s.redCards, 0),
    totalSaves: formattedStats.reduce((sum, s) => sum + s.saves, 0),
  };

  return {
    match: {
      id: match.id,
      opponent: match.opponent,
      date: new Date(match.matchDate).toLocaleDateString('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      time: match.matchTime || undefined,
      location: match.location || undefined,
      homeAway: match.homeAway,
      goalsScored: match.goalsScored,
      goalsConceded: match.goalsConceded,
      result: match.result,
    },
    clubName: club?.name || 'Klub',
    teamName: team?.name,
    events: formattedEvents,
    playerStats: formattedStats,
    summary,
  };
}

/**
 * Generate match report HTML
 */
export function generateMatchReportHtml(data: MatchReportData): string {
  const resultColor = data.match.result === 'win' ? '#22c55e' : 
                      data.match.result === 'loss' ? '#ef4444' : '#f59e0b';
  const resultText = data.match.result === 'win' ? 'WYGRANA' : 
                     data.match.result === 'loss' ? 'PRZEGRANA' : 'REMIS';

  const homeTeam = data.match.homeAway === 'home' ? data.clubName : data.match.opponent;
  const awayTeam = data.match.homeAway === 'away' ? data.clubName : data.match.opponent;
  const homeScore = data.match.homeAway === 'home' ? data.match.goalsScored : data.match.goalsConceded;
  const awayScore = data.match.homeAway === 'away' ? data.match.goalsScored : data.match.goalsConceded;

  const eventTypeIcons: Record<string, string> = {
    goal: '⚽',
    assist: '🎯',
    yellow_card: '🟨',
    red_card: '🟥',
    substitution_in: '🔼',
    substitution_out: '🔽',
    save: '🧤',
    injury: '🏥',
  };

  const eventTypeLabels: Record<string, string> = {
    goal: 'Bramka',
    assist: 'Asysta',
    yellow_card: 'Żółta kartka',
    red_card: 'Czerwona kartka',
    substitution_in: 'Wejście',
    substitution_out: 'Zejście',
    save: 'Obrona',
    injury: 'Kontuzja',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      background: #0f172a; 
      color: #e2e8f0;
      padding: 40px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #22c55e;
      font-size: 28px;
      margin-bottom: 8px;
    }
    .header .meta {
      color: #94a3b8;
      font-size: 14px;
    }
    
    .scoreboard {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      text-align: center;
    }
    .scoreboard .teams {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .scoreboard .team {
      flex: 1;
      text-align: center;
    }
    .scoreboard .team-name {
      font-size: 18px;
      font-weight: 600;
      color: #f1f5f9;
    }
    .scoreboard .score-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
    }
    .scoreboard .score {
      font-size: 64px;
      font-weight: 700;
      color: #fff;
    }
    .scoreboard .vs {
      font-size: 24px;
      color: #64748b;
    }
    .scoreboard .result-badge {
      display: inline-block;
      padding: 8px 24px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      background: ${resultColor}20;
      color: ${resultColor};
      margin-top: 15px;
    }
    .scoreboard .match-info {
      margin-top: 15px;
      color: #94a3b8;
      font-size: 13px;
    }
    
    .section {
      background: #1e293b;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .section h2 {
      color: #22c55e;
      font-size: 18px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #334155;
    }
    
    .timeline {
      position: relative;
      padding-left: 30px;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 10px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #334155;
    }
    .timeline-item {
      position: relative;
      padding: 12px 0;
      border-bottom: 1px solid #334155;
    }
    .timeline-item:last-child {
      border-bottom: none;
    }
    .timeline-item::before {
      content: '';
      position: absolute;
      left: -24px;
      top: 50%;
      transform: translateY(-50%);
      width: 10px;
      height: 10px;
      background: #22c55e;
      border-radius: 50%;
    }
    .timeline-minute {
      display: inline-block;
      width: 40px;
      font-weight: 700;
      color: #f59e0b;
    }
    .timeline-icon {
      margin-right: 8px;
    }
    .timeline-player {
      font-weight: 600;
      color: #f1f5f9;
    }
    .timeline-type {
      color: #94a3b8;
      font-size: 13px;
      margin-left: 8px;
    }
    .timeline-assist {
      color: #64748b;
      font-size: 12px;
      margin-left: 48px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: #334155;
      color: #f1f5f9;
      padding: 12px;
      text-align: left;
      font-size: 13px;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #334155;
      font-size: 14px;
    }
    tr:hover {
      background: #334155;
    }
    .stat-highlight {
      color: #22c55e;
      font-weight: 600;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
      text-align: center;
    }
    .summary-item {
      background: #0f172a;
      padding: 16px;
      border-radius: 8px;
    }
    .summary-value {
      font-size: 28px;
      font-weight: 700;
      color: #22c55e;
    }
    .summary-label {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }
    
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #334155;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Raport meczowy</h1>
      <div class="meta">${data.teamName ? data.teamName + ' | ' : ''}${data.clubName}</div>
    </div>
    
    <div class="scoreboard">
      <div class="teams">
        <div class="team">
          <div class="team-name">${homeTeam}</div>
        </div>
        <div class="score-container">
          <div class="score">${homeScore}</div>
          <div class="vs">:</div>
          <div class="score">${awayScore}</div>
        </div>
        <div class="team">
          <div class="team-name">${awayTeam}</div>
        </div>
      </div>
      <div class="result-badge">${resultText}</div>
      <div class="match-info">
        ${data.match.date}${data.match.time ? ' | ' + data.match.time : ''}${data.match.location ? ' | ' + data.match.location : ''}
      </div>
    </div>
    
    <div class="section">
      <h2>Podsumowanie</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-value">${data.summary.totalGoals}</div>
          <div class="summary-label">Bramki</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${data.summary.totalAssists}</div>
          <div class="summary-label">Asysty</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${data.summary.totalYellowCards}</div>
          <div class="summary-label">Żółte kartki</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${data.summary.totalRedCards}</div>
          <div class="summary-label">Czerwone kartki</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${data.summary.totalSaves}</div>
          <div class="summary-label">Obrony</div>
        </div>
      </div>
    </div>
    
    ${data.events.length > 0 ? `
    <div class="section">
      <h2>Oś czasu meczu</h2>
      <div class="timeline">
        ${data.events.map(e => `
          <div class="timeline-item">
            <span class="timeline-minute">${e.minute}'</span>
            <span class="timeline-icon">${eventTypeIcons[e.type] || '📝'}</span>
            <span class="timeline-player">${e.playerName}</span>
            <span class="timeline-type">${eventTypeLabels[e.type] || e.type}</span>
            ${e.assistPlayerName ? `<div class="timeline-assist">Asysta: ${e.assistPlayerName}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    
    ${data.playerStats.length > 0 ? `
    <div class="section">
      <h2>Statystyki zawodników</h2>
      <table>
        <tr>
          <th>Zawodnik</th>
          <th>Pozycja</th>
          <th>Minuty</th>
          <th>Gole</th>
          <th>Asysty</th>
          <th>Żółte</th>
          <th>Czerwone</th>
          <th>Obrony</th>
        </tr>
        ${data.playerStats.map(s => `
          <tr>
            <td>${s.name}</td>
            <td>${s.position}</td>
            <td>${s.minutesPlayed}</td>
            <td class="${s.goals > 0 ? 'stat-highlight' : ''}">${s.goals}</td>
            <td class="${s.assists > 0 ? 'stat-highlight' : ''}">${s.assists}</td>
            <td>${s.yellowCards}</td>
            <td>${s.redCards}</td>
            <td>${s.saves}</td>
          </tr>
        `).join('')}
      </table>
    </div>
    ` : ''}
    
    <div class="footer">
      Raport wygenerowany: ${new Date().toLocaleString('pl-PL')} | Small Club Manager
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate match report CSV
 */
export function generateMatchReportCsv(data: MatchReportData): string {
  let csv = '';
  
  csv += `"RAPORT MECZOWY"\n`;
  csv += `"Klub","${data.clubName}"\n`;
  if (data.teamName) csv += `"Drużyna","${data.teamName}"\n`;
  csv += `\n`;
  
  csv += `"WYNIK"\n`;
  csv += `"Przeciwnik","${data.match.opponent}"\n`;
  csv += `"Data","${data.match.date}"\n`;
  csv += `"Wynik","${data.match.goalsScored}:${data.match.goalsConceded}"\n`;
  csv += `"Rezultat","${data.match.result === 'win' ? 'Wygrana' : data.match.result === 'loss' ? 'Przegrana' : 'Remis'}"\n`;
  csv += `\n`;
  
  csv += `"PODSUMOWANIE"\n`;
  csv += `"Bramki","${data.summary.totalGoals}"\n`;
  csv += `"Asysty","${data.summary.totalAssists}"\n`;
  csv += `"Żółte kartki","${data.summary.totalYellowCards}"\n`;
  csv += `"Czerwone kartki","${data.summary.totalRedCards}"\n`;
  csv += `"Obrony","${data.summary.totalSaves}"\n`;
  csv += `\n`;
  
  if (data.events.length > 0) {
    csv += `"WYDARZENIA"\n`;
    csv += `"Minuta","Typ","Zawodnik","Asysta"\n`;
    data.events.forEach(e => {
      csv += `"${e.minute}'","${e.type}","${e.playerName}","${e.assistPlayerName || ''}"\n`;
    });
    csv += `\n`;
  }
  
  if (data.playerStats.length > 0) {
    csv += `"STATYSTYKI ZAWODNIKÓW"\n`;
    csv += `"Zawodnik","Pozycja","Minuty","Gole","Asysty","Żółte","Czerwone","Obrony"\n`;
    data.playerStats.forEach(s => {
      csv += `"${s.name}","${s.position}","${s.minutesPlayed}","${s.goals}","${s.assists}","${s.yellowCards}","${s.redCards}","${s.saves}"\n`;
    });
  }
  
  return csv;
}
