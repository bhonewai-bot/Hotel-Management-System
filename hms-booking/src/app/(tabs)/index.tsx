import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "expo-router";
import { BottomTabInset, Spacing } from "@/constants/theme";

export default function HomeScreen() {
  const { data: session } = useSession();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/sign-in");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>HMS Hotel</Text>
        <Text style={styles.subtitle}>Welcome, {session?.user?.name || "Guest"}</Text>
        <Text style={styles.email}>{session?.user?.email}</Text>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: BottomTabInset,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#333",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
  },
  signOutButton: {
    backgroundColor: "#ff4444",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  signOutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
