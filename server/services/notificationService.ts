/**
 * Notification Service
 * Handles sending notifications via SMS (Twilio/SMSAPI) and Email
 * Uses club's own API keys for cost shifting to users
 */

import { getClubById, getPlayerById, getMatchById, createNotification } from "../db";

interface SMSConfig {
  provider: "twilio" | "smsapi" | "smslabs" | "none";
  apiKey: string;
  senderName?: string;
  accountSid?: string; // For Twilio
}

interface NotificationResult {
  success: boolean;
  channel: "sms" | "email" | "app";
  error?: string;
}

/**
 * Send SMS via Twilio
 */
async function sendTwilioSMS(
  to: string,
  message: string,
  accountSid: string,
  authToken: string,
  from: string
): Promise<NotificationResult> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: from,
        Body: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[SMS] Twilio error:", error);
      return { success: false, channel: "sms", error: `Twilio error: ${response.status}` };
    }

    console.log("[SMS] Twilio message sent successfully to:", to);
    return { success: true, channel: "sms" };
  } catch (error) {
    console.error("[SMS] Twilio exception:", error);
    return { success: false, channel: "sms", error: String(error) };
  }
}

/**
 * Send SMS via SMSAPI.pl
 */
async function sendSMSAPI(
  to: string,
  message: string,
  apiKey: string,
  senderName: string
): Promise<NotificationResult> {
  try {
    const url = "https://api.smsapi.pl/sms.do";
    const params = new URLSearchParams({
      access_token: apiKey,
      to: to.replace(/\+/g, ""),
      message,
      from: senderName,
      format: "json",
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (data.error) {
      console.error("[SMS] SMSAPI error:", data.error);
      return { success: false, channel: "sms", error: data.message || data.error };
    }

    console.log("[SMS] SMSAPI message sent successfully to:", to);
    return { success: true, channel: "sms" };
  } catch (error) {
    console.error("[SMS] SMSAPI exception:", error);
    return { success: false, channel: "sms", error: String(error) };
  }
}

/**
 * Send SMS using club's configured provider
 */
export async function sendSMS(
  clubId: number,
  phoneNumber: string,
  message: string
): Promise<NotificationResult> {
  const club = await getClubById(clubId);
  if (!club) {
    return { success: false, channel: "sms", error: "Club not found" };
  }

  if (!club.smsEnabled || club.smsProvider === "none") {
    return { success: false, channel: "sms", error: "SMS not configured for this club" };
  }

  if (!club.smsApiKey) {
    return { success: false, channel: "sms", error: "SMS API key not configured" };
  }

  // Normalize phone number
  let normalizedPhone = phoneNumber.replace(/\s/g, "");
  if (!normalizedPhone.startsWith("+")) {
    normalizedPhone = "+48" + normalizedPhone; // Default to Poland
  }

  switch (club.smsProvider) {
    case "twilio":
      // For Twilio, smsApiKey contains auth token, we need accountSid too
      // Format: accountSid:authToken
      const [accountSid, authToken] = club.smsApiKey.split(":");
      if (!accountSid || !authToken) {
        return { success: false, channel: "sms", error: "Invalid Twilio credentials format (use accountSid:authToken)" };
      }
      return sendTwilioSMS(normalizedPhone, message, accountSid, authToken, club.smsSenderName || "+48000000000");

    case "smsapi":
      return sendSMSAPI(normalizedPhone, message, club.smsApiKey, club.smsSenderName || "SKM");

    case "smslabs":
      // SMSLabs implementation would go here
      return { success: false, channel: "sms", error: "SMSLabs not yet implemented" };

    default:
      return { success: false, channel: "sms", error: `Unknown SMS provider: ${club.smsProvider}` };
  }
}

/**
 * Send in-app notification
 */
export async function sendAppNotification(
  clubId: number,
  userId: number | undefined,
  title: string,
  message: string,
  type: "match" | "training" | "payment" | "callup" | "general" = "general"
): Promise<NotificationResult> {
  try {
    await createNotification({
      clubId,
      userId,
      type,
      title,
      message,
      sentVia: "app",
    });
    return { success: true, channel: "app" };
  } catch (error) {
    console.error("[Notification] App notification error:", error);
    return { success: false, channel: "app", error: String(error) };
  }
}

/**
 * Send callup notification to a player
 */
export async function sendCallupNotification(
  clubId: number,
  playerId: number,
  matchId: number,
  channel: "app" | "email" | "sms" | "both",
  hoursBeforeMatch: number
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  const player = await getPlayerById(playerId);
  const match = await getMatchById(matchId);
  const club = await getClubById(clubId);

  if (!player || !match || !club) {
    return [{ success: false, channel: "app", error: "Player, match or club not found" }];
  }

  const matchDate = new Date(match.matchDate);
  const formattedDate = matchDate.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const title = hoursBeforeMatch === 48 
    ? `Powołanie na mecz za 2 dni` 
    : `Przypomnienie: Mecz jutro!`;

  const isHome = match.homeAway === "home";
  const message = `${player.name}, zostałeś powołany na mecz ${match.opponent} (${isHome ? "dom" : "wyjazd"}) w dniu ${formattedDate}. Potwierdź swoją obecność w aplikacji.`;

  // Always send app notification
  if (channel === "app" || channel === "both") {
    const appResult = await sendAppNotification(clubId, undefined, title, message, "callup");
    results.push(appResult);
  }

  // Send SMS if configured and requested
  if ((channel === "sms" || channel === "both") && player.phone) {
    const smsMessage = `[${club.name}] ${title}: ${match.opponent} (${isHome ? "D" : "W"}) - ${formattedDate}. Potwierdź obecność w aplikacji SKM.`;
    const smsResult = await sendSMS(clubId, player.phone, smsMessage);
    results.push(smsResult);
  }

  // Email would be implemented here
  if (channel === "email" || channel === "both") {
    // TODO: Implement email sending
    results.push({ success: false, channel: "email", error: "Email not yet implemented" });
  }

  return results;
}

/**
 * Schedule callup notifications for a match (48h and 24h before)
 */
export function calculateNotificationTimes(matchDate: Date): { notify48h: Date; notify24h: Date } {
  const matchTime = new Date(matchDate);
  
  const notify48h = new Date(matchTime);
  notify48h.setHours(notify48h.getHours() - 48);
  
  const notify24h = new Date(matchTime);
  notify24h.setHours(notify24h.getHours() - 24);
  
  return { notify48h, notify24h };
}

/**
 * Format notification message for callup
 */
export function formatCallupMessage(
  playerName: string,
  opponent: string,
  isHome: boolean,
  matchDate: Date,
  clubName: string
): string {
  const formattedDate = matchDate.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${playerName}, zostałeś powołany na mecz ${opponent} (${isHome ? "dom" : "wyjazd"}) w dniu ${formattedDate}. Potwierdź swoją obecność w aplikacji ${clubName}.`;
}
