import type { UserRole } from "../constants/user-roles.js";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}