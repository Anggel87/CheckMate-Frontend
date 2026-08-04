import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <span class="loading-spinner" role="status" [attr.aria-label]="label">
      <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
      @if (showLabel) {
        <span>{{ label }}</span>
      }
    </span>
  `,
})
export class LoadingSpinnerComponent {
  @Input() label = 'Cargando';
  @Input() showLabel = false;
}
