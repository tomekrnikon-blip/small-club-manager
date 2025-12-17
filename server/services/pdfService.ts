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
