import { Component, Input } from '@angular/core';

export type StatusBadgeTone = 'present' | 'late' | 'absent' | 'justified' | 'pending' | 'success' | 'info' | 'warning' | 'danger' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="status-badge" [class]="'status-badge status-badge--' + tone">
      @if (icon) {
        <i [class]="icon" aria-hidden="true"></i>
      }
      <span>{{ label }}</span>
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() tone: StatusBadgeTone = 'neutral';
}
