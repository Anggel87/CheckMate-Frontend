import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbItem } from '../../../core/models/menu-item.model';

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (items.length) {
      <nav class="breadcrumbs" aria-label="Ruta de navegación">
        @for (item of items; track item.label; let last = $last) {
          @if (item.route && !last) {
            <a [routerLink]="item.route">{{ item.label }}</a>
          } @else {
            <span [attr.aria-current]="last ? 'page' : null">{{ item.label }}</span>
          }

          @if (!last) {
            <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
          }
        }
      </nav>
    }
  `,
})
export class BreadcrumbsComponent {
  @Input() items: BreadcrumbItem[] = [];
}
