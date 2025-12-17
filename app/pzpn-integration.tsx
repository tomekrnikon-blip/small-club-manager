import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { trpc } from "@/lib/trpc";

// PZPN Regions data
const PZPN_REGIONS = [
  { code: "WZPN", name: "Wielkopolski ZPN", enabled: true },
  { code: "MZPN", name: "Mazowiecki ZPN", enabled: false },
  { code: "SLZPN", name: "Śląski ZPN", enabled: false },
  { code: "DZPN", name: "Dolnośląski ZPN", enabled: false },
  { code: "OZPN", name: "Opolski ZPN", enabled: false },
  { code: "LZPN", name: "Lubelski ZPN", enabled: false },
  { code: "PZPN", name: "Podkarpacki ZPN", enabled: false },
  { code: "KPZPN", name: "Kujawsko-Pomorski ZPN", enabled: false },
  { code: "LOZPN", name: "Łódzki ZPN", enabled: false },
  { code: "MPZPN", name: "Małopolski ZPN", enabled: false },
  { code: "POZPN", name: "Pomorski ZPN", enabled: false },
  { code: "SWZPN", name: "Świętokrzyski ZPN", enabled: false },
  { code: "WMZPN", name: "Warmińsko-Mazurski ZPN", enabled: false },
  { code: "ZZPN", name: "Zachodniopomorski ZPN", enabled: false },
  { code: "LUZPN", name: "Lubuski ZPN", enabled: false },
  { code: "PLZPN", name: "Podlaski ZPN", enabled: false },
];

const LEAGUE_LEVELS = [
  { level: 4, name: "IV Liga" },
  { level: 5, name: "V Liga" },
  { level: 6, name: "Klasa okręgowa" },
  { level: 7, name: "Klasa A" },
  { level: 8, name: "Klasa B" },
];

type Step = "region" | "league" | "team" | "confirm";

