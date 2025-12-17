/**
 * Social Media Integration Service
 * Handles Facebook and Instagram sharing for clubs
 */

import * as db from "../db";

export interface SocialMediaConfig {
  platform: "facebook" | "instagram";
  accessToken: string;
  pageId?: string; // For Facebook Pages
  accountId?: string; // For Instagram Business
  pageName?: string;
  expiresAt?: Date;
}

export interface ShareableContent {
  type: "match_stats" | "match_preview" | "match_result" | "player_highlight" | "team_photo";
  title: string;
  description: string;
  imageUrl?: string;
  hashtags?: string[];
  link?: string;
}

/**
 * Generate match preview content for sharing
 */
export function generateMatchPreview(match: {
  opponent: string;
  matchDate: Date;
  matchTime?: string;
  location?: string;
  homeAway: "home" | "away";
  teamName?: string;
  clubName: string;
}): ShareableContent {
  const dateStr = match.matchDate.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  
  const homeTeam = match.homeAway === "home" ? match.clubName : match.opponent;
  const awayTeam = match.homeAway === "away" ? match.clubName : match.opponent;
  
  return {
    type: "match_preview",
    title: `⚽ Zapowiedź meczu`,
    description: `${homeTeam} vs ${awayTeam}
📅 ${dateStr}${match.matchTime ? ` ⏰ ${match.matchTime}` : ""}
📍 ${match.location || "Lokalizacja do potwierdzenia"}

Zapraszamy kibiców na mecz! 💪

#${match.clubName.replace(/\s+/g, "")} #mecz #piłkanożna`,
    hashtags: [match.clubName.replace(/\s+/g, ""), "mecz", "piłkanożna", "futbol"],
  };
}

/**
 * Generate match result content for sharing
 */
export function generateMatchResult(match: {
  opponent: string;
  goalsScored: number;
  goalsConceded: number;
  result: "win" | "draw" | "loss" | null;
  homeAway: "home" | "away";
  clubName: string;
  scorers?: { name: string; goals: number }[];
}): ShareableContent {
  const resultEmoji = match.result === "win" ? "🎉" : match.result === "loss" ? "😔" : "🤝";
  const resultText = match.result === "win" ? "WYGRANA" : match.result === "loss" ? "PRZEGRANA" : "REMIS";
  
  const homeTeam = match.homeAway === "home" ? match.clubName : match.opponent;
  const awayTeam = match.homeAway === "away" ? match.clubName : match.opponent;
  const homeScore = match.homeAway === "home" ? match.goalsScored : match.goalsConceded;
  const awayScore = match.homeAway === "away" ? match.goalsScored : match.goalsConceded;
  
  let scorersText = "";
  if (match.scorers && match.scorers.length > 0) {
    scorersText = "\n\n⚽ Strzelcy:\n" + match.scorers.map(s => `• ${s.name}${s.goals > 1 ? ` (${s.goals})` : ""}`).join("\n");
  }
  
  return {
    type: "match_result",
    title: `${resultEmoji} ${resultText}!`,
    description: `${homeTeam} ${homeScore} : ${awayScore} ${awayTeam}

${resultEmoji} ${resultText}!${scorersText}

Dziękujemy za doping! 👏

#${match.clubName.replace(/\s+/g, "")} #wynik #piłkanożna`,
    hashtags: [match.clubName.replace(/\s+/g, ""), "wynik", "piłkanożna", resultText.toLowerCase()],
  };
}

/**
 * Generate match statistics content for sharing
 */
