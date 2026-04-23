export const USER_ROLES = ["manager", "sales"] as const;

export type UserRole = (typeof USER_ROLES)[number];