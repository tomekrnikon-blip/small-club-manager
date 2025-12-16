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
