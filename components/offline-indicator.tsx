import React from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { AppColors } from '@/constants/theme';

type OfflineIndicatorProps = {
  isFromCache: boolean;
  isStale: boolean;
  isOffline: boolean;
  compact?: boolean;
};

export function OfflineIndicator({ isFromCache, isStale, isOffline, compact = false }: OfflineIndicatorProps) {
  if (!isFromCache && !isOffline) return null;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <MaterialIcons
          name={isOffline ? 'cloud-off' : isStale ? 'update' : 'cloud-done'}
          size={14}
          color={isOffline ? AppColors.warning : isStale ? '#94a3b8' : AppColors.success}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, isOffline && styles.offlineContainer]}>
      <MaterialIcons
        name={isOffline ? 'cloud-off' : isStale ? 'update' : 'cloud-done'}
        size={16}
        color={isOffline ? AppColors.warning : isStale ? '#94a3b8' : AppColors.success}
      />
      <ThemedText style={[styles.text, isOffline && styles.offlineText]}>
        {isOffline
          ? 'Tryb offline'
          : isStale
          ? 'Dane z pamięci (nieaktualne)'
          : 'Dane z pamięci'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  offlineContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  text: {
    fontSize: 12,
    lineHeight: 16,
    color: '#94a3b8',
  },
  offlineText: {
    color: AppColors.warning,
  },
  compactContainer: {
    padding: 4,
  },
});
