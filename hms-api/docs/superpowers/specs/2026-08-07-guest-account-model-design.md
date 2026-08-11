# Guest Account Management — Admin Dashboard

## Overview

Add a "Guests" section to the admin dashboard to manage customer accounts registered through the mobile booking app. This section displays guest profiles with booking history, contact information, and stay statistics, enabling hotel staff to view and manage guest information for customer service and CRM purposes.

## Context

**Problem:** The mobile app (hms-booking) allows customers to create accounts and make bookings. Currently, there's no way for hotel staff to view or manage these guest accounts from the admin dashboard, limiting customer service capabilities.

**Solution:** Add a "Guests" section to the admin dashboard sidebar that displays all registered guests with their booking history, contact details, and engagement metrics.

**Related Models:**
- `Guest` — Primary customer record (name, email, phone, bookings, communications)
- `GuestProfile` — Extended engagement metrics (total stays, total spent, last stay date, marketing preferences)
- `Booking` — Individual reservation records linked to guests

---

## Data Model

### Guest Model (Already Exists)

```typescript
model Guest {
  id              String    @id @default(cuid())
  email           String
  name            String
  phone           String?
  address         String?
  dateOfBirth     DateTime?
  nationality     String?
  idType          String?
  idNumber        String?
  preferences     Json?
  tags            String[]
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  bookings        Booking[]
  invoices        Invoice[]
  communications  CommunicationLog[]
  profile         GuestProfile?
}
```

### GuestProfile Model (Already Exists)

```typescript
model GuestProfile {
  id              String    @id @default(cuid())
  guestId         String    @unique
  guest           Guest     @relation(...)
  totalStays      Int       @default(0)
  totalSpent      Decimal   @default(0)
  lastStayDate    DateTime?
  anniversaryDate DateTime?
  marketingOptIn  Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### Key Metrics to Display
- Total number of guests
- Active guests (those with at least one booking)
- New guests in last 30 days
- Guest engagement score (based on stays and spending)

---

## Feature Specifications

### 1. Guest List View

**Purpose:** Display all registered guests with key information at a glance

**Columns:**
| Column | Description | Source |
|--------|-------------|--------|
| Guest | Name and email | Guest.name, Guest.email |
| Phone | Contact phone number | Guest.phone |
| Total Stays | Number of completed stays | GuestProfile.totalStays |
| Total Spent | Total revenue from guest | GuestProfile.totalSpent |
| Last Visit | Date of most recent stay | GuestProfile.lastStayDate |
| Status | Account status badge | Derived from Guest.isActive |
| Actions | View/Edit buttons | — |

**Filters:**
- Search by name or email
- Filter by status (Active/Inactive)
- Filter by registration date range
- Sort by name, total stays, total spent, last visit, or created date

**Pagination:** Cursor-based pagination (50 guests per page) using SWR for server-state management

**Empty State:** "No guests registered yet" with message about mobile app bookings

### 2. Guest Detail View

**Purpose:** View complete guest profile with booking history and engagement data

**Tabs:**

**A. Profile Tab**
- Contact information (name, email, phone, address)
- Personal details (date of birth, nationality, ID type/number)
- Account metadata (registration date, last login, account status)
- Guest notes and tags

**B. Bookings Tab**
- List of all bookings (past and future)
- Booking status badges
- Quick access to booking details

**C. Spending Tab**
- Total revenue from guest
- Average booking value
- Revenue by booking type
- Invoice history

**D. Communications Tab**
- Communication log (emails, SMS sent)
- Marketing opt-in status
- Last communication date

### 3. Guest Actions

**Available Actions:**
- **View Guest:** Opens full profile in detail view
- **Edit Guest:** Update contact information, personal details, notes
- **Toggle Status:** Activate/Deactivate guest account (soft-delete)
- **Export:** Download guest data in CSV format

**Restrictions:**
- All staff roles (ADMIN, MANAGER, FRONT_DESK) can view guest data
- Only ADMIN and MANAGER can edit guest profiles
- Guest deletion is disabled (soft-delete only via status toggle)

---

## API Endpoints

### GET /api/guests
- **Purpose:** List all guests with filtering and pagination
- **Query Params:**
  - `search` (string): Filter by name or email
  - `status` (enum): ACTIVE | INACTIVE
  - `startDate` / `endDate` (ISO date): Filter by registration date
  - `sortBy` (string): Column to sort by
  - `sortOrder` (asc | desc)
  - `cursor` (string): Pagination cursor
  - `limit` (number): Results per page (default: 50)
- **Response:** `{ guests: Guest[], nextCursor: string | null, total: number }`

### GET /api/guests/:id
- **Purpose:** Get detailed guest profile with related data
- **Response:** Guest object with included Bookings, Profile, Invoices, Communications

### PATCH /api/guests/:id
- **Purpose:** Update guest profile information
- **Body:** Partial Guest object (name, email, phone, address, notes, tags, isActive)
- **Validation:** Zod schema
- **Response:** Updated guest object

### GET /api/guests/:id/bookings
- **Purpose:** Get paginated booking history for guest
- **Response:** `{ bookings: Booking[], nextCursor: string | null }`

---

## UI Components

### File Structure
```
components/guests/
├── guest-table.tsx              (main table with filters and pagination)
├── guest-detail-dialog.tsx      (modal with tabs for profile/booking/spending/comms)
├── guest-form-dialog.tsx        (create/edit guest profile dialog)
├── guest-stats-cards.tsx        (top-level statistics display)
└── index.ts                     (exports)

app/dashboard/guests/
└── page.tsx                     (guest management page)

