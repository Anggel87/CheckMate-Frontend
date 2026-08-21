import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import {
  NotificationsApiService,
  SentNotificationView,
  notificationTypeLabel,
} from '../../data-access/notifications-api.service';

@Component({
  selector: 'app-notifications-sent-list',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, EmptyStateComponent, LoadingSpinnerComponent],
  template: `
    <section class="management-page">
      <app-page-header
        title="Notificaciones"
        description="Historial de avisos enviados."
        actionLabel="Nueva Notificacion"
        actionIcon="fa-solid fa-plus"
        actionRoute="new"
      />

      @if (loading()) {
        <app-loading-spinner label="Cargando notificaciones..." [showLabel]="true" />
      } @else if (notifications().length === 0) {
        <app-empty-state
          icon="fa-solid fa-bell"
          title="Sin notificaciones enviadas"
          description="Cuando envies un aviso aparecera en este historial."
        />
      } @else {
        <div class="checkmate-card management-table-card">
          <div class="management-table-wrap">
            <table class="management-table">
              <thead>
                <tr>
                  <th>Titulo</th>
                  <th>Tipo</th>
                  <th>Destinatario</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                @for (item of notifications(); track item.id) {
                  <tr>
                    <td><a [routerLink]="[item.id]">{{ item.title }}</a></td>
                    <td>{{ typeLabel(item.type) }}</td>
                    <td>
                      {{ item.recipientLabel }}
                      @if (item.recipientsCount > 1) {
                        ({{ item.recipientsCount }})
                      }
                    </td>
                    <td>{{ item.sentAtLabel }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </section>
  `,
})
export class NotificationsSentListComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationsApi = inject(NotificationsApiService);

  protected readonly loading = signal(true);
  protected readonly notifications = signal<SentNotificationView[]>([]);

  constructor() {
    this.notificationsApi
      .getSentNotifications()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((notifications) => this.notifications.set(notifications));
  }

  protected typeLabel(type: string): string {
    return notificationTypeLabel(type);
  }
}
