import { Component, DestroyRef, EventEmitter, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/authentication/auth.service';
import { PermissionService } from '../../../core/authorization/permission.service';
import { getNavigationForRole } from '../../../core/config/navigation.config';
import { ROUTE_PATHS } from '../../../core/constants/route-paths.constants';
import { UserRole } from '../../../core/enums/user-role.enum';
import { NavigationItem } from '../../../core/models/menu-item.model';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';
import { ProfileMenuComponent } from '../profile-menu/profile-menu.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, NotificationPanelComponent, ProfileMenuComponent],
  template: `
    <header class="checkmate-topbar">
      <div class="checkmate-topbar__left">
        <button
          type="button"
          class="icon-button"
          aria-label="Abrir navegación"
          (click)="menuToggle.emit()"
        >
          <i class="fa-solid fa-bars" aria-hidden="true"></i>
        </button>
        @if (canGoBack()) {
          <button type="button" class="icon-button" aria-label="Volver atrás" title="Volver atrás" (click)="goBack()">
            <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
          </button>
        }
        <strong>{{ currentTitle() }}</strong>
      </div>

      <div class="checkmate-topbar__actions">
        <app-notification-panel />

        @if (showScheduleShortcut()) {
          <a
            class="icon-button"
            [routerLink]="scheduleRoute()"
            aria-label="Calendario"
            title="Calendario"
          >
            <i class="fa-regular fa-calendar" aria-hidden="true"></i>
          </a>
        }

        @if (permissionService.hasPermission('settings.view')) {
          <a
            class="icon-button"
            [routerLink]="settingsRoute()"
            aria-label="Configuración"
            title="Configuración"
          >
            <i class="fa-solid fa-gear" aria-hidden="true"></i>
          </a>
        }

        <app-profile-menu />
      </div>
    </header>
  `,
})
export class TopbarComponent {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly permissionService = inject(PermissionService);

  @Output() readonly menuToggle = new EventEmitter<void>();

  /**
   * Counts in-app navigations (not just the initial page load) so the back arrow only shows
   * once there is actually somewhere in this session's history to return to. Without this, a
   * refresh or a pasted deep link on a nested page would show an arrow that, on click, sends
   * the user out of the app entirely via browser history instead of one screen back.
   */
  private readonly navigationCount = signal(0);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.navigationCount.update((count) => count + 1));
  }

  protected canGoBack(): boolean {
    const currentUrl = this.router.url.split('?')[0];
    const depth = currentUrl.split('/').filter(Boolean).length;

    return this.navigationCount() > 1 && depth > 2;
  }

  protected goBack(): void {
    this.location.back();
  }

  protected currentTitle(): string {
    const user = this.authService.currentUser();

    if (!user) {
      return 'CheckMate';
    }

    const routeTitle = this.currentRouteTitle();

    if (routeTitle) {
      return routeTitle;
    }

    const currentUrl = this.router.url.split('?')[0];
    const allItems = this.flattenNavigation(getNavigationForRole(user.role));
    return allItems.find((item) => currentUrl.startsWith(item.route))?.label ?? 'Dashboard';
  }

  protected settingsRoute(): string {
    const role = this.authService.currentUser()?.role;
    return role ? `${ROUTE_PATHS.rolePrefix[role]}/settings` : ROUTE_PATHS.login;
  }

  protected scheduleRoute(): string {
    const role = this.authService.currentUser()?.role;
    return role ? `${ROUTE_PATHS.rolePrefix[role]}/schedule` : ROUTE_PATHS.login;
  }

  protected showScheduleShortcut(): boolean {
    return (
      this.authService.currentUser()?.role === UserRole.TEACHER &&
      this.permissionService.hasPermission('schedule.view')
    );
  }

  private flattenNavigation(items: NavigationItem[]): NavigationItem[] {
    return items.flatMap((item) => [
      item,
      ...(item.children ? this.flattenNavigation(item.children) : []),
    ]);
  }

  private currentRouteTitle(): string {
    let route = this.activatedRoute.firstChild;

    while (route?.firstChild) {
      route = route.firstChild;
    }

    return (route?.snapshot.data['topbarTitle'] as string | undefined) ?? '';
  }
}
