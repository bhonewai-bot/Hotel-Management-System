# Hotel Management System (HMS) — Domain Context

## Glossary

**Staff Management** — The feature for managing hotel staff user accounts (all roles: ADMIN, MANAGER, FRONT_DESK, HOUSEKEEPING, MAINTENANCE). Previously called "Admin Management" but renamed because the feature manages all staff, not just admins.

**Staff** — A hotel employee with a user account in the system. Distinguished from "Guest" (hotel customers).

**Guest** — A person staying or who has stayed at the hotel. Managed separately from staff.

**Role Hierarchy** — The permission structure controlling what staff can access and modify:
- **ADMIN**: Full access to all staff management operations
- **MANAGER**: Can manage non-privileged staff only (FRONT_DESK, HOUSEKEEPING, MAINTENANCE)
- **FRONT_DESK / HOUSEKEEPING / MAINTENANCE**: Cannot access staff management

**Soft-Delete (Deactivation)** — Removing a staff member's active access without permanently deleting their data. Deactivated staff cannot log in but their historical records remain intact.

---

## Key Decisions

### 1. Feature Naming: "Staff Management"
**Chosen:** "Staff Management"  
**Rejected:** "Admin Management" (misleading — manages all hotel staff, not just admins)  
**Rationale:** Clear, accurate, reflects the scope of the feature

### 2. Permission Model: ADMIN + MANAGER with Role Hierarchy
**Chosen:** Both ADMIN and MANAGER can access Staff Management  
**Restrictions:**
- ADMIN can manage all roles
- MANAGER can only manage FRONT_DESK, HOUSEKEEPING, MAINTENANCE
- MANAGER cannot create/edit/delete other MANAGERs or ADMINs

**Rationale:** Matches real hotel operations — managers need to manage their team, but privilege escalation is prevented

### 3. Self-Management: Locked
**Chosen:** Users cannot change their own role  
**Rationale:** Prevents accidental lockouts and forces proper handoff procedures

### 4. Last Admin Protection
**Chosen:** Prevent demoting or deleting the last ADMIN account  
**Rationale:** Prevents system lockout — if last admin demotes themselves, no one can access staff management

### 5. User Lifecycle: Soft-Delete (Deactivation)
**Chosen:** Deactivate users instead of hard-deleting  
**Behavior:**
- Deactivation sets `isActive = false`
- Deactivated users cannot log in
- Historical data (bookings, tasks, work orders) preserved
- Can be reactivated later with same role and credentials

**Rejected:** Hard-delete (dangerous — loses historical context)

### 6. Reactivation: Restore with Previous State
**Chosen:** Reactivation restores account with previous role and credentials  
**Rationale:** Simple, preserves continuity, no need to re-enter information

### 7. UI Display: Deactivated Users Visible with Badge
**Chosen:** Deactivated users appear in staff list with "Inactive" badge  
**Behavior:**
- Deactivated rows are grayed out or reduced opacity
- Show "Inactive" badge
- Display "Reactivate" button instead of "Edit/Delete"

**Rejected:** Hide deactivated users entirely (lacks visibility into historical staff)

### 8. Credential Provisioning: Direct Password Setting
**Chosen:** Admin sets password when creating staff account  
**Rationale:** Practical for small, single-property hotels where staff are on-site. Creator can securely share credentials verbally or via encrypted channel.

**Rejected:** Invite email system (adds unnecessary complexity)

### 9. Naming Conventions
**File/Route/Schema Renames:**
- Route: `/dashboard/admins` → `/dashboard/staff`
- Sidebar: "Admin Management" → "Staff Management"
- Actions file: `lib/actions/admin.ts` → `lib/actions/staff.ts`
- Schemas: `createAdminSchema` → `createStaffSchema`
- Components folder: `components/admins/` → `components/staff/`

**Kept As-Is:**
- Function names: `getUsers()`, `createUser()`, `updateUser()`, `deleteUser()` (operate on Prisma User model)
- Prisma model: `User` with `UserRole` enum (correct abstraction)

---

## Data Model Notes

### User Model
- 5 roles: ADMIN, MANAGER, FRONT_DESK, HOUSEKEEPING, MAINTENANCE
- Needs `isActive` field for soft-delete (currently missing — to be added)
- Profile data: name, email, phone (optional), image (optional)

### Relationships
- User → HousekeepingTask (assigned tasks)
- User → MaintenanceWorkOrder (reported/assigned work orders)
- Historical assignments preserved even after deactivation

---

## Architecture Decisions

### File Structure
```
components/staff/
├── staff-table.tsx          (main table component)
├── staff-form-dialog.tsx    (create/edit dialogs)
└── delete-staff-dialog.tsx  (deactivation confirmation)

lib/actions/staff.ts         (server actions)
lib/validations/staff.ts     (Zod schemas)
app/dashboard/staff/
└── page.tsx                 (staff management page)
```

### Permission Checks
```typescript
// Server action permission model
async function requireStaffAccess() {
  // 1. Verify session exists
  // 2. Load user from database
  // 3. Check role is ADMIN or MANAGER
  // 4. Return user with role for downstream checks
}

// For mutations, also check:
// - Is target a privileged role (ADMIN/MANAGER)?
// - Does caller have permission to modify that role?
// - Is this the last admin?
// - Is caller trying to modify themselves?
```

---

## Open Questions (Resolved)

All critical domain decisions have been made. See above sections for details.

---

*Last updated: 2025-07-15*
