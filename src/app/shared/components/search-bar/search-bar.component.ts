import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  template: `
    <label class="search-bar">
      <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
      <span class="visually-hidden">{{ label }}</span>
      <input
        type="search"
        [placeholder]="placeholder"
        [value]="value"
        (input)="onInput($event)"
      />
      @if (value) {
        <button type="button" aria-label="Limpiar búsqueda" (click)="clear()">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      }
    </label>
  `,
})
export class SearchBarComponent {
  @Input() label = 'Buscar';
  @Input() placeholder = 'Buscar';
  @Input() value = '';
  @Output() readonly valueChange = new EventEmitter<string>();

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.valueChange.emit(this.value);
  }

  clear(): void {
    this.value = '';
    this.valueChange.emit('');
  }
}
