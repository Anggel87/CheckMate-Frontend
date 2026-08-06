import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../authentication/auth.service';
import { ROUTE_PATHS } from '../constants/route-paths.constants';
import { UserRole } from '../enums/user-role.enum';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as UserRole[] | undefined;
  const currentRole = authService.currentUser()?.role;

  if (!currentRole) {
    authService.login();
    return false;
  }

  if (!allowedRoles?.length || allowedRoles.includes(currentRole)) {
    return true;
  }

  return router.createUrlTree([ROUTE_PATHS.forbidden]);
};
