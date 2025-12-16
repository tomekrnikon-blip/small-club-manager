import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useRealtime } from '@/hooks/use-realtime';
import { AppColors } from '@/constants/theme';

type ToastType = 'notification' | 'callup' | 'match_update' | 'training_update' | 'message' | 'sync';

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  timestamp: number;
};

const TOAST_DURATION = 5000; // 5 seconds

export function RealtimeToast() {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const showToast = useCallback((toast: Omit<Toast, 'id' | 'timestamp'>) => {
    const newToast: Toast = {
      ...toast,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setToasts((prev) => [...prev, newToast]);

    // Animate in
    translateY.value = withSpring(0, { damping: 15 });
    opacity.value = withTiming(1, { duration: 200 });

    // Auto dismiss
    setTimeout(() => {
      dismissToast(newToast.id);
    }, TOAST_DURATION);
  }, [translateY, opacity]);

  const dismissToast = useCallback((id: string) => {
    translateY.value = withTiming(-100, { duration: 200 }, () => {
      runOnJS(setToasts)((prev: Toast[]) => prev.filter((t) => t.id !== id));
    });
    opacity.value = withTiming(0, { duration: 200 });
  }, [translateY, opacity]);

  // Listen for realtime events
  useRealtime({
    onNotification: (data) => {
      showToast({
        type: 'notification',
        title: 'Nowe powiadomienie',
        message: data.message || 'Masz nowe powiadomienie',
      });
    },
    onCallup: (data) => {
      if (data.action === 'new') {
        showToast({
          type: 'callup',
          title: 'Powołanie na mecz',
          message: data.data?.matchName || 'Zostałeś powołany na mecz',
        });
      } else if (data.action === 'response') {
        showToast({
          type: 'callup',
          title: 'Odpowiedź na powołanie',
          message: `${data.data?.playerName || 'Zawodnik'} ${data.data?.status === 'confirmed' ? 'potwierdził' : 'odrzucił'} powołanie`,
        });
      }
    },
    onMatchUpdate: (data) => {
      showToast({
        type: 'match_update',
        title: 'Aktualizacja meczu',
        message: data.message || 'Dane meczu zostały zaktualizowane',
      });
    },
    onTrainingUpdate: (data) => {
      showToast({
        type: 'training_update',
        title: 'Aktualizacja treningu',
        message: data.message || 'Dane treningu zostały zaktualizowane',
      });
    },
    onMessage: (data) => {
      showToast({
        type: 'message',
        title: 'Wiadomość',
        message: data.content || 'Otrzymałeś nową wiadomość',
      });
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getIconForType = (type: ToastType): string => {
    switch (type) {
      case 'notification':
        return 'notifications';
      case 'callup':
        return 'sports-soccer';
      case 'match_update':
        return 'event';
      case 'training_update':
        return 'fitness-center';
      case 'message':
        return 'message';
      case 'sync':
        return 'sync';
      default:
        return 'info';
    }
  };

  const getColorForType = (type: ToastType): string => {
    switch (type) {
      case 'notification':
        return AppColors.primary;
      case 'callup':
        return AppColors.success;
      case 'match_update':
        return AppColors.warning;
      case 'training_update':
        return '#8b5cf6';
      case 'message':
        return '#06b6d4';
      case 'sync':
        return '#64748b';
      default:
        return AppColors.primary;
    }
  };

  const currentToast = toasts[toasts.length - 1];

  if (!currentToast || Platform.OS !== 'web') {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        { top: Math.max(insets.top, 16) + 8 },
      ]}
    >
      <View style={[styles.toast, { borderLeftColor: getColorForType(currentToast.type) }]}>
        <View style={[styles.iconContainer, { backgroundColor: `${getColorForType(currentToast.type)}20` }]}>
          <MaterialIcons
            name={getIconForType(currentToast.type) as any}
            size={20}
            color={getColorForType(currentToast.type)}
          />
        </View>
        <View style={styles.content}>
          <ThemedText style={styles.title}>{currentToast.title}</ThemedText>
          <ThemedText style={styles.message} numberOfLines={2}>
            {currentToast.message}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => dismissToast(currentToast.id)}
          style={styles.closeButton}
        >
          <MaterialIcons name="close" size={18} color="#64748b" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: '#fff',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
