import { createAccessControl } from "better-auth/plugins/access";

// Define all permissions for the Hotel Management System
export const statement = {
  dashboard: ["read"],
  staff: ["read", "create", "update", "delete"],
  bookings: ["read", "create", "update", "delete"],
  rooms: ["read", "create", "update", "delete"],
  guests: ["read", "create", "update", "delete"],
  reports: ["read"],
} as const;

// Create the access control instance
export const ac = createAccessControl(statement);

// Define roles with their permissions

// ADMIN: Full access to everything
export const admin = ac.newRole({
  dashboard: ["read"],
  staff: ["read", "create", "update", "delete"],
  bookings: ["read", "create", "update", "delete"],
  rooms: ["read", "create", "update", "delete"],
  guests: ["read", "create", "update", "delete"],
  reports: ["read"],
});

// MANAGER: Can manage bookings, rooms, guests, reports; limited staff access
export const manager = ac.newRole({
  dashboard: ["read"],
  staff: ["read"],
  bookings: ["read", "create", "update", "delete"],
  rooms: ["read", "create", "update"],
  guests: ["read", "create", "update"],
  reports: ["read"],
});

// FRONT_DESK: Can manage bookings, rooms, guests
export const frontDesk = ac.newRole({
  dashboard: ["read"],
  staff: [],
  bookings: ["read", "create", "update"],
  rooms: ["read"],
  guests: ["read", "create", "update"],
  reports: [],
});

// HOUSEKEEPING: Can view and update room status
export const housekeeping = ac.newRole({
  dashboard: ["read"],
  staff: [],
  bookings: [],
  rooms: ["read", "update"],
  guests: [],
  reports: [],
});

// MAINTENANCE: Can view and update room status
export const maintenance = ac.newRole({
  dashboard: ["read"],
  staff: [],
  bookings: [],
  rooms: ["read", "update"],
  guests: [],
  reports: [],
});

// Export roles map for better-auth plugin
export const roles = {
  ADMIN: admin,
  MANAGER: manager,
  FRONT_DESK: frontDesk,
  HOUSEKEEPING: housekeeping,
  MAINTENANCE: maintenance,
};
