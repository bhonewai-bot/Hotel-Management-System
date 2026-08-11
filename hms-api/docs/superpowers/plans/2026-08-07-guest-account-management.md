# Guest Account Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Guest Management section to the admin dashboard that displays customer accounts from the mobile booking app with filtering, pagination, and profile viewing capabilities.

**Architecture:** Extend the existing Prisma schema with indexes on Guest and GuestProfile models. Add Better-Auth permissions for guest management. Create server actions for CRUD operations. Build a responsive guest list page with search, filters, and cursor-based pagination. Implement a guest detail dialog with profile viewing.

**Tech Stack:** Next.js 16+, Prisma ORM, Better-Auth, Shadcn UI, SWR, Zod, Tailwind CSS

## Global Constraints

- Prisma ORM with PostgreSQL database
- Better-Auth for authentication and RBAC
- Shadcn UI components for all UI elements
- SWR for client-side data fetching and caching
- Cursor-based pagination (50 items per page default)
- Zod schemas for all validation
- Server-only data access via Prisma (no client-side DB access)

---

## File Structure

```
prisma/schema.prisma                          (MODIFY: Add indexes to Guest, GuestProfile)
lib/actions/guest.ts                           (CREATE: Server actions for guest CRUD)
lib/validations/guest.ts                       (CREATE: Zod schemas for filters and updates)
components/guests/index.ts                     (CREATE: Export all guest components)
components/guests/guest-table.tsx              (CREATE: Main data table with filters)
components/guests/guest-stats-cards.tsx        (CREATE: Dashboard stat cards)
components/guests/guest-detail-dialog.tsx      (CREATE: Profile viewing dialog)
components/guests/guest-form-dialog.tsx        (CREATE: Edit profile dialog)
app/dashboard/guests/page.tsx                  (CREATE: Guest list page)
components/app-sidebar.tsx                     (MODIFY: Add Guests navigation item)
lib/auth.ts                                    (MODIFY: Add guest permissions to roles)
```

---

### Task 1: Database Schema Enhancement

**Files:**
- Modify: `prisma/schema.prisma:295-335` (Guest and GuestProfile models)

**Interfaces:**
- Consumes: None (database foundation)
- Produces: Enhanced Guest and GuestProfile models with performance indexes

- [ ] **Step 1: Add indexes to Guest model**

Open `prisma/schema.prisma` and locate the Guest model (around line 295).

Add indexes after the existing relations:

```prisma
model Guest {
  // ... existing fields and relations ...

  @@index([email])
  @@index([phone])
  @@index([createdAt])
  @@index([name])
  @@map("guest")
}
```

- [ ] **Step 2: Add indexes to GuestProfile model**

Locate GuestProfile model (around line 322).

Add indexes:

```prisma
model GuestProfile {
  // ... existing fields and relations ...

  @@index([guestId])
  @@index([lastStayDate])
  @@index([totalStays])
  @@map("guest_profile")
}
```

- [ ] **Step 3: Generate Prisma client**

Run: `pnpm prisma generate`
Expected: Client generated successfully

- [ ] **Step 4: Create migration**

Run: `pnpm prisma migrate dev --name add-guest-indexes`
Expected: Migration created and applied

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add performance indexes to Guest and GuestProfile models"
```

---

### Task 2: Validation Schemas

**Files:**
- Create: `lib/validations/guest.ts`

**Interfaces:**
- Consumes: None (validation foundation)
- Produces: `guestFiltersSchema`, `updateGuestSchema`, `toggleGuestStatusSchema`

- [ ] **Step 1: Create validation file**

Create `lib/validations/guest.ts` with the following content:

```typescript
import { z } from "zod"

export const guestFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["name", "email", "totalStays", "totalSpent", "lastStayDate", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
})

export const updateGuestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const toggleGuestStatusSchema = z.object({
  isActive: z.boolean(),
})

