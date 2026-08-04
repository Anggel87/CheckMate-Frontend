import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormValidationMessageComponent } from '../../feedback/components/form-validation-message/form-validation-message.component';

let checkboxInputId = 0;

@Component({
  selector: 'app-checkbox-input',
  standalone: true,
  imports: [FormValidationMessageComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="checkmate-form-field">
      <label class="checkmate-checkbox" [for]="inputId">
        <input
          [id]="inputId"
          type="checkbox"
          [checked]="value"
          [disabled]="disabled"
          [attr.aria-invalid]="hasError()"
          [attr.aria-describedby]="hasError() ? errorId : null"
          (change)="onToggle($event)"
          (blur)="markTouched()"
        />
        <span>{{ label }}</span>
      </label>
      <app-form-validation-message [id]="errorId" [message]="errorMessage" />
    </div>
  `,
})
export class CheckboxInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() errorMessage = '';
  @Input() inputId = `checkbox-input-${checkboxInputId++}`;

  protected value = false;
  protected disabled = false;
  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: boolean | null): void {
    this.value = value ?? false;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  protected onToggle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.checked;
    this.onChange(this.value);
  }

  protected markTouched(): void {
    this.onTouched();
  }

  protected hasError(): boolean {
    return this.errorMessage.trim().length > 0;
  }

  protected get errorId(): string {
    return `${this.inputId}-error`;
  }
}
