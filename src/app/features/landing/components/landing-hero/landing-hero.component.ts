import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../core/authentication/auth.service';

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  templateUrl: './landing-hero.component.html',
  styleUrl: './landing-hero.component.css',
})
export class LandingHeroComponent {
  private readonly authService = inject(AuthService);

  protected openPortal(): void {
    this.authService.login();
  }

  protected scrollToOverview(event: Event): void {
    event.preventDefault();

    const target = document.getElementById('overview');

    if (!target) {
      return;
    }

    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';

    target.scrollIntoView({ behavior, block: 'start' });
  }
}
