import { useEffect, useState } from "react";
import { View, Switch, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "./themed-text";
import { AppColors, Spacing } from "@/constants/theme";

const REMEMBER_ME_KEY = "remember_me_enabled";

export async function isRememberMeEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(REMEMBER_ME_KEY);
  return value === "true";
}

export async function setRememberMe(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(REMEMBER_ME_KEY, enabled ? "true" : "false");
}

export function RememberMeSetting() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isRememberMeEnabled().then((value) => {
      setEnabled(value);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    await setRememberMe(value);
  };

  if (loading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <ThemedText style={styles.label}>Zapamiętaj mnie</ThemedText>
        <ThemedText style={styles.description}>
          Pozostań zalogowany między sesjami
        </ThemedText>
      </View>
      <Switch
        value={enabled}
        onValueChange={handleToggle}
        trackColor={{ false: "#3e3e3e", true: AppColors.primary + "80" }}
        thumbColor={enabled ? AppColors.primary : "#f4f3f4"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: AppColors.bgCard,
    borderRadius: 12,
    marginVertical: Spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  description: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
});
