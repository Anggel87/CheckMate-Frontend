import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../authorization/permission.service';
import { ROUTE_PATHS } from '../constants/route-paths.constants';

export const permissionGuard: CanActivateFn = (route) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  const permission = route.data['permission'] as string | undefined;

  return permissionService.hasPermission(permission) ? true : router.createUrlTree([ROUTE_PATHS.forbidden]);
};
