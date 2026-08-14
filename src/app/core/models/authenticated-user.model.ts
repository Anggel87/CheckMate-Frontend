import { UserRole } from '../enums/user-role.enum';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  permissions: string[];
  initials: string;
  token?: string;
  tokenType?: string;
  avatarUrl?: string;
  shortName?: string;
  career?: string;
  group?: string;
}
