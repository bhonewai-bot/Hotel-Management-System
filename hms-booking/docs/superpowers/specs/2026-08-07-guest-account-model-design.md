# Guest Account Model Design

**Date:** 2026-08-07  
**Author:** Claude  
**Status:** Approved  

---

## Context

Mobile app customers are currently being created as `FRONT_DESK` users (hotel staff) instead of guests. The system needs proper separation between staff (hotel employees) and guests (hotel customers).

**Current Problem:**
- Mobile sign-ups get FRONT_DESK role (hotel staff permissions)
- Guest records are created but not linked to User accounts
- No GUEST role exists in the RBAC system
- Guests have inappropriate access to staff features

**Architecture Requirement:**
From CONTEXT.md: "Guest is managed separately from staff"

---

## Solution: Option C - Guest Table Linked to User via userId

### Core Concept

Use Better Auth for authentication (single auth system) with role-based access control. Guests authenticate as Users with a GUEST role, but their booking/profile data is stored in the Guest table linked via userId.

```
┌─────────────────────────────────────────────┐
│  User Table (Authentication)                 │
│  - Email/password or OAuth                  │
│  - Role: GUEST, FRONT_DESK, MANAGER, etc   │
│  - Basic profile (name, email)              │
└─────────────────┬───────────────────────────┘
                  │ userId (foreign key)
                  │
┌─────────────────▼───────────────────────────┐
│  Guest Table (Booking/Profile data)          │
│  - Booking history                          │
│  - Contact details                          │
│  - Stay stats & preferences                 │
└─────────────────────────────────────────────┘
```

### Advantages

✅ Maintains architectural separation (Guest ≠ Staff)  
✅ Leverages existing Better Auth setup  
✅ Single authentication system for all users  
✅ Guest-specific features grow independently  
✅ Matches existing database hook pattern  
✅ Most flexible and maintainable long-term  

---

## Database Changes

### 1. Add GUEST Role to Enum

```prisma
enum UserRole {
  ADMIN
  MANAGER
  FRONT_DESK
  HOUSEKEEPING
  MAINTENANCE
  GUEST          ← NEW
}
```

### 2. Add userId Field to Guest Model

```prisma
model Guest {
  id        String  @id @default(cuid())
  userId    String? @unique  ← NEW: Links to User
  firstName String
  lastName  String
  email     String?
  phone     String?
  // ... existing fields
  
  user      User?   @relation(fields: [userId], references: [id], onDelete: SetNull)
  // ... existing relations
}
```

### 3. Add Guest Relation to User Model

```prisma
model User {
  // ... existing fields
  guest  Guest?  @relation("UserToGuest")  ← NEW
  // ... existing relations
}
```

---

## RBAC Changes

### GUEST Role Permissions

**GUEST can:**
- ✅ Read/update their own profile
- ✅ Create/read/update their own bookings
- ✅ View their booking history
- ❌ NOT access staff features (rooms, housekeeping, reports)
- ❌ NOT view other guests' data

**Permission Matrix:**
| Role | Own Bookings | Own Profile | All Guests | Rooms | Reports |
|------|-------------|-------------|------------|-------|---------|
| GUEST | CRU | RU | ❌ | ❌ | ❌ |
| FRONT_DESK | CRU | CRU | Read | Read | ❌ |
| MANAGER | CRU | CRU | CRU | CRU | Read |
| ADMIN | CRUD | CRUD | CRUD | CRUD | CRUD |

### RBAC Config Updates

Add GUEST role to `/src/lib/rbac.ts` and `/hms-api/lib/rbac.ts`:

```typescript
const guest = createAccessControl({
  statement: {
    dashboard: ["read"],
    bookings: ["create", "read", "update"],
    guest: ["read", "update"],  // Own profile only
  },
});

export const roles = {
  ADMIN: admin,
  MANAGER: manager,
  FRONT_DESK: frontDesk,
  HOUSEKEEPING: housekeeping,
  MAINTENANCE: maintenance,
  GUEST: guest,  ← NEW
};
```

---

## Auth Flow Changes

### Current Flow (Broken)

1. Guest signs up → Creates User (role: FRONT_DESK)
2. Database hook creates orphaned Guest record
3. Guest has hotel staff permissions ❌

### New Flow (Fixed)

1. Guest signs up → Creates User (role: GUEST)
2. Database hook creates Guest record **linked via userId**
3. Guest authenticates → Gets GUEST role permissions
4. Guest makes booking → Uses their Guest profile
5. Staff views guest → Queries Guest record

### Database Hook Update

**File:** `hms-api/lib/auth.ts`

```typescript
databaseHooks: {
  user: {
    create: {
      after: async (user) => {
        // Only create Guest for GUEST role users
        if (user.role === "GUEST") {
          await prisma.guest.create({
            data: {
              userId: user.id,  // ← NEW: Link to User
              firstName: user.name?.split(" ")[0] || "",
              lastName: user.name?.split(" ").slice(1).join(" ") || "",
              email: user.email,
              profile: {
                create: {
                  totalStays: 0,
                  totalSpent: 0,
                  marketingOptIn: true,
                },
              },
            },
          });
        }
      },
    },
  },
},
```

