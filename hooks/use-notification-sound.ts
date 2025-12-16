/**
 * useNotificationSound - Hook for playing notification sounds
 */

import { useCallback, useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_ENABLED_KEY = '@skm_notification_sound_enabled';

type SoundType = 'notification' | 'success' | 'error' | 'callup';

// Sound configurations - will use Haptics as fallback if sounds not available
// Note: To add custom sounds, place .mp3 files in assets/sounds/ directory
let SOUNDS: Record<SoundType, any> = {
  notification: null,
  success: null,
  error: null,
  callup: null,
};

// Try to load sounds, but don't fail if they don't exist
try {
  SOUNDS = {
    notification: require('@/assets/sounds/notification.mp3'),
    success: require('@/assets/sounds/success.mp3'),
    error: require('@/assets/sounds/error.mp3'),
    callup: require('@/assets/sounds/callup.mp3'),
  };
} catch (e) {
  console.log('[NotificationSound] Sound files not found, using haptic feedback only');
}

export function useNotificationSound() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Load preference
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
        if (stored !== null) {
          setSoundEnabled(stored === 'true');
        }
      } catch (error) {
        console.error('[NotificationSound] Error loading preference:', error);
      }
    };

    loadPreference();
  }, []);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const toggleSound = useCallback(async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    await AsyncStorage.setItem(SOUND_ENABLED_KEY, String(newValue));
  }, [soundEnabled]);

  const playSound = useCallback(async (type: SoundType = 'notification') => {
    if (!soundEnabled) return;

    // Always provide haptic feedback
    try {
      if (type === 'error') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (type === 'success') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (e) {
      // Haptics not available on web
    }

    // Try to play sound if available
    if (!SOUNDS[type]) return;

    try {
      // Unload previous sound
      if (sound) {
        await sound.unloadAsync();
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
      });

      // Load and play sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        SOUNDS[type],
        { shouldPlay: true, volume: 0.5 }
      );

      setSound(newSound);

      // Auto unload after playing
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('[NotificationSound] Sound playback not available:', error);
    }
  }, [soundEnabled, sound]);

  return {
    soundEnabled,
    toggleSound,
    playSound,
  };
}

/**
 * Simple function to play notification sound (for use outside components)
 */
export async function playNotificationSound(type: SoundType = 'notification'): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
    if (stored === 'false') return;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      SOUNDS[type],
      { shouldPlay: true, volume: 0.5 }
    );

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.error('[NotificationSound] Error playing sound:', error);
  }
}
