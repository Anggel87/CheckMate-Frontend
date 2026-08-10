import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  TeacherGroupView,
  TeacherPortalApiService,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';

@Component({
  selector: 'app-teacher-groups',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="teacher-page">
      <header class="teacher-page__header teacher-page__header--filters">
        <div>
          <h1>Tus Grupos</h1>
          <p>Visualiza y gestiona tus grupos asignados este semestre.</p>
        </div>

        <div class="teacher-filter-actions" aria-label="Filtros de grupos">
          <button type="button" class="teacher-filter-button">
            Todas las Carreras
            <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
          </button>
          <button type="button" class="teacher-filter-button">
            Todos los Grupos
            <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
          </button>
        </div>
      </header>

      <section class="teacher-groups-grid" aria-label="Grupos asignados">
        @for (group of groups; track group.id) {
          <article class="teacher-card teacher-group-card">
            <header>
              <span class="teacher-group-chip">{{ group.group }}</span>
              <span class="teacher-career-chip">{{ group.career }}</span>
            </header>
            <h2>{{ group.subject }}</h2>
            <p>{{ group.description }}</p>
            <footer>
              <span>
                <i class="fa-solid fa-users" aria-hidden="true"></i>
                {{ group.students }} Alumnos
              </span>
              <a
                class="icon-button"
                [routerLink]="['/teacher/groups', group.id, 'students']"
                [attr.aria-label]="'Ver alumnos de ' + group.group"
              >
                <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </a>
            </footer>
          </article>
        } @empty {
          <article class="teacher-card">
            <p class="dropdown-empty">No hay grupos asignados desde la API.</p>
          </article>
        }
      </section>
    </section>
  `,
})
export class TeacherGroupsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected groups: TeacherGroupView[] = [];

  constructor() {
    this.teacherApi
      .getGroups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((groups) => {
        this.groups = groups;
      });
  }
}
