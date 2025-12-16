import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWA_INSTALL_DISMISSED_KEY = 'pwa_install_dismissed';
const PWA_INSTALL_DISMISSED_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Only run on web
    if (Platform.OS !== 'web') {
      return;
    }

    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkInstalled();

    // Check if user dismissed the prompt recently
    const checkDismissed = async () => {
      try {
        const dismissedAt = await AsyncStorage.getItem(PWA_INSTALL_DISMISSED_KEY);
        if (dismissedAt) {
          const dismissedTime = parseInt(dismissedAt, 10);
          if (Date.now() - dismissedTime < PWA_INSTALL_DISMISSED_DURATION) {
            setIsDismissed(true);
            return;
          }
        }
        setIsDismissed(false);
      } catch {
        setIsDismissed(false);
      }
    };

    checkDismissed();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) {
      return false;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return false;
    }
  }, [installPrompt]);

  const dismissPrompt = useCallback(async () => {
    setIsDismissed(true);
    try {
      await AsyncStorage.setItem(PWA_INSTALL_DISMISSED_KEY, Date.now().toString());
    } catch (error) {
      console.error('[PWA] Failed to save dismiss state:', error);
    }
  }, []);

  const showPrompt = isInstallable && !isInstalled && !isDismissed;

  return {
    isInstallable,
    isInstalled,
    showPrompt,
    promptInstall,
    dismissPrompt,
  };
}
