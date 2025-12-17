import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
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

type SurveyType = "poll" | "feedback" | "date_vote";

interface Survey {
  id: number;
  title: string;
  description: string | null;
  surveyType: SurveyType;
  status: "active" | "closed" | "draft";
  allowMultiple: boolean;
  isAnonymous: boolean;
  endsAt: Date | null;
  createdAt: Date;
  options: SurveyOption[];
  totalVotes: number;
  userVoted: boolean;
}

interface SurveyOption {
  id: number;
  optionText: string;
  optionDate: Date | null;
  voteCount: number;
}

export default function SurveysScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [comment, setComment] = useState("");

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const { data: surveys, isLoading, refetch } = trpc.surveys.list.useQuery(
    { clubId: club?.id ?? 0, status: activeTab },
    { enabled: !!club?.id }
  );

  const vote = trpc.surveys.vote.useMutation({
    onSuccess: () => {
      Alert.alert("Sukces", "Twój głos został zapisany");
      setSelectedSurvey(null);
      setSelectedOptions([]);
      setComment("");
      refetch();
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const handleVote = () => {
    if (!selectedSurvey || selectedOptions.length === 0) {
      Alert.alert("Błąd", "Wybierz co najmniej jedną opcję");
      return;
    }

    vote.mutate({
      surveyId: selectedSurvey.id,
      optionIds: selectedOptions,
      comment: comment || undefined,
    });
  };

  const toggleOption = (optionId: number) => {
    if (!selectedSurvey) return;

    if (selectedSurvey.allowMultiple) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const getTypeIcon = (type: SurveyType) => {
    switch (type) {
      case "poll": return "poll";
      case "feedback": return "rate-review";
      case "date_vote": return "event";
      default: return "poll";
    }
  };

  const getTypeLabel = (type: SurveyType) => {
    switch (type) {
      case "poll": return "Ankieta";
      case "feedback": return "Opinia";
      case "date_vote": return "Głosowanie na termin";
      default: return "Ankieta";
    }
  };

  const renderSurvey = ({ item }: { item: Survey }) => {
    const totalVotes = item.options.reduce((sum, opt) => sum + opt.voteCount, 0);
    const isExpired = item.endsAt && new Date(item.endsAt) < new Date();

    return (
      <Pressable
        style={styles.surveyCard}
        onPress={() => {
          if (item.status === "active" && !item.userVoted && !isExpired) {
            setSelectedSurvey(item);
            setSelectedOptions([]);
          }
        }}
      >
        <View style={styles.surveyHeader}>
          <View style={[styles.typeIcon, { backgroundColor: AppColors.primary + "20" }]}>
            <MaterialIcons name={getTypeIcon(item.surveyType)} size={20} color={AppColors.primary} />
          </View>
          <View style={styles.surveyInfo}>
            <ThemedText style={styles.surveyTitle}>{item.title}</ThemedText>
            <ThemedText style={styles.surveyType}>{getTypeLabel(item.surveyType)}</ThemedText>
          </View>
          {item.userVoted && (
            <View style={styles.votedBadge}>
              <MaterialIcons name="check-circle" size={16} color="#22c55e" />
              <ThemedText style={styles.votedText}>Zagłosowano</ThemedText>
            </View>
          )}
        </View>

        {item.description && (
          <ThemedText style={styles.surveyDesc}>{item.description}</ThemedText>
        )}

        {/* Options with results */}
        <View style={styles.optionsList}>
          {item.options.map(option => {
            const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
            
            return (
              <View key={option.id} style={styles.optionItem}>
                <View style={styles.optionBar}>
                  <View 
                    style={[
                      styles.optionFill, 
                      { width: `${percentage}%` }
                    ]} 
                  />
                </View>
                <View style={styles.optionContent}>
                  <ThemedText style={styles.optionText}>
                    {option.optionDate 
                      ? new Date(option.optionDate).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })
                      : option.optionText}
                  </ThemedText>
                  <ThemedText style={styles.optionPercent}>{percentage}%</ThemedText>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.surveyFooter}>
          <ThemedText style={styles.voteCount}>
            {totalVotes} {totalVotes === 1 ? 'głos' : totalVotes < 5 ? 'głosy' : 'głosów'}
          </ThemedText>
          {item.endsAt && (
            <ThemedText style={styles.endsAt}>
              {isExpired ? 'Zakończona' : `Do ${new Date(item.endsAt).toLocaleDateString('pl-PL')}`}
            </ThemedText>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Ankiety</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === "active" && styles.tabActive]}
          onPress={() => setActiveTab("active")}
        >
          <ThemedText style={[styles.tabText, activeTab === "active" && styles.tabTextActive]}>
            Aktywne
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "closed" && styles.tabActive]}
          onPress={() => setActiveTab("closed")}
        >
          <ThemedText style={[styles.tabText, activeTab === "closed" && styles.tabTextActive]}>
            Zakończone
          </ThemedText>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : surveys && surveys.length > 0 ? (
        <FlatList
          data={surveys}
          renderItem={renderSurvey}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.empty}>
          <MaterialIcons name="poll" size={64} color="#334155" />
          <ThemedText style={styles.emptyText}>
            {activeTab === "active" ? "Brak aktywnych ankiet" : "Brak zakończonych ankiet"}
          </ThemedText>
        </View>
      )}

      {/* Voting Modal */}
      {selectedSurvey && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{selectedSurvey.title}</ThemedText>
              <Pressable onPress={() => setSelectedSurvey(null)}>
                <MaterialIcons name="close" size={24} color="#94a3b8" />
              </Pressable>
            </View>

            {selectedSurvey.description && (
              <ThemedText style={styles.modalDesc}>{selectedSurvey.description}</ThemedText>
            )}

            <ThemedText style={styles.selectHint}>
              {selectedSurvey.allowMultiple ? "Wybierz jedną lub więcej opcji" : "Wybierz jedną opcję"}
            </ThemedText>

            <View style={styles.modalOptions}>
              {selectedSurvey.options.map(option => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.modalOption,
                    selectedOptions.includes(option.id) && styles.modalOptionSelected
                  ]}
                  onPress={() => toggleOption(option.id)}
                >
                  <View style={[
                    styles.checkbox,
                    selectedOptions.includes(option.id) && styles.checkboxSelected
                  ]}>
                    {selectedOptions.includes(option.id) && (
                      <MaterialIcons name="check" size={16} color="#fff" />
                    )}
                  </View>
                  <ThemedText style={styles.modalOptionText}>
                    {option.optionDate 
                      ? new Date(option.optionDate).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
                      : option.optionText}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {selectedSurvey.surveyType === "feedback" && (
              <TextInput
                style={styles.commentInput}
                placeholder="Dodaj komentarz (opcjonalnie)"
                placeholderTextColor="#64748b"
                value={comment}
                onChangeText={setComment}
                multiline
              />
            )}

            <Pressable
              style={[styles.voteBtn, selectedOptions.length === 0 && styles.voteBtnDisabled]}
              onPress={handleVote}
              disabled={selectedOptions.length === 0 || vote.isPending}
            >
              {vote.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.voteBtnText}>Zagłosuj</ThemedText>
              )}
            </Pressable>

            {selectedSurvey.isAnonymous && (
              <View style={styles.anonymousNote}>
                <MaterialIcons name="visibility-off" size={16} color="#64748b" />
                <ThemedText style={styles.anonymousText}>Głosowanie anonimowe</ThemedText>
              </View>
            )}
          </View>
        </View>
      )}
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
  tabs: {
    flexDirection: "row",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Radius.md,
    backgroundColor: "#1e293b",
  },
  tabActive: {
    backgroundColor: AppColors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
  },
  tabTextActive: {
    color: "#fff",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: Spacing.lg,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
  },
  surveyCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  surveyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  surveyInfo: {
    flex: 1,
  },
  surveyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  surveyType: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  votedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#22c55e20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  votedText: {
    fontSize: 12,
    color: "#22c55e",
  },
  surveyDesc: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: Spacing.md,
  },
  optionsList: {
    gap: Spacing.sm,
  },
  optionItem: {
    position: "relative",
  },
  optionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#0f172a",
    borderRadius: Radius.sm,
    overflow: "hidden",
  },
  optionFill: {
    height: "100%",
    backgroundColor: AppColors.primary + "30",
  },
  optionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.sm,
  },
  optionText: {
    fontSize: 14,
    color: "#e2e8f0",
  },
  optionPercent: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
  },
  surveyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  voteCount: {
    fontSize: 12,
    color: "#64748b",
  },
  endsAt: {
    fontSize: 12,
    color: "#64748b",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  modalDesc: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: Spacing.md,
  },
  selectHint: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: Spacing.md,
  },
  modalOptions: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  modalOptionSelected: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "10",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  checkboxSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 15,
    color: "#e2e8f0",
  },
  commentInput: {
    backgroundColor: "#0f172a",
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: "#fff",
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: Spacing.lg,
  },
  voteBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
  },
  voteBtnDisabled: {
    opacity: 0.5,
  },
  voteBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  anonymousNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  anonymousText: {
    fontSize: 12,
    color: "#64748b",
  },
});
