import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/authentication/auth.service';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constants';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div class="auth-callback">
      <i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i>
      <p>Verificando tu sesión...</p>
    </div>
  `,
  styles: [
    `
      .auth-callback {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 48px 24px;
        color: var(--checkmate-text-secondary, #6e6e73);
        font-size: 15px;
      }

      .auth-callback i {
        font-size: 24px;
        color: var(--checkmate-info, #007aff);
      }
    `,
  ],
})
export class AuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const tokenType = this.route.snapshot.queryParamMap.get('token_type');

    if (token && tokenType) {
      this.authService.completeCallback(token, tokenType);
    } else {
      void this.router.navigateByUrl(ROUTE_PATHS.login);
    }
  }
}
