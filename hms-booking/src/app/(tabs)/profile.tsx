import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getSession, signOut } from "@/lib/auth-client";
import { useLanguage } from "@/lib/language-context";
import { BottomTabInset, Spacing } from "@/constants/theme";

const LANGUAGES = [
  { code: "en" as const, label: "English", flag: "🇺🇸" },
  { code: "mm" as const, label: "Myanmar", flag: "🇲🇲" },
];

export default function ProfileScreen() {
  const [session, setSession] = useState<any>(null);
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  async function handleSignOut() {
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch {
      Alert.alert(t("error"), t("failedToSignOut"));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(session?.user?.name || "U").charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* User Info */}
        <Text style={styles.name}>{session?.user?.name || "User"}</Text>
        <Text style={styles.email}>{session?.user?.email}</Text>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("language")}</Text>
          <View style={styles.tabContainer}>
            {LANGUAGES.map((lang) => {
              const isActive = language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>{t("logOut")}</Text>
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
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.six,
    paddingBottom: BottomTabInset + Spacing.three,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#208AEF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginTop: Spacing.three,
  },
  email: {
    fontSize: 15,
    color: "#666",
    marginTop: Spacing.half,
  },
  section: {
    width: "100%",
    marginTop: Spacing.five,
    height: 90,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
  tabContainer: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#f0f0f3",
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#666",
  },
  tabTextActive: {
    fontWeight: "600",
    color: "#000",
  },
  logoutButton: {
    position: "absolute",
    bottom: BottomTabInset + Spacing.three,
    left: Spacing.five,
    right: Spacing.five,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ff4444",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#ff4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
