export enum UserRole {
  ADMIN = 'ADMIN',
  CAREER_DIRECTOR = 'CAREER_DIRECTOR',
  TEACHER = 'TEACHER',
  TUTOR_TEACHER = 'TUTOR_TEACHER',
  STUDENT = 'STUDENT',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.CAREER_DIRECTOR]: 'Director de carrera',
  [UserRole.TEACHER]: 'Profesor',
  [UserRole.TUTOR_TEACHER]: 'Profesor tutor',
  [UserRole.STUDENT]: 'Alumno',
};

export function getUserRoleLabel(role: UserRole): string {
  return USER_ROLE_LABELS[role];
}