export type GuestFilters = z.infer<typeof guestFiltersSchema>
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>
export type ToggleGuestStatusInput = z.infer<typeof toggleGuestStatusSchema>
```

- [ ] **Step 2: Verify file is valid TypeScript**

Run: `pnpm tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add lib/validations/guest.ts
git commit -m "feat(validation): add Zod schemas for guest filters and updates"
```

---

### Task 3: Better-Auth Permissions

**Files:**
- Modify: `lib/auth.ts` (Add guest permissions to role configuration)

**Interfaces:**
- Consumes: Existing Better-Auth setup
- Produces: Permission definitions for `guests:read` and `guests:write`

- [ ] **Step 1: Read current auth.ts file**

Run: `Read lib/auth.ts` to understand current structure

- [ ] **Step 2: Add guest permissions to ADMIN role**

In the `roles` object within `lib/auth.ts`, add permissions to the ADMIN role:

```typescript
ADMIN: {
  // ... existing permissions ...
  guests: ["read", "write"],
},
```

- [ ] **Step 3: Add guest permissions to MANAGER role**

```typescript
MANAGER: {
  // ... existing permissions ...
  guests: ["read", "write"],
},
```

- [ ] **Step 4: Add guest permissions to FRONT_DESK role**

```typescript
FRONT_DESK: {
  // ... existing permissions ...
  guests: ["read"],
},
```

- [ ] **Step 5: Verify TypeScript**

Run: `pnpm tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 6: Commit**

```bash
git add lib/auth.ts
git commit -m "feat(auth): add guest management permissions for ADMIN, MANAGER, and FRONT_DESK roles"
```

---

### Task 4: Server Actions - Core CRUD

**Files:**
- Create: `lib/actions/guest.ts`

**Interfaces:**
- Consumes: `lib/validations/guest.ts` schemas, Prisma Guest/GuestProfile models
- Produces: `getGuests()`, `getGuestById()`, `updateGuest()`, `toggleGuestStatus()`

- [ ] **Step 1: Create server actions file**

Create `lib/actions/guest.ts` with the following content:

