import { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Easing } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";

export default function FarewellScreen() {
  const { logout, user } = useAuth();
  const router = useRouter();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Wave animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Logout and redirect after delay
    const timer = setTimeout(async () => {
      await logout();
      router.replace("/(tabs)" as any);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const waveRotate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-15deg", "15deg"],
  });

  return (
    <ThemedView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          contentFit="contain"
        />
        
        <Animated.View style={{ transform: [{ rotate: waveRotate }] }}>
          <MaterialIcons name="waving-hand" size={64} color={AppColors.warning} />
        </Animated.View>

        <ThemedText style={styles.title}>Do zobaczenia!</ThemedText>
        <ThemedText style={styles.subtitle}>
          {user?.name ? `Dziękujemy, ${user.name}!` : "Dziękujemy za korzystanie z aplikacji!"}
        </ThemedText>
        <ThemedText style={styles.message}>
          Twoje dane są bezpieczne. Wróć do nas wkrótce!
        </ThemedText>

        <View style={styles.dots}>
          <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
        </View>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    padding: Spacing.xxl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: 18,
    color: AppColors.primary,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: Spacing.md,
  },
  dots: {
    flexDirection: "row",
    marginTop: Spacing.xxl,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
  },
});
