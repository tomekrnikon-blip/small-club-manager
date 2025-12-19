/**
 * useNotificationSound - Hook for haptic feedback on notifications
 * Note: Audio playback has been removed, only haptic feedback is used
 */

import { useCallback, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTIC_ENABLED_KEY = '@skm_haptic_feedback_enabled';

type FeedbackType = 'notification' | 'success' | 'error' | 'callup';

export function useNotificationSound() {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load preference
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(HAPTIC_ENABLED_KEY);
        if (stored !== null) {
          setSoundEnabled(stored === 'true');
        }
      } catch (error) {
        console.error('[HapticFeedback] Error loading preference:', error);
      }
    };

    loadPreference();
  }, []);

  const toggleSound = useCallback(async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    await AsyncStorage.setItem(HAPTIC_ENABLED_KEY, String(newValue));
  }, [soundEnabled]);

  const playSound = useCallback(async (type: FeedbackType = 'notification') => {
    if (!soundEnabled) return;

    // Provide haptic feedback based on type
    try {
      switch (type) {
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'callup':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'notification':
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
      }
    } catch (e) {
      // Haptics not available on web
      console.log('[HapticFeedback] Haptics not available');
    }
  }, [soundEnabled]);

  return {
    soundEnabled,
    toggleSound,
    playSound,
  };
}

/**
 * Simple function to trigger haptic feedback (for use outside components)
 */
export async function playNotificationSound(type: FeedbackType = 'notification'): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(HAPTIC_ENABLED_KEY);
    if (stored === 'false') return;

    switch (type) {
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'callup':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'notification':
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
    }
  } catch (error) {
    console.log('[HapticFeedback] Haptics not available');
  }
}
