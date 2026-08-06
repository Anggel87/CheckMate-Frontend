import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../core/authentication/auth.service';

interface LandingNavItem {
  label: string;
  targetId: string;
}

@Component({
  selector: 'app-landing-navbar',
  standalone: true,
  templateUrl: './landing-navbar.component.html',
  styleUrl: './landing-navbar.component.css',
})
export class LandingNavbarComponent {
  private readonly authService = inject(AuthService);

  protected readonly navItems: LandingNavItem[] = [
    { label: 'Sistema', targetId: 'overview' },
    { label: 'Caracteristicas', targetId: 'features' },
    { label: 'Funcionamiento', targetId: 'process' },
    { label: 'Beneficios', targetId: 'benefits' },
  ];

  protected scrollTo(event: Event, targetId: string): void {
    event.preventDefault();

    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';

    target.scrollIntoView({ behavior, block: 'start' });
  }

  protected openPortal(): void {
    this.authService.login();
  }
}