lib/actions/guest.ts             (server actions for CRUD)
lib/validations/guest.ts         (Zod schemas for validation)
```

### Key Components

**GuestTable Component:**
- Data table using shadcn/ui Table component
- Client-side sorting with SWR integration
- Cursor-based pagination controls
- Search input with debounced filtering
- Filter dropdowns for status and date range
- Row click opens GuestDetailDialog

**GuestDetailDialog Component:**
- Full-screen modal or slide-over panel
- Tabbed interface (Profile, Bookings, Spending, Communications)
- Edit button for quick profile updates
- Status toggle for activate/deactivate
- Responsive layout

**GuestStatsCards Component:**
- 4 stat cards at top of page:
  - Total Guests
  - Active Guests (with percentage)
  - New Guests (last 30 days)
  - Average Revenue per Guest

---

## Permission Model

### Role-Based Access Control

| Role | View Guests | Edit Guests | Toggle Status | Export Data |
|------|:-----------:|:-----------:|:-------------:|:-----------:|
| ADMIN | ✅ | ✅ | ✅ | ✅ |
| MANAGER | ✅ | ✅ | ✅ | ✅ |
| FRONT_DESK | ✅ | ❌ | ❌ | ❌ |
| HOUSEKEEPING | ❌ | ❌ | ❌ | ❌ |
| MAINTENANCE | ❌ | ❌ | ❌ | ❌ |

### Permission Checks
```typescript
// Server action permission model
async function requireGuestManagementAccess() {
  // 1. Verify session exists
  // 2. Load user from database
  // 3. Check role is ADMIN, MANAGER, or FRONT_DESK
  // 4. Return user with role for downstream checks
}

// For mutations (edit/status toggle):
// - Verify caller has ADMIN or MANAGER role
// - Prevent deactivating own account (not applicable for guests)
// - Log changes for audit trail
```

### Better-Auth Integration
- Use existing `auth.api.userHasPermission()` for route protection
- Define permissions: `guests: ["read"]`, `guests: ["write"]`
- Add permissions to role configuration

---

## Server Actions

### File: `lib/actions/guest.ts`

```typescript
"use server"

// 1. getGuests(filters, pagination)
//    - Validate filters with Zod schema
//    - Query Guest model with includes (Bookings, Profile)
//    - Apply cursor-based pagination
//    - Return serialized guests with total count

// 2. getGuestById(guestId)
//    - Validate guestId
//    - Fetch Guest with all related data
//    - Return complete guest object

// 3. updateGuest(guestId, data)
//    - Validate caller permissions (ADMIN/MANAGER only)
//    - Validate input with Zod schema
//    - Update Guest record
//    - Return updated guest

// 4. toggleGuestStatus(guestId, isActive)
//    - Validate caller permissions (ADMIN/MANAGER only)
//    - Toggle isActive field
//    - Return updated guest

// 5. exportGuests(filters)
//    - Validate caller permissions
//    - Generate CSV with guest data
//    - Return download URL or stream
```

### Validation Schema: `lib/validations/guest.ts`

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
```

---

## Error Handling

### Validation Errors
- Return structured error responses: `{ success: false, error: string, fieldErrors?: Record<string, string[]> }`
- Display field-level errors inline in forms
- Show toast notifications for general errors

### Permission Errors
- Redirect to login if session invalid
- Show "Access Denied" message if insufficient permissions
- Log permission violations for audit

### Data Not Found
- Return 404 for non-existent guests
- Show "Guest not found" error message
- Redirect to guest list after 3 seconds

---

## Performance Considerations

### Database Optimization
- Add indexes on commonly filtered fields: `Guest.email`, `Guest.name`, `GuestProfile.lastStayDate`
- Use `select` to fetch only necessary fields in list view
- Lazy-load related data in detail view tabs
- Implement cursor-based pagination to avoid offset performance issues

### Caching Strategy
- Use SWR for client-side data caching
- Implement `revalidatePath("/dashboard/guests")` after mutations
- Cache guest statistics in Redis for fast dashboard loading

### Query Optimization
- Eager-load GuestProfile in list view (single query)
- Lazy-load Bookings, Invoices, Communications in detail view tabs
- Use database-level filtering before pagination

---

## Success Metrics

1. **Dashboard Load Time:** Guest list loads in < 2 seconds
2. **Search Performance:** Filter results appear in < 500ms
3. **User Adoption:** Staff accesses guest profiles at least 5x per shift
4. **Data Accuracy:** Guest information is complete and up-to-date

---

## Dependencies

1. **Existing Models:** Guest, GuestProfile, Booking, Invoice, CommunicationLog
2. **Better-Auth Plugin:** For permission checks and role management
3. **Shadcn UI Components:** Table, Dialog, Tabs, Form, Button, Input, Badge
4. **SWR:** For data fetching and caching
5. **Prisma ORM:** For database queries

---

## Phase 1: Database & RBAC Changes (This Plan)

This plan covers:
- Database schema enhancements for Guest and GuestProfile
- Better-Auth permission definitions for guest management
- Core server actions for CRUD operations
- Basic table view with filtering and pagination

### Phase 1 Deliverables:
1. Enhanced Prisma schema with indexes and relations
2. Permission definitions and role mappings
3. Server actions: getGuests, getGuestById, updateGuest, toggleGuestStatus
4. Guest list page with data table
5. Basic filtering (search, status, date range)
6. Cursor-based pagination
7. Stat cards (Total, Active, New, Avg Revenue)
8. Guest detail dialog (profile tab only)

---

*Last updated: 2026-08-07*
