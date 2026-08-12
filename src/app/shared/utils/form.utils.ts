import { AbstractControl, FormGroup } from '@angular/forms';

export function controlErrorMessage(control: AbstractControl | null, label: string): string {
  if (!control || !(control.touched || control.dirty) || !control.errors) {
    return '';
  }

  if (control.errors['server']) {
    return control.errors['server'];
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

  if (control.errors['minlength']) {
    return `${label} es demasiado corto.`;
  }

  return `${label} no es válido.`;
}

export function markFormGroupTouched(form: FormGroup): void {
  Object.values(form.controls).forEach((control) => {
    control.markAsTouched();
    control.updateValueAndValidity({ onlySelf: true });
  });
}

/** Maps a 422 field -> messages dictionary from the API onto matching form controls. */
export function applyServerErrors(form: FormGroup, fieldErrors: Record<string, string[]>): void {
  Object.entries(fieldErrors).forEach(([field, messages]) => {
    const control = form.get(field);

    if (control && messages.length > 0) {
      control.setErrors({ ...control.errors, server: messages[0] });
      control.markAsTouched();
    }
  });
}
