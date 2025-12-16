import { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

export default function AdminSecurityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [setupData, setSetupData] = useState<{ secret: string; backupCodes: string[]; qrUrl: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  
  const { data: status, isLoading, refetch } = trpc.masterAdmin.get2FAStatus.useQuery();
  const setup2FA = trpc.masterAdmin.setup2FA.useMutation({
    onSuccess: (data) => {
      setSetupData(data);
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });
  
  const verify2FA = trpc.masterAdmin.verify2FA.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        Alert.alert("Sukces", "2FA zostało aktywowane!");
        setSetupData(null);
        setVerificationCode("");
        refetch();
      } else {
        Alert.alert("Błąd", "Nieprawidłowy kod weryfikacyjny");
      }
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });
  
  const disable2FA = trpc.masterAdmin.disable2FA.useMutation({
    onSuccess: () => {
      Alert.alert("Sukces", "2FA zostało wyłączone");
      setDisableCode("");
      refetch();
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });
  
  const regenerateBackupCodes = trpc.masterAdmin.regenerateBackupCodes.useMutation({
    onSuccess: (data) => {
      Alert.alert(
        "Nowe kody zapasowe",
        data.backupCodes.join("\n"),
        [{ text: "OK", onPress: () => refetch() }]
      );
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });
  
  const handleSetup = () => {
    setup2FA.mutate();
  };
  
  const handleVerify = () => {
    if (verificationCode.length !== 6) {
      Alert.alert("Błąd", "Kod musi mieć 6 cyfr");
      return;
    }
    verify2FA.mutate({ code: verificationCode });
  };
  
  const handleDisable = () => {
    if (!disableCode) {
      Alert.alert("Błąd", "Wprowadź kod 2FA lub kod zapasowy");
      return;
    }
    Alert.alert(
      "Potwierdź wyłączenie 2FA",
      "Czy na pewno chcesz wyłączyć dwuskładnikowe uwierzytelnianie?",
      [
        { text: "Anuluj", style: "cancel" },
        { text: "Wyłącz", style: "destructive", onPress: () => disable2FA.mutate({ code: disableCode }) },
      ]
    );
  };
  
  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.dark.tint} />
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </Pressable>
        <ThemedText type="title" style={styles.title}>Bezpieczeństwo</ThemedText>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Dwuskładnikowe uwierzytelnianie (2FA)
          </ThemedText>
          
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Ionicons 
                name={status?.isEnabled ? "shield-checkmark" : "shield-outline"} 
                size={32} 
                color={status?.isEnabled ? "#22c55e" : "#6b7280"} 
              />
              <View style={styles.statusInfo}>
                <ThemedText type="defaultSemiBold">
                  {status?.isEnabled ? "Aktywne" : "Nieaktywne"}
                </ThemedText>
                <ThemedText style={styles.statusDescription}>
                  {status?.isEnabled 
                    ? `Pozostało ${status.backupCodesCount} kodów zapasowych`
                    : "Włącz 2FA dla dodatkowej ochrony konta"
                  }
                </ThemedText>
              </View>
            </View>
          </View>
          
          {!status?.isEnabled && !setupData && (
            <Pressable 
              style={styles.primaryButton} 
              onPress={handleSetup}
              disabled={setup2FA.isPending}
            >
              {setup2FA.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="key" size={20} color="#fff" />
                  <ThemedText style={styles.buttonText}>Włącz 2FA</ThemedText>
                </>
              )}
            </Pressable>
          )}
          
          {setupData && (
            <View style={styles.setupCard}>
              <ThemedText type="defaultSemiBold" style={styles.setupTitle}>
                Konfiguracja 2FA
              </ThemedText>
              
              <ThemedText style={styles.setupStep}>
                1. Zeskanuj kod QR w aplikacji Google Authenticator lub Authy
              </ThemedText>
              
              <View style={styles.qrPlaceholder}>
                <ThemedText style={styles.qrText}>
                  Otwórz link w przeglądarce:
                </ThemedText>
                <ThemedText style={styles.secretText} selectable>
                  {setupData.qrUrl}
                </ThemedText>
              </View>
              
              <ThemedText style={styles.setupStep}>
                Lub wprowadź ręcznie klucz:
              </ThemedText>
              <ThemedText style={styles.secretKey} selectable>
                {setupData.secret}
              </ThemedText>
              
              <ThemedText style={styles.setupStep}>
                2. Wprowadź 6-cyfrowy kod z aplikacji:
              </ThemedText>
              
              <TextInput
                style={styles.codeInput}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="000000"
                placeholderTextColor="#6b7280"
                keyboardType="number-pad"
                maxLength={6}
              />
              
              <Pressable 
                style={[styles.primaryButton, verificationCode.length !== 6 && styles.buttonDisabled]} 
                onPress={handleVerify}
                disabled={verify2FA.isPending || verificationCode.length !== 6}
              >
                {verify2FA.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>Zweryfikuj i aktywuj</ThemedText>
                )}
              </Pressable>
              
              <Pressable 
                style={styles.secondaryButton} 
                onPress={() => setShowBackupCodes(!showBackupCodes)}
              >
                <ThemedText style={styles.secondaryButtonText}>
                  {showBackupCodes ? "Ukryj kody zapasowe" : "Pokaż kody zapasowe"}
                </ThemedText>
              </Pressable>
              
              {showBackupCodes && (
                <View style={styles.backupCodesCard}>
                  <ThemedText style={styles.backupCodesTitle}>
                    Kody zapasowe (zapisz w bezpiecznym miejscu):
                  </ThemedText>
                  {setupData.backupCodes.map((code, index) => (
                    <ThemedText key={index} style={styles.backupCode} selectable>
                      {code}
                    </ThemedText>
                  ))}
                </View>
              )}
            </View>
          )}
          
          {status?.isEnabled && (
            <View style={styles.disableSection}>
              <ThemedText type="defaultSemiBold" style={styles.disableTitle}>
                Wyłącz 2FA
              </ThemedText>
              <ThemedText style={styles.disableDescription}>
                Wprowadź kod z aplikacji lub kod zapasowy:
              </ThemedText>
              
              <TextInput
                style={styles.codeInput}
                value={disableCode}
                onChangeText={setDisableCode}
                placeholder="Kod 2FA lub zapasowy"
                placeholderTextColor="#6b7280"
              />
              
              <Pressable 
                style={styles.dangerButton} 
                onPress={handleDisable}
                disabled={disable2FA.isPending}
              >
                {disable2FA.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>Wyłącz 2FA</ThemedText>
                )}
              </Pressable>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Dziennik aktywności
          </ThemedText>
          
          <Pressable 
            style={styles.menuItem}
            onPress={() => router.push("/admin/audit-logs" as any)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="list" size={24} color={Colors.dark.tint} />
              <ThemedText style={styles.menuItemText}>Przeglądaj logi audytu</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </Pressable>
        </View>
        
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </ThemedView>
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
    borderBottomColor: "#1f1f1f",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    color: "#22c55e",
  },
  statusCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusDescription: {
    color: "#9ca3af",
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  setupCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  setupTitle: {
    marginBottom: 16,
    textAlign: "center",
  },
  setupStep: {
    color: "#9ca3af",
    marginVertical: 8,
  },
  qrPlaceholder: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  qrText: {
    color: "#9ca3af",
    marginBottom: 8,
  },
  secretText: {
    color: "#22c55e",
    fontSize: 12,
    fontFamily: "monospace",
  },
  secretKey: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 12,
    color: "#22c55e",
    fontFamily: "monospace",
    textAlign: "center",
    marginVertical: 8,
  },
  codeInput: {
    backgroundColor: "#0a0a0a",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 8,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  secondaryButton: {
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#22c55e",
  },
  backupCodesCard: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  backupCodesTitle: {
    color: "#9ca3af",
    marginBottom: 12,
    fontSize: 14,
  },
  backupCode: {
    fontFamily: "monospace",
    color: "#fff",
    padding: 4,
  },
  disableSection: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  disableTitle: {
    color: "#ef4444",
    marginBottom: 8,
  },
  disableDescription: {
    color: "#9ca3af",
    marginBottom: 8,
  },
  dangerButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  menuItem: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
});
