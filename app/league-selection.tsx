import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
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

// Country data with regions and leagues
const COUNTRY_DATA: Record<string, {
  name: string;
  flag: string;
  association: string;
  regions: { code: string; name: string; enabled: boolean }[];
  leagues: { level: number; name: string; hasRegions: boolean }[];
}> = {
  PL: {
    name: "Polska",
    flag: "🇵🇱",
    association: "PZPN",
    regions: [
      { code: "WZPN", name: "Wielkopolski ZPN", enabled: true },
      { code: "MZPN", name: "Mazowiecki ZPN", enabled: false },
      { code: "SLZPN", name: "Śląski ZPN", enabled: false },
      { code: "DZPN", name: "Dolnośląski ZPN", enabled: false },
      { code: "OZPN", name: "Opolski ZPN", enabled: false },
      { code: "LZPN", name: "Lubelski ZPN", enabled: false },
      { code: "PZPN_POD", name: "Podkarpacki ZPN", enabled: false },
      { code: "KPZPN", name: "Kujawsko-Pomorski ZPN", enabled: false },
      { code: "LOZPN", name: "Łódzki ZPN", enabled: false },
      { code: "MPZPN", name: "Małopolski ZPN", enabled: false },
      { code: "POZPN", name: "Pomorski ZPN", enabled: false },
      { code: "SWZPN", name: "Świętokrzyski ZPN", enabled: false },
      { code: "WMZPN", name: "Warmińsko-Mazurski ZPN", enabled: false },
      { code: "ZZPN", name: "Zachodniopomorski ZPN", enabled: false },
      { code: "LUZPN", name: "Lubuski ZPN", enabled: false },
      { code: "PLZPN", name: "Podlaski ZPN", enabled: false },
    ],
    leagues: [
      { level: 4, name: "IV Liga", hasRegions: true },
      { level: 5, name: "V Liga (Klasa okręgowa)", hasRegions: true },
      { level: 6, name: "Klasa A", hasRegions: true },
      { level: 7, name: "Klasa B", hasRegions: true },
      { level: 8, name: "Klasa C", hasRegions: true },
    ],
  },
  DE: {
    name: "Deutschland",
    flag: "🇩🇪",
    association: "DFB",
    regions: [
      { code: "BFV", name: "Bayerischer FV", enabled: true },
      { code: "WDFV", name: "Westdeutscher FV", enabled: false },
      { code: "NFV", name: "Niedersächsischer FV", enabled: false },
      { code: "HFV", name: "Hessischer FV", enabled: false },
      { code: "BFV_BERLIN", name: "Berliner FV", enabled: false },
      { code: "SFV", name: "Sächsischer FV", enabled: false },
    ],
    leagues: [
      { level: 4, name: "Regionalliga", hasRegions: true },
      { level: 5, name: "Oberliga", hasRegions: true },
      { level: 6, name: "Landesliga", hasRegions: true },
      { level: 7, name: "Bezirksliga", hasRegions: true },
      { level: 8, name: "Kreisliga", hasRegions: true },
    ],
  },
  CZ: {
    name: "Česká republika",
    flag: "🇨🇿",
    association: "FAČR",
    regions: [
      { code: "PKFS", name: "Praha", enabled: true },
      { code: "SKFS", name: "Středočeský", enabled: false },
      { code: "JCKFS", name: "Jihočeský", enabled: false },
      { code: "JMKFS", name: "Jihomoravský", enabled: false },
      { code: "MSKFS", name: "Moravskoslezský", enabled: false },
    ],
    leagues: [
      { level: 3, name: "ČFL / MSFL", hasRegions: true },
      { level: 4, name: "Divize", hasRegions: true },
      { level: 5, name: "Krajský přebor", hasRegions: true },
      { level: 6, name: "I.A třída", hasRegions: true },
    ],
  },
  SK: {
    name: "Slovensko",
    flag: "🇸🇰",
    association: "SFZ",
    regions: [
      { code: "BFZ", name: "Bratislavský FZ", enabled: true },
      { code: "ZsFZ", name: "Západoslovenský FZ", enabled: false },
      { code: "SsFZ", name: "Stredoslovenský FZ", enabled: false },
      { code: "VsFZ", name: "Východoslovenský FZ", enabled: false },
    ],
    leagues: [
      { level: 3, name: "3. liga", hasRegions: true },
      { level: 4, name: "4. liga", hasRegions: true },
      { level: 5, name: "5. liga", hasRegions: true },
    ],
  },
  AT: {
    name: "Österreich",
    flag: "🇦🇹",
    association: "ÖFB",
    regions: [
      { code: "WFV", name: "Wiener FV", enabled: true },
      { code: "NÖFV", name: "Niederösterreichischer FV", enabled: false },
      { code: "STFV", name: "Steirischer FV", enabled: false },
      { code: "OÖFV", name: "Oberösterreichischer FV", enabled: false },
    ],
    leagues: [
      { level: 3, name: "Regionalliga", hasRegions: true },
      { level: 4, name: "Landesliga", hasRegions: true },
      { level: 5, name: "Gebietsliga", hasRegions: true },
    ],
  },
};

