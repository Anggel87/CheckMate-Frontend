import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function fileTypeValidator(allowedTypes: string[]): ValidatorFn {
  return (control: AbstractControl<File | File[] | null>): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const files = Array.isArray(value) ? value : [value];
    const invalid = files.some((file) => !allowedTypes.includes(file.type));

    return invalid ? { fileType: { allowedTypes } } : null;
  };
}
