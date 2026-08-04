import { environment } from '../../../environments/environment';
import { ADMIN_MENU } from '../../roles/admin/config/admin-menu.config';
import { CAREER_DIRECTOR_MENU } from '../../roles/career-director/config/career-director-menu.config';
import { STUDENT_MENU } from '../../roles/student/config/student-menu.config';
import { TEACHER_MENU } from '../../roles/teacher/config/teacher-menu.config';
import { TUTOR_TEACHER_MENU } from '../../roles/tutor-teacher/config/tutor-teacher-menu.config';
import { UserRole } from '../enums/user-role.enum';
import { NavigationItem } from '../models/menu-item.model';

export const NAVIGATION_BY_ROLE: Record<UserRole, NavigationItem[]> = {
  [UserRole.ADMIN]: ADMIN_MENU,
  [UserRole.CAREER_DIRECTOR]: CAREER_DIRECTOR_MENU,
  [UserRole.TEACHER]: TEACHER_MENU,
  [UserRole.TUTOR_TEACHER]: TUTOR_TEACHER_MENU,
  [UserRole.STUDENT]: STUDENT_MENU,
};

const UI_SHOWCASE_MENU_ITEM: NavigationItem = {
  label: 'UI Showcase',
  icon: 'fa-solid fa-wand-magic-sparkles',
  route: '/admin/ui-showcase',
};

export function getNavigationForRole(role: UserRole): NavigationItem[] {
  const items = NAVIGATION_BY_ROLE[role];

  if (!environment.production && role === UserRole.ADMIN) {
    return [...items, UI_SHOWCASE_MENU_ITEM];
  }

  return items;
}
