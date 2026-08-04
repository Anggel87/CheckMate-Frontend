import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `
    <section class="error-state">
      <span class="error-state__icon" aria-hidden="true">
        <i class="fa-solid fa-circle-exclamation"></i>
      </span>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
      @if (retryLabel) {
        <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="retry.emit()">
          <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
          <span>{{ retryLabel }}</span>
        </button>
      }
    </section>
  `,
})
export class ErrorStateComponent {
  @Input() title = 'No se pudo cargar la información';
  @Input() description = 'Intenta nuevamente.';
  @Input() retryLabel = 'Reintentar';
  @Output() readonly retry = new EventEmitter<void>();
}
