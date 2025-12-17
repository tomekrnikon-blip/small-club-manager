import { Alert } from "react-native";
import { useAuth } from "./use-auth";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOGOUT_ANIMATION_KEY = "show_logout_animation";

export function useLogoutConfirm() {
  const { logout } = useAuth();
  const router = useRouter();

  const confirmLogout = () => {
    Alert.alert(
      "Wylogowanie",
      "Czy na pewno chcesz się wylogować?",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Wyloguj",
          style: "destructive",
          onPress: async () => {
            // Set flag to show farewell screen
            await AsyncStorage.setItem(LOGOUT_ANIMATION_KEY, "true");
            // Navigate to farewell screen first
            router.replace("/farewell" as any);
          },
        },
      ]
    );
  };

  return { confirmLogout };
}
