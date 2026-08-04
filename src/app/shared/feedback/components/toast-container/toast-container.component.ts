import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { ToastItemComponent } from '../toast-item/toast-item.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [ToastItemComponent],
  template: `
    <section class="checkmate-toast-region" aria-label="Notificaciones">
      @for (toast of toastService.toasts(); track toast.id) {
        <app-toast-item [toast]="toast" (closed)="toastService.dismiss($event)" />
      }
    </section>
  `,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
