import { Platform } from 'react-native';

/**
 * AdMob Configuration
 * 
 * Production IDs should be set via environment variables:
 * - EXPO_PUBLIC_ADMOB_BANNER_ID_IOS
 * - EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID
 * - EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_IOS
 * - EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID_ANDROID
 * - EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS
 * - EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID
 * 
 * Test IDs are used when environment variables are not set
 */

// Google AdMob Test IDs (safe to use in development)
const TEST_IDS = {
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
    rewardedInterstitial: 'ca-app-pub-3940256099942544/6978759866',
    native: 'ca-app-pub-3940256099942544/3986624511',
  },
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    rewardedInterstitial: 'ca-app-pub-3940256099942544/5354046379',
    native: 'ca-app-pub-3940256099942544/2247696110',
  },
};

// Check if running in production mode
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get AdMob unit ID based on platform and ad type
 */
export function getAdUnitId(type: 'banner' | 'interstitial' | 'rewarded' | 'rewardedInterstitial' | 'native'): string {
  const platform = Platform.OS as 'ios' | 'android';
  
  // Return test IDs for non-iOS/Android platforms (web)
  if (platform !== 'ios' && platform !== 'android') {
    return TEST_IDS.android[type]; // Fallback to Android test ID
  }

  // Check for production environment variables
  if (isProduction) {
    const envKey = `EXPO_PUBLIC_ADMOB_${type.toUpperCase()}_ID_${platform.toUpperCase()}`;
    const productionId = process.env[envKey];
    
    if (productionId) {
      return productionId;
    }
    
    console.warn(`[AdMob] Production ID not found for ${type} on ${platform}. Using test ID.`);
  }

  // Return test IDs for development or when production IDs are not set
  return TEST_IDS[platform][type];
}

/**
 * AdMob configuration object
 */
export const AdMobConfig = {
  // Banner ad unit IDs
  banner: {
    ios: getAdUnitId('banner'),
    android: getAdUnitId('banner'),
    get current() {
      return Platform.OS === 'ios' ? this.ios : this.android;
    },
  },
  
  // Interstitial ad unit IDs
  interstitial: {
    ios: getAdUnitId('interstitial'),
    android: getAdUnitId('interstitial'),
    get current() {
      return Platform.OS === 'ios' ? this.ios : this.android;
    },
  },
  
  // Rewarded ad unit IDs
  rewarded: {
    ios: getAdUnitId('rewarded'),
    android: getAdUnitId('rewarded'),
    get current() {
      return Platform.OS === 'ios' ? this.ios : this.android;
    },
  },
  
  // Rewarded interstitial ad unit IDs
  rewardedInterstitial: {
    ios: getAdUnitId('rewardedInterstitial'),
    android: getAdUnitId('rewardedInterstitial'),
    get current() {
      return Platform.OS === 'ios' ? this.ios : this.android;
    },
  },
  
  // Native ad unit IDs
  native: {
    ios: getAdUnitId('native'),
    android: getAdUnitId('native'),
    get current() {
      return Platform.OS === 'ios' ? this.ios : this.android;
    },
  },
  
  // Ad request configuration
  requestConfig: {
    // Set to true to request only non-personalized ads
    requestNonPersonalizedAdsOnly: false,
    
    // Maximum ad content rating
    // Options: 'G', 'PG', 'T', 'MA'
    maxAdContentRating: 'PG' as const,
    
    // Tag for child-directed treatment
    // true = treat as child-directed
    // false = do not treat as child-directed
    // undefined = let Google decide
    tagForChildDirectedTreatment: undefined as boolean | undefined,
    
    // Tag for users under age of consent
    // true = treat as under age of consent
    // false = do not treat as under age of consent
    // undefined = let Google decide
    tagForUnderAgeOfConsent: undefined as boolean | undefined,
  },
  
  // Banner sizes
  bannerSizes: {
    banner: { width: 320, height: 50 },
    largeBanner: { width: 320, height: 100 },
    mediumRectangle: { width: 300, height: 250 },
    fullBanner: { width: 468, height: 60 },
    leaderboard: { width: 728, height: 90 },
    smartBanner: { width: 'auto', height: 50 },
  },
  
  // Check if using test ads
  isUsingTestAds: !isProduction || !process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_IOS,
};

/**
 * Log AdMob configuration for debugging
 */
export function logAdMobConfig(): void {
  console.log('[AdMob] Configuration:');
  console.log('  - Environment:', isProduction ? 'Production' : 'Development');
  console.log('  - Using test ads:', AdMobConfig.isUsingTestAds);
  console.log('  - Banner ID:', AdMobConfig.banner.current);
  console.log('  - Interstitial ID:', AdMobConfig.interstitial.current);
  console.log('  - Rewarded ID:', AdMobConfig.rewarded.current);
}

/**
 * Validate AdMob configuration
 */
export function validateAdMobConfig(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  if (isProduction && AdMobConfig.isUsingTestAds) {
    warnings.push('Using test ad IDs in production. Set EXPO_PUBLIC_ADMOB_* environment variables.');
  }
  
  if (Platform.OS === 'web') {
    warnings.push('AdMob is not supported on web platform.');
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
  };
}

export default AdMobConfig;
