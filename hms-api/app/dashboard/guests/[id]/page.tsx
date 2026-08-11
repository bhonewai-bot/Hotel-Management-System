// FILE: app/dashboard/guests/[id]/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
} from "@phosphor-icons/react";
import { getGuestDetails } from "@/lib/actions/guest";

export const metadata = {
  title: "Guest Details | HMS Admin",
  description: "View guest profile and booking history",
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: Decimal | number) {
  if (!amount) return "0 MMK";
  const num =
    typeof amount === "object" ? parseFloat(amount.toString()) : amount;
  return `${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MMK`;
}

// This is needed for Decimal type from Prisma
type Decimal = any;

export default async function GuestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const hdrs = await headers();
  const session = await auth.api.getSession({
    headers: hdrs,
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { role: true },
  });

  if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
    redirect("/dashboard");
  }

  const guest = await getGuestDetails(params.id);

  if (!guest) {
    redirect("/dashboard/guests");
  }

  const totalSpent = guest.profile?.totalSpent || 0;
  const totalStays = guest.profile?.totalStays || 0;

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
                {/* Back Button */}
                <Link href="/dashboard/guests">
                  <Button variant="ghost" size="sm" className="mb-4">
                    <ArrowLeftIcon className="mr-2 size-4" />
                    Back to Guests
                  </Button>
                </Link>

                {/* Guest Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">
                        {guest.firstName} {guest.lastName}
                      </h1>
                      <p className="text-muted-foreground mt-1">
                        Mobile app customer • Joined{" "}
                        {formatDate(guest.createdAt)}
                      </p>
                    </div>
                    <Badge
                      className="text-base"
                      variant={guest.user?.isActive ? "default" : "destructive"}
                    >
                      {guest.user?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Left Column: Guest Info */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Contact Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {guest.email && (
                          <div className="flex items-center gap-3">
                            <EnvelopeIcon className="size-4 text-muted-foreground" />
                            <a
                              href={`mailto:${guest.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {guest.email}
                            </a>
                          </div>
                        )}
                        {guest.phone && (
                          <div className="flex items-center gap-3">
                            <PhoneIcon className="size-4 text-muted-foreground" />
                            <a
                              href={`tel:${guest.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {guest.phone}
                            </a>
                          </div>
                        )}
                        {guest.address && (
                          <div className="flex items-start gap-3">
                            <MapPinIcon className="size-4 text-muted-foreground mt-0.5" />
                            <span>{guest.address}</span>
                          </div>
                        )}
                        {guest.dateOfBirth && (
                          <div className="flex items-center gap-3">
                            <CalendarIcon className="size-4 text-muted-foreground" />
                            <span>{formatDate(guest.dateOfBirth)}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Booking History */}
                    {guest.bookings && guest.bookings.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Booking History</CardTitle>
                          <CardDescription>
                            {guest.bookings.length} total bookings
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Booking #</TableHead>
                                  <TableHead>Check-in</TableHead>
                                  <TableHead>Check-out</TableHead>
                                  <TableHead>Rooms</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {guest.bookings.map((booking) => (
                                  <TableRow key={booking.id}>
                                    <TableCell className="font-mono text-sm">
                                      {booking.bookingNumber}
                                    </TableCell>
                                    <TableCell>
                                      {formatDate(booking.checkIn)}
                                    </TableCell>
                                    <TableCell>
                                      {formatDate(booking.checkOut)}
                                    </TableCell>
                                    <TableCell>
                                      {booking.rooms.length}
                                    </TableCell>
                                    <TableCell>
                                      {formatCurrency(booking.totalAmount)}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
                                        {booking.status}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* No Bookings */}
                    {(!guest.bookings || guest.bookings.length === 0) && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Booking History</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center py-8 text-muted-foreground">
                          No bookings yet.
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Right Column: Stats */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Total Stays
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">{totalStays}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Total Spent
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {formatCurrency(totalSpent)}
                        </p>
                      </CardContent>
                    </Card>

                    {guest.profile?.lastStayDate && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">
                            Last Stay
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            {formatDate(guest.profile.lastStayDate)}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {guest.nationality && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">
                            Nationality
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{guest.nationality}</p>
                        </CardContent>
                      </Card>
                    )}

                    {guest.notes && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">
                            Notes
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {guest.notes}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
