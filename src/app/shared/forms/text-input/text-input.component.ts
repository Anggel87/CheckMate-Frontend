import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormValidationMessageComponent } from '../../feedback/components/form-validation-message/form-validation-message.component';

let textInputId = 0;

@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [FormValidationMessageComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInputComponent),
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
      <input
        class="checkmate-input"
        [class.is-invalid]="hasError()"
        [id]="inputId"
        [type]="type"
        [placeholder]="placeholder"
        [autocomplete]="autocomplete"
        [disabled]="disabled"
        [value]="value"
        [attr.required]="required ? true : null"
        [attr.aria-invalid]="hasError()"
        [attr.aria-describedby]="hasError() ? errorId : null"
        (input)="onInput($event)"
        (blur)="markTouched()"
      />
      <app-form-validation-message [id]="errorId" [message]="errorMessage" />
    </div>
  `,
})
export class TextInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() autocomplete = 'off';
  @Input() type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' = 'text';
  @Input() required = false;
  @Input() errorMessage = '';
  @Input() inputId = `text-input-${textInputId++}`;

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

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
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
