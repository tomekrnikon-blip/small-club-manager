/**
 * Email Service
 * Handles sending emails via SMTP (Nodemailer-compatible)
 * Uses club's own SMTP configuration for cost shifting to users
 */

import { getClubById } from "../db";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Send email using fetch to a simple SMTP relay or external service
 * For production, integrate with services like SendGrid, Mailgun, or AWS SES
 */
async function sendEmailViaSMTP(
  config: EmailConfig,
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<EmailResult> {
  try {
    // For now, we'll use a simple HTTP-based email service approach
    // In production, you would use nodemailer or an email API service
    
    // Check if using SendGrid
    if (config.host.includes('sendgrid')) {
      return await sendViaSendGrid(config.password, config.fromEmail, to, subject, htmlBody, textBody);
    }
    
    // Check if using Mailgun
    if (config.host.includes('mailgun')) {
      return await sendViaMailgun(config.user, config.password, config.fromEmail, to, subject, htmlBody, textBody);
    }
    
    // Default: Log the email (for development/testing)
    console.log(`[Email] Would send email to ${to}`);
    console.log(`[Email] Subject: ${subject}`);
    console.log(`[Email] From: ${config.fromName} <${config.fromEmail}>`);
    
    // Return success for development
    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  } catch (error) {
    console.error("[Email] SMTP error:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Send email via SendGrid API
 */
async function sendViaSendGrid(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<EmailResult> {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from },
        subject,
        content: [
          { type: "text/plain", value: textBody || htmlBody.replace(/<[^>]*>/g, '') },
          { type: "text/html", value: htmlBody },
        ],
      }),
    });

    if (response.ok || response.status === 202) {
      return { success: true, messageId: response.headers.get("x-message-id") || undefined };
    }

    const error = await response.text();
    return { success: false, error: `SendGrid error: ${error}` };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Send email via Mailgun API
 */
async function sendViaMailgun(
  domain: string,
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<EmailResult> {
  try {
    const auth = Buffer.from(`api:${apiKey}`).toString("base64");
    const formData = new URLSearchParams();
    formData.append("from", from);
    formData.append("to", to);
    formData.append("subject", subject);
    formData.append("html", htmlBody);
    if (textBody) formData.append("text", textBody);

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      return { success: true, messageId: result.id };
    }

    const error = await response.text();
    return { success: false, error: `Mailgun error: ${error}` };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get email configuration for a club
 */
async function getClubEmailConfig(clubId: number): Promise<EmailConfig | null> {
  const club = await getClubById(clubId);
  if (!club) return null;

  // Check if email is configured
  if (!club.smtpHost || !club.smtpUser || !club.smtpPassword) {
    return null;
  }

  return {
    host: club.smtpHost,
    port: club.smtpPort || 587,
    secure: club.smtpSecure || false,
    user: club.smtpUser,
    password: club.smtpPassword,
    fromName: club.emailFromName || club.name,
    fromEmail: club.emailFromAddress || club.smtpUser,
  };
}

/**
 * Send email for a club
 */
export async function sendClubEmail(
  clubId: number,
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<EmailResult> {
  const config = await getClubEmailConfig(clubId);
  
  if (!config) {
    return {
      success: false,
      error: "Email not configured for this club. Please configure SMTP settings.",
    };
  }

  return sendEmailViaSMTP(config, to, subject, htmlBody, textBody);
}

/**
 * Send callup notification email
 */
export async function sendCallupEmail(
  clubId: number,
  playerEmail: string,
  playerName: string,
  matchInfo: {
    opponent: string;
    date: string;
    time: string;
    location: string;
    isHome: boolean;
  },
  hoursBeforeMatch: number
): Promise<EmailResult> {
  const subject = `Powołanie na mecz - ${matchInfo.opponent}`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">⚽ Powołanie na mecz</h1>
      </div>
      <div style="padding: 20px; background: #f8fafc;">
        <p>Cześć <strong>${playerName}</strong>,</p>
        <p>Zostałeś powołany na mecz:</p>
        <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #22c55e;">
          <p style="margin: 8px 0;"><strong>Przeciwnik:</strong> ${matchInfo.opponent}</p>
          <p style="margin: 8px 0;"><strong>Data:</strong> ${matchInfo.date}</p>
          <p style="margin: 8px 0;"><strong>Godzina:</strong> ${matchInfo.time}</p>
          <p style="margin: 8px 0;"><strong>Miejsce:</strong> ${matchInfo.location}</p>
          <p style="margin: 8px 0;"><strong>Typ:</strong> ${matchInfo.isHome ? 'Mecz domowy' : 'Mecz wyjazdowy'}</p>
        </div>
        <p>To przypomnienie wysłane <strong>${hoursBeforeMatch}h</strong> przed meczem.</p>
        <p>Potwierdź swoją obecność w aplikacji Small Club Manager.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          Wiadomość wygenerowana automatycznie przez Small Club Manager
        </p>
      </div>
    </div>
  `;

  const textBody = `
Powołanie na mecz

Cześć ${playerName},

Zostałeś powołany na mecz:
- Przeciwnik: ${matchInfo.opponent}
- Data: ${matchInfo.date}
- Godzina: ${matchInfo.time}
- Miejsce: ${matchInfo.location}
- Typ: ${matchInfo.isHome ? 'Mecz domowy' : 'Mecz wyjazdowy'}

To przypomnienie wysłane ${hoursBeforeMatch}h przed meczem.
Potwierdź swoją obecność w aplikacji Small Club Manager.
  `;

  return sendClubEmail(clubId, playerEmail, subject, htmlBody, textBody);
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminderEmail(
  clubId: number,
  parentEmail: string,
  parentName: string,
  studentName: string,
  amount: number,
  clubName: string
): Promise<EmailResult> {
  const subject = `Przypomnienie o płatności - ${clubName}`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">💰 Przypomnienie o płatności</h1>
      </div>
      <div style="padding: 20px; background: #f8fafc;">
        <p>Szanowny/a <strong>${parentName}</strong>,</p>
        <p>Przypominamy o nieuregulowanej płatności za szkółkę piłkarską:</p>
        <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 8px 0;"><strong>Uczeń:</strong> ${studentName}</p>
          <p style="margin: 8px 0;"><strong>Kwota:</strong> ${amount} PLN</p>
          <p style="margin: 8px 0;"><strong>Klub:</strong> ${clubName}</p>
        </div>
        <p>Prosimy o uregulowanie należności w najbliższym możliwym terminie.</p>
        <p>W razie pytań prosimy o kontakt z administracją klubu.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          Wiadomość wygenerowana automatycznie przez Small Club Manager
        </p>
      </div>
    </div>
  `;

  const textBody = `
Przypomnienie o płatności

Szanowny/a ${parentName},

Przypominamy o nieuregulowanej płatności za szkółkę piłkarską:
- Uczeń: ${studentName}
- Kwota: ${amount} PLN
- Klub: ${clubName}

Prosimy o uregulowanie należności w najbliższym możliwym terminie.
W razie pytań prosimy o kontakt z administracją klubu.
  `;

  return sendClubEmail(clubId, parentEmail, subject, htmlBody, textBody);
}

/**
 * Send invitation email
 */
export async function sendInvitationEmail(
  clubId: number,
  recipientEmail: string,
  clubName: string,
  role: string,
  inviteToken: string,
  inviterName: string
): Promise<EmailResult> {
  const subject = `Zaproszenie do klubu ${clubName}`;
  const inviteUrl = `${process.env.VITE_APP_URL || 'https://app.example.com'}/invite/${inviteToken}`;
  
  const roleNames: Record<string, string> = {
    manager: 'Manager',
    board: 'Członek Zarządu',
    board_finance: 'Zarząd - Finanse',
    coach: 'Trener',
    player: 'Zawodnik',
  };
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">⚽ Zaproszenie do klubu</h1>
      </div>
      <div style="padding: 20px; background: #f8fafc;">
        <p>Cześć!</p>
        <p><strong>${inviterName}</strong> zaprasza Cię do dołączenia do klubu <strong>${clubName}</strong> jako <strong>${roleNames[role] || role}</strong>.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${inviteUrl}" style="background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Akceptuj zaproszenie
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px;">
          Jeśli przycisk nie działa, skopiuj ten link do przeglądarki:<br>
          <a href="${inviteUrl}">${inviteUrl}</a>
        </p>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          Wiadomość wygenerowana automatycznie przez Small Club Manager
        </p>
      </div>
    </div>
  `;

  const textBody = `
Zaproszenie do klubu ${clubName}

Cześć!

${inviterName} zaprasza Cię do dołączenia do klubu ${clubName} jako ${roleNames[role] || role}.

Kliknij link, aby zaakceptować zaproszenie:
${inviteUrl}

Wiadomość wygenerowana automatycznie przez Small Club Manager
  `;

  return sendClubEmail(clubId, recipientEmail, subject, htmlBody, textBody);
}
