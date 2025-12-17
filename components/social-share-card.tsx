import { useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Share,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

// ViewShot is only available on native platforms
let ViewShot: any = null;
if (Platform.OS !== "web") {
  ViewShot = require("react-native-view-shot").default;
}

import { ThemedText } from "@/components/themed-text";
import { AppColors, Spacing, Radius } from "@/constants/theme";

// Template types
type TemplateType = "result" | "preview" | "stats" | "highlight";
// Template style type moved below with extended options

interface MatchData {
  id: number;
  opponent: string;
  goalsScored: number | null;
  goalsConceded: number | null;
  result: "win" | "draw" | "loss" | null;
  homeAway: "home" | "away";
  matchDate: string;
  matchTime?: string | null;
  location?: string | null;
  league?: string | null;
  clubName: string;
  clubLogo?: string;
  scorers?: { name: string; goals: number }[];
  stats?: {
    totalGoals: number;
    totalAssists: number;
    yellowCards: number;
    redCards: number;
    saves: number;
  };
}

interface SocialShareCardProps {
  visible: boolean;
  onClose: () => void;
  matchData: MatchData;
  type: TemplateType;
  clubColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Extended template styles with more designs
type TemplateStyle = "dark" | "gradient" | "minimal" | "bold" | "neon" | "retro" | "sport" | "elegant";

const TEMPLATE_STYLES: { 
  id: TemplateStyle; 
  name: string; 
  colors: { bg: string; accent: string; text: string; secondary?: string };
  pattern?: "stripes" | "dots" | "diagonal" | "none";
}[] = [
  { 
    id: "dark", 
    name: "Ciemny", 
    colors: { bg: "#0f172a", accent: "#22c55e", text: "#ffffff", secondary: "#334155" },
    pattern: "none"
  },
  { 
    id: "gradient", 
    name: "Gradient", 
    colors: { bg: "#1e3a5f", accent: "#3b82f6", text: "#ffffff", secondary: "#60a5fa" },
    pattern: "none"
  },
  { 
    id: "minimal", 
    name: "Minimalny", 
    colors: { bg: "#ffffff", accent: "#22c55e", text: "#0f172a", secondary: "#64748b" },
    pattern: "none"
  },
  { 
    id: "bold", 
    name: "Wyrazisty", 
    colors: { bg: "#22c55e", accent: "#ffffff", text: "#0f172a", secondary: "#166534" },
    pattern: "none"
  },
  { 
    id: "neon", 
    name: "Neon", 
    colors: { bg: "#0a0a0a", accent: "#00ff88", text: "#ffffff", secondary: "#ff00ff" },
    pattern: "none"
  },
  { 
    id: "retro", 
    name: "Retro", 
    colors: { bg: "#fef3c7", accent: "#d97706", text: "#451a03", secondary: "#92400e" },
    pattern: "stripes"
  },
  { 
    id: "sport", 
    name: "Sportowy", 
    colors: { bg: "#1e1e1e", accent: "#ef4444", text: "#ffffff", secondary: "#fbbf24" },
    pattern: "diagonal"
  },
  { 
    id: "elegant", 
    name: "Elegancki", 
    colors: { bg: "#1a1a2e", accent: "#c9a227", text: "#ffffff", secondary: "#e0e0e0" },
    pattern: "none"
  },
];

// Club colors template - will be populated with actual club colors
const getClubColorsTemplate = (clubColors?: { primary: string; secondary: string; accent: string }) => ({
  id: "club" as const,
  name: "Klubowy",
  colors: {
    bg: clubColors?.secondary || "#1e3a5f",
    accent: clubColors?.primary || "#22c55e",
    text: clubColors?.accent || "#ffffff",
    secondary: clubColors?.primary || "#22c55e",
  },
  pattern: "none" as const,
});

export function SocialShareCard({ visible, onClose, matchData, type, clubColors }: SocialShareCardProps) {
  const [selectedStyle, setSelectedStyle] = useState<TemplateStyle | "club">("dark");
  
  // Build template list including club colors if available
  const allTemplates = clubColors 
    ? [...TEMPLATE_STYLES, getClubColorsTemplate(clubColors)]
    : TEMPLATE_STYLES;
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<"facebook" | "instagram" | "both">("both");
  const viewShotRef = useRef<any>(null);

  const style = allTemplates.find(s => s.id === selectedStyle) || allTemplates[0];

  const getResultEmoji = () => {
    if (matchData.result === "win") return "🎉";
    if (matchData.result === "loss") return "😔";
    if (matchData.result === "draw") return "🤝";
    return "⚽";
  };

  const getResultText = () => {
    if (matchData.result === "win") return "WYGRANA";
    if (matchData.result === "loss") return "PRZEGRANA";
    if (matchData.result === "draw") return "REMIS";
    return "MECZ";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const getHomeTeam = () => matchData.homeAway === "home" ? matchData.clubName : matchData.opponent;
  const getAwayTeam = () => matchData.homeAway === "away" ? matchData.clubName : matchData.opponent;
  const getHomeScore = () => matchData.homeAway === "home" ? matchData.goalsScored : matchData.goalsConceded;
  const getAwayScore = () => matchData.homeAway === "away" ? matchData.goalsScored : matchData.goalsConceded;

  const generateCaption = () => {
    let caption = "";
    
    if (type === "result") {
      caption = `${getResultEmoji()} ${getResultText()}!\n\n`;
      caption += `${getHomeTeam()} ${getHomeScore()} : ${getAwayScore()} ${getAwayTeam()}\n\n`;
      
      if (matchData.scorers && matchData.scorers.length > 0) {
        caption += "⚽ Strzelcy:\n";
        matchData.scorers.forEach(s => {
          caption += `• ${s.name}${s.goals > 1 ? ` (${s.goals})` : ""}\n`;
        });
        caption += "\n";
      }
      
      caption += "Dziękujemy za doping! 👏\n\n";
    } else if (type === "preview") {
      caption = `📅 ZAPRASZAMY NA MECZ!\n\n`;
      caption += `🆚 ${matchData.opponent}\n`;
      caption += `📍 ${matchData.location || "Lokalizacja do potwierdzenia"}\n`;
      caption += `🕐 ${formatDate(matchData.matchDate)}${matchData.matchTime ? ` ${matchData.matchTime}` : ""}\n`;
      if (matchData.league) {
        caption += `🏆 ${matchData.league}\n`;
      }
      caption += "\nZapraszamy kibiców! 💪\n\n";
    } else if (type === "stats") {
      caption = `📊 STATYSTYKI MECZU\n\n`;
      caption += `${matchData.clubName} vs ${matchData.opponent}\n`;
      caption += `Wynik: ${matchData.goalsScored} : ${matchData.goalsConceded}\n\n`;
      
      if (matchData.stats) {
        caption += `⚽ Bramki: ${matchData.stats.totalGoals}\n`;
        caption += `🎯 Asysty: ${matchData.stats.totalAssists}\n`;
        caption += `🟨 Żółte kartki: ${matchData.stats.yellowCards}\n`;
        caption += `🟥 Czerwone kartki: ${matchData.stats.redCards}\n`;
        caption += `🧤 Obrony: ${matchData.stats.saves}\n\n`;
      }
    }
    
    caption += `#${matchData.clubName.replace(/\s+/g, "")} #piłkanożna #futbol #mecz`;
    
    return caption;
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);

    try {
      // Capture the view as an image
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture?.();
        
        if (uri) {
          const caption = generateCaption();
          
          if (Platform.OS === "web") {
            // On web, use native share or copy caption
            await Share.share({
              message: caption,
            });
          } else {
            // On mobile, share the image with caption
            const isAvailable = await Sharing.isAvailableAsync();
            
            if (isAvailable) {
              await Sharing.shareAsync(uri, {
                mimeType: "image/png",
                dialogTitle: "Udostępnij na social media",
              });
            } else {
              // Fallback to text share
              await Share.share({
                message: caption,
              });
            }
          }
          
          Alert.alert("Sukces", "Grafika została przygotowana do udostępnienia!");
        }
      }
    } catch (error: any) {
      console.error("Share error:", error);
      Alert.alert("Błąd", "Nie udało się wygenerować grafiki");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCaption = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const caption = generateCaption();
    
    try {
      await Share.share({
        message: caption,
      });
    } catch (error) {
      console.error("Copy error:", error);
    }
  };

  // Render pattern overlay for templates with patterns
  const renderPatternOverlay = () => {
    const currentStyle = TEMPLATE_STYLES.find(s => s.id === selectedStyle);
    if (!currentStyle?.pattern || currentStyle.pattern === "none") return null;

    const patternColor = currentStyle.colors.secondary || currentStyle.colors.accent;
    
    if (currentStyle.pattern === "stripes") {
      return (
        <View style={styles.patternOverlay} pointerEvents="none">
          {[...Array(8)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.stripe,
                {
                  backgroundColor: patternColor + "15",
                  top: i * 50,
                  transform: [{ rotate: "-45deg" }],
                },
              ]}
            />
          ))}
        </View>
      );
    }

    if (currentStyle.pattern === "diagonal") {
      return (
        <View style={styles.patternOverlay} pointerEvents="none">
          <View
            style={[
              styles.diagonalStripe,
              { backgroundColor: patternColor + "20" },
            ]}
          />
          <View
            style={[
              styles.diagonalStripe2,
              { backgroundColor: currentStyle.colors.accent + "15" },
            ]}
          />
        </View>
      );
    }

    return null;
  };

  const renderTemplate = () => {
    const bgColor = style.colors.bg;
    const accentColor = style.colors.accent;
    const textColor = style.colors.text;
    const secondaryColor = style.colors.secondary || "#94a3b8";
    const secondaryText = selectedStyle === "minimal" || selectedStyle === "bold" ? "#64748b" : "#94a3b8";

    // Special styling for neon template
    const isNeon = selectedStyle === "neon";
    const isElegant = selectedStyle === "elegant";
    const isSport = selectedStyle === "sport";

    return (
      <View style={[styles.templateContainer, { backgroundColor: bgColor }]}>
        {/* Pattern overlay */}
        {renderPatternOverlay()}
        
        {/* Neon glow effect */}
        {isNeon && (
          <View style={[styles.neonGlow, { shadowColor: accentColor }]} />
        )}
        
        {/* Elegant gold border */}
        {isElegant && (
          <View style={[styles.elegantBorder, { borderColor: accentColor }]} />
        )}
        {/* Header with SKM Logo */}
        <View style={styles.templateHeader}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.skmLogo}
              contentFit="contain"
            />
          </View>
          <View style={styles.headerTextContainer}>
            <ThemedText style={[styles.clubNameText, { color: accentColor }]}>
              {matchData.clubName}
            </ThemedText>
            <ThemedText style={[styles.appBranding, { color: secondaryText }]}>
              Small Club Manager
            </ThemedText>
          </View>
        </View>

        {/* Content based on type */}
        {type === "result" && (
          <View style={styles.resultContent}>
            <ThemedText style={[styles.resultEmoji, { color: textColor }]}>
              {getResultEmoji()}
            </ThemedText>
            <ThemedText style={[styles.resultTitle, { color: textColor }]}>
              {getResultText()}!
            </ThemedText>
            
            <View style={styles.scoreSection}>
              <View style={styles.teamColumn}>
                <View style={[styles.teamBadge, { backgroundColor: accentColor + "20" }]}>
                  <ThemedText style={[styles.teamInitial, { color: accentColor }]}>
                    {getHomeTeam().charAt(0)}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.teamNameSmall, { color: textColor }]} numberOfLines={2}>
                  {getHomeTeam()}
                </ThemedText>
              </View>
              
              <View style={styles.scoreBox}>
                <ThemedText style={[styles.scoreText, { color: textColor }]}>
                  {getHomeScore()} : {getAwayScore()}
                </ThemedText>
              </View>
              
              <View style={styles.teamColumn}>
                <View style={[styles.teamBadge, { backgroundColor: secondaryText + "20" }]}>
                  <ThemedText style={[styles.teamInitial, { color: secondaryText }]}>
                    {getAwayTeam().charAt(0)}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.teamNameSmall, { color: textColor }]} numberOfLines={2}>
                  {getAwayTeam()}
                </ThemedText>
              </View>
            </View>

            {matchData.scorers && matchData.scorers.length > 0 && (
              <View style={styles.scorersSection}>
                <ThemedText style={[styles.scorersTitle, { color: accentColor }]}>
                  ⚽ Strzelcy
                </ThemedText>
                {matchData.scorers.slice(0, 3).map((scorer, index) => (
                  <ThemedText key={index} style={[styles.scorerName, { color: textColor }]}>
                    {scorer.name}{scorer.goals > 1 ? ` (${scorer.goals})` : ""}
                  </ThemedText>
                ))}
              </View>
            )}
          </View>
        )}

        {type === "preview" && (
          <View style={styles.previewContent}>
            <ThemedText style={[styles.previewTitle, { color: textColor }]}>
              📅 NADCHODZĄCY MECZ
            </ThemedText>
            
            <View style={styles.matchupSection}>
              <ThemedText style={[styles.vsText, { color: accentColor }]}>
                {matchData.clubName}
              </ThemedText>
              <ThemedText style={[styles.vsLabel, { color: secondaryText }]}>vs</ThemedText>
              <ThemedText style={[styles.vsText, { color: textColor }]}>
                {matchData.opponent}
              </ThemedText>
            </View>

            <View style={styles.matchDetails}>
              <View style={styles.detailRow}>
                <MaterialIcons name="event" size={20} color={accentColor} />
                <ThemedText style={[styles.detailText, { color: textColor }]}>
                  {formatDate(matchData.matchDate)}
                </ThemedText>
              </View>
              {matchData.matchTime && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="schedule" size={20} color={accentColor} />
                  <ThemedText style={[styles.detailText, { color: textColor }]}>
                    {matchData.matchTime}
                  </ThemedText>
                </View>
              )}
              {matchData.location && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="place" size={20} color={accentColor} />
                  <ThemedText style={[styles.detailText, { color: textColor }]}>
                    {matchData.location}
                  </ThemedText>
                </View>
              )}
            </View>

            <ThemedText style={[styles.inviteText, { color: accentColor }]}>
              Zapraszamy kibiców! 💪
            </ThemedText>
          </View>
        )}

        {type === "stats" && (
          <View style={styles.statsContent}>
            <ThemedText style={[styles.statsTitle, { color: textColor }]}>
              📊 STATYSTYKI MECZU
            </ThemedText>
            
            <View style={styles.statsMatchup}>
              <ThemedText style={[styles.statsTeams, { color: textColor }]}>
                {matchData.clubName} vs {matchData.opponent}
              </ThemedText>
              <ThemedText style={[styles.statsScore, { color: accentColor }]}>
                {matchData.goalsScored} : {matchData.goalsConceded}
              </ThemedText>
            </View>

            {matchData.stats && (
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: accentColor }]}>
                    {matchData.stats.totalGoals}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: secondaryText }]}>
                    Bramki
                  </ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: accentColor }]}>
                    {matchData.stats.totalAssists}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: secondaryText }]}>
                    Asysty
                  </ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: accentColor }]}>
                    {matchData.stats.yellowCards}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: secondaryText }]}>
                    Żółte
                  </ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: accentColor }]}>
                    {matchData.stats.saves}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: secondaryText }]}>
                    Obrony
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={[styles.templateFooter, { borderTopColor: secondaryText + "30" }]}>
          <ThemedText style={[styles.hashtags, { color: accentColor }]}>
            #{matchData.clubName.replace(/\s+/g, "")} #piłkanożna
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </Pressable>
            <ThemedText style={styles.modalTitle}>Udostępnij na social media</ThemedText>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Template Preview */}
            <View style={styles.previewSection}>
              <ThemedText style={styles.sectionLabel}>Podgląd</ThemedText>
              {Platform.OS !== "web" && ViewShot ? (
              <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
                {renderTemplate()}
              </ViewShot>
            ) : (
              <View ref={viewShotRef}>
                {renderTemplate()}
              </View>
            )}
            </View>

            {/* Style Selection */}
            <View style={styles.styleSection}>
              <ThemedText style={styles.sectionLabel}>Styl szablonu</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.styleOptions}>
                  {allTemplates.map((s) => (
                    <Pressable
                      key={s.id}
                      style={[
                        styles.styleOption,
                        { backgroundColor: s.colors.bg, borderColor: s.colors.accent },
                        selectedStyle === s.id && styles.styleOptionSelected,
                        s.id === "club" && styles.clubStyleOption,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedStyle(s.id);
                      }}
                    >
                      {s.id === "club" && (
                        <MaterialIcons name="star" size={12} color={s.colors.accent} style={{ position: "absolute", top: 4, right: 4 }} />
                      )}
                      <View style={[styles.stylePreview, { backgroundColor: s.colors.accent }]} />
                      <ThemedText style={[styles.styleName, { color: s.colors.text }]}>
                        {s.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Platform Selection */}
            <View style={styles.platformSection}>
              <ThemedText style={styles.sectionLabel}>Platforma</ThemedText>
              <View style={styles.platformOptions}>
                <Pressable
                  style={[
                    styles.platformOption,
                    selectedPlatform === "facebook" && styles.platformOptionSelected,
                  ]}
                  onPress={() => setSelectedPlatform("facebook")}
                >
                  <MaterialIcons 
                    name="facebook" 
                    size={24} 
                    color={selectedPlatform === "facebook" ? "#1877F2" : "#64748b"} 
                  />
                  <ThemedText style={styles.platformName}>Facebook</ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.platformOption,
                    selectedPlatform === "instagram" && styles.platformOptionSelected,
                  ]}
                  onPress={() => setSelectedPlatform("instagram")}
                >
                  <MaterialIcons 
                    name="photo-camera" 
                    size={24} 
                    color={selectedPlatform === "instagram" ? "#E4405F" : "#64748b"} 
                  />
                  <ThemedText style={styles.platformName}>Instagram</ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.platformOption,
                    selectedPlatform === "both" && styles.platformOptionSelected,
                  ]}
                  onPress={() => setSelectedPlatform("both")}
                >
                  <MaterialIcons 
                    name="share" 
                    size={24} 
                    color={selectedPlatform === "both" ? AppColors.primary : "#64748b"} 
                  />
                  <ThemedText style={styles.platformName}>Oba</ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.actionButton, styles.copyButton]}
                onPress={handleCopyCaption}
              >
                <MaterialIcons name="content-copy" size={20} color="#fff" />
                <ThemedText style={styles.actionButtonText}>Kopiuj opis</ThemedText>
              </Pressable>
              
              <Pressable
                style={[styles.actionButton, styles.shareButton]}
                onPress={handleShare}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="share" size={20} color="#fff" />
                    <ThemedText style={styles.actionButtonText}>Udostępnij</ThemedText>
                  </>
                )}
              </Pressable>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: AppColors.bgDark,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  modalScroll: {
    padding: Spacing.lg,
  },
  previewSection: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  templateContainer: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    aspectRatio: 1,
  },
  templateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    overflow: "hidden",
    marginRight: Spacing.md,
  },
  skmLogo: {
    width: 48,
    height: 48,
  },
  headerTextContainer: {
    flex: 1,
  },
  clubNameText: {
    fontSize: 18,
    fontWeight: "700",
  },
  appBranding: {
    fontSize: 12,
  },
  resultContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  resultEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: Spacing.lg,
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: Spacing.lg,
  },
  teamColumn: {
    flex: 1,
    alignItems: "center",
  },
  teamBadge: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  teamInitial: {
    fontSize: 24,
    fontWeight: "700",
  },
  teamNameSmall: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  scoreBox: {
    paddingHorizontal: Spacing.lg,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: "800",
  },
  scorersSection: {
    alignItems: "center",
  },
  scorersTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  scorerName: {
    fontSize: 14,
  },
  previewContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  matchupSection: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  vsText: {
    fontSize: 20,
    fontWeight: "700",
  },
  vsLabel: {
    fontSize: 14,
    marginVertical: Spacing.xs,
  },
  matchDetails: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  detailText: {
    fontSize: 14,
    marginLeft: Spacing.sm,
  },
  inviteText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statsContent: {
    flex: 1,
    alignItems: "center",
  },
  statsTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  statsMatchup: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  statsTeams: {
    fontSize: 16,
    fontWeight: "600",
  },
  statsScore: {
    fontSize: 32,
    fontWeight: "800",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  statItem: {
    alignItems: "center",
    width: 80,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
  },
  templateFooter: {
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    marginTop: "auto",
  },
  hashtags: {
    fontSize: 12,
  },
  styleSection: {
    marginBottom: Spacing.xl,
  },
  styleOptions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  styleOption: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    borderWidth: 2,
    padding: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  styleOptionSelected: {
    borderWidth: 3,
  },
  clubStyleOption: {
    borderStyle: "dashed",
  },
  stylePreview: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xs,
  },
  styleName: {
    fontSize: 10,
    fontWeight: "600",
  },
  platformSection: {
    marginBottom: Spacing.xl,
  },
  platformOptions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  platformOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  platformOptionSelected: {
    borderColor: AppColors.primary,
  },
  platformName: {
    fontSize: 14,
    color: "#fff",
    marginLeft: Spacing.sm,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  copyButton: {
    backgroundColor: "#334155",
  },
  shareButton: {
    backgroundColor: AppColors.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  // Pattern overlay styles
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  stripe: {
    position: "absolute",
    width: 500,
    height: 20,
    left: -100,
  },
  diagonalStripe: {
    position: "absolute",
    width: 200,
    height: 400,
    right: -50,
    top: -50,
    transform: [{ rotate: "30deg" }],
  },
  diagonalStripe2: {
    position: "absolute",
    width: 150,
    height: 300,
    left: -30,
    bottom: -30,
    transform: [{ rotate: "30deg" }],
  },
  neonGlow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: Radius.lg - 4,
    borderWidth: 2,
    borderColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  elegantBorder: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: Radius.lg - 4,
    borderWidth: 2,
  },
});
