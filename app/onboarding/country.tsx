import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

interface Country {
  code: string;
  name: string;
  nameLocal: string;
  flag: string;
  association: string;
  enabled: boolean;
}

const COUNTRIES: Country[] = [
  { code: "PL", name: "Poland", nameLocal: "Polska", flag: "🇵🇱", association: "PZPN", enabled: true },
  { code: "DE", name: "Germany", nameLocal: "Deutschland", flag: "🇩🇪", association: "DFB", enabled: true },
  { code: "GB", name: "England", nameLocal: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", association: "FA", enabled: true },
  { code: "NL", name: "Netherlands", nameLocal: "Nederland", flag: "🇳🇱", association: "KNVB", enabled: true },
  { code: "BE", name: "Belgium", nameLocal: "België", flag: "🇧🇪", association: "KBVB", enabled: true },
  { code: "FR", name: "France", nameLocal: "France", flag: "🇫🇷", association: "FFF", enabled: true },
  { code: "IT", name: "Italy", nameLocal: "Italia", flag: "🇮🇹", association: "FIGC", enabled: true },
  { code: "ES", name: "Spain", nameLocal: "España", flag: "🇪🇸", association: "RFEF", enabled: true },
  { code: "DK", name: "Denmark", nameLocal: "Danmark", flag: "🇩🇰", association: "DBU", enabled: true },
  { code: "SE", name: "Sweden", nameLocal: "Sverige", flag: "🇸🇪", association: "SvFF", enabled: true },
  { code: "CZ", name: "Czech Republic", nameLocal: "Česko", flag: "🇨🇿", association: "FAČR", enabled: true },
  { code: "SK", name: "Slovakia", nameLocal: "Slovensko", flag: "🇸🇰", association: "SFZ", enabled: true },
  { code: "AT", name: "Austria", nameLocal: "Österreich", flag: "🇦🇹", association: "ÖFB", enabled: true },
  { code: "HU", name: "Hungary", nameLocal: "Magyarország", flag: "🇭🇺", association: "MLSZ", enabled: false },
  { code: "UA", name: "Ukraine", nameLocal: "Україна", flag: "🇺🇦", association: "UAF", enabled: false },
];

export default function OnboardingCountryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor({ light: "#F5F5F5", dark: "#1C1C1E" }, "background");
  const borderColor = useThemeColor({ light: "#E0E0E0", dark: "#333" }, "icon");

  const handleSelectCountry = async (country: Country) => {
    if (!country.enabled) return;
    
    setSelectedCountry(country.code);
    
    // Save country preference
    await AsyncStorage.setItem("user_country", country.code);
    await AsyncStorage.setItem("user_country_name", country.name);
    
    // Navigate to next onboarding step or league selection
    router.push({
      pathname: "/league-selection",
      params: { country: country.code },
    });
  };

  const renderCountry = ({ item }: { item: Country }) => {
    const isSelected = selectedCountry === item.code;
    const isDisabled = !item.enabled;

    return (
      <Pressable
        onPress={() => handleSelectCountry(item)}
        disabled={isDisabled}
        style={[
          styles.countryCard,
          {
            backgroundColor: cardBg,
            borderColor: isSelected ? tintColor : borderColor,
            borderWidth: isSelected ? 2 : 1,
            opacity: isDisabled ? 0.5 : 1,
          },
        ]}
      >
        <ThemedText style={styles.flag}>{item.flag}</ThemedText>
        <View style={styles.countryInfo}>
          <ThemedText type="defaultSemiBold" style={styles.countryName}>
            {item.nameLocal}
          </ThemedText>
          <ThemedText style={styles.association}>
            {item.association}
          </ThemedText>
        </View>
        {isDisabled && (
          <View style={styles.comingSoonBadge}>
            <ThemedText style={styles.comingSoonText}>Wkrótce</ThemedText>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Wybierz kraj
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Wybierz kraj, w którym działa Twój klub. Pobierzemy oficjalne dane ligowe z odpowiedniego związku piłkarskiego.
        </ThemedText>
      </View>

      <FlatList
        data={COUNTRIES}
        keyExtractor={(item) => item.code}
        renderItem={renderCountry}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.7,
    lineHeight: 22,
  },
  list: {
    paddingHorizontal: 12,
  },
  row: {
    justifyContent: "space-between",
  },
  countryCard: {
    flex: 1,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 100,
  },
  flag: {
    fontSize: 40,
    marginBottom: 8,
  },
  countryInfo: {
    alignItems: "center",
  },
  countryName: {
    fontSize: 14,
    textAlign: "center",
  },
  association: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  comingSoonBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 149, 0, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comingSoonText: {
    fontSize: 10,
    color: "#FF9500",
    fontWeight: "600",
  },
});
