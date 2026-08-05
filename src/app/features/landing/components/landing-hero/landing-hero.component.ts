import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-hero.component.html',
  styleUrl: './landing-hero.component.css',
})
export class LandingHeroComponent {
  @Input({ required: true }) loginRoute = '/auth/login';

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
