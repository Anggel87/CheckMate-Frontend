import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/authentication/auth.service';
import { UserRole, getUserRoleLabel } from '../../../../core/enums/user-role.enum';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { SelectInputComponent, SelectInputOption } from '../../../../shared/forms/select-input/select-input.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, SelectInputComponent],
  template: `
    <form class="login-card" [formGroup]="form" (ngSubmit)="submit()">
      <div class="login-card__header">
        <img src="/favicon.ico" alt="Logo de CheckMate" />
        <div>
          <h1>Iniciar sesión</h1>
          <p>Selecciona un rol para probar el scaffolding inicial.</p>
        </div>
      </div>

      <app-select-input
        label="Rol de desarrollo"
        formControlName="role"
        [options]="roleOptions"
        [required]="true"
      />

      <button type="submit" class="btn-checkmate btn-checkmate-primary">
        <i class="fa-solid fa-arrow-right-to-bracket" aria-hidden="true"></i>
        <span>Entrar a CheckMate</span>
      </button>
    </form>
  `,
})
export class LoginPageComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected readonly roleOptions: SelectInputOption[] = Object.values(UserRole).map((role) => ({
    label: getUserRoleLabel(role),
    value: role,
  }));

  protected readonly form = this.formBuilder.group({
    role: this.formBuilder.control<UserRole>(UserRole.TEACHER),
  });

  protected submit(): void {
    const redirectUrl = this.authService.signInAs(this.form.controls.role.value);
    this.toastService.success('Sesión iniciada', 'El entorno de desarrollo cargó el usuario seleccionado.');
    void this.router.navigateByUrl(redirectUrl);
  }
}