export function generateMatchStats(data: {
  opponent: string;
  goalsScored: number;
  goalsConceded: number;
  result: "win" | "draw" | "loss" | null;
  clubName: string;
  stats: {
    totalGoals: number;
    totalAssists: number;
    totalYellowCards: number;
    totalRedCards: number;
    totalSaves: number;
  };
  topScorer?: { name: string; goals: number };
  topAssister?: { name: string; assists: number };
}): ShareableContent {
  const resultEmoji = data.result === "win" ? "🏆" : data.result === "loss" ? "📊" : "📈";
  
  let statsText = `📊 STATYSTYKI MECZU

⚽ Bramki: ${data.stats.totalGoals}
🎯 Asysty: ${data.stats.totalAssists}
🟨 Żółte kartki: ${data.stats.totalYellowCards}
🟥 Czerwone kartki: ${data.stats.totalRedCards}
🧤 Obrony: ${data.stats.totalSaves}`;

  if (data.topScorer) {
    statsText += `\n\n👑 Król strzelców: ${data.topScorer.name} (${data.topScorer.goals})`;
  }
  if (data.topAssister) {
    statsText += `\n🎭 Asystent: ${data.topAssister.name} (${data.topAssister.assists})`;
  }

  return {
    type: "match_stats",
    title: `${resultEmoji} Statystyki meczu`,
    description: `${data.clubName} vs ${data.opponent}
Wynik: ${data.goalsScored} : ${data.goalsConceded}

${statsText}

#${data.clubName.replace(/\s+/g, "")} #statystyki #piłkanożna`,
    hashtags: [data.clubName.replace(/\s+/g, ""), "statystyki", "piłkanożna"],
  };
}

/**
 * Generate player highlight content
 */
export function generatePlayerHighlight(player: {
  name: string;
  achievement: string;
  description: string;
  clubName: string;
}): ShareableContent {
  return {
    type: "player_highlight",
    title: `⭐ Wyróżnienie zawodnika`,
    description: `🌟 ${player.name}

${player.achievement}
${player.description}

Gratulacje! 👏

#${player.clubName.replace(/\s+/g, "")} #zawodnik #piłkanożna`,
    hashtags: [player.clubName.replace(/\s+/g, ""), "zawodnik", "piłkanożna", "wyróżnienie"],
  };
}

/**
 * Generate HTML template for social media image
 */
