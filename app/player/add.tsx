import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

const positions = [
  { value: "bramkarz", label: "Bramkarz", icon: "sports-handball" },
  { value: "obrońca", label: "Obrońca", icon: "shield" },
  { value: "pomocnik", label: "Pomocnik", icon: "swap-horiz" },
  { value: "napastnik", label: "Napastnik", icon: "sports-soccer" },
] as const;

export default function AddPlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [position, setPosition] = useState<typeof positions[number]["value"]>("pomocnik");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isAcademy, setIsAcademy] = useState(false);

  const { data: clubs } = trpc.clubs.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const club = clubs?.[0];

  const createMutation = trpc.players.create.useMutation({
    onSuccess: () => {
      utils.players.list.invalidate();
      Alert.alert("Sukces", "Zawodnik został dodany!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert("Błąd", "Podaj imię i nazwisko zawodnika");
      return;
    }

    if (!club?.id) {
      Alert.alert("Błąd", "Nie znaleziono klubu");
      return;
    }

    createMutation.mutate({
      clubId: club.id,
      name: name.trim(),
      position,
      jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      isAcademy,
    });
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.title}>Dodaj zawodnika</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Imię i nazwisko *</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="np. Jan Kowalski"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Pozycja *</ThemedText>
            <View style={styles.positionGrid}>
              {positions.map((pos) => (
                <Pressable
                  key={pos.value}
                  style={[
                    styles.positionCard,
                    position === pos.value && styles.positionCardActive,
                  ]}
                  onPress={() => setPosition(pos.value)}
                >
                  <MaterialIcons
                    name={pos.icon as any}
                    size={28}
                    color={position === pos.value ? "#fff" : "#94a3b8"}
                  />
                  <ThemedText
                    style={[
                      styles.positionLabel,
                      position === pos.value && styles.positionLabelActive,
                    ]}
                  >
                    {pos.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Numer na koszulce</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="np. 10"
              placeholderTextColor="#64748b"
              value={jerseyNumber}
              onChangeText={setJerseyNumber}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Telefon</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="np. +48 123 456 789"
              placeholderTextColor="#64748b"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="np. jan@example.com"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Academy Toggle */}
          <Pressable
            style={styles.toggleRow}
            onPress={() => setIsAcademy(!isAcademy)}
          >
            <View style={styles.toggleInfo}>
              <MaterialIcons name="school" size={24} color="#94a3b8" />
              <View>
                <ThemedText style={styles.toggleLabel}>Zawodnik szkółki</ThemedText>
                <ThemedText style={styles.toggleHint}>Zaznacz jeśli to młody zawodnik</ThemedText>
              </View>
            </View>
            <View style={[styles.toggle, isAcademy && styles.toggleActive]}>
              <View style={[styles.toggleThumb, isAcademy && styles.toggleThumbActive]} />
            </View>
          </Pressable>
        </View>

        {/* Submit Button */}
        <Pressable
          style={[styles.submitButton, createMutation.isPending && styles.submitButtonDisabled]}
          onPress={handleCreate}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="person-add" size={24} color="#fff" />
              <ThemedText style={styles.submitText}>Dodaj zawodnika</ThemedText>
            </>
          )}
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgDark,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  form: {
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
  },
  input: {
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  positionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  positionCard: {
    width: "48%",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  positionCardActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  positionLabel: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: Spacing.sm,
    fontWeight: "500",
  },
  positionLabelActive: {
    color: "#fff",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  toggleLabel: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  toggleHint: {
    fontSize: 13,
    color: "#64748b",
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#334155",
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: AppColors.primary,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
});
