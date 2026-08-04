import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="page-header">
      <div>
        @if (eyebrow) {
          <span class="page-header__eyebrow">{{ eyebrow }}</span>
        }
        <h1>{{ title }}</h1>
        @if (description) {
          <p>{{ description }}</p>
        }
      </div>

      @if (actionLabel) {
        @if (actionRoute) {
          <a class="btn-checkmate btn-checkmate-primary" [routerLink]="actionRoute">
            @if (actionIcon) {
              <i [class]="actionIcon" aria-hidden="true"></i>
            }
            <span>{{ actionLabel }}</span>
          </a>
        } @else {
          <button type="button" class="btn-checkmate btn-checkmate-primary" (click)="action.emit()">
            @if (actionIcon) {
              <i [class]="actionIcon" aria-hidden="true"></i>
            }
            <span>{{ actionLabel }}</span>
          </button>
        }
      }
    </header>
  `,
})
export class PageHeaderComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() actionIcon = '';
  @Input() actionRoute: string | null = null;
  @Output() readonly action = new EventEmitter<void>();
}
