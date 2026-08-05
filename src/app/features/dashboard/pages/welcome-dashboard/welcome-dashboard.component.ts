import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/authentication/auth.service';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constants';
import { UserRole } from '../../../../core/enums/user-role.enum';
import {
  DASHBOARD_METRICS_BY_ROLE,
  DASHBOARD_STUDENTS,
  TODAY_CLASSES,
} from '../../../../core/mocks/dashboard.mock';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-welcome-dashboard',
  standalone: true,
  imports: [RouterLink, CardComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="dashboard-page">
      <div class="dashboard-page__hero">
        <app-page-header [title]="welcomeTitle()" [description]="welcomeDescription()" />

        <aside class="next-class-card" aria-label="Próxima clase">
          <div class="next-class-card__header">
            <div>
              <span>Próxima clase en</span>
              <strong>15 <small>minutos</small></strong>
            </div>
            <span class="next-class-card__icon" aria-hidden="true">
              <i class="fa-solid fa-clock"></i>
            </span>
          </div>
          <div class="next-class-card__footer">
            <div>
              <b>Base de datos</b>
              <small>Grupo 1-A • Aula 204</small>
            </div>
            <a class="btn-checkmate btn-checkmate-light" [routerLink]="attendanceRoute()"
              >Iniciar</a
            >
          </div>
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
                <button
                  type="button"
                  class="icon-button"
                  [attr.aria-label]="'Abrir ' + classItem.subject"
                >
                  <i [class]="classActionIcon(classItem.status)" aria-hidden="true"></i>
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
                @if (student.avatarUrl) {
                  <img
                    class="student-row__avatar"
                    [src]="student.avatarUrl"
                    [alt]="'Foto de ' + student.name"
                  />
                } @else {
                  <span class="avatar">{{ initials(student.name) }}</span>
                }
                <div>
                  <strong>{{ student.name }}</strong>
                  <small>Matrícula: {{ student.enrollment }}</small>
                </div>
                <span
                  class="student-row__status"
                  [class]="'student-row__status student-row__status--' + student.status"
                  [title]="statusLabel(student.status)"
                  aria-hidden="true"
                ></span>
                <button type="button" class="icon-button" [attr.aria-label]="'Ver ' + student.name">
                  <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                </button>
              </article>
            }
          </div>

          <a
            class="btn-checkmate btn-checkmate-secondary students-card__action"
            [routerLink]="studentsActionRoute()"
          >
            {{ studentsActionLabel() }}
          </a>
        </app-card>
      </section>
    </section>
  `,
})
export class WelcomeDashboardComponent {
  private readonly authService = inject(AuthService);

  protected readonly todayClasses = TODAY_CLASSES;
  protected readonly students = DASHBOARD_STUDENTS;

  protected welcomeTitle(): string {
    return `Bienvenido, ${this.dashboardRoleName()}`;
  }

  protected welcomeDescription(): string {
    return `Hoy es ${this.todayLabel()}. Aquí tienes el resumen de tus actividades.`;
  }

  protected metrics() {
    const role = this.authService.currentUser()?.role;
    return role ? DASHBOARD_METRICS_BY_ROLE[role] : [];
  }

  protected attendanceRoute(): string {
    const role = this.authService.currentUser()?.role;
    return role ? `${ROUTE_PATHS.rolePrefix[role]}/attendance` : this.authService.getHomeUrl();
  }

  protected studentsActionRoute(): string {
    const role = this.authService.currentUser()?.role;

    if (!role) {
      return this.authService.getHomeUrl();
    }

    return role === UserRole.STUDENT
      ? `${ROUTE_PATHS.rolePrefix[role]}/profile`
      : `${ROUTE_PATHS.rolePrefix[role]}/students`;
  }

  protected studentsActionLabel(): string {
    return this.authService.currentUser()?.role === UserRole.STUDENT
      ? 'Ver mi perfil'
      : 'Ver todos los alumnos';
  }

  protected classActionIcon(status: 'active' | 'pending' | 'completed'): string {
    return status === 'active' ? 'fa-solid fa-play' : 'fa-solid fa-arrow-up-right-from-square';
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

  private dashboardRoleName(): string {
    const role = this.authService.currentUser()?.role;
    const labels: Record<UserRole, string> = {
      [UserRole.ADMIN]: 'Administrador',
      [UserRole.CAREER_DIRECTOR]: 'Director',
      [UserRole.TEACHER]: 'Profesor',
      [UserRole.TUTOR_TEACHER]: 'Profesor tutor',
      [UserRole.STUDENT]: 'Alumno',
    };

    return role ? labels[role] : 'CheckMate';
  }

  private todayLabel(): string {
    const date = new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());

    return date.charAt(0).toUpperCase() + date.slice(1);
  }
}
