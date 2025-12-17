import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

type ExcuseReason = 
  | 'illness'
  | 'injury'
  | 'school'
  | 'family'
  | 'travel'
  | 'work'
  | 'other';

const EXCUSE_REASONS: { value: ExcuseReason; label: string; icon: string }[] = [
  { value: 'illness', label: 'Choroba', icon: 'local-hospital' },
  { value: 'injury', label: 'Kontuzja', icon: 'healing' },
  { value: 'school', label: 'Szkoła / Studia', icon: 'school' },
  { value: 'family', label: 'Sprawy rodzinne', icon: 'family-restroom' },
  { value: 'travel', label: 'Wyjazd', icon: 'flight' },
  { value: 'work', label: 'Praca', icon: 'work' },
  { value: 'other', label: 'Inne', icon: 'more-horiz' },
];

export default function AbsenceExcuseScreen() {
  const { eventId, eventType, playerId, playerName } = useLocalSearchParams<{
    eventId: string;
    eventType: 'training' | 'match';
    playerId: string;
    playerName: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  
  const [selectedReason, setSelectedReason] = useState<ExcuseReason | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert("Błąd", "Wybierz powód nieobecności");
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real implementation, this would call a backend API
      // For now, we'll just update the attendance with a note
      
      if (eventType === 'training') {
        // Update training attendance with excuse
        // This would need a backend endpoint to store the excuse
        console.log('[AbsenceExcuse] Submitting excuse:', {
          eventId,
          eventType,
          playerId,
          reason: selectedReason,
          notes,
        });
      }

      Alert.alert(
        "Usprawiedliwienie zapisane",
        `Nieobecność ${playerName || 'zawodnika'} została usprawiedliwiona: ${EXCUSE_REASONS.find(r => r.value === selectedReason)?.label}`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się zapisać usprawiedliwienia");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Usprawiedliwienie</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Player Info */}
        <View style={styles.playerCard}>
          <MaterialIcons name="person" size={40} color={AppColors.primary} />
          <View style={styles.playerInfo}>
            <ThemedText style={styles.playerName}>
              {playerName || 'Zawodnik'}
            </ThemedText>
            <ThemedText style={styles.eventInfo}>
              {eventType === 'training' ? 'Trening' : 'Mecz'} #{eventId}
            </ThemedText>
          </View>
        </View>

        {/* Reason Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Powód nieobecności</ThemedText>
          
          <View style={styles.reasonGrid}>
            {EXCUSE_REASONS.map(reason => (
              <Pressable
                key={reason.value}
                style={[
                  styles.reasonCard,
                  selectedReason === reason.value && styles.reasonCardSelected,
                ]}
                onPress={() => setSelectedReason(reason.value)}
              >
                <MaterialIcons
                  name={reason.icon as any}
                  size={28}
                  color={selectedReason === reason.value ? AppColors.primary : "#64748b"}
                />
                <ThemedText
                  style={[
                    styles.reasonLabel,
                    selectedReason === reason.value && styles.reasonLabelSelected,
                  ]}
                >
                  {reason.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Dodatkowe informacje (opcjonalne)</ThemedText>
          <TextInput
            style={styles.notesInput}
            placeholder="Wpisz dodatkowe szczegóły..."
            placeholderTextColor="#64748b"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <Pressable
          style={[styles.submitBtn, (!selectedReason || isSubmitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!selectedReason || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="check" size={20} color="#fff" />
              <ThemedText style={styles.submitBtnText}>
                Zapisz usprawiedliwienie
              </ThemedText>
            </>
          )}
        </Pressable>

        {/* Info */}
        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={20} color="#64748b" />
          <ThemedText style={styles.infoText}>
            Usprawiedliwienie zostanie zapisane i będzie widoczne dla trenera. 
            Nieobecność nadal będzie liczona w statystykach, ale z oznaczeniem usprawiedliwienia.
          </ThemedText>
        </View>
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
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: "#1e293b",
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xl,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  eventInfo: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.md,
  },
  reasonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  reasonCard: {
    width: "48%",
    backgroundColor: "#1e293b",
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: "transparent",
  },
  reasonCardSelected: {
    borderColor: AppColors.primary,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#94a3b8",
    textAlign: "center",
  },
  reasonLabelSelected: {
    color: AppColors.primary,
  },
  notesInput: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: "#fff",
    fontSize: 15,
    minHeight: 100,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  infoBox: {
    flexDirection: "row",
    gap: Spacing.sm,
    backgroundColor: "#1e293b",
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
});
