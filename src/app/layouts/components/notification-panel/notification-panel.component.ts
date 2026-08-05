import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/authentication/auth.service';
import { ROUTE_PATHS } from '../../../core/constants/route-paths.constants';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="notification-menu">
      <button
        type="button"
        class="icon-button"
        aria-label="Abrir notificaciones"
        [attr.aria-expanded]="open()"
        (click)="toggle($event)"
      >
        <i class="fa-solid fa-bell" aria-hidden="true"></i>
        @if (notificationService.unreadCount() > 0) {
          <span class="notification-menu__badge">{{ notificationService.unreadCount() }}</span>
        }
      </button>

      @if (open()) {
        <section class="dropdown-panel notification-menu__panel" aria-label="Notificaciones">
          <header>
            <strong>Notificaciones</strong>
            <button type="button" (click)="notificationService.markAllAsRead()">
              Marcar leídas
            </button>
          </header>

          @if (notificationService.notifications().length) {
            <div class="notification-menu__list">
              @for (notification of notificationService.notifications(); track notification.id) {
                <a
                  class="notification-item"
                  [class.is-unread]="!notification.read"
                  [routerLink]="notificationsRoute()"
                  (click)="notificationService.markAsRead(notification.id); open.set(false)"
                >
                  <span></span>
                  <div>
                    <strong>{{ notification.title }}</strong>
                    <p>{{ notification.description }}</p>
                    <small>{{ notification.dateLabel }}</small>
                  </div>
                </a>
              }
            </div>
          } @else {
            <p class="dropdown-empty">No tienes notificaciones nuevas.</p>
          }

          <a class="dropdown-link" [routerLink]="notificationsRoute()" (click)="open.set(false)">
            Ver todas
          </a>
        </section>
      }
    </div>
  `,
})
export class NotificationPanelComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly authService = inject(AuthService);
  protected readonly notificationService = inject(NotificationService);
  protected readonly open = signal(false);

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    const target = event.target as Node | null;

    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.open.set(false);
    }
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update((open) => !open);
  }

  notificationsRoute(): string {
    const role = this.authService.currentUser()?.role;
    return role ? `${ROUTE_PATHS.rolePrefix[role]}/notifications` : ROUTE_PATHS.login;
  }
}