export function generateSocialMediaImageHtml(content: ShareableContent, clubName: string, clubLogo?: string): string {
  const bgGradient = content.type === "match_result" 
    ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
    : content.type === "match_preview"
    ? "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)"
    : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1080px;
      height: 1080px;
      background: ${bgGradient};
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #fff;
      display: flex;
      flex-direction: column;
      padding: 60px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 40px;
    }
    .logo {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      background: #22c55e;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: bold;
    }
    .club-name {
      font-size: 32px;
      font-weight: 600;
      color: #22c55e;
    }
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .title {
      font-size: 64px;
      font-weight: 700;
      margin-bottom: 30px;
      line-height: 1.2;
    }
    .description {
      font-size: 28px;
      line-height: 1.6;
      color: #e2e8f0;
      white-space: pre-line;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 30px;
      border-top: 2px solid #334155;
    }
    .hashtags {
      font-size: 20px;
      color: #22c55e;
    }
    .branding {
      font-size: 18px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">${clubLogo ? `<img src="${clubLogo}" style="width:100%;height:100%;object-fit:cover;border-radius:16px">` : clubName.charAt(0)}</div>
    <div class="club-name">${clubName}</div>
  </div>
  <div class="content">
    <div class="title">${content.title}</div>
    <div class="description">${content.description.split('\n').slice(0, 8).join('\n')}</div>
  </div>
  <div class="footer">
    <div class="hashtags">${content.hashtags?.slice(0, 4).map(h => `#${h}`).join(' ') || ''}</div>
    <div class="branding">Small Club Manager</div>
  </div>
</body>
</html>
  `;
}

/**
 * Share content to Facebook Page
 * Note: Requires Facebook Graph API access token with pages_manage_posts permission
 */
export async function shareToFacebook(
  config: SocialMediaConfig,
  content: ShareableContent
): Promise<{ success: boolean; postId?: string; error?: string }> {
  if (!config.accessToken || !config.pageId) {
    return { success: false, error: "Brak konfiguracji Facebook" };
  }

  try {
    // Facebook Graph API endpoint for page posts
    const url = `https://graph.facebook.com/v18.0/${config.pageId}/feed`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `${content.title}\n\n${content.description}`,
        access_token: config.accessToken,
        link: content.link,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("[SocialMedia] Facebook error:", data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, postId: data.id };
  } catch (error: any) {
    console.error("[SocialMedia] Facebook share failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Share content to Instagram Business Account
 * Note: Requires Instagram Graph API with instagram_content_publish permission
 * Instagram requires an image URL for posts
 */
export async function shareToInstagram(
  config: SocialMediaConfig,
  content: ShareableContent,
  imageUrl: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  if (!config.accessToken || !config.accountId) {
    return { success: false, error: "Brak konfiguracji Instagram" };
  }

  try {
    // Step 1: Create media container
    const containerUrl = `https://graph.facebook.com/v18.0/${config.accountId}/media`;
    
    const containerResponse = await fetch(containerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: `${content.title}\n\n${content.description}`,
        access_token: config.accessToken,
      }),
    });

    const containerData = await containerResponse.json();

    if (containerData.error) {
      console.error("[SocialMedia] Instagram container error:", containerData.error);
      return { success: false, error: containerData.error.message };
    }

    // Step 2: Publish the container
    const publishUrl = `https://graph.facebook.com/v18.0/${config.accountId}/media_publish`;
    
    const publishResponse = await fetch(publishUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: config.accessToken,
      }),
    });

    const publishData = await publishResponse.json();

    if (publishData.error) {
      console.error("[SocialMedia] Instagram publish error:", publishData.error);
      return { success: false, error: publishData.error.message };
    }

    return { success: true, postId: publishData.id };
  } catch (error: any) {
    console.error("[SocialMedia] Instagram share failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get Facebook OAuth URL for connecting a page
 */
export function getFacebookOAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.FACEBOOK_APP_ID;
  if (!clientId) {
    throw new Error("FACEBOOK_APP_ID not configured");
  }

  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
  ].join(",");

  return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}&response_type=code`;
}

/**
 * Exchange Facebook OAuth code for access token
 */
export async function exchangeFacebookCode(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; expiresIn: number } | null> {
  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[SocialMedia] Facebook app credentials not configured");
    return null;
  }

  try {
    const url = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("[SocialMedia] Facebook token exchange error:", data.error);
      return null;
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 5184000, // Default 60 days
    };
  } catch (error) {
    console.error("[SocialMedia] Facebook token exchange failed:", error);
    return null;
  }
}

/**
 * Get user's Facebook pages
 */
export async function getFacebookPages(
  accessToken: string
): Promise<{ id: string; name: string; accessToken: string }[]> {
  try {
    const url = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("[SocialMedia] Get pages error:", data.error);
      return [];
    }

    return data.data.map((page: any) => ({
      id: page.id,
      name: page.name,
      accessToken: page.access_token,
    }));
  } catch (error) {
    console.error("[SocialMedia] Get pages failed:", error);
    return [];
  }
}

/**
 * Get Instagram Business Account connected to a Facebook Page
 */
export async function getInstagramAccount(
  pageId: string,
  pageAccessToken: string
): Promise<{ id: string; username: string } | null> {
  try {
    const url = `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error || !data.instagram_business_account) {
      return null;
    }

    // Get Instagram account details
    const igUrl = `https://graph.facebook.com/v18.0/${data.instagram_business_account.id}?fields=username&access_token=${pageAccessToken}`;
    const igResponse = await fetch(igUrl);
    const igData = await igResponse.json();

    return {
      id: data.instagram_business_account.id,
      username: igData.username || "Instagram",
    };
  } catch (error) {
    console.error("[SocialMedia] Get Instagram account failed:", error);
    return null;
  }
}
