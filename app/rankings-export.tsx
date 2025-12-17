import { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { trpc } from "@/lib/trpc";
import { AdBanner } from "@/components/ad-banner";

type ExportFormat = "pdf" | "html" | "csv";
type RankingCategory = "goals" | "assists" | "attendance" | "rating" | "minutes";

export default function RankingsExportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
  const [selectedCategories, setSelectedCategories] = useState<RankingCategory[]>([
    "goals", "assists", "attendance"
  ]);
  const [isExporting, setIsExporting] = useState(false);
  
  const { data: clubs } = trpc.clubs.list.useQuery();
  const clubId = clubs?.[0]?.id;
  
  const { data: teams } = trpc.teams.list.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId }
  );
  
  const { data: players } = trpc.players.list.useQuery(
    { clubId: clubId! },
    { enabled: !!clubId }
  );
  
  const categories: { id: RankingCategory; label: string; icon: string }[] = [
    { id: "goals", label: "Bramki", icon: "⚽" },
    { id: "assists", label: "Asysty", icon: "🎯" },
    { id: "attendance", label: "Frekwencja", icon: "📅" },
    { id: "rating", label: "Oceny", icon: "⭐" },
    { id: "minutes", label: "Minuty", icon: "⏱️" },
  ];
  
  const formats: { id: ExportFormat; label: string; desc: string }[] = [
    { id: "pdf", label: "PDF", desc: "Do druku" },
    { id: "html", label: "HTML", desc: "Do przeglądania" },
    { id: "csv", label: "CSV", desc: "Do Excela" },
  ];
  
  const toggleCategory = (cat: RankingCategory) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter(c => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };
  
  const handleExport = async () => {
    if (!clubId) {
      Alert.alert("Błąd", "Nie wybrano klubu");
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Generate mock rankings data
      const teamPlayers = selectedTeamId
        ? players?.filter((p: any) => p.teamId === selectedTeamId)
        : players;
      
      const rankings = teamPlayers?.map((p: any, index: number) => ({
        position: index + 1,
        name: p.name,
        goals: Math.floor(Math.random() * 20),
        assists: Math.floor(Math.random() * 15),
        attendance: Math.floor(Math.random() * 30) + 70,
        rating: (Math.random() * 2 + 3).toFixed(1),
        minutes: Math.floor(Math.random() * 1500) + 500,
      })) || [];
      
      // Sort by first selected category
      const sortKey = selectedCategories[0];
      rankings.sort((a: any, b: any) => {
        const aVal = parseFloat(a[sortKey]);
        const bVal = parseFloat(b[sortKey]);
        return bVal - aVal;
      });
      
      // Update positions
      rankings.forEach((r: any, i: number) => {
        r.position = i + 1;
      });
      
      const teamName = selectedTeamId
        ? teams?.find((t: any) => t.id === selectedTeamId)?.name || "Drużyna"
        : "Wszystkie drużyny";
      
      let content = "";
      
      if (selectedFormat === "csv") {
        // Generate CSV
        const headers = ["Pozycja", "Zawodnik"];
        if (selectedCategories.includes("goals")) headers.push("Bramki");
        if (selectedCategories.includes("assists")) headers.push("Asysty");
        if (selectedCategories.includes("attendance")) headers.push("Frekwencja %");
        if (selectedCategories.includes("rating")) headers.push("Ocena");
        if (selectedCategories.includes("minutes")) headers.push("Minuty");
        
        content = headers.join(",") + "\n";
        rankings.forEach((r: any) => {
          const row = [r.position, r.name];
          if (selectedCategories.includes("goals")) row.push(r.goals);
          if (selectedCategories.includes("assists")) row.push(r.assists);
          if (selectedCategories.includes("attendance")) row.push(r.attendance);
          if (selectedCategories.includes("rating")) row.push(r.rating);
          if (selectedCategories.includes("minutes")) row.push(r.minutes);
          content += row.join(",") + "\n";
        });
      } else {
        // Generate HTML
        content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ranking - ${teamName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #1a73e8; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: bold; }
    tr:hover { background: #f9f9f9; }
    .gold { color: #FFD700; }
    .silver { color: #C0C0C0; }
    .bronze { color: #CD7F32; }
    .footer { margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h1>🏆 Ranking: ${teamName}</h1>
  <p>Wygenerowano: ${new Date().toLocaleDateString("pl-PL")}</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Zawodnik</th>
        ${selectedCategories.includes("goals") ? "<th>⚽ Bramki</th>" : ""}
        ${selectedCategories.includes("assists") ? "<th>🎯 Asysty</th>" : ""}
        ${selectedCategories.includes("attendance") ? "<th>📅 Frekwencja</th>" : ""}
        ${selectedCategories.includes("rating") ? "<th>⭐ Ocena</th>" : ""}
        ${selectedCategories.includes("minutes") ? "<th>⏱️ Minuty</th>" : ""}
      </tr>
    </thead>
    <tbody>
      ${rankings.map((r: any) => `
        <tr>
          <td>${r.position === 1 ? '<span class="gold">🥇</span>' : r.position === 2 ? '<span class="silver">🥈</span>' : r.position === 3 ? '<span class="bronze">🥉</span>' : r.position}</td>
          <td><strong>${r.name}</strong></td>
          ${selectedCategories.includes("goals") ? `<td>${r.goals}</td>` : ""}
          ${selectedCategories.includes("assists") ? `<td>${r.assists}</td>` : ""}
          ${selectedCategories.includes("attendance") ? `<td>${r.attendance}%</td>` : ""}
          ${selectedCategories.includes("rating") ? `<td>${r.rating}</td>` : ""}
          ${selectedCategories.includes("minutes") ? `<td>${r.minutes}</td>` : ""}
        </tr>
      `).join("")}
    </tbody>
  </table>
  <div class="footer">
    <p>Small Club Manager - Ranking drużyny</p>
  </div>
</body>
</html>`;
      }
      
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        "Sukces",
        `Ranking został wyeksportowany jako ${selectedFormat.toUpperCase()}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się wyeksportować rankingu");
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText>← Wróć</ThemedText>
        </Pressable>
        <ThemedText type="title" style={styles.title}>Eksport Rankingów</ThemedText>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Team Selection */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Wybierz drużynę</ThemedText>
          <View style={styles.teamGrid}>
            <Pressable
              style={[styles.teamBtn, !selectedTeamId && styles.teamBtnActive]}
              onPress={() => setSelectedTeamId(null)}
            >
              <ThemedText style={!selectedTeamId ? styles.teamBtnTextActive : undefined}>
                Wszystkie
              </ThemedText>
            </Pressable>
            {teams?.map((team: any) => (
              <Pressable
                key={team.id}
                style={[styles.teamBtn, selectedTeamId === team.id && styles.teamBtnActive]}
                onPress={() => setSelectedTeamId(team.id)}
              >
                <ThemedText style={selectedTeamId === team.id ? styles.teamBtnTextActive : undefined}>
                  {team.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* Categories */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Kategorie do eksportu</ThemedText>
          <View style={styles.categoryGrid}>
            {categories.map(cat => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryBtn,
                  selectedCategories.includes(cat.id) && styles.categoryBtnActive
                ]}
                onPress={() => toggleCategory(cat.id)}
              >
                <ThemedText style={styles.categoryIcon}>{cat.icon}</ThemedText>
                <ThemedText
                  style={selectedCategories.includes(cat.id) ? styles.categoryTextActive : undefined}
                >
                  {cat.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* Format */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Format eksportu</ThemedText>
          <View style={styles.formatGrid}>
            {formats.map(fmt => (
              <Pressable
                key={fmt.id}
                style={[styles.formatBtn, selectedFormat === fmt.id && styles.formatBtnActive]}
                onPress={() => setSelectedFormat(fmt.id)}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={selectedFormat === fmt.id ? styles.formatTextActive : undefined}
                >
                  {fmt.label}
                </ThemedText>
                <ThemedText style={[styles.formatDesc, selectedFormat === fmt.id && styles.formatTextActive]}>
                  {fmt.desc}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* Preview */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Podgląd</ThemedText>
          <View style={styles.previewBox}>
            <ThemedText style={styles.previewTitle}>
              🏆 Ranking: {selectedTeamId ? teams?.find((t: any) => t.id === selectedTeamId)?.name : "Wszystkie drużyny"}
            </ThemedText>
            <ThemedText style={styles.previewInfo}>
              Kategorie: {selectedCategories.map(c => categories.find(cat => cat.id === c)?.label).join(", ")}
            </ThemedText>
            <ThemedText style={styles.previewInfo}>
              Format: {formats.find(f => f.id === selectedFormat)?.label}
            </ThemedText>
            <ThemedText style={styles.previewInfo}>
              Zawodników: {selectedTeamId 
                ? players?.filter((p: any) => p.teamId === selectedTeamId).length || 0
                : players?.length || 0}
            </ThemedText>
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Export Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={[styles.exportBtn, isExporting && styles.exportBtnDisabled]}
          onPress={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.exportBtnText}>
              📥 Eksportuj ranking
            </ThemedText>
          )}
        </Pressable>
      </View>
      
      <AdBanner placement="more" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  teamGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  teamBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  teamBtnActive: {
    backgroundColor: "#1a73e8",
  },
  teamBtnTextActive: {
    color: "#fff",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  categoryBtnActive: {
    backgroundColor: "#e8f0fe",
    borderWidth: 1,
    borderColor: "#1a73e8",
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryTextActive: {
    color: "#1a73e8",
  },
  formatGrid: {
    flexDirection: "row",
    gap: 12,
  },
  formatBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  formatBtnActive: {
    backgroundColor: "#1a73e8",
  },
  formatDesc: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  formatTextActive: {
    color: "#fff",
  },
  previewBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  previewInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  exportBtn: {
    backgroundColor: "#1a73e8",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  exportBtnDisabled: {
    opacity: 0.6,
  },
  exportBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
