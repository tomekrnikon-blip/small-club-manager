/**
 * WhatsApp Business API Integration Service
 * 
 * This service allows clubs to connect their own WhatsApp Business API
 * to send notifications. The costs are on the user's side.
 * 
 * Supports:
 * - WhatsApp Business API (Meta Cloud API)
 * - Custom WhatsApp Business Solution Providers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const WHATSAPP_CONFIG_KEY = 'whatsapp_config';
const WHATSAPP_TEMPLATES_KEY = 'whatsapp_templates';

// WhatsApp configuration interface
export interface WhatsAppConfig {
  enabled: boolean;
  provider: 'meta' | 'twilio' | 'custom';
  // Meta Cloud API
  phoneNumberId?: string;
  accessToken?: string;
  businessAccountId?: string;
  // Twilio
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWhatsAppNumber?: string;
  // Custom provider
  customApiUrl?: string;
  customApiKey?: string;
  // Settings
  defaultCountryCode: string;
  testMode: boolean;
  lastVerified?: string;
}

// Message template interface
export interface WhatsAppTemplate {
  id: string;
  name: string;
  type: 'training_reminder' | 'match_reminder' | 'callup' | 'attendance' | 'custom';
  language: string;
  content: string;
  variables: string[];
  approved: boolean;
}

// Default configuration
const defaultConfig: WhatsAppConfig = {
  enabled: false,
  provider: 'meta',
  defaultCountryCode: '+48',
  testMode: true,
};

// Default templates
const defaultTemplates: WhatsAppTemplate[] = [
  {
    id: 'training_reminder',
    name: 'Przypomnienie o treningu',
    type: 'training_reminder',
    language: 'pl',
    content: 'Przypomnienie: Trening {{team}} jutro o {{time}} w {{location}}. Do zobaczenia!',
    variables: ['team', 'time', 'location'],
    approved: false,
  },
  {
    id: 'match_reminder',
    name: 'Przypomnienie o meczu',
    type: 'match_reminder',
    language: 'pl',
    content: 'Przypomnienie: Mecz {{team}} vs {{opponent}} - {{date}} o {{time}}. Miejsce: {{location}}',
    variables: ['team', 'opponent', 'date', 'time', 'location'],
    approved: false,
  },
  {
    id: 'callup',
    name: 'Powołanie na mecz',
    type: 'callup',
    language: 'pl',
    content: 'Zostałeś powołany na mecz {{team}} vs {{opponent}} w dniu {{date}}. Potwierdź obecność.',
    variables: ['team', 'opponent', 'date'],
    approved: false,
  },
  {
    id: 'attendance_missing',
    name: 'Brak obecności',
    type: 'attendance',
    language: 'pl',
    content: 'Nieobecność na treningu {{date}}. Prosimy o kontakt z trenerem.',
    variables: ['date'],
    approved: false,
  },
];

/**
 * Get WhatsApp configuration
 */
export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  try {
    const stored = await AsyncStorage.getItem(WHATSAPP_CONFIG_KEY);
    if (stored) {
      return { ...defaultConfig, ...JSON.parse(stored) };
    }
    return defaultConfig;
  } catch (error) {
    console.error('[WhatsApp] Error loading config:', error);
    return defaultConfig;
  }
}

/**
 * Save WhatsApp configuration
 */
export async function saveWhatsAppConfig(config: Partial<WhatsAppConfig>): Promise<void> {
  try {
    const current = await getWhatsAppConfig();
    const updated = { ...current, ...config };
    await AsyncStorage.setItem(WHATSAPP_CONFIG_KEY, JSON.stringify(updated));
    console.log('[WhatsApp] Config saved');
  } catch (error) {
    console.error('[WhatsApp] Error saving config:', error);
    throw error;
  }
}

/**
 * Get message templates
 */
export async function getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
  try {
    const stored = await AsyncStorage.getItem(WHATSAPP_TEMPLATES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return defaultTemplates;
  } catch (error) {
    console.error('[WhatsApp] Error loading templates:', error);
    return defaultTemplates;
  }
}

/**
 * Save message templates
 */
export async function saveWhatsAppTemplates(templates: WhatsAppTemplate[]): Promise<void> {
  try {
    await AsyncStorage.setItem(WHATSAPP_TEMPLATES_KEY, JSON.stringify(templates));
    console.log('[WhatsApp] Templates saved');
  } catch (error) {
    console.error('[WhatsApp] Error saving templates:', error);
    throw error;
  }
}

/**
 * Format phone number for WhatsApp
 */
export function formatPhoneNumber(phone: string, countryCode: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, remove it and add country code
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // If doesn't start with country code, add it
  const codeDigits = countryCode.replace(/\D/g, '');
  if (!cleaned.startsWith(codeDigits)) {
    cleaned = codeDigits + cleaned;
  }
  
  return cleaned;
}

/**
 * Replace template variables with actual values
 */
export function fillTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

/**
 * Send WhatsApp message via Meta Cloud API
 */
