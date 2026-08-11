import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { getSession } from "@/lib/auth-client";

export default function CallbackScreen() {
  const router = useRouter();
  const retryCount = useRef(0);
  const maxRetries = 5;

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          router.replace("/(tabs)");
          return;
        }

        if (retryCount.current < maxRetries) {
          retryCount.current += 1;
          setTimeout(checkSession, 500);
        } else {
          router.replace("/(auth)/sign-in");
        }
      } catch (error) {
        console.error("Session check failed:", error);
        if (retryCount.current < maxRetries) {
          retryCount.current += 1;
          setTimeout(checkSession, 500);
        } else {
          router.replace("/(auth)/sign-in");
        }
      }
    };

    checkSession();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#208AEF" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
});
