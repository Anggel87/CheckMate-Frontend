import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/authentication/auth.service';
import { PermissionService } from '../../../core/authorization/permission.service';
import { getNavigationForRole } from '../../../core/config/navigation.config';
import { ROUTE_PATHS } from '../../../core/constants/route-paths.constants';
import { UserRole } from '../../../core/enums/user-role.enum';
import { NavigationItem } from '../../../core/models/menu-item.model';
import { DialogService } from '../../../shared/feedback/services/dialog.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <aside
      class="checkmate-sidebar"
      [class.is-collapsed]="collapsed"
      [class.is-mobile-open]="mobileOpen"
      aria-label="Navegacion principal"
    >
      <div class="checkmate-sidebar__brand">
        <a [routerLink]="homeRoute()" (click)="closeMobile.emit()">
          <img
            class="checkmate-sidebar__logo"
            src="/img/logos/isotipowhite.png"
            alt="CheckMate"
          />
          @if (!collapsed) {
            <span class="checkmate-sidebar__role">{{ sidebarRoleLabel() }}</span>
          }
        </a>
      </div>

      <button
        type="button"
        class="checkmate-sidebar__collapse"
        [attr.aria-label]="collapsed ? 'Expandir menu' : 'Contraer menu'"
        (click)="collapseToggle.emit()"
      >
        <i class="fa-solid fa-table-columns" aria-hidden="true"></i>
      </button>

      <nav class="checkmate-sidebar__nav">
        @for (item of menuItems(); track item.route) {
          <a
            class="checkmate-sidebar-link"
            [class.is-active]="isMenuItemActive(item)"
            [routerLink]="item.route"
            [title]="collapsed ? item.label : ''"
            (click)="closeMobile.emit()"
          >
            <i [class]="item.icon" aria-hidden="true"></i>
            @if (!collapsed) {
              <span>{{ item.label }}</span>
            }
          </a>
        }
      </nav>

      <div class="checkmate-sidebar__footer">
        @if (showSettingsLink()) {
          <a
            class="checkmate-sidebar-link"
            [routerLink]="settingsRoute()"
            [title]="collapsed ? 'Ajustes' : ''"
            (click)="closeMobile.emit()"
          >
            <i class="fa-solid fa-gear" aria-hidden="true"></i>
            @if (!collapsed) {
              <span>Ajustes</span>
            }
          </a>
        }

        @if (showTeacherAttendanceShortcut()) {
          <a
            class="btn-checkmate btn-checkmate-light"
            [routerLink]="attendanceRoute()"
            [title]="collapsed ? 'Pasar lista' : ''"
            (click)="closeMobile.emit()"
          >
            <i class="fa-solid fa-clipboard-check" aria-hidden="true"></i>
            @if (!collapsed) {
              <span>Pasar lista</span>
            }
          </a>
        }

        <button
          type="button"
          class="checkmate-sidebar-link checkmate-sidebar-logout"
          [title]="collapsed ? 'Cerrar sesion' : ''"
          [disabled]="signingOut()"
          (click)="signOut()"
        >
          @if (signingOut()) {
            <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
          } @else {
            <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
          }
          @if (!collapsed) {
            <span>{{ signingOut() ? 'Cerrando...' : 'Cerrar sesion' }}</span>
          }
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);
  private readonly dialogService = inject(DialogService);
  private readonly router = inject(Router);

  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() readonly closeMobile = new EventEmitter<void>();
  @Output() readonly collapseToggle = new EventEmitter<void>();

  protected readonly signingOut = signal(false);

  protected menuItems(): NavigationItem[] {
    const user = this.authService.currentUser();
    return user ? this.permissionService.filterNavigation(getNavigationForRole(user.role)) : [];
  }

  protected attendanceRoute(): string {
    const role = this.authService.currentUser()?.role;

    if (role === UserRole.TUTOR_TEACHER) {
      return `${ROUTE_PATHS.rolePrefix[role]}/schedule`;
    }

    if (role && this.permissionService.hasPermission('attendance.view')) {
      return `${ROUTE_PATHS.rolePrefix[role]}/attendance`;
    }

    return this.authService.getHomeUrl();
  }

  protected settingsRoute(): string {
    const role = this.authService.currentUser()?.role;
    return role ? `${ROUTE_PATHS.rolePrefix[role]}/settings` : this.authService.getHomeUrl();
  }

  protected homeRoute(): string {
    return this.authService.getHomeUrl();
  }

  protected sidebarRoleLabel(): string {
    const role = this.authService.currentUser()?.role;
    const labels: Record<UserRole, string> = {
      [UserRole.ADMIN]: 'ADMINISTRADOR',
      [UserRole.CAREER_DIRECTOR]: 'DIRECTOR',
      [UserRole.TEACHER]: 'PROFESOR',
      [UserRole.TUTOR_TEACHER]: 'TUTOR',
      [UserRole.STUDENT]: 'ALUMNO',
    };

    return role ? labels[role] : '';
  }

  protected showSettingsLink(): boolean {
    return this.permissionService.hasPermission('settings.view');
  }

  protected showTeacherAttendanceShortcut(): boolean {
    const role = this.authService.currentUser()?.role;

    return (
      (role === UserRole.TEACHER || role === UserRole.TUTOR_TEACHER) &&
      this.permissionService.hasPermission('attendance.view')
    );
  }

  protected isMenuItemActive(item: NavigationItem): boolean {
    return (
      this.isRouteActive(item.route) ||
      Boolean(item.children?.some((child) => this.isRouteActive(child.route)))
    );
  }

  protected async signOut(): Promise<void> {
    if (this.signingOut()) {
      return;
    }

    const confirmed = await this.dialogService.confirm({
      title: 'Cerrar sesion?',
      message: 'Estas seguro de que deseas cerrar tu sesion?',
      confirmText: 'Cerrar sesion',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'fa-solid fa-arrow-right-from-bracket',
    });

    if (!confirmed) {
      return;
    }

    this.signingOut.set(true);
    this.authService.signOut();
    this.closeMobile.emit();
  }

  private isRouteActive(route: string): boolean {
    const currentUrl = this.router.url.split('?')[0];
    return currentUrl === route || currentUrl.startsWith(`${route}/`);
  }
}
