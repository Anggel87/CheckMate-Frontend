import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/authentication/auth.service';
import {
  DASHBOARD_METRICS_BY_ROLE,
  DASHBOARD_STUDENTS,
  QUICK_ACTIONS_BY_ROLE,
  RECENT_ACTIVITY,
  TODAY_CLASSES,
} from '../../../../core/mocks/dashboard.mock';
import { PermissionService } from '../../../../core/authorization/permission.service';
import { QuickAction } from '../../../../core/models/menu-item.model';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-welcome-dashboard',
  standalone: true,
  imports: [RouterLink, CardComponent, EmptyStateComponent, PageHeaderComponent, StatCardComponent, StatusBadgeComponent],
  template: `
    <section class="dashboard-page">
      <div class="dashboard-page__hero">
        <app-page-header [title]="welcomeTitle()" [description]="welcomeDescription()" />

        <aside class="next-class-card" aria-label="Próxima clase">
          <span>Próxima clase en</span>
          <strong>15 <small>minutos</small></strong>
          <div>
            <b>Base de datos</b>
            <small>Grupo 1-A · Aula 204</small>
          </div>
          <a class="btn-checkmate btn-checkmate-light" [routerLink]="attendanceRoute()">Iniciar</a>
        </aside>
      </div>

      <section class="stats-grid" aria-label="Resumen">
        @for (metric of metrics(); track metric.title) {
          <app-stat-card
            [title]="metric.title"
            [value]="metric.value"
            [description]="metric.description"
            [icon]="metric.icon"
            [tone]="metric.tone"
            [trend]="metric.trend ?? ''"
          />
        }
      </section>

      <section class="dashboard-page__columns">
        <app-card>
          <div class="panel-heading">
            <div>
              <h2>Materias de hoy</h2>
              <p>{{ todayClasses.length }} sesiones programadas</p>
            </div>
            <button type="button" class="icon-button" aria-label="Más opciones">
              <i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i>
            </button>
          </div>

          <div class="class-list">
            @for (classItem of todayClasses; track classItem.subject) {
              <article class="class-row" [class.is-active]="classItem.status === 'active'">
                <span class="class-row__group">{{ classItem.group }}</span>
                <div>
                  <strong>{{ classItem.subject }}</strong>
                  <small>
                    <i class="fa-regular fa-clock" aria-hidden="true"></i>
                    {{ classItem.time }}
                  </small>
                </div>
                <button type="button" class="icon-button" [attr.aria-label]="'Abrir ' + classItem.subject">
                  <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                </button>
              </article>
            }
          </div>
        </app-card>

        <app-card>
          <div class="panel-heading">
            <div>
              <h2>Tus alumnos</h2>
              <p>Directorio rápido</p>
            </div>
            <div class="segmented-control" aria-label="Carrera">
              <button type="button" class="is-active">TICS</button>
              <button type="button">Mecatrónica</button>
            </div>
          </div>

          <div class="chip-row" aria-label="Grupos">
            <button type="button" class="is-active">Grupo 1-A</button>
            <button type="button">Grupo 1-B</button>
            <button type="button">Grupo 2-A</button>
          </div>

          <div class="student-list">
            @for (student of students; track student.enrollment) {
              <article class="student-row">
                <span class="avatar">{{ initials(student.name) }}</span>
                <div>
                  <strong>{{ student.name }}</strong>
                  <small>Matrícula: {{ student.enrollment }}</small>
                </div>
                <app-status-badge [label]="statusLabel(student.status)" [tone]="student.status" />
                <button type="button" class="icon-button" [attr.aria-label]="'Ver ' + student.name">
                  <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                </button>
              </article>
            }
          </div>
        </app-card>
      </section>

      <section class="dashboard-page__columns">
        <app-card>
          <div class="panel-heading">
            <div>
              <h2>Acciones rápidas</h2>
              <p>Disponibles según tu rol</p>
            </div>
          </div>

          <div class="quick-actions">
            @for (action of quickActions(); track action.label) {
              <a class="quick-action" [routerLink]="action.route">
                <i [class]="action.icon" aria-hidden="true"></i>
                <span>{{ action.label }}</span>
              </a>
            }
          </div>
        </app-card>

        <app-card>
          <div class="panel-heading">
            <div>
              <h2>Actividad reciente</h2>
              <p>Últimos movimientos registrados</p>
            </div>
          </div>

          @if (activity.length) {
            <div class="activity-list">
              @for (item of activity; track item.title) {
                <article class="activity-row">
                  <span aria-hidden="true"><i [class]="item.icon"></i></span>
                  <div>
                    <strong>{{ item.title }}</strong>
                    <p>{{ item.description }}</p>
                    <small>{{ item.date }}</small>
                  </div>
                </article>
              }
            </div>
          } @else {
            <app-empty-state
              icon="fa-solid fa-clock-rotate-left"
              title="No hay actividad reciente."
              description="Cuando existan movimientos aparecerán en esta sección."
            />
          }
        </app-card>
      </section>
    </section>
  `,
})
export class WelcomeDashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);

  protected readonly todayClasses = TODAY_CLASSES;
  protected readonly students = DASHBOARD_STUDENTS;
  protected readonly activity = RECENT_ACTIVITY;

  protected welcomeTitle(): string {
    const user = this.authService.currentUser();
    return user ? `${this.greeting()}, ${user.fullName}.` : 'Bienvenido a CheckMate';
  }

  protected welcomeDescription(): string {
    return 'Administra y consulta la información académica desde un solo lugar.';
  }

  protected metrics() {
    const role = this.authService.currentUser()?.role;
    return role ? DASHBOARD_METRICS_BY_ROLE[role] : [];
  }

  protected quickActions(): QuickAction[] {
    const role = this.authService.currentUser()?.role;
    return role ? this.permissionService.filterActions(QUICK_ACTIONS_BY_ROLE[role]) : [];
  }

  protected attendanceRoute(): string {
    return this.quickActions().find((action) => action.route.includes('attendance'))?.route ?? this.authService.getHomeUrl();
  }

  protected initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  protected statusLabel(status: 'present' | 'late' | 'absent' | 'pending'): string {
    const labels = {
      present: 'Presente',
      late: 'Retardo',
      absent: 'Falta',
      pending: 'Pendiente',
    };

    return labels[status];
  }

  private greeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Buenos días';
    }

    if (hour < 19) {
      return 'Buenas tardes';
    }

    return 'Buenas noches';
  }
}
