/**
 * Survey Notification Service
 * Sends notifications when new surveys are created
 */

import * as db from "../db";
import { sendClubEmail } from "./emailService";

interface SurveyNotificationParams {
  clubId: number;
  surveyId: number;
  surveyTitle: string;
  surveyType: "poll" | "feedback" | "date_vote";
  creatorName: string;
  endsAt?: Date;
}

/**
 * Send notifications to all club members about a new survey
 */
export async function notifyNewSurvey(params: SurveyNotificationParams): Promise<{
  sent: number;
  failed: number;
}> {
  const { clubId, surveyId, surveyTitle, surveyType, creatorName, endsAt } = params;
  
  let sent = 0;
  let failed = 0;

  try {
    // Get all club members
    const members = await db.getClubMembers(clubId);
    
    // Get club info
    const club = await db.getClubById(clubId);
    if (!club) {
      console.error("[SurveyNotification] Club not found:", clubId);
      return { sent: 0, failed: 0 };
    }

    // Get user emails for members
    for (const member of members) {
      try {
        const user = await db.getUserById(member.userId);
        if (!user?.email) continue;

        // Create in-app notification
        await db.createNotification({
          clubId,
          userId: user.id,
          type: "general",
          title: `Nowa ankieta: ${surveyTitle}`,
          message: `${creatorName} utworzył nową ankietę. Kliknij aby zagłosować.`,
          sentVia: "app",
        });

        // Send email notification if club has email configured
        if (club.emailEnabled && club.emailFromAddress) {
          const emailResult = await sendSurveyNotificationEmail(
            clubId,
            user.email,
            user.name || "Użytkownik",
            surveyTitle,
            surveyType,
            creatorName,
            club.name,
            endsAt
          );
          
          if (emailResult.success) {
            sent++;
          } else {
            failed++;
          }
        } else {
          sent++; // Count in-app notification as sent
        }
      } catch (error) {
        console.error("[SurveyNotification] Failed to notify member:", error);
        failed++;
      }
    }
  } catch (error) {
    console.error("[SurveyNotification] Failed to send notifications:", error);
  }

  return { sent, failed };
}

/**
 * Send email notification about new survey
 */
async function sendSurveyNotificationEmail(
  clubId: number,
  recipientEmail: string,
  recipientName: string,
  surveyTitle: string,
  surveyType: "poll" | "feedback" | "date_vote",
  creatorName: string,
  clubName: string,
  endsAt?: Date
): Promise<{ success: boolean; error?: string }> {
  const typeLabels: Record<string, string> = {
    poll: "Ankieta",
    feedback: "Opinia",
    date_vote: "Głosowanie na termin",
  };

  const typeIcons: Record<string, string> = {
    poll: "📊",
    feedback: "💬",
    date_vote: "📅",
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">${typeIcons[surveyType]}</div>
        <h1 style="color: white; margin: 0;">Nowa ankieta</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">${clubName}</p>
      </div>
      <div style="padding: 20px; background: #f8fafc;">
        <p>Cześć <strong>${recipientName}</strong>! 👋</p>
        <p><strong>${creatorName}</strong> utworzył nową ankietę i czeka na Twój głos.</p>
        
        <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #22c55e;">
          <div style="font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">
            ${typeLabels[surveyType]}
          </div>
          <div style="font-size: 18px; font-weight: 600; color: #1e293b;">
            ${surveyTitle}
          </div>
          ${endsAt ? `
            <div style="font-size: 13px; color: #64748b; margin-top: 12px;">
              ⏰ Głosowanie kończy się: ${endsAt.toLocaleDateString('pl-PL', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </div>
          ` : ''}
        </div>
        
        <p style="text-align: center;">
          <a href="#" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Zagłosuj teraz
          </a>
        </p>
        
        <p style="color: #64748b; font-size: 12px; margin-top: 24px; text-align: center;">
          Small Club Manager
        </p>
      </div>
    </div>
  `;

  const text = `
Nowa ankieta - ${clubName}

Cześć ${recipientName}!

${creatorName} utworzył nową ankietę: ${surveyTitle}

Typ: ${typeLabels[surveyType]}
${endsAt ? `Głosowanie kończy się: ${endsAt.toLocaleDateString('pl-PL')}` : ''}

Zaloguj się do aplikacji, aby zagłosować.
  `;

  return sendClubEmail(
    clubId,
    recipientEmail,
    `${typeIcons[surveyType]} Nowa ankieta: ${surveyTitle} | ${clubName}`,
    html,
    text
  );
}

/**
 * Send reminder about expiring survey
 */
export async function notifySurveyExpiring(
  clubId: number,
  surveyId: number,
  surveyTitle: string,
  endsAt: Date,
  hoursRemaining: number
): Promise<void> {
  try {
    // Get members who haven't voted yet
    const members = await db.getClubMembers(clubId);
    
    for (const member of members) {
      const vote = await db.getUserSurveyVote(surveyId, member.userId);
      if (vote) continue; // Already voted
      
      await db.createNotification({
        clubId,
        userId: member.userId,
        type: "general",
        title: `Ankieta kończy się za ${hoursRemaining}h`,
        message: `Nie zapomnij zagłosować w ankiecie: ${surveyTitle}`,
        sentVia: "app",
      });
    }
  } catch (error) {
    console.error("[SurveyNotification] Failed to send expiring notifications:", error);
  }
}
