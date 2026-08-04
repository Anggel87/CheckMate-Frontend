import { AbstractControl, FormGroup } from '@angular/forms';

export function controlErrorMessage(control: AbstractControl | null, label: string): string {
  if (!control || !(control.touched || control.dirty) || !control.errors) {
    return '';
  }

  if (control.errors['required']) {
    return `${label} es obligatorio.`;
  }

  if (control.errors['email']) {
    return 'Ingresa un correo electrónico válido.';
  }

  if (control.errors['maxlength']) {
    return `${label} supera la longitud permitida.`;
  }

  return `${label} no es válido.`;
}

export function markFormGroupTouched(form: FormGroup): void {
  Object.values(form.controls).forEach((control) => {
    control.markAsTouched();
    control.updateValueAndValidity({ onlySelf: true });
  });
}
