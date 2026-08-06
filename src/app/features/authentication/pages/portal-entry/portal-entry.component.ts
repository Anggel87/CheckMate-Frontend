import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/authentication/auth.service';
import { checkmatePortalUrl } from '../../../../core/authentication/auth-redirect-url.util';

@Component({
  selector: 'app-portal-entry',
  standalone: true,
  template: `
    <div class="portal-entry">
      <i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i>
      <p>Verificando tu sesion...</p>
    </div>
  `,
  styles: [
    `
      .portal-entry {
        display: flex;
        min-height: 100vh;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 48px 24px;
        background: var(--checkmate-background, #f5f5f7);
        color: var(--checkmate-text-secondary, #6e6e73);
        font-size: 15px;
      }

      .portal-entry i {
        color: var(--checkmate-info, #007aff);
        font-size: 24px;
      }
    `,
  ],
})
export class PortalEntryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');

    if (this.authService.isAuthenticated()) {
      void this.router.navigateByUrl(this.authService.getHomeUrl(), { replaceUrl: true });
      return;
    }

    if (code) {
      this.authService.completeRedirect(code, checkmatePortalUrl());
      return;
    }

    this.authService.login();
  }
}
