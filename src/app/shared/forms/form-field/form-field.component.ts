import { Component, Input } from '@angular/core';
import { FormValidationMessageComponent } from '../../feedback/components/form-validation-message/form-validation-message.component';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [FormValidationMessageComponent],
  template: `
    <div class="checkmate-form-field">
      @if (label) {
        <label class="checkmate-label" [for]="forId">
          {{ label }}
          @if (required) {
            <span aria-hidden="true">*</span>
          }
        </label>
      }

      <ng-content />

      <app-form-validation-message [id]="errorId" [message]="errorMessage" />
    </div>
  `,
})
export class FormFieldComponent {
  @Input() label = '';
  @Input() forId = '';
  @Input() required = false;
  @Input() errorId = '';
  @Input() errorMessage = '';
}