### Default Role for Mobile Sign-ups

**File:** `hms-api/lib/auth.ts`

Change from:
```typescript
adminPlugin({
  ac,
  roles,
  defaultRole: "FRONT_DESK",  // ← OLD
  adminRoles: ["ADMIN"],
}),
```

To:
```typescript
adminPlugin({
  ac,
  roles,
  defaultRole: "GUEST",  // ← NEW: Mobile users get GUEST role
  adminRoles: ["ADMIN"],
}),
```

**Note:** This changes the default for ALL new users. If staff are created through the admin dashboard, they should explicitly set the role. If this is a concern, we can add a separate mobile sign-up endpoint that sets GUEST role.

---

## API Query Examples

### Guest Views Their Profile

```typescript
const guest = await prisma.guest.findUnique({
  where: { userId: session.user.id },
  include: { 
    bookings: true, 
    profile: true 
  },
});
```

### Staff Views All Guests

```typescript
const guests = await prisma.guest.findMany({
  include: {
    user: { select: { email: true, role: true } },
    bookings: true,
  },
});
```

### Guest Views Their Bookings

```typescript
const bookings = await prisma.booking.findMany({
  where: { 
    guest: { userId: session.user.id } 
  },
  include: { room: true },
  orderBy: { createdAt: "desc" },
});
```

---

## Feature Split

### Mobile App (Guest Experience)

**After login, guests can:**
1. ✅ View their profile (name, email, phone, preferences)
2. ✅ Update their profile information
3. ✅ View their booking history
4. ✅ Make new bookings
5. ✅ View/cancel existing bookings
6. ❌ NOT see other guests' information
7. ❌ NOT see room management or staff features

**UI Flow:**
```
Sign-in/Sign-up → Home (shows bookings) → Profile tab → Booking history → Make booking
```

### Admin Dashboard (Staff Experience)

**Front Desk staff can:**
1. ✅ View all guests (list, search, filter)
2. ✅ Create bookings on behalf of guests
3. ✅ View guest profiles
4. ✅ Update guest information
5. ✅ Check-in/check-out guests
6. ❌ NOT delete guest records (admin only)

**Manager/Admin can:**
- All of the above + delete, reports, room management

---

## Implementation Phases

### Phase 1: Database & RBAC (Backend)
1. Update Prisma schema (add GUEST role, userId field, relations)
2. Run migration
3. Update RBAC config (add GUEST role with limited permissions)
4. Update database hook (only create Guest for GUEST role users)

### Phase 2: Auth & API (Backend)
1. Set default role for mobile sign-ups to GUEST
2. Add role-based middleware for guest vs staff routes
3. Create guest-specific API endpoints (own profile, own bookings)
4. Test authentication flow

### Phase 3: Mobile App (Frontend)
1. Update sign-up to handle GUEST role
2. Create guest home screen (bookings list)
3. Create guest profile screen
4. Create booking flow
5. Test complete guest journey

### Phase 4: Admin Dashboard (Frontend)
1. Update guest list to show userId link
2. Ensure staff can query guests properly
3. Test staff can manage guests

---

## Testing Strategy

### Unit Tests
- Guest creation hook (linked to User)
- RBAC permissions (GUEST vs STAFF)
- API endpoints (guest can only access own data)

### Integration Tests
- Sign-up flow creates User + Guest correctly
- Sign-in gives correct role and permissions
- Guest makes booking → shows in their list
- Staff views guest → sees correct data

### E2E Tests
- Complete guest journey (sign up → book → view reservation)
- Staff journey (view guests → create booking)

---

## Migration Strategy

### For Existing Users
1. All current users are staff (FRONT_DESK, MANAGER, etc.) - no changes needed
2. New mobile sign-ups get GUEST role
3. Existing orphaned Guest records can be manually linked or archived

### Data Integrity
- Ensure no duplicate Guest records
- Validate userId links are correct
- Test rollback procedure

---

## Open Questions

1. **Staff creation flow:** Should staff be created through admin dashboard with explicit role selection, or through a separate endpoint? (Recommendation: Admin dashboard with explicit role)

2. **Existing orphaned Guests:** How to handle Guest records that were created from mobile users but not linked? (Recommendation: Manual linking or archive)

3. **Guest becoming staff:** If a guest gets hired, should we promote their account or create a new User? (Recommendation: Create new User, archive old Guest)

---

## Next Steps

1. Review this design document
2. Create implementation plan using writing-plans skill
3. Begin Phase 1: Database & RBAC changes
4. Test with a fresh mobile sign-up

---

## Related Files

- `hms-api/prisma/schema.prisma` - Database schema
- `hms-api/lib/auth.ts` - Auth config & database hooks
- `hms-api/lib/rbac.ts` - Backend RBAC config
- `hms-booking/src/lib/rbac.ts` - Mobile RBAC config
- `hms-booking/src/app/(auth)/sign-up.tsx` - Mobile sign-up screen
- `CONTEXT.md` - Domain architecture
