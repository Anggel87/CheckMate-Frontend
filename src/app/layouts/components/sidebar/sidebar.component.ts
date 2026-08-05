import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/authentication/auth.service';
import { PermissionService } from '../../../core/authorization/permission.service';
import { getNavigationForRole } from '../../../core/config/navigation.config';
import { ROUTE_PATHS } from '../../../core/constants/route-paths.constants';
import { getUserRoleLabel } from '../../../core/enums/user-role.enum';
import { NavigationItem } from '../../../core/models/menu-item.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside
      class="checkmate-sidebar"
      [class.is-collapsed]="collapsed"
      [class.is-mobile-open]="mobileOpen"
      aria-label="Navegación principal"
    >
      <div class="checkmate-sidebar__brand">
        <img src="/favicon.ico" alt="Logo de CheckMate" />
        @if (!collapsed) {
          <div>
            <strong>CheckMate</strong>
            <span>Portal del {{ roleLabel() }}</span>
          </div>
        }
      </div>

      <button
        type="button"
        class="checkmate-sidebar__collapse"
        [attr.aria-label]="collapsed ? 'Expandir menú' : 'Contraer menú'"
        (click)="collapseToggle.emit()"
      >
        <i class="fa-solid fa-table-columns" aria-hidden="true"></i>
      </button>

      <nav class="checkmate-sidebar__nav">
        @for (item of menuItems(); track item.route) {
          <a
            class="checkmate-sidebar-link"
            routerLinkActive="is-active"
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
        <a
          class="btn-checkmate btn-checkmate-light"
          [routerLink]="attendanceRoute()"
          (click)="closeMobile.emit()"
        >
          <i class="fa-solid fa-clipboard-check" aria-hidden="true"></i>
          @if (!collapsed) {
            <span>Pasar lista</span>
          }
        </a>
        <button
          type="button"
          class="checkmate-sidebar-link checkmate-sidebar-logout"
          [title]="collapsed ? 'Cerrar sesión' : ''"
          (click)="signOut()"
        >
          <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
          @if (!collapsed) {
            <span>Cerrar sesión</span>
          }
        </button>
        <a
          class="checkmate-sidebar-link"
          routerLink="/help"
          [title]="collapsed ? 'Ayuda' : ''"
          (click)="closeMobile.emit()"
        >
          <i class="fa-solid fa-circle-question" aria-hidden="true"></i>
          @if (!collapsed) {
            <span>Ayuda</span>
          }
        </a>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);
  private readonly router = inject(Router);

  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() readonly closeMobile = new EventEmitter<void>();
  @Output() readonly collapseToggle = new EventEmitter<void>();

  protected menuItems(): NavigationItem[] {
    const user = this.authService.currentUser();
    return user ? this.permissionService.filterNavigation(getNavigationForRole(user.role)) : [];
  }

  protected attendanceRoute(): string {
    const role = this.authService.currentUser()?.role;

    if (role && this.permissionService.hasPermission('attendance.view')) {
      return `${ROUTE_PATHS.rolePrefix[role]}/attendance`;
    }

    return this.authService.getHomeUrl();
  }

  protected roleLabel(): string {
    const role = this.authService.currentUser()?.role;
    return role ? getUserRoleLabel(role) : 'Usuario';
  }

  protected signOut(): void {
    this.authService.signOut();
    this.closeMobile.emit();
    void this.router.navigateByUrl('/auth/login');
  }
}
