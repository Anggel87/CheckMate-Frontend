import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/authentication/auth.service';
import { ROUTE_PATHS } from '../../../core/constants/route-paths.constants';
import { getUserRoleLabel } from '../../../core/enums/user-role.enum';

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
            <span class="avatar">{{ authService.currentUser()?.initials ?? 'CM' }}</span>
            <div>
              <strong>{{ authService.currentUser()?.fullName ?? 'Usuario' }}</strong>
              <small>{{ roleLabel() }}</small>
            </div>
          </header>

          <a [routerLink]="profileRoute()" (click)="open.set(false)">
            <i class="fa-solid fa-user" aria-hidden="true"></i>
            <span>Perfil</span>
          </a>
          <a
            [routerLink]="profileRoute()"
            [queryParams]="{ tab: 'account' }"
            (click)="open.set(false)"
          >
            <i class="fa-solid fa-id-card" aria-hidden="true"></i>
            <span>Mi cuenta</span>
          </a>
        </section>
      }
    </div>
  `,
})
export class ProfileMenuComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly authService = inject(AuthService);
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

  roleLabel(): string {
    const role = this.authService.currentUser()?.role;
    return role ? getUserRoleLabel(role) : '';
  }

  avatarUrl(): string {
    return this.authService.currentUser()?.avatarUrl ?? '';
  }

  profileRoute(): string {
    const role = this.authService.currentUser()?.role;
    return role ? `${ROUTE_PATHS.rolePrefix[role]}/profile` : ROUTE_PATHS.login;
  }
}
