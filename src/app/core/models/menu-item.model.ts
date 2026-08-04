import { UserRole } from '../enums/user-role.enum';

export interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
  permission?: string;
  children?: NavigationItem[];
}

export interface QuickAction {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
  permission?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface BreadcrumbItem {
  label: string;
  route?: string;
}
