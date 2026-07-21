import { useSession } from "@/lib/auth-client";
import AppTabs from "@/components/app-tabs";

export default function TabsLayout() {
  const { data: session, isPending } = useSession();

  if (isPending || !session) {
    return null;
  }

  return <AppTabs />;
}
