import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    <nav class="pagination-control" aria-label="Paginación">
      <button
        type="button"
        class="icon-button"
        aria-label="Página anterior"
        [disabled]="page <= 1"
        (click)="goTo(page - 1)"
      >
        <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
      </button>

      <span>Página {{ page }} de {{ totalPages }}</span>

      <button
        type="button"
        class="icon-button"
        aria-label="Página siguiente"
        [disabled]="page >= totalPages"
        (click)="goTo(page + 1)"
      >
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
      </button>
    </nav>
  `,
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() totalPages = 1;
  @Output() readonly pageChange = new EventEmitter<number>();

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) {
      return;
    }

    this.pageChange.emit(page);
  }
}
