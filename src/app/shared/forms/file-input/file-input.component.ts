import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormValidationMessageComponent } from '../../feedback/components/form-validation-message/form-validation-message.component';

let fileInputId = 0;

type FileInputValue = File | File[] | null;

@Component({
  selector: 'app-file-input',
  standalone: true,
  imports: [FormValidationMessageComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileInputComponent),
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
        type="file"
        [accept]="accept"
        [multiple]="multiple"
        [disabled]="disabled"
        [attr.required]="required ? true : null"
        [attr.aria-invalid]="hasError()"
        [attr.aria-describedby]="hasError() ? errorId : null"
        (change)="onFilesSelected($event)"
        (blur)="markTouched()"
      />
      <app-form-validation-message [id]="errorId" [message]="errorMessage" />
    </div>
  `,
})
export class FileInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() accept = '';
  @Input() multiple = false;
  @Input() required = false;
  @Input() errorMessage = '';
  @Input() inputId = `file-input-${fileInputId++}`;

  protected disabled = false;
  private onChange: (value: FileInputValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(): void {
    return undefined;
  }

  registerOnChange(fn: (value: FileInputValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.onChange(this.multiple ? files : files[0] ?? null);
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
