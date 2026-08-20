import { computed, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, switchMap, timeout } from 'rxjs';
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
  checkmatePortalUrl,
} from './auth-redirect-url.util';
import { apiErrorMessage } from '../../shared/utils/api-error.util';

interface AuthOutcome {
  user: AuthenticatedUser | null;
  message: string | null;
}

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
    let url: string;

    try {
      url = buildGovernanceLoginUrl(returnPathOrUrl);
    } catch (error) {
      console.error('[CheckMate] No se pudo construir la URL de login de gobernanza.', {
        governanceLoginUrl: environment.governanceLoginUrl,
        governanceBaseUrl: environment.governanceBaseUrl,
        error,
      });
      this.toastService.error(
        'No se pudo abrir el portal',
        'La URL de inicio de sesion no es valida. Revisa la consola para mas detalle.',
      );

      return;
    }

    console.info('[CheckMate] Redirigiendo a gobernanza:', url);
    window.location.assign(url);
  }

  completeRedirect(code: string, returnUrl = checkmatePortalUrl()) {
    const request: GovernanceCodeExchangeRequest = {
      code,
      client_id: environment.governanceClientId,
      return_url: returnUrl,
      device_name: 'web-redirect',
    };

    console.info('[CheckMate] Intercambiando codigo de gobernanza:', {
      url: `${environment.governanceApiUrl}/auth/exchange-code`,
      client_id: request.client_id,
      return_url: request.return_url,
    });

    return this.http
      .post<ApiResponse<GovernanceAuthPayload>>(
        `${environment.governanceApiUrl}/auth/exchange-code`,
        request,
      )
      .pipe(
        switchMap((response) => {
          const payload = response?.data;

          return payload?.token && payload.token_type && payload.user
            ? this.toAuthenticatedUser(payload.token, payload.token_type, payload.user)
            : of<AuthOutcome>({ user: null, message: null });
        }),
        catchError((error) => {
          console.error('[CheckMate] Fallo el intercambio de codigo con gobernanza.', error);

          return of<AuthOutcome>({ user: null, message: apiErrorMessage(error, '') || null });
        }),
      )
      .subscribe((outcome) => this.handleAuthenticatedUser(outcome));
  }

  signOut(): void {
    const token = this.sessionService.authToken();
    const tokenType = this.sessionService.tokenType() ?? 'Bearer';
    const redirectToLanding = () => void this.router.navigateByUrl('/', { replaceUrl: true });

    this.sessionService.clear();

    if (!token) {
      redirectToLanding();
      return;
    }

    this.http
      .post(
        `${environment.governanceApiUrl}/auth/logout`,
        {},
        { headers: { Authorization: `${tokenType} ${token}` } },
      )
      .pipe(
        timeout(3000),
        catchError(() => of(null)),
        finalize(redirectToLanding),
      )
      .subscribe();
  }

  getHomeUrl(): string {
    const role = this.currentUser()?.role;
    return role ? ROUTE_PATHS.roleHome[role] : ROUTE_PATHS.login;
  }

  updateProfileSummary(avatarUrl: string, shortName: string): void {
    if (avatarUrl || shortName) {
      this.sessionService.updateProfileSummary(avatarUrl, shortName);
    }
  }

  private toAuthenticatedUser(
    token: string,
    tokenType: string,
    user: GovernanceUser,
  ): Observable<AuthOutcome> {
    const role = mapGovernanceRole(user.role);

    if (!role) {
      return of({ user: null, message: null });
    }

    return this.http
      .get<ApiResponse<{ permissions: string[] }>>(`${environment.checkmateApiUrl}/me`, {
        headers: { Authorization: `${tokenType} ${token}` },
      })
      .pipe(
        map((response) => ({
          user: {
            id: user.id,
            fullName: user.name,
            email: user.email,
            role,
            initials: this.buildInitials(user.name),
            permissions: response.data?.permissions ?? [],
            token,
            tokenType,
          },
          message: null,
        })),
        catchError((error) => of<AuthOutcome>({ user: null, message: apiErrorMessage(error, '') || null })),
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

  private handleAuthenticatedUser(outcome: AuthOutcome): void {
    if (outcome.user) {
      this.sessionService.setUser(outcome.user);
      void this.router.navigateByUrl(this.getHomeUrl(), { replaceUrl: true });
      return;
    }

    this.toastService.error(
      'No se pudo iniciar sesion',
      outcome.message ?? 'Tu sesion no pudo validarse en este portal.',
    );
    this.login();
  }
}
