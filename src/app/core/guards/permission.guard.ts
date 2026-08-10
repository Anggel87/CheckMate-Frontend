import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../authentication/auth.service';
import { PermissionService } from '../authorization/permission.service';
import { ROUTE_PATHS } from '../constants/route-paths.constants';

export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  const permission = route.data['permission'] as string | undefined;

  if (permissionService.hasPermission(permission)) {
    return true;
  }

  return authService.isAuthenticated()
    ? router.createUrlTree([authService.getHomeUrl()])
    : router.createUrlTree([ROUTE_PATHS.login]);
};