```typescript
"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import {
  guestFiltersSchema,
  updateGuestSchema,
  toggleGuestStatusSchema,
  GuestFilters,
  UpdateGuestInput,
  ToggleGuestStatusInput,
} from "@/lib/validations/guest"

async function requireGuestAccess() {
  const hdrs = await headers()
  const session = await auth.api.getSession({
    headers: hdrs,
  })

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  })

  if (!user || !["ADMIN", "MANAGER", "FRONT_DESK"].includes(user.role)) {
    throw new Error("Insufficient permissions")
  }

  return user
}

export async function getGuests(filters: GuestFilters) {
  await requireGuestAccess()

  const validatedFilters = guestFiltersSchema.parse(filters)

  const where: any = {}

  if (validatedFilters.search) {
    where.OR = [
      { name: { contains: validatedFilters.search, mode: "insensitive" } },
      { email: { contains: validatedFilters.search, mode: "insensitive" } },
    ]
  }

  if (validatedFilters.status) {
    if (validatedFilters.status === "ACTIVE") {
      where.bookings = { some: { status: { not: "CANCELLED" } } }
    }
  }

  if (validatedFilters.startDate || validatedFilters.endDate) {
    where.createdAt = {}
    if (validatedFilters.startDate) {
      where.createdAt.gte = new Date(validatedFilters.startDate)
    }
    if (validatedFilters.endDate) {
      where.createdAt.lte = new Date(validatedFilters.endDate)
    }
  }

  const orderBy: any = {}
  if (validatedFilters.sortBy) {
    if (validatedFilters.sortBy === "totalStays" || validatedFilters.sortBy === "totalSpent") {
      orderBy.profile = { [validatedFilters.sortBy]: validatedFilters.sortOrder || "desc" }
    } else {
      orderBy[validatedFilters.sortBy] = validatedFilters.sortOrder || "desc"
    }
  } else {
    orderBy.createdAt = "desc"
  }

  const limit = validatedFilters.limit || 50
  const cursor = validatedFilters.cursor

  const guests = await prisma.guest.findMany({
    where,
    include: {
      profile: true,
      _count: {
        select: { bookings: true },
      },
    },
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy,
  })

  const hasMore = guests.length > limit
  const items = hasMore ? guests.slice(0, -1) : guests
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return {
    guests: items.map((guest) => ({
      ...guest,
      createdAt: guest.createdAt.toISOString(),
      updatedAt: guest.updatedAt.toISOString(),
      profile: guest.profile
        ? {
            ...guest.profile,
            createdAt: guest.profile.createdAt.toISOString(),
            updatedAt: guest.profile.updatedAt.toISOString(),
            lastStayDate: guest.profile.lastStayDate?.toISOString() || null,
            totalSpent: guest.profile.totalSpent.toString(),
          }
        : null,
    })),
    nextCursor,
    total: await prisma.guest.count({ where }),
  }
}

export async function getGuestById(guestId: string) {
  await requireGuestAccess()

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: {
      profile: true,
      bookings: {
        orderBy: { checkIn: "desc" },
        take: 10,
      },
    },
  })

  if (!guest) {
    throw new Error("Guest not found")
  }

  return {
    ...guest,
    createdAt: guest.createdAt.toISOString(),
    updatedAt: guest.updatedAt.toISOString(),
    profile: guest.profile
      ? {
          ...guest.profile,
          createdAt: guest.profile.createdAt.toISOString(),
          updatedAt: guest.profile.updatedAt.toISOString(),
          lastStayDate: guest.profile.lastStayDate?.toISOString() || null,
          totalSpent: guest.profile.totalSpent.toString(),
        }
      : null,
    bookings: guest.bookings.map((booking) => ({
      ...booking,
      checkIn: booking.checkIn.toISOString(),
      checkOut: booking.checkOut.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      totalAmount: booking.totalAmount.toString(),
    })),
  }
}

export async function updateGuest(guestId: string, data: UpdateGuestInput) {
  const user = await requireGuestAccess()

  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw new Error("Insufficient permissions to update guests")
  }

  const validatedData = updateGuestSchema.parse(data)

  const guest = await prisma.guest.update({
    where: { id: guestId },
    data: {
      ...(validatedData.name && { name: validatedData.name }),
      ...(validatedData.email && { email: validatedData.email }),
      ...(validatedData.phone && { phone: validatedData.phone }),
      ...(validatedData.address && { address: validatedData.address }),
      ...(validatedData.dateOfBirth && { dateOfBirth: new Date(validatedData.dateOfBirth) }),
      ...(validatedData.nationality && { nationality: validatedData.nationality }),
      ...(validatedData.idType && { idType: validatedData.idType }),
      ...(validatedData.idNumber && { idNumber: validatedData.idNumber }),
      ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
      ...(validatedData.tags && { tags: validatedData.tags }),
    },
    include: {
      profile: true,
    },
  })

  return {
    ...guest,
    createdAt: guest.createdAt.toISOString(),
    updatedAt: guest.updatedAt.toISOString(),
    profile: guest.profile
      ? {
          ...guest.profile,
          createdAt: guest.profile.createdAt.toISOString(),
          updatedAt: guest.profile.updatedAt.toISOString(),
          lastStayDate: guest.profile.lastStayDate?.toISOString() || null,
          totalSpent: guest.profile.totalSpent.toString(),
        }
      : null,
  }
}

export async function toggleGuestStatus(guestId: string, data: ToggleGuestStatusInput) {
  const user = await requireGuestAccess()

  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw new Error("Insufficient permissions to toggle guest status")
  }

  const validatedData = toggleGuestStatusSchema.parse(data)

  const guest = await prisma.guest.update({
    where: { id: guestId },
    data: { isActive: validatedData.isActive },
    include: {
      profile: true,
    },
  })

  return {
    ...guest,
    createdAt: guest.createdAt.toISOString(),
    updatedAt: guest.updatedAt.toISOString(),
    profile: guest.profile
      ? {
          ...guest.profile,
          createdAt: guest.profile.createdAt.toISOString(),
          updatedAt: guest.profile.updatedAt.toISOString(),
          lastStayDate: guest.profile.lastStayDate?.toISOString() || null,
          totalSpent: guest.profile.totalSpent.toString(),
        }
      : null,
  }
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `pnpm tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add lib/actions/guest.ts
git commit -m "feat(actions): add guest CRUD server actions with permission checks"
```

---

### Task 5: Guest Stats Cards

**Files:**
- Create: `components/guests/guest-stats-cards.tsx`
- Create: `components/guests/index.ts`

**Interfaces:**
- Consumes: Prisma Guest and GuestProfile models
- Produces: `GuestStatsCards` component

- [ ] **Step 1: Create stats cards component**

Create `components/guests/guest-stats-cards.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserPlus, DollarSign } from "lucide-react"

interface GuestStats {
  totalGuests: number
  activeGuests: number
  newGuestsLast30Days: number
  averageRevenue: number
}

