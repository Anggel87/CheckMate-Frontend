import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../core/authentication/auth.service';

@Component({
  selector: 'app-landing-cta',
  standalone: true,
  templateUrl: './landing-cta.component.html',
  styleUrl: './landing-cta.component.css',
})
export class LandingCtaComponent {
  private readonly authService = inject(AuthService);

  protected openPortal(): void {
    this.authService.login();
  }
}
