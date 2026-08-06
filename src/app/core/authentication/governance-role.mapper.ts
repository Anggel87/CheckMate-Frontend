import { UserRole } from '../enums/user-role.enum';

const GOVERNANCE_ROLE_MAP: Record<string, UserRole> = {
  administrador: UserRole.ADMIN,
  director_carrera: UserRole.CAREER_DIRECTOR,
  profesor: UserRole.TEACHER,
  tutor_academico: UserRole.TUTOR_TEACHER,
  alumno: UserRole.STUDENT,
};

export function mapGovernanceRole(role: string | null): UserRole | null {
  if (!role) {
    return null;
  }

  return GOVERNANCE_ROLE_MAP[role] ?? null;
}
