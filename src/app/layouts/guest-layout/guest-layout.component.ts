import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-guest-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main class="guest-shell">
      <section class="guest-shell__brand" aria-label="CheckMate">
        <img src="/favicon.ico" alt="Logo de CheckMate" />
        <strong>CheckMate</strong>
        <span>Portal académico</span>
      </section>

      <section class="guest-shell__panel">
        <router-outlet />
      </section>
    </main>
  `,
})
export class GuestLayoutComponent {}
