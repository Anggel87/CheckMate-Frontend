import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { TopbarComponent } from '../components/topbar/topbar.component';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-shell" [class.is-sidebar-collapsed]="sidebarCollapsed()">
      <app-sidebar
        [collapsed]="sidebarCollapsed()"
        [mobileOpen]="mobileSidebarOpen()"
        (collapseToggle)="toggleSidebar()"
        (closeMobile)="closeMobileSidebar()"
      />

      <button
        type="button"
        class="app-mobile-overlay"
        [class.is-visible]="mobileSidebarOpen()"
        aria-label="Cerrar menú"
        (click)="closeMobileSidebar()"
      ></button>

      <div class="app-main">
        <app-topbar (menuToggle)="toggleNavigation()" />

        <main class="app-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AuthenticatedLayoutComponent {
  readonly sidebarCollapsed = signal(false);
  readonly mobileSidebarOpen = signal(false);

  @HostListener('window:resize')
  handleResize(): void {
    if (this.isDesktop()) {
      this.mobileSidebarOpen.set(false);
    }
  }

  toggleNavigation(): void {
    if (this.isDesktop()) {
      this.toggleSidebar();
      return;
    }

    this.mobileSidebarOpen.update((open) => !open);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  private isDesktop(): boolean {
    return typeof window !== 'undefined' && window.innerWidth >= 992;
  }
}
