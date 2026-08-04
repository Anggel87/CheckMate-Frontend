import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TOAST_ICON_BY_TYPE } from '../../constants/feedback-config.constants';
import { ToastNotification } from '../../models/toast.model';

@Component({
  selector: 'app-toast-item',
  standalone: true,
  template: `
    <article
      class="checkmate-toast"
      [class]="'checkmate-toast checkmate-toast--' + toast.type"
      [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'"
      role="status"
    >
      <span class="checkmate-toast__icon" aria-hidden="true">
        <i [class]="iconClass()"></i>
      </span>

      <span class="checkmate-toast__content">
        <strong>{{ toast.title }}</strong>
        <span>{{ toast.message }}</span>
      </span>

      @if (toast.dismissible) {
        <button
          type="button"
          class="checkmate-toast__close"
          aria-label="Cerrar notificación"
          (click)="closed.emit(toast.id)"
        >
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      }
    </article>
  `,
})
export class ToastItemComponent {
  @Input({ required: true }) toast!: ToastNotification;
  @Output() readonly closed = new EventEmitter<string>();

  iconClass(): string {
    return TOAST_ICON_BY_TYPE[this.toast.type];
  }
}
