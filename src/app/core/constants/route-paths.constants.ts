import { UserRole } from '../enums/user-role.enum';

export const ROUTE_PATHS = {
  auth: '/auth',
  login: '/auth/login',
  authCallback: '/auth/callback',
  forbidden: '/forbidden',
  notFound: '/not-found',
  serverError: '/server-error',
  roleHome: {
    [UserRole.ADMIN]: '/admin/dashboard',
    [UserRole.CAREER_DIRECTOR]: '/director/dashboard',
    [UserRole.TEACHER]: '/teacher/dashboard',
    [UserRole.TUTOR_TEACHER]: '/tutor/dashboard',
    [UserRole.STUDENT]: '/student/dashboard',
  },
  rolePrefix: {
    [UserRole.ADMIN]: '/admin',
    [UserRole.CAREER_DIRECTOR]: '/director',
    [UserRole.TEACHER]: '/teacher',
    [UserRole.TUTOR_TEACHER]: '/tutor',
    [UserRole.STUDENT]: '/student',
  },
} as const;
