import { computed, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CHECKMATE_ROLE_USERS } from '../mocks/auth.mock';
import { ApiResponse } from '../models/api-response.model';
import { AuthenticatedUser } from '../models/authenticated-user.model';
import { ROUTE_PATHS } from '../constants/route-paths.constants';
import { UserRole } from '../enums/user-role.enum';
import { ToastService } from '../../shared/feedback/services/toast.service';
import { GovernanceAuthMessage, GovernanceUser } from './governance-auth.model';
import { mapGovernanceRole } from './governance-role.mapper';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly sessionService = inject(SessionService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly currentUser = this.sessionService.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  private popupWindow: Window | null = null;
  private popupMessageListener: ((event: MessageEvent) => void) | null = null;

  login(): void {
    this.detachPopupListener();

    const redirectUri = `${window.location.origin}${ROUTE_PATHS.authCallback}`;
    const popupUrl =
      `${environment.governanceBaseUrl}/governance/auth` +
      `?client_id=${environment.governanceClientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    this.popupWindow = window.open(popupUrl, 'governance-login', 'width=500,height=600');

    this.popupMessageListener = (event: MessageEvent<GovernanceAuthMessage>) => {
      if (event.origin !== this.governanceOrigin() || event.data?.type !== 'governance_auth') {
        return;
      }

      const { token, token_type, user } = event.data.data;
      const authenticatedUser$ = user ? this.toAuthenticatedUser(token, token_type, user) : of(null);

      authenticatedUser$.subscribe((authenticatedUser) => {
        if (authenticatedUser) {
          this.sessionService.setUser(authenticatedUser);
          void this.router.navigateByUrl(this.getHomeUrl());
        } else {
          this.toastService.error('No se pudo iniciar sesión', 'Tu rol no está soportado en este portal.');
        }
      });

      this.popupWindow?.close();
      this.detachPopupListener();
    };

    window.addEventListener('message', this.popupMessageListener);
  }

  completeCallback(token: string, tokenType: string) {
    return this.http
      .get<ApiResponse<GovernanceUser>>(`${environment.governanceApiUrl}/auth/me`, {
        headers: { Authorization: `${tokenType} ${token}` },
      })
      .pipe(
        catchError(() => of(null)),
        switchMap((response) =>
          response?.data ? this.toAuthenticatedUser(token, tokenType, response.data) : of(null),
        ),
      )
      .subscribe((authenticatedUser) => {
        if (authenticatedUser) {
          this.sessionService.setUser(authenticatedUser);
          void this.router.navigateByUrl(this.getHomeUrl());
          return;
        }

        this.toastService.error('No se pudo iniciar sesión', 'Tu rol no está soportado en este portal.');
        void this.router.navigateByUrl(ROUTE_PATHS.login);
      });
  }

  signOut(): void {
    const token = this.sessionService.authToken();
    const tokenType = this.sessionService.tokenType() ?? 'Bearer';

    this.sessionService.clear();

    if (!token) {
      return;
    }

    this.http
      .post(
        `${environment.governanceApiUrl}/auth/logout`,
        {},
        { headers: { Authorization: `${tokenType} ${token}` } },
      )
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  signInAs(role: UserRole): string {
    this.sessionService.setUser(CHECKMATE_ROLE_USERS[role]);
    return ROUTE_PATHS.roleHome[role];
  }

  getHomeUrl(): string {
    const role = this.currentUser()?.role;
    return role ? ROUTE_PATHS.roleHome[role] : ROUTE_PATHS.login;
  }

  private toAuthenticatedUser(
    token: string,
    tokenType: string,
    user: GovernanceUser,
  ): Observable<AuthenticatedUser | null> {
    const role = mapGovernanceRole(user.role);

    if (!role) {
      return of(null);
    }

    return this.http
      .get<ApiResponse<{ permissions: string[] }>>(`${environment.checkmateApiUrl}/me`, {
        headers: { Authorization: `${tokenType} ${token}` },
      })
      .pipe(
        map((response) => ({
          id: user.id,
          fullName: user.name,
          email: user.email,
          role,
          initials: this.buildInitials(user.name),
          permissions: response.data?.permissions ?? [],
          token,
          tokenType,
        })),
        catchError(() => of(null)),
      );
  }

  private buildInitials(fullName: string): string {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  private governanceOrigin(): string {
    return new URL(environment.governanceBaseUrl).origin;
  }

  private detachPopupListener(): void {
    if (this.popupMessageListener) {
      window.removeEventListener('message', this.popupMessageListener);
      this.popupMessageListener = null;
    }
  }
}
