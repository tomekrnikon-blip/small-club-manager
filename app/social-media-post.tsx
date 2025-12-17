import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

type PostTemplate = "match_result" | "match_preview" | "player_highlight" | "season_stats" | "custom";

interface Template {
  id: PostTemplate;
  name: string;
  icon: string;
  description: string;
  fields: { key: string; label: string; placeholder: string; multiline?: boolean }[];
}

const TEMPLATES: Template[] = [
  {
    id: "match_result",
    name: "Wynik meczu",
    icon: "⚽",
    description: "Podsumowanie meczu ze statystykami",
    fields: [
      { key: "homeTeam", label: "Drużyna gospodarzy", placeholder: "np. KS Orzeł" },
      { key: "awayTeam", label: "Drużyna gości", placeholder: "np. FC Sokół" },
      { key: "score", label: "Wynik", placeholder: "np. 3:1" },
      { key: "scorers", label: "Strzelcy bramek", placeholder: "np. Kowalski 23', 67', Nowak 45'" },
      { key: "highlights", label: "Najważniejsze momenty", placeholder: "Opisz kluczowe akcje meczu...", multiline: true },
    ],
  },
  {
    id: "match_preview",
    name: "Zapowiedź meczu",
    icon: "📅",
    description: "Informacja o nadchodzącym spotkaniu",
    fields: [
      { key: "opponent", label: "Przeciwnik", placeholder: "np. FC Sokół" },
      { key: "date", label: "Data i godzina", placeholder: "np. Sobota, 15:00" },
      { key: "venue", label: "Miejsce", placeholder: "np. Stadion Miejski" },
      { key: "league", label: "Rozgrywki", placeholder: "np. IV Liga, 15. kolejka" },
      { key: "info", label: "Dodatkowe informacje", placeholder: "Zapraszamy kibiców! Wstęp wolny.", multiline: true },
    ],
  },
  {
    id: "player_highlight",
    name: "Wyróżnienie zawodnika",
    icon: "🌟",
    description: "Post o osiągnięciu zawodnika",
    fields: [
      { key: "playerName", label: "Imię i nazwisko", placeholder: "np. Jan Kowalski" },
      { key: "achievement", label: "Osiągnięcie", placeholder: "np. 50 bramek dla klubu" },
      { key: "stats", label: "Statystyki", placeholder: "np. 50 goli w 120 meczach" },
      { key: "message", label: "Gratulacje", placeholder: "Gratulujemy i życzymy kolejnych sukcesów!", multiline: true },
    ],
  },
  {
    id: "season_stats",
    name: "Statystyki sezonu",
    icon: "📊",
    description: "Podsumowanie statystyk ligowych",
    fields: [
      { key: "position", label: "Pozycja w tabeli", placeholder: "np. 3. miejsce" },
      { key: "points", label: "Punkty", placeholder: "np. 45 pkt" },
      { key: "record", label: "Bilans", placeholder: "np. 14W-3R-5P" },
      { key: "topScorer", label: "Najlepszy strzelec", placeholder: "np. Jan Kowalski - 15 bramek" },
      { key: "summary", label: "Podsumowanie", placeholder: "Komentarz do sezonu...", multiline: true },
    ],
  },
  {
    id: "custom",
    name: "Własny post",
    icon: "✏️",
    description: "Napisz własną treść",
    fields: [
      { key: "title", label: "Tytuł", placeholder: "Tytuł posta" },
      { key: "content", label: "Treść", placeholder: "Napisz treść posta...", multiline: true },
    ],
  },
];