export function GuestStatsCards({ stats }: { stats: GuestStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalGuests}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Guests</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeGuests}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalGuests > 0
              ? `${Math.round((stats.activeGuests / stats.totalGuests) * 100)}% of total`
              : "No guests yet"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New (Last 30 Days)</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.newGuestsLast30Days}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Revenue per Guest</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageRevenue > 0
              ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "MMK",
                }).format(stats.averageRevenue)
              : "MMK 0"}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Create index file**

Create `components/guests/index.ts`:

```typescript
export { GuestStatsCards } from "./guest-stats-cards"
export { GuestTable } from "./guest-table"
export { GuestDetailDialog } from "./guest-detail-dialog"
export { GuestFormDialog } from "./guest-form-dialog"
```

- [ ] **Step 3: Verify TypeScript**

Run: `pnpm tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add components/guests/
git commit -m "feat(ui): add guest statistics cards component"
```

---

### Task 6: Guest Table Component

**Files:**
- Create: `components/guests/guest-table.tsx`

**Interfaces:**
- Consumes: `getGuests()` from `lib/actions/guest.ts`
- Produces: `GuestTable` component

- [ ] **Step 1: Create guest table component**

Create `components/guests/guest-table.tsx`:

```tsx
"use client"

import { useState } from "react"
import useSWR from "swr"
import { format } from "date-fns"
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { GuestDetailDialog } from "./guest-detail-dialog"

interface Guest {
  id: string
  name: string
  email: string
  phone: string | null
  isActive: boolean
  createdAt: string
  profile: {
    totalStays: number
    totalSpent: string
    lastStayDate: string | null
  } | null
}

interface GuestResponse {
  guests: Guest[]
  nextCursor: string | null
  total: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function GuestTable() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [cursor, setCursor] = useState<string | null>(null)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)

  const params = new URLSearchParams()
  if (search) params.append("search", search)
  if (status) params.append("status", status)
  if (sortBy) params.append("sortBy", sortBy)
  if (sortOrder) params.append("sortOrder", sortOrder)
  if (cursor) params.append("cursor", cursor)

  const { data, error, isLoading } = useSWR<GuestResponse>(
    `/api/guests?${params.toString()}`,
    fetcher
  )

  const guests = data?.guests || []
  const total = data?.total || 0
  const nextCursor = data?.nextCursor

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Registration Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="totalStays">Total Stays</SelectItem>
              <SelectItem value="totalSpent">Total Spent</SelectItem>
              <SelectItem value="lastStayDate">Last Visit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {total} guest{total !== 1 ? "s" : ""} found
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">
          Error loading guests. Please try again.
        </div>
      ) : guests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No guests found. Guest accounts from the mobile app will appear here.
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Total Stays</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map((guest) => (
                  <TableRow
                    key={guest.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedGuest(guest)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{guest.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {guest.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{guest.phone || "—"}</TableCell>
                    <TableCell className="text-right">
                      {guest.profile?.totalStays || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {guest.profile?.totalSpent
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "MMK",
                          }).format(parseFloat(guest.profile.totalSpent))
                        : "MMK 0"}
                    </TableCell>
                    <TableCell>
                      {guest.profile?.lastStayDate
                        ? format(new Date(guest.profile.lastStayDate), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={guest.isActive ? "default" : "secondary"}>
                        {guest.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedGuest(guest)
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={!cursor}
              onClick={() => setCursor(null)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              {guests.length} of {total}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!nextCursor}
              onClick={() => nextCursor && setCursor(nextCursor)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </>
      )}

      {selectedGuest && (
        <GuestDetailDialog
          guest={selectedGuest}
          open={!!selectedGuest}
          onClose={() => setSelectedGuest(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `pnpm tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add components/guests/guest-table.tsx
git commit -m "feat(ui): add guest data table with search, filters, and pagination"
```

---

### Task 7: Guest Detail Dialog

**Files:**
- Create: `components/guests/guest-detail-dialog.tsx`

**Interfaces:**
- Consumes: `getGuestById()` from `lib/actions/guest.ts`
- Produces: `GuestDetailDialog` component

- [ ] **Step 1: Create guest detail dialog**

Create `components/guests/guest-detail-dialog.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { format } from "date-fns"
import { Loader2, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GuestFormDialog } from "./guest-form-dialog"

