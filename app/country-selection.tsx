import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

// Countries with football associations
const COUNTRIES = [
  {
    code: "PL",
    name: "Polska",
    nameEn: "Poland",
    flag: "🇵🇱",
    association: "PZPN",
    associationFull: "Polski Związek Piłki Nożnej",
    enabled: true,
    leagues: "Ekstraklasa → Klasa C",
  },
  {
    code: "DE",
    name: "Deutschland",
    nameEn: "Germany",
    flag: "🇩🇪",
    association: "DFB",
    associationFull: "Deutscher Fußball-Bund",
    enabled: true,
    leagues: "Bundesliga → Kreisliga",
  },
  {
    code: "CZ",
    name: "Česká republika",
    nameEn: "Czech Republic",
    flag: "🇨🇿",
    association: "FAČR",
    associationFull: "Fotbalová asociace České republiky",
    enabled: true,
    leagues: "Fortuna liga → I.A třída",
  },
  {
    code: "SK",
    name: "Slovensko",
    nameEn: "Slovakia",
    flag: "🇸🇰",
    association: "SFZ",
    associationFull: "Slovenský futbalový zväz",
    enabled: true,
    leagues: "Niké liga → 5. liga",
  },
  {
    code: "AT",
    name: "Österreich",
    nameEn: "Austria",
    flag: "🇦🇹",
    association: "ÖFB",
    associationFull: "Österreichischer Fußball-Bund",
    enabled: true,
    leagues: "Bundesliga → Gebietsliga",
  },
  {
    code: "GB",
    name: "England",
    nameEn: "England",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    association: "FA",
    associationFull: "The Football Association",
    enabled: true,
    leagues: "Premier League → Step 6",
  },
  {
    code: "NL",
    name: "Nederland",
    nameEn: "Netherlands",
    flag: "🇳🇱",
    association: "KNVB",
    associationFull: "Koninklijke Nederlandse Voetbalbond",
    enabled: true,
    leagues: "Eredivisie → Vierde Klasse",
  },
  {
    code: "BE",
    name: "België",
    nameEn: "Belgium",
    flag: "🇧🇪",
    association: "KBVB",
    associationFull: "Koninklijke Belgische Voetbalbond",
    enabled: true,
    leagues: "Pro League → 3e Provinciale",
  },
  {
    code: "DK",
    name: "Danmark",
    nameEn: "Denmark",
    flag: "🇩🇰",
    association: "DBU",
    associationFull: "Dansk Boldspil-Union",
    enabled: true,
    leagues: "Superliga → Serie 2",
  },
  {
    code: "SE",
    name: "Sverige",
    nameEn: "Sweden",
    flag: "🇸🇪",
    association: "SvFF",
    associationFull: "Svenska Fotbollförbundet",
    enabled: true,
    leagues: "Allsvenskan → Division 7",
  },
  {
    code: "FR",
    name: "France",
    nameEn: "France",
    flag: "🇫🇷",
    association: "FFF",
    associationFull: "Fédération Française de Football",
    enabled: true,
    leagues: "Ligue 1 → District 2",
  },
  {
    code: "IT",
    name: "Italia",
    nameEn: "Italy",
    flag: "🇮🇹",
    association: "FIGC",
    associationFull: "Federazione Italiana Giuoco Calcio",
    enabled: true,
    leagues: "Serie A → Terza Categoria",
  },
  {
    code: "ES",
    name: "España",
    nameEn: "Spain",
    flag: "🇪🇸",
    association: "RFEF",
    associationFull: "Real Federación Española de Fútbol",
    enabled: true,
    leagues: "La Liga → Segunda Regional",
  },
  {
    code: "HU",
    name: "Magyarország",
    nameEn: "Hungary",
    flag: "🇭🇺",
    association: "MLSZ",
    associationFull: "Magyar Labdarúgó Szövetség",
    enabled: false,
    leagues: "NB I → NB III",
  },
  {
    code: "UA",
    name: "Україна",
    nameEn: "Ukraine",
    flag: "🇺🇦",
    association: "UAF",
    associationFull: "Українська асоціація футболу",
    enabled: false,
    leagues: "Прем'єр-ліга → Перша ліга",
  },
  {
    code: "LT",
    name: "Lietuva",
    nameEn: "Lithuania",
    flag: "🇱🇹",
    association: "LFF",
    associationFull: "Lietuvos futbolo federacija",
    enabled: false,
    leagues: "A lyga → I lyga",
  },
  {
    code: "LV",
    name: "Latvija",
    nameEn: "Latvia",
    flag: "🇱🇻",
    association: "LFF",
    associationFull: "Latvijas Futbola federācija",
    enabled: false,
    leagues: "Virslīga → 1. līga",
  },
  {
    code: "EE",
    name: "Eesti",
    nameEn: "Estonia",
    flag: "🇪🇪",
    association: "EJL",
    associationFull: "Eesti Jalgpalli Liit",
    enabled: false,
    leagues: "Meistriliiga → Esiliiga",
  },
  {
    code: "BY",
    name: "Беларусь",
    nameEn: "Belarus",
    flag: "🇧🇾",
    association: "ABFF",
    associationFull: "Беларуская федэрацыя футбола",
    enabled: false,
    leagues: "Вышэйшая ліга",
  },
  {
    code: "RO",
    name: "România",
    nameEn: "Romania",
    flag: "🇷🇴",
    association: "FRF",
    associationFull: "Federația Română de Fotbal",
    enabled: false,
    leagues: "SuperLiga → Liga III",
  },
  {
    code: "BG",
    name: "България",
    nameEn: "Bulgaria",
    flag: "🇧🇬",
    association: "BFU",
    associationFull: "Български футболен съюз",
    enabled: false,
    leagues: "Първа лига → Трета лига",
  },
  {
    code: "HR",
    name: "Hrvatska",
    nameEn: "Croatia",
    flag: "🇭🇷",
    association: "HNS",
    associationFull: "Hrvatski nogometni savez",
    enabled: false,
    leagues: "HNL → 3. HNL",
  },
  {
    code: "SI",
    name: "Slovenija",
    nameEn: "Slovenia",
    flag: "🇸🇮",
    association: "NZS",
    associationFull: "Nogometna zveza Slovenije",
    enabled: false,
    leagues: "1. SNL → 3. SNL",
  },
];

