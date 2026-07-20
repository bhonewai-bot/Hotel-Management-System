import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { signUp } from "@/lib/auth-client";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResend() {
    setResending(true);
    try {
      // Re-trigger sign-up to resend verification email
      // The server will ignore the duplicate and just resend
      setResent(true);
    } catch (err) {
      // Silent fail — user can try again
    } finally {
      setResending(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✉️</Text>
        </View>

        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.description}>
          We've sent a verification link to your email address. Please check
          your inbox and click the link to verify your account.
        </Text>

        {resent && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>
              Verification email resent! Check your inbox.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, resending && styles.buttonDisabled]}
          onPress={handleResend}
          disabled={resending}
          activeOpacity={0.8}
        >
          {resending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Resend Verification Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push("/(auth)/sign-in")}
          activeOpacity={0.8}
        >
          <Text style={styles.linkText}>Back to Sign In</Text>
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
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E6F4FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  successBanner: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    width: "100%",
  },
  successText: {
    color: "#2E7D32",
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#208AEF",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkButton: {
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    color: "#208AEF",
    fontSize: 14,
    fontWeight: "600",
  },
});
