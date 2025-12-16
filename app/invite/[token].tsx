import { useRouter, useLocalSearchParams } from "expo-router";
import { View, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { getRoleLabel } from "@/hooks/use-club-role";

export default function AcceptInvitationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token: string }>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: invitation, isLoading } = trpc.invitations.getByToken.useQuery(
    { token: params.token || "" },
    { enabled: !!params.token }
  );

  const acceptInvitation = trpc.invitations.accept.useMutation({
    onSuccess: (data) => {
      Alert.alert("Sukces", "Dołączyłeś do klubu!", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
    },
    onError: (error) => {
      Alert.alert("Błąd", error.message);
    },
  });

  const handleAccept = () => {
    if (!params.token) return;
    acceptInvitation.mutate({ token: params.token });
  };

  if (authLoading || isLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#22c55e" />
      </ThemedView>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Ionicons name="lock-closed-outline" size={64} color="#64748b" />
          <ThemedText type="subtitle" style={styles.title}>
            Zaloguj się
          </ThemedText>
          <ThemedText style={styles.description}>
            Musisz być zalogowany, aby zaakceptować zaproszenie do klubu.
          </ThemedText>
          <Pressable style={styles.button} onPress={() => router.push("/")}>
            <ThemedText style={styles.buttonText}>Przejdź do logowania</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  if (!invitation) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Ionicons name="close-circle-outline" size={64} color="#ef4444" />
          <ThemedText type="subtitle" style={styles.title}>
            Zaproszenie nie znalezione
          </ThemedText>
          <ThemedText style={styles.description}>
            To zaproszenie nie istnieje lub zostało anulowane.
          </ThemedText>
          <Pressable style={styles.button} onPress={() => router.replace("/")}>
            <ThemedText style={styles.buttonText}>Wróć do aplikacji</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  if (invitation.status !== "pending") {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Ionicons
            name={invitation.status === "accepted" ? "checkmark-circle-outline" : "close-circle-outline"}
            size={64}
            color={invitation.status === "accepted" ? "#22c55e" : "#ef4444"}
          />
          <ThemedText type="subtitle" style={styles.title}>
            {invitation.status === "accepted" ? "Zaproszenie zaakceptowane" : "Zaproszenie wygasło"}
          </ThemedText>
          <ThemedText style={styles.description}>
            {invitation.status === "accepted"
              ? "To zaproszenie zostało już zaakceptowane."
              : "To zaproszenie wygasło lub zostało anulowane."}
          </ThemedText>
          <Pressable style={styles.button} onPress={() => router.replace("/")}>
            <ThemedText style={styles.buttonText}>Wróć do aplikacji</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-open-outline" size={64} color="#22c55e" />
        </View>

        <ThemedText type="subtitle" style={styles.title}>
          Zaproszenie do klubu
        </ThemedText>

        <View style={styles.inviteCard}>
          <ThemedText style={styles.clubName}>{invitation.clubName}</ThemedText>
          <ThemedText style={styles.roleLabel}>Rola:</ThemedText>
          <ThemedText style={styles.roleName}>{getRoleLabel(invitation.role as any)}</ThemedText>
          <ThemedText style={styles.expiresText}>
            Wygasa: {new Date(invitation.expiresAt).toLocaleDateString("pl-PL")}
          </ThemedText>
        </View>

        <ThemedText style={styles.description}>
          Zostałeś zaproszony do dołączenia do klubu. Kliknij przycisk poniżej, aby zaakceptować zaproszenie.
        </ThemedText>

        <Pressable
          style={[styles.button, acceptInvitation.isPending && styles.buttonDisabled]}
          onPress={handleAccept}
          disabled={acceptInvitation.isPending}
        >
          {acceptInvitation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Dołącz do klubu</ThemedText>
          )}
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <ThemedText style={styles.cancelButtonText}>Anuluj</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 24,
    alignItems: "center",
    maxWidth: 400,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  inviteCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  clubName: {
    fontSize: 20,
    lineHeight: 28,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 12,
  },
  roleLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
  },
  roleName: {
    fontSize: 18,
    lineHeight: 24,
    color: "#22c55e",
    fontWeight: "600",
    marginBottom: 8,
  },
  expiresText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
    marginTop: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#fff",
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
  },
});
