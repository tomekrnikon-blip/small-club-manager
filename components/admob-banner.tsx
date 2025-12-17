import React, { useEffect, useState } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { AppColors, Spacing, Radius } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

// AdMob configuration
// In production, replace with real AdMob unit IDs
const ADMOB_CONFIG = {
  // Test IDs - replace with production IDs before release
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716', // Test banner
    interstitial: 'ca-app-pub-3940256099942544/4411468910', // Test interstitial
    rewarded: 'ca-app-pub-3940256099942544/1712485313', // Test rewarded
  },
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111', // Test banner
    interstitial: 'ca-app-pub-3940256099942544/1033173712', // Test interstitial
    rewarded: 'ca-app-pub-3940256099942544/5224354917', // Test rewarded
  },
  // Production IDs - set these in environment variables
  production: {
    ios: {
      banner: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER || '',
      interstitial: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL || '',
      rewarded: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED || '',
    },
    android: {
      banner: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER || '',
      interstitial: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL || '',
      rewarded: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED || '',
    },
  },
};

// Get AdMob unit ID based on platform and ad type
function getAdUnitId(type: 'banner' | 'interstitial' | 'rewarded'): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  
  if (isProduction) {
    return ADMOB_CONFIG.production[platform][type] || ADMOB_CONFIG[platform][type];
  }
  
  return ADMOB_CONFIG[platform][type];
}

type AdMobBannerProps = {
  size?: 'banner' | 'largeBanner' | 'mediumRectangle' | 'fullBanner' | 'leaderboard';
  showAds?: boolean;
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: string) => void;
  style?: any;
};

/**
 * AdMob Banner Component
 * 
 * Note: This is a placeholder implementation. To enable real AdMob ads:
 * 1. Install expo-ads-admob: npx expo install expo-ads-admob
 * 2. Configure app.json with AdMob app ID
 * 3. Replace placeholder with actual AdMob component
 * 
 * For now, this shows a placeholder banner that can be used during development.
 */
export function AdMobBanner({ 
  size = 'banner', 
  showAds = true, 
  onAdLoaded,
  onAdFailedToLoad,
  style 
}: AdMobBannerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Simulate ad loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      onAdLoaded?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onAdLoaded]);

  if (!showAds || hasError) return null;

  // Size configurations (standard AdMob sizes)
  const sizeConfig = {
    banner: { width: 320, height: 50 },
    largeBanner: { width: 320, height: 100 },
    mediumRectangle: { width: 300, height: 250 },
    fullBanner: { width: 468, height: 60 },
    leaderboard: { width: 728, height: 90 },
  };

  const dimensions = sizeConfig[size];

  return (
    <View style={[styles.container, { maxWidth: dimensions.width }, style]}>
      {isLoading ? (
        <View style={[styles.placeholder, { height: dimensions.height }]}>
          <ThemedText style={styles.loadingText}>Ładowanie reklamy...</ThemedText>
        </View>
      ) : (
        <View style={[styles.adContainer, { height: dimensions.height }]}>
          {/* Placeholder for AdMob banner */}
          <View style={styles.placeholderAd}>
            <ThemedText style={styles.adLabel}>Reklama</ThemedText>
            <ThemedText style={styles.adText}>
              {Platform.OS === 'web' ? 'Reklamy niedostępne w przeglądarce' : 'AdMob Banner'}
            </ThemedText>
            <ThemedText style={styles.adSize}>{dimensions.width}x{dimensions.height}</ThemedText>
          </View>
        </View>
      )}
    </View>
  );
}

type InterstitialAdProps = {
  showAds?: boolean;
  onAdClosed?: () => void;
  onAdFailedToLoad?: (error: string) => void;
};

/**
 * Interstitial Ad Manager
 * 
 * Usage:
 * const { showInterstitial, isReady } = useInterstitialAd({ showAds: true });
 * 
 * // Show ad at appropriate moment (e.g., after completing an action)
 * if (isReady) {
 *   await showInterstitial();
 * }
 */
export function useInterstitialAd({ showAds = true, onAdClosed, onAdFailedToLoad }: InterstitialAdProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!showAds) return;

    // Simulate ad preloading
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [showAds]);

  const showInterstitial = async (): Promise<boolean> => {
    if (!isReady || !showAds) return false;

    setIsLoading(true);
    
    // Simulate showing interstitial
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsLoading(false);
        setIsReady(false);
        onAdClosed?.();
        
        // Reload next ad
        setTimeout(() => setIsReady(true), 2000);
        
        resolve(true);
      }, 1500);
    });
  };

  return {
    isReady: isReady && showAds,
    isLoading,
    showInterstitial,
  };
}

type RewardedAdProps = {
  showAds?: boolean;
  onRewarded?: (reward: { type: string; amount: number }) => void;
  onAdClosed?: () => void;
  onAdFailedToLoad?: (error: string) => void;
};

/**
 * Rewarded Ad Manager
 * 
 * Usage:
 * const { showRewardedAd, isReady } = useRewardedAd({
 *   showAds: true,
 *   onRewarded: (reward) => {
 *     console.log('User earned reward:', reward);
 *   }
 * });
 */
export function useRewardedAd({ showAds = true, onRewarded, onAdClosed, onAdFailedToLoad }: RewardedAdProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!showAds) return;

    // Simulate ad preloading
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [showAds]);

  const showRewardedAd = async (): Promise<boolean> => {
    if (!isReady || !showAds) return false;

    setIsLoading(true);
    
    // Simulate showing rewarded ad
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsLoading(false);
        setIsReady(false);
        
        // Simulate reward
        onRewarded?.({ type: 'coins', amount: 10 });
        onAdClosed?.();
        
        // Reload next ad
        setTimeout(() => setIsReady(true), 2000);
        
        resolve(true);
      }, 3000);
    });
  };

  return {
    isReady: isReady && showAds,
    isLoading,
    showRewardedAd,
  };
}

// Ad placement helper - determines when to show interstitial ads
export function shouldShowInterstitial(actionCount: number, threshold: number = 5): boolean {
  return actionCount > 0 && actionCount % threshold === 0;
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginVertical: Spacing.sm,
  },
  placeholder: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
  },
  adContainer: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  placeholderAd: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  adLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  adText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  adSize: {
    fontSize: 10,
    color: '#475569',
    marginTop: 4,
  },
});

export default AdMobBanner;
