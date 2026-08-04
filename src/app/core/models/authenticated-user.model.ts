import { UserRole } from '../enums/user-role.enum';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  permissions: string[];
  initials: string;
  token?: string;
  avatarUrl?: string;
  career?: string;
  group?: string;
}
