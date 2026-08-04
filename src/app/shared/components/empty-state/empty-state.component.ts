import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <section class="empty-state">
      <span class="empty-state__icon" aria-hidden="true">
        <i [class]="icon"></i>
      </span>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
      @if (actionLabel) {
        <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="action.emit()">
          @if (actionIcon) {
            <i [class]="actionIcon" aria-hidden="true"></i>
          }
          <span>{{ actionLabel }}</span>
        </button>
      }
    </section>
  `,
})
export class EmptyStateComponent {
  @Input() icon = 'fa-solid fa-inbox';
  @Input() title = 'Sin información';
  @Input() description = 'Todavía no hay registros para mostrar.';
  @Input() actionLabel = '';
  @Input() actionIcon = '';
  @Output() readonly action = new EventEmitter<void>();
}
