import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TutoringDataService } from '../../data-access/tutoring-data.service';

@Component({
  selector: 'app-tutor-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="teacher-page tutor-dashboard-page">
      <header class="teacher-page__header">
        <div>
          <h1>Tus grupos tutorados</h1>
          <p>Gestiona la asistencia y el estado de tus grupos academicos asignados.</p>
        </div>
      </header>

      <div class="tutor-dashboard-layout">
        <section class="teacher-card tutor-groups-panel" aria-label="Grupos tutorados">
          @if (selectedGroup(); as headerGroup) {
            <header class="tutor-groups-panel__header">
              <span class="teacher-group-chip">{{ headerGroup.label }}</span>
              <span class="teacher-career-chip">{{ headerGroup.department }}</span>
            </header>
          }

          <div class="teacher-tabs tutor-group-tabs" aria-label="Grupos">
            @for (group of groups(); track group.id) {
              <button
                type="button"
                [class.is-active]="group.id === selectedGroupId()"
                (click)="explicitGroupId.set(group.id)"
              >
                {{ group.label }}
              </button>
            } @empty {
              <span class="dropdown-empty">No tienes grupos tutorados asignados.</span>
            }
          </div>

          @if (selectedGroup(); as group) {
            <div class="tutor-list-heading">
              <strong>Listado de Grupo: {{ group.label }}</strong>
              <span>{{ groupStudents().length }} alumnos inscritos</span>
            </div>

            <div class="tutor-student-preview-list">
              @for (student of previewStudents(); track student.id) {
                <a class="tutor-student-preview-row" [routerLink]="['/tutor/students', student.id]">
                  <span class="avatar">{{ student.initials }}</span>
                  <div>
                    <strong>{{ student.name }}</strong>
                    <small>ID: {{ student.enrollment }} - Estado: {{ student.status }}</small>
                  </div>
                  <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </a>
              } @empty {
                <p class="dropdown-empty">Este grupo no tiene alumnos activos.</p>
              }
            </div>

            <a
              class="btn-checkmate btn-checkmate-secondary tutor-full-list-link"
              [routerLink]="['/tutor/students']"
              [queryParams]="{ group: group.label }"
            >
              + Ver lista completa del grupo
            </a>
          }
        </section>

        <aside class="teacher-side-stack">
          <section class="teacher-card tutor-day-summary">
            <span>Resumen del dia</span>
            <div>
              <strong>Asistencia Hoy</strong>
              <b>{{ todaySummary().rate }}%</b>
            </div>
            <div class="tutor-progress" aria-hidden="true">
              <span [style.width.%]="todaySummary().rate"></span>
            </div>
            <dl>
              <div>
                <dt>Presentes</dt>
                <dd>{{ todaySummary().present }}</dd>
              </div>
              <div>
                <dt>Ausentes</dt>
                <dd>{{ todaySummary().absent }}</dd>
              </div>
            </dl>
          </section>

          @if (absenceAlerts().length) {
            <section class="teacher-card tutor-alert-card">
              <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
              <div>
                <h2>Alerta de Inasistencia</h2>
                <p>
                  {{ absenceAlerts().length }} alumno(s) han faltado 3 veces o mas esta semana.
                </p>
                <a routerLink="/tutor/students" [queryParams]="{ risk: 'attendance' }">Ver detalles</a>
              </div>
            </section>
          } @else {
            <section class="teacher-card tutor-alert-card is-clear">
              <i class="fa-regular fa-circle-check" aria-hidden="true"></i>
              <div>
                <h2>Sin alertas</h2>
                <p>Ningun alumno tutorado acumula 3 o mas faltas esta semana.</p>
              </div>
            </section>
          }
        </aside>
      </div>
    </section>
  `,
})
export class TutorDashboardComponent {
  private readonly tutoringData = inject(TutoringDataService);

  protected readonly groups = this.tutoringData.groups;
  protected readonly students = this.tutoringData.students;
  protected readonly todaySummary = this.tutoringData.todayAttendanceSummary;
  protected readonly absenceAlerts = this.tutoringData.weeklyAbsenceAlerts;

  protected readonly explicitGroupId = signal<string | null>(null);
  protected readonly selectedGroupId = computed(
    () => this.explicitGroupId() ?? this.groups()[0]?.id ?? null,
  );
  protected readonly selectedGroup = computed(
    () => this.groups().find((group) => group.id === this.selectedGroupId()) ?? null,
  );
  protected readonly groupStudents = computed(() =>
    this.students().filter((student) => student.groupId === this.selectedGroupId()),
  );
  protected readonly previewStudents = computed(() => this.groupStudents().slice(0, 4));
}
