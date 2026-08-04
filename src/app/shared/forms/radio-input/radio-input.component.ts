import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormValidationMessageComponent } from '../../feedback/components/form-validation-message/form-validation-message.component';

export interface RadioInputOption {
  label: string;
  value: string;
}

let radioInputId = 0;

@Component({
  selector: 'app-radio-input',
  standalone: true,
  imports: [FormValidationMessageComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioInputComponent),
      multi: true,
    },
  ],
  template: `
    <fieldset class="checkmate-form-field checkmate-radio-group" [attr.aria-describedby]="hasError() ? errorId : null">
      <legend class="checkmate-label">
        {{ label }}
        @if (required) {
          <span aria-hidden="true">*</span>
        }
      </legend>
      @for (option of options; track option.value) {
        <label class="checkmate-radio">
          <input
            type="radio"
            [name]="name"
            [value]="option.value"
            [checked]="value === option.value"
            [disabled]="disabled"
            [attr.required]="required ? true : null"
            (change)="select(option.value)"
            (blur)="markTouched()"
          />
          <span>{{ option.label }}</span>
        </label>
      }
      <app-form-validation-message [id]="errorId" [message]="errorMessage" />
    </fieldset>
  `,
})
export class RadioInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() required = false;
  @Input() errorMessage = '';
  @Input() name = `radio-input-${radioInputId++}`;
  @Input() options: RadioInputOption[] = [];

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

  protected select(value: string): void {
    this.value = value;
    this.onChange(value);
  }

  protected markTouched(): void {
    this.onTouched();
  }

  protected hasError(): boolean {
    return this.errorMessage.trim().length > 0;
  }

  protected get errorId(): string {
    return `${this.name}-error`;
  }
}
