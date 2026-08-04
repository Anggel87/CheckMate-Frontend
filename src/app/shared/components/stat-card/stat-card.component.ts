import { Component, Input } from '@angular/core';

export type StatCardTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <article class="stat-card" [class]="'stat-card stat-card--' + tone">
      <span class="stat-card__icon" aria-hidden="true">
        <i [class]="icon"></i>
      </span>
      <div>
        <span class="stat-card__label">{{ title }}</span>
        <strong>{{ value }}</strong>
        @if (description || trend) {
          <p>
            @if (description) {
              <span>{{ description }}</span>
            }
            @if (trend) {
              <small>{{ trend }}</small>
            }
          </p>
        }
      </div>
    </article>
  `,
})
export class StatCardComponent {
  @Input() title = '';
  @Input() value = '';
  @Input() description = '';
  @Input() icon = 'fa-solid fa-chart-simple';
  @Input() tone: StatCardTone = 'neutral';
  @Input() trend = '';
}
