import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormValidationMessageComponent } from '../../feedback/components/form-validation-message/form-validation-message.component';

export interface SelectInputOption {
  label: string;
  value: string;
}

let selectInputId = 0;

@Component({
  selector: 'app-select-input',
  standalone: true,
  imports: [FormValidationMessageComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="checkmate-form-field">
      <label class="checkmate-label" [for]="inputId">
        {{ label }}
        @if (required) {
          <span aria-hidden="true">*</span>
        }
      </label>
      <select
        class="checkmate-select"
        [class.is-invalid]="hasError()"
        [id]="inputId"
        [disabled]="disabled"
        [value]="value"
        [attr.required]="required ? true : null"
        [attr.aria-invalid]="hasError()"
        [attr.aria-describedby]="hasError() ? errorId : null"
        (change)="onSelect($event)"
        (blur)="markTouched()"
      >
        @if (placeholder) {
          <option value="">{{ placeholder }}</option>
        }
        @for (option of options; track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
      <app-form-validation-message [id]="errorId" [message]="errorMessage" />
    </div>
  `,
})
export class SelectInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Selecciona una opción';
  @Input() required = false;
  @Input() errorMessage = '';
  @Input() inputId = `select-input-${selectInputId++}`;
  @Input() options: SelectInputOption[] = [];

  protected value = '';
  protected disabled = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  protected onSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.value = select.value;
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
