import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
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

interface RatingCategory {
  key: 'technique' | 'engagement' | 'progress' | 'teamwork';
  label: string;
  icon: string;
  description: string;
}

const RATING_CATEGORIES: RatingCategory[] = [
  { key: 'technique', label: 'Technika', icon: 'sports-soccer', description: 'Kontrola piłki, podania, strzały' },
  { key: 'engagement', label: 'Zaangażowanie', icon: 'fitness-center', description: 'Wysiłek, intensywność, motywacja' },
  { key: 'progress', label: 'Postępy', icon: 'trending-up', description: 'Rozwój umiejętności w czasie' },
  { key: 'teamwork', label: 'Współpraca', icon: 'groups', description: 'Gra zespołowa, komunikacja' },
];

export default function PlayerRatingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    playerId: string;
    eventType: string;
    eventId: string;
    eventDate: string;
    playerName: string;
  }>();

  const [ratings, setRatings] = useState({
    technique: 3,
    engagement: 3,
    progress: 3,
    teamwork: 3,
  });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const createRating = trpc.playerRatings.create.useMutation();

  const overall = (
    (ratings.technique + ratings.engagement + ratings.progress + ratings.teamwork) / 4
  ).toFixed(2);

  const handleRatingChange = (category: keyof typeof ratings, value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const handleSave = async () => {
    if (!club || !params.playerId || !params.eventType || !params.eventId) {
      Alert.alert('Błąd', 'Brak wymaganych danych');
      return;
    }

    setSaving(true);
    try {
      await createRating.mutateAsync({
        clubId: club.id,
        playerId: parseInt(params.playerId),
        eventType: params.eventType as 'training' | 'match',
        eventId: parseInt(params.eventId),
        eventDate: params.eventDate || new Date().toISOString().split('T')[0],
        technique: ratings.technique,
        engagement: ratings.engagement,
        progress: ratings.progress,
        teamwork: ratings.teamwork,
        overall: parseFloat(overall),
        notes: notes || undefined,
      });

      Alert.alert('Sukces', 'Ocena została zapisana', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving rating:', error);
      Alert.alert('Błąd', 'Nie udało się zapisać oceny');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Ocena zawodnika</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Player Info */}
        <View style={styles.playerCard}>
          <View style={styles.playerAvatar}>
            <MaterialIcons name="person" size={32} color={AppColors.primary} />
          </View>
          <View style={styles.playerInfo}>
            <ThemedText style={styles.playerName}>
              {params.playerName || 'Zawodnik'}
            </ThemedText>
            <ThemedText style={styles.eventInfo}>
              {params.eventType === 'training' ? 'Trening' : 'Mecz'} • {params.eventDate}
            </ThemedText>
          </View>
        </View>

        {/* Overall Score */}
        <View style={styles.overallCard}>
          <ThemedText style={styles.overallLabel}>Ocena ogólna</ThemedText>
          <ThemedText style={styles.overallValue}>{overall}</ThemedText>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <MaterialIcons
                key={star}
                name="star"
                size={24}
                color={parseFloat(overall) >= star ? '#f59e0b' : '#334155'}
              />
            ))}
          </View>
        </View>

        {/* Rating Categories */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Kategorie oceny</ThemedText>
          
          {RATING_CATEGORIES.map(category => (
            <View key={category.key} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryIcon}>
                  <MaterialIcons name={category.icon as any} size={20} color={AppColors.primary} />
                </View>
                <View style={styles.categoryInfo}>
                  <ThemedText style={styles.categoryLabel}>{category.label}</ThemedText>
                  <ThemedText style={styles.categoryDesc}>{category.description}</ThemedText>
                </View>
                <ThemedText style={styles.categoryValue}>{ratings[category.key]}/5</ThemedText>
              </View>
              
              <View style={styles.ratingButtons}>
                {[1, 2, 3, 4, 5].map(value => (
                  <Pressable
                    key={value}
                    style={[
                      styles.ratingBtn,
                      ratings[category.key] === value && styles.ratingBtnActive,
                    ]}
                    onPress={() => handleRatingChange(category.key, value)}
                  >
                    <ThemedText style={[
                      styles.ratingBtnText,
                      ratings[category.key] === value && styles.ratingBtnTextActive,
                    ]}>
                      {value}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Uwagi (opcjonalnie)</ThemedText>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Dodaj komentarz do oceny..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="save" size={20} color="#fff" />
              <ThemedText style={styles.saveBtnText}>Zapisz ocenę</ThemedText>
            </>
          )}
        </Pressable>

        {/* Rating Guide */}
        <View style={styles.guideBox}>
          <ThemedText style={styles.guideTitle}>Skala ocen:</ThemedText>
          <View style={styles.guideRow}>
            <ThemedText style={styles.guideScore}>1</ThemedText>
            <ThemedText style={styles.guideDesc}>Słabo - wymaga znacznej poprawy</ThemedText>
          </View>
          <View style={styles.guideRow}>
            <ThemedText style={styles.guideScore}>2</ThemedText>
            <ThemedText style={styles.guideDesc}>Poniżej oczekiwań</ThemedText>
          </View>
          <View style={styles.guideRow}>
            <ThemedText style={styles.guideScore}>3</ThemedText>
            <ThemedText style={styles.guideDesc}>Przeciętnie - zgodnie z oczekiwaniami</ThemedText>
          </View>
          <View style={styles.guideRow}>
            <ThemedText style={styles.guideScore}>4</ThemedText>
            <ThemedText style={styles.guideDesc}>Dobrze - powyżej oczekiwań</ThemedText>
          </View>
          <View style={styles.guideRow}>
            <ThemedText style={styles.guideScore}>5</ThemedText>
            <ThemedText style={styles.guideDesc}>Doskonale - wybitny występ</ThemedText>
          </View>
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
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary + '20',
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
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
  overallCard: {
    alignItems: "center",
    backgroundColor: AppColors.primary + '10',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: AppColors.primary + '30',
  },
  overallLabel: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: Spacing.xs,
  },
  overallValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: AppColors.primary,
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: Spacing.sm,
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
  categoryCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary + '20',
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  categoryDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  categoryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.primary,
  },
  ratingButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  ratingBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  ratingBtnActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  ratingBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  ratingBtnTextActive: {
    color: "#fff",
  },
  notesInput: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: "#fff",
    fontSize: 14,
    minHeight: 100,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  saveBtnDisabled: {
    backgroundColor: "#334155",
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  guideBox: {
    backgroundColor: "#1e3a5f",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: Spacing.sm,
  },
  guideRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  guideScore: {
    width: 24,
    fontSize: 14,
    fontWeight: "bold",
    color: "#f59e0b",
  },
  guideDesc: {
    fontSize: 12,
    color: "#94a3b8",
  },
});
