import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  template: `
    <div class="table-skeleton" aria-label="Cargando tabla">
      @for (row of rowsArray(); track row) {
        <span></span>
      }
    </div>
  `,
})
export class TableSkeletonComponent {
  @Input() rows = 6;

  rowsArray(): number[] {
    return Array.from({ length: this.rows }, (_, index) => index);
  }
}