export default function PzpnIntegrationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({ light: "#F5F5F5", dark: "#1C1C1E" }, "background");
  const borderColor = useThemeColor({ light: "#E0E0E0", dark: "#333" }, "icon");

  const [step, setStep] = useState<Step>("region");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<{
    name: string;
    position: number;
    points: number;
    externalId: string;
  } | null>(null);

  const handleSelectRegion = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRegion(code);
    setStep("league");
  };

  const handleSelectLevel = (level: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLevel(level);
    setStep("team");
  };

  const handleSelectTeam = (team: typeof selectedTeam) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTeam(team);
    setStep("confirm");
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Link club to PZPN team via API
    router.back();
  };

  const handleBack = () => {
    if (step === "league") setStep("region");
    else if (step === "team") setStep("league");
    else if (step === "confirm") setStep("team");
    else router.back();
  };

  // Mock teams data (would come from API)
  const mockTeams = [
    { name: "KOTWICA Kórnik", position: 1, points: 46, externalId: "kotwica-kornik" },
    { name: "MIESZKO Gniezno", position: 2, points: 42, externalId: "mieszko-gniezno" },
    { name: "Polonia CHODZIEŻ", position: 3, points: 37, externalId: "polonia-chodziez" },
    { name: "POLONIA Golina", position: 4, points: 35, externalId: "polonia-golina" },
    { name: "HURAGAN Pobiedziska", position: 5, points: 33, externalId: "huragan-pobiedziska" },
    { name: "WARTA Śrem", position: 6, points: 28, externalId: "warta-srem" },
    { name: "PIAST Kobylnica", position: 7, points: 26, externalId: "piast-kobylnica" },
    { name: "Obra 1912 Kościan", position: 8, points: 24, externalId: "obra-koscian" },
  ];

  const filteredTeams = mockTeams.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRegionStep = () => (
    <View style={styles.stepContainer}>
      <ThemedText type="title" style={styles.stepTitle}>
        Wybierz okręg
      </ThemedText>
      <ThemedText style={styles.stepDescription}>
        Wybierz wojewódzki związek piłki nożnej, w którym gra Twoja drużyna
      </ThemedText>

      <FlatList
        data={PZPN_REGIONS}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.regionCard,
              { backgroundColor: cardBg, borderColor },
              !item.enabled && styles.regionCardDisabled,
            ]}
            onPress={() => item.enabled && handleSelectRegion(item.code)}
            disabled={!item.enabled}
          >
            <View style={styles.regionInfo}>
              <ThemedText
                type="defaultSemiBold"
                style={!item.enabled && styles.disabledText}
              >
                {item.name}
              </ThemedText>
              <ThemedText
                style={[styles.regionCode, !item.enabled && styles.disabledText]}
              >
                {item.code}
              </ThemedText>
            </View>
            {item.enabled ? (
              <ThemedText style={{ color: tintColor }}>→</ThemedText>
            ) : (
              <View style={styles.comingSoonBadge}>
                <ThemedText style={styles.comingSoonText}>Wkrótce</ThemedText>
              </View>
            )}
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderLeagueStep = () => (
    <View style={styles.stepContainer}>
      <ThemedText type="title" style={styles.stepTitle}>
        Wybierz ligę
      </ThemedText>
      <ThemedText style={styles.stepDescription}>
        Na jakim poziomie rozgrywkowym gra Twoja drużyna?
      </ThemedText>

      <View style={styles.leagueList}>
        {LEAGUE_LEVELS.map((league) => (
          <Pressable
            key={league.level}
            style={[styles.leagueCard, { backgroundColor: cardBg, borderColor }]}
            onPress={() => handleSelectLevel(league.level)}
          >
            <View style={styles.leagueLevelBadge}>
              <ThemedText style={styles.leagueLevelText}>{league.level}</ThemedText>
            </View>
            <ThemedText type="defaultSemiBold">{league.name}</ThemedText>
            <ThemedText style={{ color: tintColor }}>→</ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderTeamStep = () => (
    <View style={styles.stepContainer}>
      <ThemedText type="title" style={styles.stepTitle}>
        Znajdź drużynę
      </ThemedText>
      <ThemedText style={styles.stepDescription}>
        Wyszukaj swoją drużynę w tabeli ligowej
      </ThemedText>

      <View style={[styles.searchContainer, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText style={styles.searchIcon}>🔍</ThemedText>
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj drużyny..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredTeams}
        keyExtractor={(item) => item.externalId}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.teamCard, { backgroundColor: cardBg, borderColor }]}
            onPress={() => handleSelectTeam(item)}
          >
            <View style={styles.teamPosition}>
              <ThemedText type="defaultSemiBold">{item.position}</ThemedText>
            </View>
            <View style={styles.teamInfo}>
              <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
              <ThemedText style={styles.teamPoints}>{item.points} pkt</ThemedText>
            </View>
            <ThemedText style={{ color: tintColor }}>Wybierz</ThemedText>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderConfirmStep = () => (
    <View style={styles.stepContainer}>
      <ThemedText type="title" style={styles.stepTitle}>
        Potwierdź wybór
      </ThemedText>

      <View style={[styles.confirmCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.confirmRow}>
          <ThemedText style={styles.confirmLabel}>Okręg:</ThemedText>
          <ThemedText type="defaultSemiBold">
            {PZPN_REGIONS.find((r) => r.code === selectedRegion)?.name}
          </ThemedText>
        </View>
        <View style={styles.confirmRow}>
          <ThemedText style={styles.confirmLabel}>Liga:</ThemedText>
          <ThemedText type="defaultSemiBold">
            {LEAGUE_LEVELS.find((l) => l.level === selectedLevel)?.name}
          </ThemedText>
        </View>
        <View style={styles.confirmRow}>
          <ThemedText style={styles.confirmLabel}>Drużyna:</ThemedText>
          <ThemedText type="defaultSemiBold">{selectedTeam?.name}</ThemedText>
        </View>
        <View style={styles.confirmRow}>
          <ThemedText style={styles.confirmLabel}>Pozycja:</ThemedText>
          <ThemedText type="defaultSemiBold">
            {selectedTeam?.position}. miejsce ({selectedTeam?.points} pkt)
          </ThemedText>
        </View>
      </View>

      <ThemedText style={styles.confirmNote}>
        Po połączeniu, tabela ligowa i wyniki meczów będą automatycznie
        synchronizowane z oficjalnymi danymi PZPN.
      </ThemedText>

      <Pressable
        style={[styles.confirmButton, { backgroundColor: tintColor }]}
        onPress={handleConfirm}
      >
        <ThemedText style={styles.confirmButtonText}>
          Połącz z oficjalnymi danymi
        </ThemedText>
      </Pressable>
    </View>
  );

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
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ThemedText style={{ fontSize: 24 }}>←</ThemedText>
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText type="subtitle">Integracja PZPN</ThemedText>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        {["region", "league", "team", "confirm"].map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  step === s
                    ? tintColor
                    : ["region", "league", "team", "confirm"].indexOf(step) > i
                    ? tintColor
                    : borderColor,
              },
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === "region" && renderRegionStep()}
        {step === "league" && renderLeagueStep()}
        {step === "team" && renderTeamStep()}
        {step === "confirm" && renderConfirmStep()}
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
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 16,
  },
  stepTitle: {
    marginBottom: 8,
  },
  stepDescription: {
    opacity: 0.7,
    marginBottom: 24,
    lineHeight: 22,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  regionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  regionCardDisabled: {
    opacity: 0.5,
  },
  regionInfo: {
    flex: 1,
  },
  regionCode: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  disabledText: {
    opacity: 0.5,
  },
  comingSoonBadge: {
    backgroundColor: "#FFE0B2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  comingSoonText: {
    fontSize: 10,
    color: "#E65100",
    fontWeight: "600",
  },
  leagueList: {
    gap: 12,
  },
  leagueCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  leagueLevelBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  leagueLevelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1976D2",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  teamPosition: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  teamInfo: {
    flex: 1,
  },
  teamPoints: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  confirmCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  confirmLabel: {
    opacity: 0.6,
  },
  confirmNote: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
