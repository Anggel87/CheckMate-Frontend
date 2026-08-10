import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TutoringDataService } from '../../data-access/tutoring-data.service';

@Component({
  selector: 'app-tutor-attendance-overview',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="teacher-page">
      <header class="teacher-page__header teacher-page__header--filters">
        <div>
          <h1>Asistencias</h1>
          <p>Selecciona un alumno tutorado para revisar su historial de asistencia.</p>
        </div>
        <label class="tutor-search-control">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <span class="sr-only">Buscar alumno</span>
          <input
            class="checkmate-input"
            type="search"
            placeholder="Buscar alumno..."
            (input)="search.set(inputValue($event))"
          />
        </label>
      </header>

      <section class="teacher-groups-grid tutor-student-card-grid" aria-label="Alumnos con asistencia">
        @for (student of filteredStudents(); track student.id) {
          <article class="teacher-card teacher-group-card tutor-student-card">
            <header>
              <span class="avatar">{{ student.initials }}</span>
              <app-status-badge [label]="student.status" [tone]="student.statusTone" />
            </header>
            <h2>{{ student.name }}</h2>
            <p>{{ student.group }} - {{ student.department }} - {{ student.enrollment }}</p>
            <div class="teacher-attendance-meter">
              <div class="teacher-progress" aria-hidden="true">
                <span
                  [class.is-warning]="student.attendanceRate < 90 && student.attendanceRate >= 80"
                  [class.is-danger]="student.attendanceRate < 80"
                  [style.width.%]="student.attendanceRate"
                ></span>
              </div>
              <strong>{{ student.attendanceRate }}%</strong>
            </div>
            <footer>
              <span>{{ student.absenceCount }} faltas</span>
              <a class="icon-button" [routerLink]="['/tutor/students', student.id, 'attendance']">
                <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </a>
            </footer>
          </article>
        }
      </section>
    </section>
  `,
})
export class TutorAttendanceOverviewComponent {
  private readonly tutoringData = inject(TutoringDataService);

  protected readonly students = this.tutoringData.students;
  protected readonly search = signal('');
  protected readonly filteredStudents = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.students().filter(
      (student) =>
        term.length === 0 ||
        student.name.toLowerCase().includes(term) ||
        student.enrollment.toLowerCase().includes(term),
    );
  });

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
