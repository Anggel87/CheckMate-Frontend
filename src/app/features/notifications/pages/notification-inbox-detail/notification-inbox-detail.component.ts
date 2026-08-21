import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  EMPTY_NOTIFICATION_INBOX_DETAIL,
  NotificationInboxView,
  NotificationsApiService,
  notificationTypeLabel,
} from '../../data-access/notifications-api.service';

@Component({
  selector: 'app-notification-inbox-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, LoadingSpinnerComponent],
  template: `
    <section class="student-page">
      <a class="student-back-link" [routerLink]="['..']">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        Volver a Notificaciones
      </a>

      @if (loading()) {
        <app-loading-spinner label="Cargando notificacion..." [showLabel]="true" />
      } @else {
        <article class="student-card student-attendance-detail-card">
          <header>
            <div>
              <h1>{{ detail().title }}</h1>
              <p>{{ detail().sentAtLabel }}</p>
            </div>
            <app-status-badge [label]="typeLabel(detail().type)" tone="info" />
          </header>

          <dl class="student-detail-list">
            <div>
              <dt>Mensaje</dt>
              <dd>{{ detail().message }}</dd>
            </div>
            @if (detail().senderName) {
              <div>
                <dt>Enviado por</dt>
                <dd>{{ detail().senderName }}</dd>
              </div>
            }
          </dl>
        </article>
      }
    </section>
  `,
})
export class NotificationInboxDetailComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationsApi = inject(NotificationsApiService);

  protected readonly loading = signal(true);
  protected readonly detail = signal<NotificationInboxView>(EMPTY_NOTIFICATION_INBOX_DETAIL);

  constructor() {
    const notificationId = this.route.snapshot.paramMap.get('notificationId');

    this.notificationsApi
      .getInboxDetail(notificationId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => {
        this.detail.set(detail);

        if (notificationId && !detail.isRead) {
          this.notificationsApi
            .markAsRead(notificationId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        }
      });
  }

  protected typeLabel(type: string): string {
    return notificationTypeLabel(type);
  }
}
