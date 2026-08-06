import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../../core/authentication/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  template: `
    <section class="login-redirect" aria-live="polite">
      <i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i>
      <h1>Redirigiendo al inicio de sesion</h1>
      <p>La autenticacion se realiza desde la gobernanza centralizada de CheckMate.</p>
      <button type="button" class="btn-checkmate btn-checkmate-primary" (click)="redirect()">
        <i class="fa-solid fa-arrow-right-to-bracket" aria-hidden="true"></i>
        <span>Continuar</span>
      </button>
    </section>
  `,
  styles: [
    `
      .login-redirect {
        display: flex;
        min-height: min(420px, 100vh);
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        padding: 48px 24px;
        text-align: center;
      }

      .login-redirect i {
        color: var(--checkmate-info, #007aff);
        font-size: 24px;
      }

      .login-redirect h1 {
        margin: 0;
        color: var(--checkmate-text-primary, #1d1d1f);
        font-size: 24px;
        font-weight: 700;
      }

      .login-redirect p {
        max-width: 360px;
        margin: 0;
        color: var(--checkmate-text-secondary, #6e6e73);
        font-size: 15px;
      }
    `,
  ],
})
export class LoginPageComponent implements OnInit {
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.redirect();
  }

  protected redirect(): void {
    this.authService.login();
  }
}
