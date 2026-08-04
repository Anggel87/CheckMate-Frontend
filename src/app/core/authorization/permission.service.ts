import { Injectable, inject } from '@angular/core';
import { AuthService } from '../authentication/auth.service';
import { UserRole } from '../enums/user-role.enum';
import { NavigationItem, QuickAction } from '../models/menu-item.model';

type Authorizable = {
  roles?: UserRole[];
  permission?: string;
};

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly authService = inject(AuthService);

  hasRole(roles: UserRole[] | undefined): boolean {
    const currentRole = this.authService.currentUser()?.role;
    return !roles?.length || (currentRole !== undefined && roles.includes(currentRole));
  }

  hasPermission(permission: string | undefined): boolean {
    const permissions = this.authService.currentUser()?.permissions ?? [];
    return !permission || permissions.includes('*') || permissions.includes(permission);
  }

  canAccess(item: Authorizable): boolean {
    return this.hasRole(item.roles) && this.hasPermission(item.permission);
  }

  filterNavigation(items: NavigationItem[]): NavigationItem[] {
    return items
      .filter((item) => this.canAccess(item))
      .map((item) => ({
        ...item,
        children: item.children ? this.filterNavigation(item.children) : undefined,
      }));
  }

  filterActions(actions: QuickAction[]): QuickAction[] {
    return actions.filter((action) => this.canAccess(action));
  }
}
