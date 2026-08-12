import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/authentication/auth.service';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constants';
import { UserRole } from '../../../../core/enums/user-role.enum';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import {
  DashboardDataService,
  DashboardMetric,
  DashboardStudent,
  TodayClass,
} from '../../data-access/dashboard-data.service';

@Component({
  selector: 'app-welcome-dashboard',
  standalone: true,
  imports: [RouterLink, CardComponent, LoadingSpinnerComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="dashboard-page">
      <div class="dashboard-page__hero">
        <app-page-header [title]="welcomeTitle()" [description]="welcomeDescription()" />

        @if (nextClass()) {
          <aside class="next-class-card" aria-label="Proxima clase">
            <div class="next-class-card__header">
              <div>
                <span>Proxima clase</span>
                <strong>{{ nextClass()!.time }}</strong>
              </div>
              <span class="next-class-card__icon" aria-hidden="true">
                <i class="fa-solid fa-clock"></i>
              </span>
            </div>
            <div class="next-class-card__footer">
              <div>
                <b>{{ nextClass()!.subject }}</b>
                <small>{{ nextClass()!.group }}</small>
              </div>
              <a class="btn-checkmate btn-checkmate-light" [routerLink]="classRoute(nextClass()!)"
                >Iniciar</a
              >
            </div>
          </aside>
        }
      </div>

      @if (loading()) {
        <div class="dashboard-page__loading">
          <app-loading-spinner label="Cargando informacion del dashboard" [showLabel]="true" />
        </div>
      } @else {
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
                <p>{{ todayClasses().length }} sesiones programadas</p>
              </div>
            </div>

            <div class="class-list">
              @for (classItem of todayClasses(); track classItem.subject + classItem.time) {
                <article class="class-row" [class.is-active]="classItem.status === 'active'">
                  <span class="class-row__group">{{ classItem.group }}</span>
                  <div>
                    <strong>{{ classItem.subject }}</strong>
                    <small>
                      <i class="fa-regular fa-clock" aria-hidden="true"></i>
                      {{ classItem.time }}
                    </small>
                  </div>
                  <a
                    class="icon-button"
                    [routerLink]="classRoute(classItem)"
                    [attr.aria-label]="'Abrir ' + classItem.subject"
                  >
                    <i [class]="classActionIcon(classItem.status)" aria-hidden="true"></i>
                  </a>
                </article>
              } @empty {
                <p class="dropdown-empty">Sin sesiones de hoy para este rol.</p>
              }
            </div>
          </app-card>

          <app-card>
            <div class="panel-heading">
              <div>
                <h2>Alumnos</h2>
                <p>Directorio de alumnos</p>
              </div>
            </div>

            <div class="student-list">
              @for (student of students(); track student.enrollment + student.name) {
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
                    <small>Matricula: {{ student.enrollment }}</small>
                  </div>
                  <span
                    class="student-row__status"
                    [class]="'student-row__status student-row__status--' + student.status"
                    [title]="statusLabel(student.status)"
                    aria-hidden="true"
                  ></span>
                </article>
              } @empty {
                <p class="dropdown-empty">Sin alumnos disponibles para este dashboard.</p>
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
      }
    </section>
  `,
})
export class WelcomeDashboardComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly dashboardData = inject(DashboardDataService);

  protected readonly loading = signal(true);
  protected readonly metrics = signal<DashboardMetric[]>([]);
  protected readonly todayClasses = signal<TodayClass[]>([]);
  protected readonly students = signal<DashboardStudent[]>([]);
  protected readonly nextClass = signal<TodayClass | null>(null);

  constructor() {
    this.dashboardData
      .getDashboard()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((dashboard) => {
        this.metrics.set(dashboard.metrics);
        this.todayClasses.set(dashboard.todayClasses);
        this.students.set(dashboard.students);
        this.nextClass.set(dashboard.nextClass);
      });
  }

  protected welcomeTitle(): string {
    return `Bienvenido, ${this.dashboardRoleName()}`;
  }

  protected welcomeDescription(): string {
    return `Hoy es ${this.todayLabel()}. Aqui tienes tu resumen del dia.`;
  }

  protected attendanceRoute(): string {
    const role = this.authService.currentUser()?.role;
    return role ? `${ROUTE_PATHS.rolePrefix[role]}/attendance` : this.authService.getHomeUrl();
  }

  protected classRoute(classItem: TodayClass): string {
    const role = this.authService.currentUser()?.role;

    if ((role === UserRole.TEACHER || role === UserRole.TUTOR_TEACHER) && classItem.scheduleId) {
      return `${ROUTE_PATHS.rolePrefix[role]}/attendance/take/${classItem.scheduleId}`;
    }

    return this.attendanceRoute();
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
