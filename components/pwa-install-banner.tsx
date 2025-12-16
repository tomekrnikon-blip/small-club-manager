import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { usePwaInstall } from '@/hooks/use-pwa-install';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PwaInstallBanner() {
  const insets = useSafeAreaInsets();
  const { showPrompt, promptInstall, dismissPrompt } = usePwaInstall();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (showPrompt) {
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withSpring(100);
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [showPrompt, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (!installed) {
      // User declined, dismiss for a while
      dismissPrompt();
    }
  };

  const handleDismiss = () => {
    translateY.value = withTiming(100, { duration: 200 }, () => {
      runOnJS(dismissPrompt)();
    });
    opacity.value = withTiming(0, { duration: 200 });
  };

  // Only show on web
  if (Platform.OS !== 'web' || !showPrompt) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        animatedStyle,
        { paddingBottom: Math.max(insets.bottom, 16) }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="download-outline" size={28} color="#22c55e" />
        </View>
        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>Zainstaluj aplikację</ThemedText>
          <ThemedText style={styles.description}>
            Dodaj SKM do ekranu głównego dla szybszego dostępu
          </ThemedText>
        </View>
        <Pressable onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#64748b" />
        </Pressable>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.laterButton} onPress={handleDismiss}>
          <ThemedText style={styles.laterText}>Później</ThemedText>
        </Pressable>
        <AnimatedPressable style={styles.installButton} onPress={handleInstall}>
          <Ionicons name="add-circle" size={18} color="#fff" />
          <ThemedText style={styles.installText}>Zainstaluj</ThemedText>
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#fff',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  laterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    alignItems: 'center',
  },
  laterText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    color: '#94a3b8',
  },
  installButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  installText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#fff',
  },
});