type Step = "region" | "league" | "team";

export default function LeagueSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ country: string }>();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({ light: "#F5F5F5", dark: "#1C1C1E" }, "background");
  const borderColor = useThemeColor({ light: "#E0E0E0", dark: "#333" }, "icon");

  const countryCode = params.country || "PL";
  const countryData = COUNTRY_DATA[countryCode];

  const [step, setStep] = useState<Step>("region");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<{ name: string; position: number; points: number; id: string }[]>([]);

  // Mock team data fetch
  useEffect(() => {
    if (step === "team" && selectedRegion && selectedLeague) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setTeams([
          { id: "1", name: "KS Przykład", position: 1, points: 45 },
          { id: "2", name: "FC Testowy", position: 2, points: 42 },
          { id: "3", name: "Orzeł Sportowy", position: 3, points: 38 },
          { id: "4", name: "Victoria Miejska", position: 4, points: 35 },
          { id: "5", name: "Sokół Regionalny", position: 5, points: 32 },
          { id: "6", name: "Polonia Lokalna", position: 6, points: 30 },
          { id: "7", name: "Warta Powiatowa", position: 7, points: 28 },
          { id: "8", name: "Huragan Gminny", position: 8, points: 25 },
        ]);
        setIsLoading(false);
      }, 1000);
    }
  }, [step, selectedRegion, selectedLeague]);

  const handleSelectRegion = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRegion(code);
    setStep("league");
  };

  const handleSelectLeague = (level: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLeague(level);
    setStep("team");
  };

  const handleSelectTeam = (teamId: string, teamName: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Save selection and link to club
    router.back();
  };

  const handleBack = () => {
    if (step === "league") setStep("region");
    else if (step === "team") setStep("league");
    else router.back();
  };

  if (!countryData) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ThemedText>Kraj nie znaleziony</ThemedText>
      </ThemedView>
    );
  }

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
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
          <ThemedText style={styles.headerFlag}>{countryData.flag}</ThemedText>
          <ThemedText type="subtitle">{countryData.name}</ThemedText>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        {["region", "league", "team"].map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  step === s
                    ? tintColor
                    : ["region", "league", "team"].indexOf(step) > i
                    ? tintColor
                    : borderColor,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Region Selection */}
        {step === "region" && (
          <View style={styles.stepContainer}>
            <ThemedText type="title" style={styles.stepTitle}>
              Wybierz okręg
            </ThemedText>
            <ThemedText style={styles.stepDescription}>
              Wybierz regionalny związek piłkarski
            </ThemedText>

            <FlatList
              data={countryData.regions}
              keyExtractor={(item) => item.code}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.optionCard,
                    { backgroundColor: cardBg, borderColor },
                    !item.enabled && styles.optionCardDisabled,
                  ]}
                  onPress={() => item.enabled && handleSelectRegion(item.code)}
                  disabled={!item.enabled}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={!item.enabled && styles.disabledText}
                  >
                    {item.name}
                  </ThemedText>
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
            />
          </View>
        )}

        {/* League Selection */}
        {step === "league" && (
          <View style={styles.stepContainer}>
            <ThemedText type="title" style={styles.stepTitle}>
              Wybierz ligę
            </ThemedText>
            <ThemedText style={styles.stepDescription}>
              Na jakim poziomie rozgrywkowym gra Twoja drużyna?
            </ThemedText>

            <FlatList
              data={countryData.leagues}
              keyExtractor={(item) => item.level.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.leagueCard, { backgroundColor: cardBg, borderColor }]}
                  onPress={() => handleSelectLeague(item.level)}
                >
                  <View style={styles.leagueLevelBadge}>
                    <ThemedText style={styles.leagueLevelText}>{item.level}</ThemedText>
                  </View>
                  <ThemedText type="defaultSemiBold" style={styles.leagueName}>
                    {item.name}
                  </ThemedText>
                  <ThemedText style={{ color: tintColor }}>→</ThemedText>
                </Pressable>
              )}
              contentContainerStyle={styles.listContent}
            />
          </View>
        )}

        {/* Team Selection */}
        {step === "team" && (
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

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tintColor} />
                <ThemedText style={styles.loadingText}>
                  Pobieranie danych z {countryData.association}...
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={filteredTeams}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.teamCard, { backgroundColor: cardBg, borderColor }]}
                    onPress={() => handleSelectTeam(item.id, item.name)}
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
                ListEmptyComponent={
                  <ThemedText style={styles.emptyText}>
                    Nie znaleziono drużyn pasujących do wyszukiwania
                  </ThemedText>
                }
              />
            )}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerFlag: {
    fontSize: 24,
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
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionCardDisabled: {
    opacity: 0.5,
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
  leagueName: {
    flex: 1,
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
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
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
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
    paddingVertical: 20,
  },
});