export default function CountrySelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({ light: "#F5F5F5", dark: "#1C1C1E" }, "background");
  const borderColor = useThemeColor({ light: "#E0E0E0", dark: "#333" }, "icon");

  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.association.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCountry = (countryCode: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to league/region selection for this country
    router.push({
      pathname: "/league-selection" as any,
      params: { country: countryCode },
    });
  };

  const renderCountry = ({ item }: { item: typeof COUNTRIES[0] }) => (
    <Pressable
      style={[
        styles.countryCard,
        { backgroundColor: cardBg, borderColor },
        !item.enabled && styles.countryCardDisabled,
      ]}
      onPress={() => item.enabled && handleSelectCountry(item.code)}
      disabled={!item.enabled}
    >
      <View style={styles.flagContainer}>
        <ThemedText style={styles.flag}>{item.flag}</ThemedText>
      </View>
      <View style={styles.countryInfo}>
        <ThemedText
          type="defaultSemiBold"
          style={[styles.countryName, !item.enabled && styles.disabledText]}
        >
          {item.name}
        </ThemedText>
        <ThemedText style={[styles.associationName, !item.enabled && styles.disabledText]}>
          {item.associationFull}
        </ThemedText>
        <ThemedText style={[styles.leagueRange, !item.enabled && styles.disabledText]}>
          {item.leagues}
        </ThemedText>
      </View>
      <View style={styles.rightSection}>
        {item.enabled ? (
          <View style={[styles.associationBadge, { backgroundColor: tintColor + "20" }]}>
            <ThemedText style={[styles.associationCode, { color: tintColor }]}>
              {item.association}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.comingSoonBadge}>
            <ThemedText style={styles.comingSoonText}>Wkrótce</ThemedText>
          </View>
        )}
      </View>
    </Pressable>
  );

  const enabledCountries = filteredCountries.filter((c) => c.enabled);
  const disabledCountries = filteredCountries.filter((c) => !c.enabled);

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
          <ThemedText type="subtitle">Wybierz kraj</ThemedText>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={[styles.searchContainer, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.searchIcon}>🔍</ThemedText>
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj kraju lub związku..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Info */}
      <View style={[styles.infoCard, { backgroundColor: "#E8F5E9", borderColor: "#A5D6A7" }]}>
        <ThemedText style={styles.infoText}>
          🌍 Wybierz kraj, aby pobrać oficjalne dane ligowe z lokalnego związku piłkarskiego.
          Dane są aktualizowane automatycznie.
        </ThemedText>
      </View>

      {/* Countries List */}
      <FlatList
        data={[...enabledCountries, ...disabledCountries]}
        keyExtractor={(item) => item.code}
        renderItem={renderCountry}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          enabledCountries.length > 0 ? (
            <ThemedText type="subtitle" style={styles.sectionHeader}>
              Dostępne kraje ({enabledCountries.length})
            </ThemedText>
          ) : null
        }
        stickyHeaderIndices={[]}
      />
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
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  infoCard: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#2E7D32",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 8,
  },
  countryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  countryCardDisabled: {
    opacity: 0.5,
  },
  flagContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  flag: {
    fontSize: 28,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    marginBottom: 2,
  },
  associationName: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  leagueRange: {
    fontSize: 11,
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  associationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  associationCode: {
    fontSize: 12,
    fontWeight: "700",
  },
  comingSoonBadge: {
    backgroundColor: "#FFE0B2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  comingSoonText: {
    fontSize: 10,
    color: "#E65100",
    fontWeight: "600",
  },
});
