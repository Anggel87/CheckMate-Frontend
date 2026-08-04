import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  template: `
    <button
      type="button"
      class="icon-button"
      [attr.aria-label]="label"
      [title]="label"
      [disabled]="disabled"
      (click)="pressed.emit()"
    >
      <i [class]="icon" aria-hidden="true"></i>
    </button>
  `,
})
export class IconButtonComponent {
  @Input() icon = 'fa-solid fa-circle';
  @Input() label = 'Acción';
  @Input() disabled = false;
  @Output() readonly pressed = new EventEmitter<void>();
}