export default function SocialMediaPostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({ light: "#F5F5F5", dark: "#1C1C1E" }, "background");
  const borderColor = useThemeColor({ light: "#E0E0E0", dark: "#333" }, "icon");

  const [selectedTemplate, setSelectedTemplate] = useState<PostTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedPlatforms, setSelectedPlatforms] = useState<("facebook" | "instagram")[]>(["facebook"]);

  const template = TEMPLATES.find((t) => t.id === selectedTemplate);

  const handleSelectTemplate = (id: PostTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTemplate(id);
    setFormData({});
  };

  const togglePlatform = (platform: "facebook" | "instagram") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedPlatforms.includes(platform)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const generatePreview = (): string => {
    if (!template) return "";

    switch (template.id) {
      case "match_result":
        return `⚽ WYNIK MECZU\n\n${formData.homeTeam || "---"} ${formData.score || "0:0"} ${formData.awayTeam || "---"}\n\n🎯 Bramki: ${formData.scorers || "brak"}\n\n${formData.highlights || ""}\n\n#piłkanożna #mecz #wynik`;
      
      case "match_preview":
        return `📅 ZAPRASZAMY NA MECZ!\n\n🆚 ${formData.opponent || "---"}\n📍 ${formData.venue || "---"}\n🕐 ${formData.date || "---"}\n🏆 ${formData.league || "---"}\n\n${formData.info || ""}\n\n#mecz #zapowiedź #piłkanożna`;
      
      case "player_highlight":
        return `🌟 GRATULACJE!\n\n${formData.playerName || "---"}\n\n🏆 ${formData.achievement || "---"}\n📊 ${formData.stats || "---"}\n\n${formData.message || ""}\n\n#zawodnik #osiągnięcie #gratulacje`;
      
      case "season_stats":
        return `📊 STATYSTYKI SEZONU\n\n🏆 Pozycja: ${formData.position || "---"}\n⭐ Punkty: ${formData.points || "---"}\n📈 Bilans: ${formData.record || "---"}\n👑 Najlepszy strzelec: ${formData.topScorer || "---"}\n\n${formData.summary || ""}\n\n#sezon #statystyki #tabela`;
      
      case "custom":
        return `${formData.title ? `📢 ${formData.title}\n\n` : ""}${formData.content || ""}\n\n#piłkanożna`;
      
      default:
        return "";
    }
  };

  const handlePublish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Opublikować post?",
      `Post zostanie opublikowany na: ${selectedPlatforms.join(", ")}`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Opublikuj",
          onPress: () => {
            // TODO: Call API to publish
            Alert.alert("Sukces", "Post został zaplanowany do publikacji!");
            router.back();
          },
        },
      ]
    );
  };

  const handleSchedule = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Zaplanuj publikację",
      "Funkcja planowania postów będzie dostępna wkrótce!",
      [{ text: "OK" }]
    );
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={{ fontSize: 24 }}>←</ThemedText>
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText type="subtitle">
            {selectedTemplate ? "Utwórz post" : "Wybierz szablon"}
          </ThemedText>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedTemplate ? (
          // Template Selection
          <View style={styles.templatesContainer}>
            <ThemedText style={styles.sectionDescription}>
              Wybierz szablon posta do publikacji na social media
            </ThemedText>

            {TEMPLATES.map((t) => (
              <Pressable
                key={t.id}
                style={[styles.templateCard, { backgroundColor: cardBg, borderColor }]}
                onPress={() => handleSelectTemplate(t.id)}
              >
                <View style={styles.templateIcon}>
                  <ThemedText style={styles.templateIconText}>{t.icon}</ThemedText>
                </View>
                <View style={styles.templateInfo}>
                  <ThemedText type="defaultSemiBold">{t.name}</ThemedText>
                  <ThemedText style={styles.templateDescription}>{t.description}</ThemedText>
                </View>
                <ThemedText style={{ color: tintColor }}>→</ThemedText>
              </Pressable>
            ))}
          </View>
        ) : (
          // Post Editor
          <View style={styles.editorContainer}>
            {/* Back to templates */}
            <Pressable
              style={styles.changeTemplateButton}
              onPress={() => setSelectedTemplate(null)}
            >
              <ThemedText style={{ color: tintColor }}>← Zmień szablon</ThemedText>
            </Pressable>

            {/* Platform Selection */}
            <View style={styles.platformSection}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Publikuj na:
              </ThemedText>
              <View style={styles.platformButtons}>
                <Pressable
                  style={[
                    styles.platformButton,
                    { borderColor },
                    selectedPlatforms.includes("facebook") && styles.platformButtonSelected,
                  ]}
                  onPress={() => togglePlatform("facebook")}
                >
                  <ThemedText style={styles.platformIcon}>f</ThemedText>
                  <ThemedText
                    style={[
                      styles.platformName,
                      selectedPlatforms.includes("facebook") && { color: "#1877F2" },
                    ]}
                  >
                    Facebook
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.platformButton,
                    { borderColor },
                    selectedPlatforms.includes("instagram") && styles.platformButtonSelected,
                  ]}
                  onPress={() => togglePlatform("instagram")}
                >
                  <ThemedText style={styles.platformIcon}>📷</ThemedText>
                  <ThemedText
                    style={[
                      styles.platformName,
                      selectedPlatforms.includes("instagram") && { color: "#E4405F" },
                    ]}
                  >
                    Instagram
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                {template?.name} {template?.icon}
              </ThemedText>

              {template?.fields.map((field) => (
                <View key={field.key} style={styles.fieldContainer}>
                  <ThemedText style={styles.fieldLabel}>{field.label}</ThemedText>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      { backgroundColor: cardBg, borderColor },
                      field.multiline && styles.fieldInputMultiline,
                    ]}
                    placeholder={field.placeholder}
                    placeholderTextColor="#999"
                    value={formData[field.key] || ""}
                    onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                    multiline={field.multiline}
                    numberOfLines={field.multiline ? 4 : 1}
                  />
                </View>
              ))}
            </View>

            {/* Preview */}
            <View style={styles.previewSection}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Podgląd posta
              </ThemedText>
              <View style={[styles.previewCard, { backgroundColor: cardBg, borderColor }]}>
                <ThemedText style={styles.previewText}>{generatePreview()}</ThemedText>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsSection}>
              <Pressable
                style={[styles.scheduleButton, { borderColor: tintColor }]}
                onPress={handleSchedule}
              >
                <ThemedText style={{ color: tintColor }}>📅 Zaplanuj</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.publishButton, { backgroundColor: tintColor }]}
                onPress={handlePublish}
              >
                <ThemedText style={styles.publishButtonText}>Opublikuj teraz</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  templatesContainer: {
    gap: 12,
  },
  sectionDescription: {
    opacity: 0.7,
    marginBottom: 12,
    lineHeight: 20,
  },
  templateCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  templateIconText: {
    fontSize: 24,
  },
  templateInfo: {
    flex: 1,
  },
  templateDescription: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  editorContainer: {
    gap: 24,
    paddingBottom: 24,
  },
  changeTemplateButton: {
    paddingVertical: 8,
  },
  platformSection: {},
  sectionTitle: {
    marginBottom: 12,
  },
  platformButtons: {
    flexDirection: "row",
    gap: 12,
  },
  platformButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  platformButtonSelected: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderWidth: 2,
  },
  platformIcon: {
    fontSize: 18,
    fontWeight: "700",
  },
  platformName: {
    fontSize: 14,
    fontWeight: "500",
  },
  formSection: {},
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  fieldInput: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
  },
  fieldInputMultiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  previewSection: {},
  previewCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 22,
  },
  actionsSection: {
    flexDirection: "row",
    gap: 12,
  },
  scheduleButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
  },
  publishButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  publishButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
