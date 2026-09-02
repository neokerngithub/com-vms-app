/** Central permission rules for VMS. UI stays unchanged — these only gate actions. */

export const SUPER_ADMIN_EMAILS = [
  "vms.app.nepal@gmail.com",
  "neokern.np@gmail.com",
  "kiran@modernedge.com.np",
] as const;

export function isSuperAdminEmail(email?: string | null) {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(
    email.trim().toLowerCase() as (typeof SUPER_ADMIN_EMAILS)[number],
  );
}

export type VmsRole = "Admin" | "Verified Valuator" | "Guest";

export function roleOf(isAdmin: boolean, isVerified?: boolean | null): VmsRole {
  if (isAdmin) return "Admin";
  return isVerified ? "Verified Valuator" : "Guest";
}

/** Only admins and verified valuators may publish new valuation records. */
export function canPublish(isAdmin: boolean, isVerified?: boolean | null) {
  return isAdmin || Boolean(isVerified);
}

/** Creators edit their own entries; admins moderate everything. */
export function canEditRecord(
  userId: string | undefined | null,
  createdBy: string,
  isAdmin: boolean,
) {
  return isAdmin || (Boolean(userId) && userId === createdBy);
}

/** Deletion is an admin-only moderation action. */
export function canDeleteRecord(isAdmin: boolean) {
  return isAdmin;
}
