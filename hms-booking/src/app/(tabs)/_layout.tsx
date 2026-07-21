import { Redirect, Stack } from "expo-router";
import { useSession } from "@/lib/auth-client";
import AppTabs from "@/components/app-tabs";

export default function TabsLayout() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <AppTabs />;
}