interface GuestDetail {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  dateOfBirth: string | null
  nationality: string | null
  idType: string | null
  idNumber: string | null
  notes: string | null
  tags: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  profile: {
    totalStays: number
    totalSpent: string
    lastStayDate: string | null
    marketingOptIn: boolean
  } | null
  bookings: Array<{
    id: string
    bookingNumber: string
    checkIn: string
    checkOut: string
    status: string
    totalAmount: string
  }>
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface GuestDetailDialogProps {
  guest: { id: string; name: string; email: string }
  open: boolean
  onClose: () => void
}

export function GuestDetailDialog({ guest, open, onClose }: GuestDetailDialogProps) {
  const [editOpen, setEditOpen] = useState(false)

  const { data, error, isLoading } = useSWR<GuestDetail>(
    open ? `/api/guests/${guest.id}` : null,
    fetcher
  )

  const guestDetail = data

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{guest.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">{guest.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Error loading guest details. Please try again.
          </div>
        ) : guestDetail ? (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p>{guestDetail.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p>{guestDetail.address || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                    <p>
                      {guestDetail.dateOfBirth
                        ? format(new Date(guestDetail.dateOfBirth), "MMM d, yyyy")
                        : "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nationality</p>
                    <p>{guestDetail.nationality || "Not provided"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ID Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID Type</p>
                    <p>{guestDetail.idType || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID Number</p>
                    <p>{guestDetail.idNumber || "Not provided"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notes & Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p>{guestDetail.notes || "No notes"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {guestDetail.tags.length > 0 ? (
                        guestDetail.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No tags</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={guestDetail.isActive ? "default" : "secondary"}>
                      {guestDetail.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Registered</p>
                    <p>{format(new Date(guestDetail.createdAt), "MMM d, yyyy")}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>Booking History</CardTitle>
                </CardHeader>
                <CardContent>
                  {guestDetail.bookings.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      No bookings found for this guest.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {guestDetail.bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{booking.bookingNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(booking.checkIn), "MMM d, yyyy")} -{" "}
                              {format(new Date(booking.checkOut), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                booking.status === "CHECKED_OUT"
                                  ? "default"
                                  : booking.status === "CANCELLED"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {booking.status}
                            </Badge>
                            <p className="text-sm font-medium mt-1">
                              MMK {parseFloat(booking.totalAmount).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Stays</p>
                      <p className="text-2xl font-bold">
                        {guestDetail.profile?.totalStays || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Last Visit</p>
                      <p>
                        {guestDetail.profile?.lastStayDate
                          ? format(new Date(guestDetail.profile.lastStayDate), "MMM d, yyyy")
                          : "Never"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold">
                        {guestDetail.profile?.totalSpent
                          ? `MMK ${parseFloat(guestDetail.profile.totalSpent).toLocaleString()}`
                          : "MMK 0"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Avg. per Stay
                      </p>
                      <p className="text-2xl font-bold">
                        {guestDetail.profile?.totalStays &&
                        guestDetail.profile.totalStays > 0
                          ? `MMK ${Math.round(
                              parseFloat(guestDetail.profile.totalSpent) /
                                guestDetail.profile.totalStays
                            ).toLocaleString()}`
                          : "MMK 0"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : null}

        {editOpen && guestDetail && (
          <GuestFormDialog
            guest={guestDetail}
            open={editOpen}
            onClose={() => setEditOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `pnpm tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add components/guests/guest-detail-dialog.tsx
git commit -m "feat(ui): add guest detail dialog with profile, bookings, and statistics tabs"
```

---

### Task 8: Guest Form Dialog

**Files:**
- Create: `components/guests/guest-form-dialog.tsx`

**Interfaces:**
- Consumes: `updateGuest()` from `lib/actions/guest.ts`
- Produces: `GuestFormDialog` component

- [ ] **Step 1: Create guest form dialog**

Create `components/guests/guest-form-dialog.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateGuestSchema } from "@/lib/validations/guest"
import { updateGuest } from "@/lib/actions/guest"
import { toast } from "sonner"

interface Guest {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  dateOfBirth: string | null
  nationality: string | null
  idType: string | null
  idNumber: string | null
  notes: string | null
  tags: string[]
}

interface GuestFormDialogProps {
  guest: Guest
  open: boolean
  onClose: () => void
}

export function GuestFormDialog({ guest, open, onClose }: GuestFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateGuestSchema),
    defaultValues: {
      name: guest.name,
      email: guest.email,
      phone: guest.phone || "",
      address: guest.address || "",
      dateOfBirth: guest.dateOfBirth
        ? new Date(guest.dateOfBirth).toISOString().split("T")[0]
        : "",
      nationality: guest.nationality || "",
      idType: guest.idType || "",
      idNumber: guest.idNumber || "",
      notes: guest.notes || "",
    },
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      await updateGuest(guest.id, data)
      toast.success("Guest profile updated successfully")
      onClose()
    } catch (error) {
      toast.error("Failed to update guest profile")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Guest Profile</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register("name")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input id="nationality" {...register("nationality")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idType">ID Type</Label>
              <Input id="idType" {...register("idType")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number</Label>
              <Input id="idNumber" {...register("idNumber")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" {...register("address")} rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `pnpm tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add components/guests/guest-form-dialog.tsx
git commit -m "feat(ui): add guest edit form dialog with validation"
```

---

### Task 9: Guest List Page

**Files:**
- Create: `app/dashboard/guests/page.tsx`
- Modify: `components/app-sidebar.tsx:19-36` (Add navigation item)

**Interfaces:**
- Consumes: `GuestStatsCards`, `GuestTable` components
- Produces: `/dashboard/guests` route

- [ ] **Step 1: Create guest list page**

Create `app/dashboard/guests/page.tsx`:

```tsx
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { GuestStatsCards, GuestTable } from "@/components/guests"

export default async function GuestsPage() {
  const hdrs = await headers()
  const session = await auth.api.getSession({
    headers: hdrs,
  })

  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  })

  if (!user || !["ADMIN", "MANAGER", "FRONT_DESK"].includes(user.role)) {
    redirect("/dashboard")
  }

  // Fetch stats
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [totalGuests, activeGuests, newGuestsLast30Days, revenueStats] =
    await Promise.all([
      prisma.guest.count(),
      prisma.guest.findMany({
        where: {
          bookings: { some: { status: { not: "CANCELLED" } } },
        },
        select: { id: true },
      }),
      prisma.guest.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.guestProfile.aggregate({
        _avg: { totalSpent: true },
      }),
    ])

  const stats = {
    totalGuests,
    activeGuests: activeGuests.length,
    newGuestsLast30Days,
    averageRevenue: revenueStats._avg.totalSpent
      ? parseFloat(revenueStats._avg.totalSpent.toString())
      : 0,
  }

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
                <GuestStatsCards stats={stats} />
              </div>
              <div className="px-4 lg:px-6">
                <GuestTable />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

- [ ] **Step 2: Add navigation item to sidebar**

Open `components/app-sidebar.tsx` and locate the `navMain` array (around line 19).

Add the Guests navigation item:

```typescript
const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <SquaresFourIcon />,
  },
  {
    title: "Guests",
    url: "/dashboard/guests",
    icon: <UsersIcon />,
  },
  {
    title: "Staff Management",
    url: "/dashboard/staff",
    icon: <UsersIcon />,
  },
]
```

- [ ] **Step 3: Verify TypeScript**

Run: `pnpm tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/guests/page.tsx components/app-sidebar.tsx
git commit -m "feat(ui): add guest list page with stats and navigation"
```

---

### Task 10: API Routes

**Files:**
- Create: `app/api/guests/route.ts`
- Create: `app/api/guests/[id]/route.ts`

**Interfaces:**
- Consumes: `getGuests()`, `getGuestById()` from `lib/actions/guest.ts`
- Produces: GET `/api/guests`, GET `/api/guests/:id`

- [ ] **Step 1: Create guests list API route**

Create `app/api/guests/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { guestFiltersSchema } from "@/lib/validations/guest"

export async function GET(request: NextRequest) {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({
      headers: hdrs,
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    })

    if (!user || !["ADMIN", "MANAGER", "FRONT_DESK"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const filters = {
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    }

    const validatedFilters = guestFiltersSchema.parse(filters)

    const where: any = {}

    if (validatedFilters.search) {
      where.OR = [
        { name: { contains: validatedFilters.search, mode: "insensitive" } },
        { email: { contains: validatedFilters.search, mode: "insensitive" } },
      ]
    }

    if (validatedFilters.startDate || validatedFilters.endDate) {
      where.createdAt = {}
      if (validatedFilters.startDate) {
        where.createdAt.gte = new Date(validatedFilters.startDate)
      }
      if (validatedFilters.endDate) {
        where.createdAt.lte = new Date(validatedFilters.endDate)
      }
    }

    const orderBy: any = {}
    if (validatedFilters.sortBy) {
      if (validatedFilters.sortBy === "totalStays" || validatedFilters.sortBy === "totalSpent") {
        orderBy.profile = { [validatedFilters.sortBy]: validatedFilters.sortOrder || "desc" }
      } else {
        orderBy[validatedFilters.sortBy] = validatedFilters.sortOrder || "desc"
      }
    } else {
      orderBy.createdAt = "desc"
    }

    const limit = validatedFilters.limit || 50
    const cursor = validatedFilters.cursor

    const guests = await prisma.guest.findMany({
      where,
      include: {
        profile: true,
        _count: {
          select: { bookings: true },
        },
      },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy,
    })

    const hasMore = guests.length > limit
    const items = hasMore ? guests.slice(0, -1) : guests
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return NextResponse.json({
      guests: items.map((guest) => ({
        ...guest,
        createdAt: guest.createdAt.toISOString(),
        updatedAt: guest.updatedAt.toISOString(),
        profile: guest.profile
          ? {
              ...guest.profile,
              createdAt: guest.profile.createdAt.toISOString(),
              updatedAt: guest.profile.updatedAt.toISOString(),
              lastStayDate: guest.profile.lastStayDate?.toISOString() || null,
              totalSpent: guest.profile.totalSpent.toString(),
            }
          : null,
      })),
      nextCursor,
      total: await prisma.guest.count({ where }),
    })
  } catch (error) {
    console.error("Error fetching guests:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Create guest detail API route**

Create `app/api/guests/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({
      headers: hdrs,
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    })

    if (!user || !["ADMIN", "MANAGER", "FRONT_DESK"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id } = await params

    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        profile: true,
        bookings: {
          orderBy: { checkIn: "desc" },
          take: 10,
        },
      },
    })

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...guest,
      createdAt: guest.createdAt.toISOString(),
      updatedAt: guest.updatedAt.toISOString(),
      profile: guest.profile
        ? {
            ...guest.profile,
            createdAt: guest.profile.createdAt.toISOString(),
            updatedAt: guest.profile.updatedAt.toISOString(),
            lastStayDate: guest.profile.lastStayDate?.toISOString() || null,
            totalSpent: guest.profile.totalSpent.toString(),
          }
        : null,
      bookings: guest.bookings.map((booking) => ({
        ...booking,
        checkIn: booking.checkIn.toISOString(),
        checkOut: booking.checkOut.toISOString(),
        createdAt: booking.createdAt.toISOString(),
        totalAmount: booking.totalAmount.toString(),
      })),
    })
  } catch (error) {
    console.error("Error fetching guest:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `pnpm tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add app/api/guests/
git commit -m "feat(api): add guest list and detail API routes with pagination"
```

---

### Task 11: Build and Test

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Verified build and basic smoke test

- [ ] **Step 1: Build the application**

Run: `pnpm build`
Expected: Build completes successfully without errors

- [ ] **Step 2: Start the application**

Run: `pnpm start`
Expected: Application starts on port 3000

- [ ] **Step 3: Smoke test the guests page**

Open browser to `http://localhost:3000/dashboard/guests`
- Verify: Page loads without errors
- Verify: Stats cards display
- Verify: Guest table appears (empty or with data)
- Verify: Search and filter controls are visible

- [ ] **Step 4: Test guest list API**

Run: `curl http://localhost:3000/api/guests`
Expected: JSON response with guests array, nextCursor, and total

- [ ] **Step 5: Stop the application**

Press Ctrl+C in the terminal

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: verify guest management implementation builds successfully"
```

---

## Summary

**Total Tasks:** 11

**Estimated Time:** 30-45 minutes

**Key Deliverables:**
- Enhanced database schema with performance indexes
- Better-Auth permissions for guest management
- Complete server actions with validation
- Responsive guest list page with stats, search, filtering, and pagination
- Guest detail dialog with profile, bookings, and statistics tabs
- Guest edit form dialog
- Full API routes for guest data

**Dependencies:**
- Existing Prisma schema (Guest, GuestProfile, Booking models)
- Better-Auth configuration (lib/auth.ts)
- Shadcn UI components
- SWR for data fetching
- Zod for validation
- date-fns for date formatting

---

*Last updated: 2026-08-07*
