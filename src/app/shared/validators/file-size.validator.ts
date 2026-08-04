import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function maxFileSizeValidator(maxSizeInBytes: number): ValidatorFn {
  return (control: AbstractControl<File | File[] | null>): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const files = Array.isArray(value) ? value : [value];
    const exceedsLimit = files.some((file) => file.size > maxSizeInBytes);

    return exceedsLimit ? { fileSize: { maxSizeInBytes } } : null;
  };
}
