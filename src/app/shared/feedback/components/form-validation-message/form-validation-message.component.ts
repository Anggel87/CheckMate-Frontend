import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-validation-message',
  standalone: true,
  template: `
    @if (message) {
      <p class="checkmate-field-error" [id]="id" role="alert">
        <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
        <span>{{ message }}</span>
      </p>
    }
  `,
})
export class FormValidationMessageComponent {
  @Input() id = '';
  @Input() message = '';
}
