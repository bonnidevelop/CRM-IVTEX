export const USER_ROLES = [
  "admin",
  "sales_manager",
  "sales_executive",
] as const;

export type UserRole = (typeof USER_ROLES)[number];