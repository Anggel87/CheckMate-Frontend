import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  NotificationInboxView,
  NotificationsApiService,
  notificationTypeLabel,
} from '../../data-access/notifications-api.service';

@Component({
  selector: 'app-notifications-inbox',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <section class="student-page">
      <header class="student-page__header">
        <div>
          <h1>Notificaciones</h1>
          <p>Avisos que te han enviado.</p>
        </div>
      </header>

      @if (loading()) {
        <app-loading-spinner label="Cargando notificaciones..." [showLabel]="true" />
      } @else if (notifications().length === 0) {
        <app-empty-state
          icon="fa-solid fa-bell"
          title="Sin notificaciones"
          description="Cuando te envien un aviso aparecera en este historial."
        />
      } @else {
        <article class="student-card student-request-list-card">
          <div class="student-request-list">
            @for (item of notifications(); track item.id) {
              <a class="student-request-row" [class.is-unread]="!item.isRead" [routerLink]="[item.id]">
                <div>
                  <app-status-badge [label]="typeLabel(item.type)" tone="info" />
                  <h2>{{ item.title }}</h2>
                  <p>{{ item.message }}</p>
                </div>

                <aside>
                  <time>{{ item.sentAtLabel }}</time>
                  @if (!item.isRead) {
                    <span class="student-attachment-pill">Nuevo</span>
                  }
                  <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                </aside>
              </a>
            }
          </div>
        </article>
      }
    </section>
  `,
})
export class NotificationsInboxComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationsApi = inject(NotificationsApiService);

  protected readonly loading = signal(true);
  protected readonly notifications = signal<NotificationInboxView[]>([]);

  constructor() {
    this.notificationsApi
      .getInbox()
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
