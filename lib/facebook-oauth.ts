/**
 * Facebook OAuth Service
 * Handles Facebook Graph API authentication for posting to Pages
 */

import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const FB_ACCESS_TOKEN_KEY = "fb_access_token";
const FB_PAGE_TOKEN_KEY = "fb_page_token";
const FB_PAGE_ID_KEY = "fb_page_id";
const FB_PAGE_NAME_KEY = "fb_page_name";
const IG_ACCOUNT_ID_KEY = "ig_account_id";
const IG_USERNAME_KEY = "ig_username";

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
}

export interface FacebookConfig {
  appId: string;
  appSecret?: string;
  redirectUri: string;
}

// Default config - should be set from club settings
let facebookConfig: FacebookConfig = {
  appId: "", // Will be loaded from settings
  redirectUri: Platform.OS === "web" 
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/oauth/facebook/callback`
    : "fb://authorize",
};

/**
 * Set Facebook app configuration
 */
export function setFacebookConfig(config: Partial<FacebookConfig>) {
  facebookConfig = { ...facebookConfig, ...config };
}

/**
 * Get Facebook OAuth URL
 */
export function getFacebookOAuthUrl(state: string): string {
  const { appId, redirectUri } = facebookConfig;
  
  if (!appId) {
    throw new Error("Facebook App ID not configured");
  }

  const scopes = [
    "pages_show_list",
    "pages_read_engagement", 
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
  ].join(",");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: "code",
    state: state,
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  appSecret: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const { appId, redirectUri } = facebookConfig;

  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `client_id=${appId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `client_secret=${appSecret}&` +
    `code=${code}`
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  // Store access token
  await AsyncStorage.setItem(FB_ACCESS_TOKEN_KEY, data.access_token);

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Get long-lived access token (60 days instead of 1 hour)
 */
export async function getLongLivedToken(
  shortLivedToken: string,
  appSecret: string
): Promise<string> {
  const { appId } = facebookConfig;

  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `grant_type=fb_exchange_token&` +
    `client_id=${appId}&` +
    `client_secret=${appSecret}&` +
    `fb_exchange_token=${shortLivedToken}`
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  await AsyncStorage.setItem(FB_ACCESS_TOKEN_KEY, data.access_token);

  return data.access_token;
}

/**
 * Get user's Facebook Pages
 */
export async function getFacebookPages(accessToken: string): Promise<FacebookPage[]> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?` +
    `fields=id,name,access_token,category,picture&` +
    `access_token=${accessToken}`
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data || [];
}

/**
 * Get Instagram Business Account linked to a Facebook Page
 */
export async function getInstagramAccount(
  pageId: string,
  pageAccessToken: string
): Promise<InstagramAccount | null> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?` +
    `fields=instagram_business_account{id,username,profile_picture_url}&` +
    `access_token=${pageAccessToken}`
  );

  const data = await response.json();

  if (data.error) {
    console.error("[Facebook] Error getting Instagram account:", data.error);
    return null;
  }

  if (data.instagram_business_account) {
    const igAccount = data.instagram_business_account;
    await AsyncStorage.setItem(IG_ACCOUNT_ID_KEY, igAccount.id);
    await AsyncStorage.setItem(IG_USERNAME_KEY, igAccount.username || "");
    return igAccount;
  }

  return null;
}

/**
 * Save selected Facebook Page
 */
export async function saveSelectedPage(page: FacebookPage): Promise<void> {
  await AsyncStorage.setItem(FB_PAGE_ID_KEY, page.id);
  await AsyncStorage.setItem(FB_PAGE_TOKEN_KEY, page.access_token);
  await AsyncStorage.setItem(FB_PAGE_NAME_KEY, page.name);
}

/**
 * Get saved Facebook Page info
 */
export async function getSavedPageInfo(): Promise<{
  pageId: string | null;
  pageToken: string | null;
  pageName: string | null;
  igAccountId: string | null;
  igUsername: string | null;
}> {
  const [pageId, pageToken, pageName, igAccountId, igUsername] = await Promise.all([
    AsyncStorage.getItem(FB_PAGE_ID_KEY),
    AsyncStorage.getItem(FB_PAGE_TOKEN_KEY),
    AsyncStorage.getItem(FB_PAGE_NAME_KEY),
    AsyncStorage.getItem(IG_ACCOUNT_ID_KEY),
    AsyncStorage.getItem(IG_USERNAME_KEY),
  ]);

  return { pageId, pageToken, pageName, igAccountId, igUsername };
}

/**
 * Post to Facebook Page
 */
export async function postToFacebookPage(
  message: string,
  imageUrl?: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const { pageId, pageToken } = await getSavedPageInfo();

  if (!pageId || !pageToken) {
    return { success: false, error: "Nie połączono strony Facebook" };
  }

  try {
    let endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    let body: any = {
      message,
      access_token: pageToken,
    };

    // If image URL provided, post as photo
    if (imageUrl) {
      endpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      body = {
        url: imageUrl,
        caption: message,
        access_token: pageToken,
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      console.error("[Facebook] Post error:", data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, postId: data.id || data.post_id };
  } catch (error: any) {
    console.error("[Facebook] Post failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Post to Instagram Business Account
 */
export async function postToInstagram(
  imageUrl: string,
  caption: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const { pageToken, igAccountId } = await getSavedPageInfo();

  if (!igAccountId || !pageToken) {
    return { success: false, error: "Nie połączono konta Instagram" };
  }

  try {
    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: pageToken,
        }),
      }
    );

    const containerData = await containerResponse.json();

    if (containerData.error) {
      console.error("[Instagram] Container error:", containerData.error);
      return { success: false, error: containerData.error.message };
    }

    const containerId = containerData.id;

    // Step 2: Publish the container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: pageToken,
        }),
      }
    );

    const publishData = await publishResponse.json();

    if (publishData.error) {
      console.error("[Instagram] Publish error:", publishData.error);
      return { success: false, error: publishData.error.message };
    }

    return { success: true, postId: publishData.id };
  } catch (error: any) {
    console.error("[Instagram] Post failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Disconnect Facebook/Instagram accounts
 */
export async function disconnectAccounts(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(FB_ACCESS_TOKEN_KEY),
    AsyncStorage.removeItem(FB_PAGE_TOKEN_KEY),
    AsyncStorage.removeItem(FB_PAGE_ID_KEY),
    AsyncStorage.removeItem(FB_PAGE_NAME_KEY),
    AsyncStorage.removeItem(IG_ACCOUNT_ID_KEY),
    AsyncStorage.removeItem(IG_USERNAME_KEY),
  ]);
}

/**
 * Check if Facebook is connected
 */
export async function isFacebookConnected(): Promise<boolean> {
  const pageToken = await AsyncStorage.getItem(FB_PAGE_TOKEN_KEY);
  return !!pageToken;
}

/**
 * Check if Instagram is connected
 */
export async function isInstagramConnected(): Promise<boolean> {
  const igAccountId = await AsyncStorage.getItem(IG_ACCOUNT_ID_KEY);
  return !!igAccountId;
}
