// FILE: app/dashboard/guests/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { GuestTable } from "@/components/guests";
import { getGuests } from "@/lib/actions/guest";

export const metadata = {
  title: "Guest Management | HMS Admin",
  description: "Manage customer accounts from mobile app",
};

export default async function GuestsPage() {
  const hdrs = await headers();
  const session = await auth.api.getSession({
    headers: hdrs,
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true, role: true },
  });

  // RBAC: Only ADMIN and MANAGER can access guest management
  if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
    redirect("/dashboard");
  }

  // Fetch guests
  const guests = await getGuests();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <GuestTable guests={guests} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
