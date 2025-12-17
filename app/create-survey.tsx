import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColors, Spacing, Radius } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

type SurveyType = "poll" | "feedback" | "date_vote";

interface SurveyOption {
  id: string;
  text: string;
  date?: Date;
}

export default function CreateSurveyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [surveyType, setSurveyType] = useState<SurveyType>("poll");
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [options, setOptions] = useState<SurveyOption[]>([
    { id: "1", text: "" },
    { id: "2", text: "" },
  ]);
  const [sendNotifications, setSendNotifications] = useState(true);

  const { data: clubs } = trpc.clubs.list.useQuery();
  const club = clubs?.[0];

  const createSurvey = trpc.surveys.create.useMutation({
    onSuccess: () => {
      Alert.alert("Sukces", "Ankieta została utworzona", [
        { text: "OK", onPress: () => router.back() }
      ]);
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const addOption = () => {
    const newId = (options.length + 1).toString();
    if (surveyType === "date_vote") {
      setOptions([...options, { id: newId, text: "", date: new Date() }]);
    } else {
      setOptions([...options, { id: newId, text: "" }]);
    }
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) {
      Alert.alert("Błąd", "Ankieta musi mieć co najmniej 2 opcje");
      return;
    }
    setOptions(options.filter(opt => opt.id !== id));
  };

  const updateOptionText = (id: string, text: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

  const updateOptionDate = (id: string, date: Date) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, date } : opt));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Błąd", "Podaj tytuł ankiety");
      return;
    }

    const validOptions = options.filter(opt => 
      surveyType === "date_vote" ? opt.date : opt.text.trim()
    );

    if (validOptions.length < 2) {
      Alert.alert("Błąd", "Dodaj co najmniej 2 opcje");
      return;
    }

    if (!club?.id) {
      Alert.alert("Błąd", "Nie znaleziono klubu");
      return;
    }

    createSurvey.mutate({
      clubId: club.id,
      title: title.trim(),
      description: description.trim() || undefined,
      surveyType,
      allowMultiple,
      isAnonymous,
      endsAt: hasEndDate ? endDate : undefined,
      options: validOptions.map(opt => ({
        optionText: surveyType === "date_vote" 
          ? opt.date!.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
          : opt.text,
        optionDate: surveyType === "date_vote" ? opt.date : undefined,
      })),
    });
  };

  const surveyTypes: { value: SurveyType; label: string; icon: keyof typeof MaterialIcons.glyphMap; desc: string }[] = [
    { value: "poll", label: "Ankieta", icon: "poll", desc: "Głosowanie na opcje tekstowe" },
    { value: "feedback", label: "Opinia", icon: "rate-review", desc: "Zbieranie opinii z komentarzami" },
    { value: "date_vote", label: "Termin", icon: "event", desc: "Głosowanie na daty wydarzeń" },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="close" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Nowa ankieta</ThemedText>
        <Pressable 
          onPress={handleSubmit} 
          style={[styles.submitBtn, createSurvey.isPending && styles.submitBtnDisabled]}
          disabled={createSurvey.isPending}
        >
          {createSurvey.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={styles.submitBtnText}>Utwórz</ThemedText>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Tytuł ankiety *</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="np. Wybór terminu turnieju"
            placeholderTextColor="#64748b"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Opis (opcjonalnie)</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Dodatkowe informacje dla głosujących..."
            placeholderTextColor="#64748b"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Survey Type */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Typ ankiety</ThemedText>
          <View style={styles.typeGrid}>
            {surveyTypes.map(type => (
              <Pressable
                key={type.value}
                style={[
                  styles.typeCard,
                  surveyType === type.value && styles.typeCardActive,
                ]}
                onPress={() => {
                  setSurveyType(type.value);
                  // Reset options when changing type
                  if (type.value === "date_vote") {
                    setOptions([
                      { id: "1", text: "", date: new Date() },
                      { id: "2", text: "", date: new Date(Date.now() + 24 * 60 * 60 * 1000) },
                    ]);
                  } else {
                    setOptions([
                      { id: "1", text: "" },
                      { id: "2", text: "" },
                    ]);
                  }
                }}
              >
                <MaterialIcons 
                  name={type.icon} 
                  size={24} 
                  color={surveyType === type.value ? AppColors.primary : "#64748b"} 
                />
                <ThemedText style={[
                  styles.typeLabel,
                  surveyType === type.value && styles.typeLabelActive,
                ]}>
                  {type.label}
                </ThemedText>
                <ThemedText style={styles.typeDesc}>{type.desc}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.label}>
              {surveyType === "date_vote" ? "Proponowane terminy" : "Opcje do wyboru"}
            </ThemedText>
            <Pressable onPress={addOption} style={styles.addBtn}>
              <MaterialIcons name="add" size={20} color={AppColors.primary} />
              <ThemedText style={styles.addBtnText}>Dodaj</ThemedText>
            </Pressable>
          </View>

          {options.map((option, index) => (
            <View key={option.id} style={styles.optionRow}>
              <View style={styles.optionNumber}>
                <ThemedText style={styles.optionNumberText}>{index + 1}</ThemedText>
              </View>
              
              {surveyType === "date_vote" ? (
                <Pressable 
                  style={styles.dateInput}
                  onPress={() => {
                    // For simplicity, we'll use a basic date selection
                    const newDate = new Date(option.date || new Date());
                    newDate.setDate(newDate.getDate() + 1);
                    updateOptionDate(option.id, newDate);
                  }}
                >
                  <MaterialIcons name="event" size={20} color="#64748b" />
                  <ThemedText style={styles.dateText}>
                    {option.date?.toLocaleDateString('pl-PL', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    }) || "Wybierz datę"}
                  </ThemedText>
                </Pressable>
              ) : (
                <TextInput
                  style={styles.optionInput}
                  placeholder={`Opcja ${index + 1}`}
                  placeholderTextColor="#64748b"
                  value={option.text}
                  onChangeText={(text) => updateOptionText(option.id, text)}
                />
              )}

              <Pressable 
                onPress={() => removeOption(option.id)}
                style={styles.removeBtn}
              >
                <MaterialIcons name="close" size={20} color="#ef4444" />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Ustawienia</ThemedText>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="check-box" size={20} color="#64748b" />
              <ThemedText style={styles.settingLabel}>Wielokrotny wybór</ThemedText>
            </View>
            <Switch
              value={allowMultiple}
              onValueChange={setAllowMultiple}
              trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
              thumbColor={allowMultiple ? AppColors.primary : '#64748b'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="visibility-off" size={20} color="#64748b" />
              <ThemedText style={styles.settingLabel}>Anonimowe głosowanie</ThemedText>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
              thumbColor={isAnonymous ? AppColors.primary : '#64748b'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="schedule" size={20} color="#64748b" />
              <ThemedText style={styles.settingLabel}>Data zakończenia</ThemedText>
            </View>
            <Switch
              value={hasEndDate}
              onValueChange={setHasEndDate}
              trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
              thumbColor={hasEndDate ? AppColors.primary : '#64748b'}
            />
          </View>

          {hasEndDate && (
            <Pressable 
              style={styles.endDatePicker}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="event" size={20} color={AppColors.primary} />
              <ThemedText style={styles.endDateText}>
                Zakończenie: {endDate.toLocaleDateString('pl-PL', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric',
                })}
              </ThemedText>
            </Pressable>
          )}

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="notifications" size={20} color="#64748b" />
              <ThemedText style={styles.settingLabel}>Wyślij powiadomienia</ThemedText>
            </View>
            <Switch
              value={sendNotifications}
              onValueChange={setSendNotifications}
              trackColor={{ false: '#334155', true: AppColors.primary + '60' }}
              thumbColor={sendNotifications ? AppColors.primary : '#64748b'}
            />
          </View>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Podgląd</ThemedText>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <MaterialIcons 
                name={surveyTypes.find(t => t.value === surveyType)?.icon || "poll"} 
                size={20} 
                color={AppColors.primary} 
              />
              <ThemedText style={styles.previewTitle}>
                {title || "Tytuł ankiety"}
              </ThemedText>
            </View>
            {description && (
              <ThemedText style={styles.previewDesc}>{description}</ThemedText>
            )}
            <View style={styles.previewOptions}>
              {options.slice(0, 3).map((opt, i) => (
                <View key={opt.id} style={styles.previewOption}>
                  <View style={styles.previewRadio} />
                  <ThemedText style={styles.previewOptionText}>
                    {surveyType === "date_vote" 
                      ? opt.date?.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })
                      : opt.text || `Opcja ${i + 1}`}
                  </ThemedText>
                </View>
              ))}
              {options.length > 3 && (
                <ThemedText style={styles.previewMore}>
                  +{options.length - 3} więcej opcji
                </ThemedText>
              )}
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setEndDate(date);
          }}
        />
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
  submitBtn: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: "#fff",
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  typeGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  typeCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeCardActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "10",
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
    marginTop: Spacing.xs,
  },
  typeLabelActive: {
    color: AppColors.primary,
  },
  typeDesc: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addBtnText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "500",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  optionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  optionNumberText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
  optionInput: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: "#fff",
    fontSize: 14,
  },
  dateInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  dateText: {
    fontSize: 14,
    color: "#e2e8f0",
  },
  removeBtn: {
    padding: Spacing.xs,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  settingLabel: {
    fontSize: 14,
    color: "#e2e8f0",
  },
  endDatePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary + "15",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  endDateText: {
    fontSize: 14,
    color: AppColors.primary,
  },
  previewCard: {
    backgroundColor: "#1e293b",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  previewDesc: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: Spacing.md,
  },
  previewOptions: {
    gap: Spacing.sm,
  },
  previewOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#0f172a",
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  previewRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#334155",
  },
  previewOptionText: {
    fontSize: 13,
    color: "#e2e8f0",
  },
  previewMore: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginTop: Spacing.xs,
  },
});
