import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";

export default function BackupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clubId } = useLocalSearchParams<{ clubId: string }>();
  const { t } = useTranslation();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackup, setLastBackup] = useState<{ date: string; size: string } | null>(null);

  const createBackupMutation = trpc.backup.create.useMutation();
  const restoreBackupMutation = trpc.backup.restore.useMutation();
  const utils = trpc.useUtils();

  const handleCreateBackup = async () => {
    if (!clubId) return;
    
    setIsCreating(true);
    try {
      const result = await createBackupMutation.mutateAsync({ clubId: parseInt(clubId) });
      
      // Create JSON file
      const fileName = `backup_${result.backup.clubName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
      const fileContent = JSON.stringify(result.backup, null, 2);
      
      if (Platform.OS === "web") {
        // Web: Download file
        const blob = new Blob([fileContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Mobile: Save and share
        const filePath = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, fileContent);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath, {
            mimeType: "application/json",
            dialogTitle: t("backup.shareBackup"),
          });
        }
      }
      
      setLastBackup({
        date: new Date().toLocaleString("pl-PL"),
        size: result.sizeFormatted,
      });
      
      Alert.alert(
        t("backup.success"),
        t("backup.backupCreated", { size: result.sizeFormatted }),
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Backup error:", error);
      Alert.alert(t("backup.error"), t("backup.createFailed"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestoreBackup = async () => {
    Alert.alert(
      t("backup.restoreWarning"),
      t("backup.restoreWarningMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("backup.continue"),
          style: "destructive",
          onPress: pickAndRestoreFile,
        },
      ]
    );
  };

  const pickAndRestoreFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      
      if (result.canceled || !result.assets?.[0]) {
        return;
      }
      
      setIsRestoring(true);
      
      const file = result.assets[0];
      let fileContent: string;
      
      if (Platform.OS === "web") {
        // Web: Read file using fetch
        const response = await fetch(file.uri);
        fileContent = await response.text();
      } else {
        // Mobile: Read file using FileSystem
        fileContent = await FileSystem.readAsStringAsync(file.uri);
      }
      
      const backupData = JSON.parse(fileContent);
      
      const restoreResult = await restoreBackupMutation.mutateAsync({ data: backupData });
      
      // Invalidate clubs cache
      utils.clubs.list.invalidate();
      
      Alert.alert(
        t("backup.restoreSuccess"),
        t("backup.restoreSuccessMessage", {
          teams: restoreResult.stats.teams,
          players: restoreResult.stats.players,
          matches: restoreResult.stats.matches,
        }),
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)"),
          },
        ]
      );
    } catch (error) {
      console.error("Restore error:", error);
      Alert.alert(t("backup.error"), t("backup.restoreFailed"));
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("backup.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#22c55e" />
          <Text style={styles.infoText}>{t("backup.infoText")}</Text>
        </View>

        {/* Create Backup Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("backup.createBackup")}</Text>
          <Text style={styles.sectionDescription}>{t("backup.createDescription")}</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleCreateBackup}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-download-outline" size={24} color="#fff" />
                <Text style={styles.buttonText}>{t("backup.createButton")}</Text>
              </>
            )}
          </TouchableOpacity>

          {lastBackup && (
            <View style={styles.lastBackupInfo}>
              <Text style={styles.lastBackupLabel}>{t("backup.lastBackup")}</Text>
              <Text style={styles.lastBackupValue}>
                {lastBackup.date} ({lastBackup.size})
              </Text>
            </View>
          )}
        </View>

        {/* Restore Backup Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("backup.restoreBackup")}</Text>
          <Text style={styles.sectionDescription}>{t("backup.restoreDescription")}</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleRestoreBackup}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator color="#22c55e" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={24} color="#22c55e" />
                <Text style={[styles.buttonText, { color: "#22c55e" }]}>
                  {t("backup.restoreButton")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* What's Included */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("backup.whatsIncluded")}</Text>
          <View style={styles.includedList}>
            {[
              { icon: "people", label: t("backup.players") },
              { icon: "football", label: t("backup.matches") },
              { icon: "fitness", label: t("backup.trainings") },
              { icon: "cash", label: t("backup.finances") },
              { icon: "school", label: t("backup.academy") },
              { icon: "images", label: t("backup.photos") },
            ].map((item, index) => (
              <View key={index} style={styles.includedItem}>
                <Ionicons name={item.icon as any} size={20} color="#22c55e" />
                <Text style={styles.includedLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#a3a3a3",
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#737373",
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: "#22c55e",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#22c55e",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  lastBackupInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
  },
  lastBackupLabel: {
    fontSize: 12,
    color: "#737373",
    marginBottom: 4,
  },
  lastBackupValue: {
    fontSize: 14,
    color: "#fff",
  },
  includedList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  includedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1a1a1a",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  includedLabel: {
    fontSize: 14,
    color: "#d4d4d4",
  },
});
