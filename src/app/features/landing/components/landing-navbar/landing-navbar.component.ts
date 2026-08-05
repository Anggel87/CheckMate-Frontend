import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

interface LandingNavItem {
  label: string;
  targetId: string;
}

@Component({
  selector: 'app-landing-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-navbar.component.html',
  styleUrl: './landing-navbar.component.css',
})
export class LandingNavbarComponent {
  @Input({ required: true }) loginRoute = '/auth/login';

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
}
