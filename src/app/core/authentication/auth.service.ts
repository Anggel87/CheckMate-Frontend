import { computed, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthenticatedUser } from '../models/authenticated-user.model';
import { ROUTE_PATHS } from '../constants/route-paths.constants';
import { ToastService } from '../../shared/feedback/services/toast.service';
import {
  GovernanceAuthPayload,
  GovernanceCodeExchangeRequest,
  GovernanceUser,
} from './governance-auth.model';
import { mapGovernanceRole } from './governance-role.mapper';
import { SessionService } from './session.service';
import {
  buildGovernanceLoginUrl,
  buildGovernanceLogoutUrl,
  checkmatePortalUrl,
} from './auth-redirect-url.util';

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

  login(returnPathOrUrl = ROUTE_PATHS.portal): void {
    window.location.assign(buildGovernanceLoginUrl(returnPathOrUrl));
  }

  completeRedirect(code: string, returnUrl = checkmatePortalUrl()) {
    const request: GovernanceCodeExchangeRequest = {
      code,
      client_id: environment.governanceClientId,
      return_url: returnUrl,
      device_name: 'web-redirect',
    };

    return this.http
      .post<ApiResponse<GovernanceAuthPayload>>(
        `${environment.governanceApiUrl}/auth/exchange-code`,
        request,
      )
      .pipe(
        catchError(() => of(null)),
        switchMap((response) => {
          const payload = response?.data;

          return payload?.token && payload.token_type && payload.user
            ? this.toAuthenticatedUser(payload.token, payload.token_type, payload.user)
            : of(null);
        }),
      )
      .subscribe((authenticatedUser) => this.handleAuthenticatedUser(authenticatedUser));
  }

  signOut(): void {
    const token = this.sessionService.authToken();
    const tokenType = this.sessionService.tokenType() ?? 'Bearer';
    const logoutUrl = buildGovernanceLogoutUrl();

    this.sessionService.clear();

    if (!token) {
      window.location.assign(logoutUrl);
      return;
    }

    this.http
      .post(
        `${environment.governanceApiUrl}/auth/logout`,
        {},
        { headers: { Authorization: `${tokenType} ${token}` } },
      )
      .pipe(
        catchError(() => of(null)),
        finalize(() => window.location.assign(logoutUrl)),
      )
      .subscribe();
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

  private handleAuthenticatedUser(authenticatedUser: AuthenticatedUser | null): void {
    if (authenticatedUser) {
      this.sessionService.setUser(authenticatedUser);
      void this.router.navigateByUrl(this.getHomeUrl(), { replaceUrl: true });
      return;
    }

    this.toastService.error('No se pudo iniciar sesion', 'Tu sesion no pudo validarse en este portal.');
    this.login();
  }
}
