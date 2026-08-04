import { computed, Injectable, inject } from '@angular/core';
import { CHECKMATE_ROLE_USERS } from '../mocks/auth.mock';
import { ROUTE_PATHS } from '../constants/route-paths.constants';
import { UserRole } from '../enums/user-role.enum';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly sessionService = inject(SessionService);

  readonly currentUser = this.sessionService.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  signInAs(role: UserRole): string {
    this.sessionService.setUser(CHECKMATE_ROLE_USERS[role]);
    return ROUTE_PATHS.roleHome[role];
  }

  signOut(): void {
    this.sessionService.clear();
  }

  getHomeUrl(): string {
    const role = this.currentUser()?.role;
    return role ? ROUTE_PATHS.roleHome[role] : ROUTE_PATHS.login;
  }
}
