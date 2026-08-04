import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/authentication/auth.service';
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
        <span class="avatar">{{ authService.currentUser()?.initials ?? 'CM' }}</span>
        <span class="profile-menu__summary">
          <strong>{{ authService.currentUser()?.fullName ?? 'Usuario' }}</strong>
          <small>{{ roleLabel() }}</small>
        </span>
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
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

          <a routerLink="/student/profile" (click)="open.set(false)">
            <i class="fa-solid fa-user" aria-hidden="true"></i>
            <span>Mi perfil</span>
          </a>
          <a routerLink="/admin/settings" (click)="open.set(false)">
            <i class="fa-solid fa-gear" aria-hidden="true"></i>
            <span>Configuración</span>
          </a>
          <button type="button" (click)="signOut()">
            <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
            <span>Cerrar sesión</span>
          </button>
        </section>
      }
    </div>
  `,
})
export class ProfileMenuComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
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

  signOut(): void {
    this.authService.signOut();
    this.open.set(false);
    void this.router.navigateByUrl('/auth/login');
  }
}
