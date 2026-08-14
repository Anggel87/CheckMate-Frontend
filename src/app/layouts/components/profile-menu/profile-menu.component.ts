import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/authentication/auth.service';
import { ROUTE_PATHS } from '../../../core/constants/route-paths.constants';
import { getUserRoleLabel } from '../../../core/enums/user-role.enum';
import { DialogService } from '../../../shared/feedback/services/dialog.service';

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="profile-menu">
      <button
        type="button"
        class="profile-menu__button"
        aria-label="Abrir menú de perfil"
        [attr.aria-expanded]="open()"
        (click)="toggle($event)"
      >
        <span class="profile-menu__avatar">
          @if (avatarUrl()) {
            <img [src]="avatarUrl()" alt="Foto de perfil" />
          } @else {
            <span>{{ authService.currentUser()?.initials ?? 'CM' }}</span>
          }
        </span>
      </button>

      @if (open()) {
        <section class="dropdown-panel profile-menu__panel" aria-label="Menú de perfil">
          <header>
            <span class="avatar profile-menu__avatar">
              @if (avatarUrl()) {
                <img [src]="avatarUrl()" alt="Foto de perfil" />
              } @else {
                <span>{{ authService.currentUser()?.initials ?? 'CM' }}</span>
              }
            </span>
            <div>
              <strong>{{ displayName() }}</strong>
            </div>
            <span class="status-badge status-badge--info profile-menu__role-badge">{{ roleLabel() }}</span>
          </header>

          <a [routerLink]="profileRoute()" (click)="open.set(false)">
            <i class="fa-solid fa-user" aria-hidden="true"></i>
            <span>Perfil</span>
          </a>
          <button type="button" class="profile-menu__logout" [disabled]="signingOut()" (click)="signOut()">
            @if (signingOut()) {
              <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
              <span>Cerrando...</span>
            } @else {
              <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
              <span>Cerrar sesión</span>
            }
          </button>
        </section>
      }
    </div>
  `,
})
export class ProfileMenuComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialogService = inject(DialogService);
  protected readonly authService = inject(AuthService);
  protected readonly open = signal(false);
  protected readonly signingOut = signal(false);

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

  roleLabel(): string {
    const role = this.authService.currentUser()?.role;
    return role ? getUserRoleLabel(role) : '';
  }

  avatarUrl(): string {
    return this.authService.currentUser()?.avatarUrl ?? '';
  }

  displayName(): string {
    const user = this.authService.currentUser();
    return user?.shortName || user?.fullName || 'Usuario';
  }

  profileRoute(): string {
    const role = this.authService.currentUser()?.role;
    return role ? `${ROUTE_PATHS.rolePrefix[role]}/profile` : ROUTE_PATHS.login;
  }

  async signOut(): Promise<void> {
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
    this.open.set(false);
    this.authService.signOut();
  }
}
