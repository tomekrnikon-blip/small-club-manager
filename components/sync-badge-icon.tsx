import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { AppColors } from '@/constants/theme';

const SYNC_QUEUE_KEY = '@skm_sync_queue';

type SyncBadgeIconProps = {
  name: string;
  size: number;
  color: string;
};

export function SyncBadgeIcon({ name, size, color }: SyncBadgeIconProps) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Initial load
    loadPendingCount();

    // Poll for changes every 5 seconds
    const interval = setInterval(loadPendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingCount = async () => {
    try {
      const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (queueStr) {
        const queue = JSON.parse(queueStr);
        setPendingCount(queue.length);
      } else {
        setPendingCount(0);
      }
    } catch (error) {
      console.error('[SyncBadge] Error loading pending count:', error);
    }
  };

  return (
    <View style={styles.container}>
      <MaterialIcons name={name as any} size={size} color={color} />
      {pendingCount > 0 && (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>
            {pendingCount > 99 ? '99+' : pendingCount}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: AppColors.warning,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
});