async function sendViaMeta(
  config: WhatsAppConfig,
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!config.phoneNumberId || !config.accessToken) {
    return { success: false, error: 'Meta API not configured' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const data = await response.json();
    
    if (response.ok && data.messages?.[0]?.id) {
      return { success: true, messageId: data.messages[0].id };
    } else {
      return { success: false, error: data.error?.message || 'Unknown error' };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Send WhatsApp message via Twilio
 */
async function sendViaTwilio(
  config: WhatsAppConfig,
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioWhatsAppNumber) {
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const auth = btoa(`${config.twilioAccountSid}:${config.twilioAuthToken}`);
    const formData = new URLSearchParams();
    formData.append('From', `whatsapp:${config.twilioWhatsAppNumber}`);
    formData.append('To', `whatsapp:+${to}`);
    formData.append('Body', message);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    const data = await response.json();
    
    if (response.ok && data.sid) {
      return { success: true, messageId: data.sid };
    } else {
      return { success: false, error: data.message || 'Unknown error' };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Send WhatsApp message via custom provider
 */
async function sendViaCustom(
  config: WhatsAppConfig,
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!config.customApiUrl || !config.customApiKey) {
    return { success: false, error: 'Custom API not configured' };
  }

  try {
    const response = await fetch(config.customApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.customApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: to,
        message: message,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, messageId: data.messageId || data.id };
    } else {
      return { success: false, error: data.error || data.message || 'Unknown error' };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Send WhatsApp message
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string,
  config?: WhatsAppConfig
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const cfg = config || await getWhatsAppConfig();
  
  if (!cfg.enabled) {
    return { success: false, error: 'WhatsApp integration is disabled' };
  }

  // Format phone number
  const formattedPhone = formatPhoneNumber(to, cfg.defaultCountryCode);
  
  // Test mode - just log
  if (cfg.testMode) {
    console.log('[WhatsApp] Test mode - would send to:', formattedPhone, 'message:', message);
    return { success: true, messageId: 'test_' + Date.now() };
  }

  // Send via configured provider
  switch (cfg.provider) {
    case 'meta':
      return sendViaMeta(cfg, formattedPhone, message);
    case 'twilio':
      return sendViaTwilio(cfg, formattedPhone, message);
    case 'custom':
      return sendViaCustom(cfg, formattedPhone, message);
    default:
      return { success: false, error: 'Unknown provider' };
  }
}

/**
 * Send templated WhatsApp message
 */
export async function sendTemplatedMessage(
  to: string,
  templateId: string,
  variables: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const templates = await getWhatsAppTemplates();
  const template = templates.find(t => t.id === templateId);
  
  if (!template) {
    return { success: false, error: 'Template not found' };
  }

  const message = fillTemplate(template.content, variables);
  return sendWhatsAppMessage(to, message);
}

/**
 * Verify WhatsApp configuration
 */
export async function verifyWhatsAppConfig(
  config: WhatsAppConfig
): Promise<{ valid: boolean; error?: string }> {
  try {
    switch (config.provider) {
      case 'meta':
        if (!config.phoneNumberId || !config.accessToken) {
          return { valid: false, error: 'Brakuje Phone Number ID lub Access Token' };
        }
        // Try to get phone number info
        const metaResponse = await fetch(
          `https://graph.facebook.com/v18.0/${config.phoneNumberId}`,
          {
            headers: { 'Authorization': `Bearer ${config.accessToken}` },
          }
        );
        if (!metaResponse.ok) {
          return { valid: false, error: 'Nieprawidłowe dane Meta API' };
        }
        return { valid: true };

      case 'twilio':
        if (!config.twilioAccountSid || !config.twilioAuthToken) {
          return { valid: false, error: 'Brakuje Account SID lub Auth Token' };
        }
        // Try to get account info
        const auth = btoa(`${config.twilioAccountSid}:${config.twilioAuthToken}`);
        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}.json`,
          {
            headers: { 'Authorization': `Basic ${auth}` },
          }
        );
        if (!twilioResponse.ok) {
          return { valid: false, error: 'Nieprawidłowe dane Twilio' };
        }
        return { valid: true };

      case 'custom':
        if (!config.customApiUrl || !config.customApiKey) {
          return { valid: false, error: 'Brakuje URL API lub klucza API' };
        }
        return { valid: true };

      default:
        return { valid: false, error: 'Nieznany dostawca' };
    }
  } catch (error) {
    return { valid: false, error: String(error) };
  }
}

/**
 * Send bulk WhatsApp messages
 */
export async function sendBulkWhatsAppMessages(
  recipients: Array<{ phone: string; message: string }>
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const config = await getWhatsAppConfig();
  
  if (!config.enabled) {
    return { sent: 0, failed: recipients.length, errors: ['WhatsApp integration is disabled'] };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    const result = await sendWhatsAppMessage(recipient.phone, recipient.message, config);
    if (result.success) {
      sent++;
    } else {
      failed++;
      if (result.error) {
        errors.push(`${recipient.phone}: ${result.error}`);
      }
    }
    
    // Rate limiting - wait 100ms between messages
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { sent, failed, errors };
}
