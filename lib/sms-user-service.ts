/**
 * SMS Service with User's Own Provider Integration
 * 
 * Allows users to connect their own SMS provider (SMSAPI.pl, SMSLabs, Twilio)
 * so that costs are on the user's side.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const SMS_CONFIG_KEY = 'user_sms_config';
const SMS_STATS_KEY = 'user_sms_stats';
const SMS_HISTORY_KEY = 'user_sms_history';

export type SMSProvider = 'smsapi' | 'smslabs' | 'twilio' | 'custom';

export interface SMSConfig {
  enabled: boolean;
  provider: SMSProvider;
  testMode: boolean;
  defaultCountryCode: string;
  lastVerified?: string;
  
  // SMSAPI.pl
  smsapiToken?: string;
  smsapiFrom?: string;
  
  // SMSLabs
  smslabsAppKey?: string;
  smslabsSecretKey?: string;
  smslabsFrom?: string;
  
  // Twilio
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  
  // Custom provider
  customApiUrl?: string;
  customApiKey?: string;
  customHeaders?: Record<string, string>;
}

export interface SMSStats {
  totalSent: number;
  totalFailed: number;
  totalCost: number;
  byType: {
    training_reminder: number;
    match_reminder: number;
    callup: number;
    attendance: number;
    custom: number;
  };
  byMonth: {
    month: string;
    sent: number;
    failed: number;
    cost: number;
  }[];
}

export interface SMSHistoryItem {
  id: string;
  phone: string;
  message: string;
  type: 'training_reminder' | 'match_reminder' | 'callup' | 'attendance' | 'custom';
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
  provider: SMSProvider;
  messageId?: string;
  error?: string;
  cost?: number;
}

// Default config
const defaultConfig: SMSConfig = {
  enabled: false,
  provider: 'smsapi',
  testMode: true,
  defaultCountryCode: '+48',
};

// Get SMS config
export async function getSMSConfig(): Promise<SMSConfig> {
  try {
    const stored = await AsyncStorage.getItem(SMS_CONFIG_KEY);
    if (stored) {
      return { ...defaultConfig, ...JSON.parse(stored) };
    }
    return defaultConfig;
  } catch (error) {
    console.error('[SMS] Error getting config:', error);
    return defaultConfig;
  }
}

// Save SMS config
export async function saveSMSConfig(config: SMSConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(SMS_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('[SMS] Error saving config:', error);
    throw error;
  }
}

// Verify SMS config
export async function verifySMSConfig(config: SMSConfig): Promise<{ valid: boolean; error?: string; balance?: number }> {
  try {
    switch (config.provider) {
      case 'smsapi':
        return await verifySMSAPI(config);
      case 'smslabs':
        return await verifySMSLabs(config);
      case 'twilio':
        return await verifyTwilio(config);
      case 'custom':
        return await verifyCustom(config);
      default:
        return { valid: false, error: 'Nieznany dostawca' };
    }
  } catch (error) {
    return { valid: false, error: 'Błąd weryfikacji: ' + (error as Error).message };
  }
}

// SMSAPI.pl verification
async function verifySMSAPI(config: SMSConfig): Promise<{ valid: boolean; error?: string; balance?: number }> {
  if (!config.smsapiToken) {
    return { valid: false, error: 'Brak tokenu API' };
  }
  
  try {
    const response = await fetch('https://api.smsapi.pl/profile', {
      headers: {
        'Authorization': `Bearer ${config.smsapiToken}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return { valid: true, balance: data.points };
    } else {
      return { valid: false, error: 'Nieprawidłowy token API' };
    }
  } catch (error) {
    return { valid: false, error: 'Błąd połączenia z SMSAPI' };
  }
}

// SMSLabs verification
async function verifySMSLabs(config: SMSConfig): Promise<{ valid: boolean; error?: string; balance?: number }> {
  if (!config.smslabsAppKey || !config.smslabsSecretKey) {
    return { valid: false, error: 'Brak kluczy API' };
  }
  
  try {
    const auth = Buffer.from(`${config.smslabsAppKey}:${config.smslabsSecretKey}`).toString('base64');
    const response = await fetch('https://api.smslabs.net.pl/apiSms/account', {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return { valid: true, balance: data.account?.balance };
    } else {
      return { valid: false, error: 'Nieprawidłowe klucze API' };
    }
  } catch (error) {
    return { valid: false, error: 'Błąd połączenia z SMSLabs' };
  }
}

// Twilio verification
async function verifyTwilio(config: SMSConfig): Promise<{ valid: boolean; error?: string; balance?: number }> {
  if (!config.twilioAccountSid || !config.twilioAuthToken) {
    return { valid: false, error: 'Brak danych uwierzytelniających' };
  }
  
  try {
    const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}.json`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });
    
    if (response.ok) {
      return { valid: true };
    } else {
      return { valid: false, error: 'Nieprawidłowe dane uwierzytelniające' };
    }
  } catch (error) {
    return { valid: false, error: 'Błąd połączenia z Twilio' };
  }
}

// Custom provider verification
async function verifyCustom(config: SMSConfig): Promise<{ valid: boolean; error?: string }> {
  if (!config.customApiUrl) {
    return { valid: false, error: 'Brak URL API' };
  }
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (config.customApiKey) {
      headers['Authorization'] = `Bearer ${config.customApiKey}`;
    }
    
    if (config.customHeaders) {
      Object.assign(headers, config.customHeaders);
    }
    
    const response = await fetch(config.customApiUrl, {
      method: 'HEAD',
      headers,
    });
    
    return { valid: response.ok || response.status === 405 };
  } catch (error) {
    return { valid: false, error: 'Błąd połączenia z API' };
  }
}

// Send SMS
export async function sendSMS(
  phone: string,
  message: string,
  config?: SMSConfig,
  type: SMSHistoryItem['type'] = 'custom'
): Promise<{ success: boolean; messageId?: string; error?: string; cost?: number }> {
  const cfg = config || await getSMSConfig();
  
  if (!cfg.enabled) {
    return { success: false, error: 'SMS jest wyłączony' };
  }
  
  // Normalize phone number
  let normalizedPhone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  if (!normalizedPhone.startsWith('+')) {
    normalizedPhone = cfg.defaultCountryCode + normalizedPhone;
  }
  
  // Test mode - simulate sending
  if (cfg.testMode) {
    console.log('[SMS] Test mode - simulating send to:', normalizedPhone);
    const result = { success: true, messageId: `test_${Date.now()}` };
    await trackSMSMessage(normalizedPhone, message, type, 'sent', cfg.provider, result.messageId);
    return result;
  }
  
  try {
    let result: { success: boolean; messageId?: string; error?: string; cost?: number };
    
    switch (cfg.provider) {
      case 'smsapi':
        result = await sendViaSMSAPI(normalizedPhone, message, cfg);
        break;
      case 'smslabs':
        result = await sendViaSMSLabs(normalizedPhone, message, cfg);
        break;
      case 'twilio':
        result = await sendViaTwilio(normalizedPhone, message, cfg);
        break;
      case 'custom':
        result = await sendViaCustom(normalizedPhone, message, cfg);
        break;
      default:
        result = { success: false, error: 'Nieznany dostawca' };
    }
    
    await trackSMSMessage(
      normalizedPhone,
      message,
      type,
      result.success ? 'sent' : 'failed',
      cfg.provider,
      result.messageId,
      result.error,
      result.cost
    );
    
    return result;
  } catch (error) {
    const errorMsg = (error as Error).message;
    await trackSMSMessage(normalizedPhone, message, type, 'failed', cfg.provider, undefined, errorMsg);
    return { success: false, error: errorMsg };
  }
}

// Send via SMSAPI.pl
async function sendViaSMSAPI(
  phone: string,
  message: string,
  config: SMSConfig
): Promise<{ success: boolean; messageId?: string; error?: string; cost?: number }> {
  const params = new URLSearchParams({
    to: phone,
    message: message,
    from: config.smsapiFrom || 'Info',
    format: 'json',
  });
  
  const response = await fetch('https://api.smsapi.pl/sms.do', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.smsapiToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  
  const data = await response.json();
  
  if (data.list && data.list.length > 0) {
    return {
      success: true,
      messageId: data.list[0].id,
      cost: data.list[0].points,
    };
  } else {
    return {
      success: false,
      error: data.error || 'Błąd wysyłki',
    };
  }
}

// Send via SMSLabs
async function sendViaSMSLabs(
  phone: string,
  message: string,
  config: SMSConfig
): Promise<{ success: boolean; messageId?: string; error?: string; cost?: number }> {
  const auth = Buffer.from(`${config.smslabsAppKey}:${config.smslabsSecretKey}`).toString('base64');
  
  const response = await fetch('https://api.smslabs.net.pl/apiSms/sendSms', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone_number: phone,
      message: message,
      sender_id: config.smslabsFrom || 'Info',
    }),
  });
  
  const data = await response.json();
  
  if (data.account) {
    return {
      success: true,
      messageId: data.sms_id,
    };
  } else {
    return {
      success: false,
      error: data.message || 'Błąd wysyłki',
    };
  }
}

// Send via Twilio
async function sendViaTwilio(
  phone: string,
  message: string,
  config: SMSConfig
): Promise<{ success: boolean; messageId?: string; error?: string; cost?: number }> {
  const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');
  
  const params = new URLSearchParams({
    To: phone,
    From: config.twilioPhoneNumber || '',
    Body: message,
  });
  
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );
  
  const data = await response.json();
  
  if (data.sid) {
    return {
      success: true,
      messageId: data.sid,
    };
  } else {
    return {
      success: false,
      error: data.message || 'Błąd wysyłki',
    };
  }
}

// Send via Custom provider
async function sendViaCustom(
  phone: string,
  message: string,
  config: SMSConfig
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (config.customApiKey) {
    headers['Authorization'] = `Bearer ${config.customApiKey}`;
  }
  
  if (config.customHeaders) {
    Object.assign(headers, config.customHeaders);
  }
  
  const response = await fetch(config.customApiUrl!, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      phone,
      message,
    }),
  });
  
  if (response.ok) {
    const data = await response.json();
    return {
      success: true,
      messageId: data.id || data.messageId,
    };
  } else {
    return {
      success: false,
      error: 'Błąd wysyłki',
    };
  }
}

// Track SMS message
async function trackSMSMessage(
  phone: string,
  message: string,
  type: SMSHistoryItem['type'],
  status: 'sent' | 'failed',
  provider: SMSProvider,
  messageId?: string,
  error?: string,
  cost?: number
): Promise<void> {
  try {
    // Update history
    const historyStr = await AsyncStorage.getItem(SMS_HISTORY_KEY);
    const history: SMSHistoryItem[] = historyStr ? JSON.parse(historyStr) : [];
    
    history.unshift({
      id: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phone,
      message: message.substring(0, 160),
      type,
      status,
      sentAt: new Date().toISOString(),
      provider,
      messageId,
      error,
      cost,
    });
    
    // Keep only last 500 messages
    const trimmedHistory = history.slice(0, 500);
    await AsyncStorage.setItem(SMS_HISTORY_KEY, JSON.stringify(trimmedHistory));
    
    // Update stats
    const statsStr = await AsyncStorage.getItem(SMS_STATS_KEY);
    const stats: SMSStats = statsStr ? JSON.parse(statsStr) : {
      totalSent: 0,
      totalFailed: 0,
      totalCost: 0,
      byType: {
        training_reminder: 0,
        match_reminder: 0,
        callup: 0,
        attendance: 0,
        custom: 0,
      },
      byMonth: [],
    };
    
    if (status === 'sent') {
      stats.totalSent++;
      stats.byType[type]++;
      if (cost) {
        stats.totalCost += cost;
      }
    } else {
      stats.totalFailed++;
    }
    
    // Update monthly stats
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthIndex = stats.byMonth.findIndex(m => m.month === currentMonth);
    if (monthIndex >= 0) {
      if (status === 'sent') {
        stats.byMonth[monthIndex].sent++;
        if (cost) {
          stats.byMonth[monthIndex].cost += cost;
        }
      } else {
        stats.byMonth[monthIndex].failed++;
      }
    } else {
      stats.byMonth.push({
        month: currentMonth,
        sent: status === 'sent' ? 1 : 0,
        failed: status === 'failed' ? 1 : 0,
        cost: cost || 0,
      });
    }
    
    stats.byMonth = stats.byMonth.slice(-12);
    
    await AsyncStorage.setItem(SMS_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('[SMS] Error tracking message:', error);
  }
}

// Get SMS stats
export async function getSMSStats(): Promise<SMSStats> {
  try {
    const stored = await AsyncStorage.getItem(SMS_STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      totalSent: 0,
      totalFailed: 0,
      totalCost: 0,
      byType: {
        training_reminder: 0,
        match_reminder: 0,
        callup: 0,
        attendance: 0,
        custom: 0,
      },
      byMonth: [],
    };
  } catch (error) {
    console.error('[SMS] Error getting stats:', error);
    throw error;
  }
}

// Get SMS history
export async function getSMSHistory(): Promise<SMSHistoryItem[]> {
  try {
    const stored = await AsyncStorage.getItem(SMS_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('[SMS] Error getting history:', error);
    return [];
  }
}
