import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { combineLatest, finalize, forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/authentication/auth.service';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constants';
import { UserRole } from '../../../../core/enums/user-role.enum';
import { BreadcrumbItem } from '../../../../core/models/menu-item.model';
import { BreadcrumbsComponent } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { DialogService } from '../../../../shared/feedback/services/dialog.service';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { ManagementDataService } from '../../data-access/management-data.service';
import {
  AttendanceSettingFormPayload,
  CareerFormPayload,
  ClassroomFormPayload,
  EMPTY_MANAGEMENT_SNAPSHOT,
  IncidentCreatePayload,
  IncidentRosterStatus,
  ManagementAttendanceSetting,
  ManagementAuditLog,
  ManagementCareer,
  ManagementCareerDirector,
  ManagementClaim,
  ManagementClassroom,
  ManagementDevice,
  ManagementGroup,
  ManagementIncident,
  ManagementJustification,
  ManagementSchedule,
  ManagementSchoolYear,
  ManagementSnapshot,
  ManagementStatus,
  ManagementStudent,
  ManagementSubject,
  ManagementTeacher,
  ManagementTutor,
  ManagementView,
  ScheduleFormPayload,
  SchoolYearFormPayload,
  SubjectFormPayload,
} from '../../models/management.model';

@Component({
  selector: 'app-management-workspace',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, ReactiveFormsModule, FormsModule, BreadcrumbsComponent, FileUploadComponent],
  template: `
    <section class="management-page">
      <app-breadcrumbs [items]="breadcrumbs()" />

      <header class="page-header management-page__header">
        <div>
          <span class="page-header__eyebrow">{{ eyebrow() }}</span>
          <h1>{{ pageTitle() }}</h1>
          <p>{{ pageDescription() }}</p>
        </div>

        <div class="management-actions">
          @if (view() === 'students') {
            <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/groups'">
              <i class="fa-solid fa-users" aria-hidden="true"></i>
              Grupos
            </a>
          }

          @if (view() === 'incidents') {
            @if (canCreateIncidents()) {
              <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/incidents/new'">
                <i class="fa-solid fa-plus" aria-hidden="true"></i>
                Nuevo incidente
              </a>
            }
            <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/incidents/active'">
              <i class="fa-solid fa-list-check" aria-hidden="true"></i>
              Pase de lista
            </a>
          }

          @if (view() === 'devices' && canEditDevices()) {
            <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/nfc-devices/new'">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
              Crear dispositivo
            </a>
          }

          @if (view() === 'schedules' && isAdmin()) {
            <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/schedules/new'">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
              Nuevo horario
            </a>
          }

          @if (view() === 'school-years') {
            <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/academic-periods/new'">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
              Nuevo periodo
            </a>
          }

          @if (view() === 'careers') {
            <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/careers/new'">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
              Nueva carrera
            </a>
          }

          @if (view() === 'subjects' && isAdmin()) {
            <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/subjects/new'">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
              Nueva materia
            </a>
          }

          @if (view() === 'attendance-settings') {
            <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/attendance-settings/new'">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
              Nueva regla
            </a>
          }

          @if (view() === 'classrooms' && isAdmin()) {
            <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/classrooms/new'">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
              Nuevo salon
            </a>
          }
        </div>
      </header>

      @if (loading()) {
        <div class="management-loading checkmate-card">
          <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
          Cargando informacion...
        </div>
      } @else if (loadError()) {
        <div class="error-state checkmate-card">
          <span class="error-state__icon">
            <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          </span>
          <h2>No fue posible obtener la informacion</h2>
          <p>{{ loadError() }}</p>
          <button type="button" class="btn-checkmate btn-checkmate-primary" (click)="loadSnapshot()">
            Reintentar
          </button>
        </div>
      } @else {
        @switch (view()) {
          @case ('groups') {
            <div class="management-card-grid">
              @for (group of snapshot().groups; track group.id) {
                <article class="checkmate-card management-card">
                  <div class="management-card__header">
                    <span class="management-icon"><i class="fa-solid fa-users" aria-hidden="true"></i></span>
                    <span class="status-badge status-badge--info">{{ group.shift }}</span>
                  </div>
                  <h2>{{ group.label }}</h2>
                  <p>{{ group.career }}</p>
                  <dl class="management-metrics">
                    <div>
                      <dt>Alumnos</dt>
                      <dd>{{ group.studentCount }}</dd>
                    </div>
                    <div>
                      <dt>Asistencia</dt>
                      <dd>{{ group.attendanceRate }}%</dd>
                    </div>
                  </dl>
                  <small>Tutor: {{ group.tutor }}</small>
                  <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/students'">
                    Ver alumnos
                  </a>
                </article>
              }
            </div>
          }

          @case ('students') {
            <div class="management-split">
              <div class="checkmate-card management-table-card">
                <div class="management-toolbar">
                  <label class="checkmate-form-field">
                    <span class="checkmate-label">Carrera</span>
                    <select class="checkmate-select">
                      <option>Ingenieria en Desarrollo</option>
                      <option>Ingenieria en Sistemas</option>
                    </select>
                  </label>
                  <label class="checkmate-form-field">
                    <span class="checkmate-label">Turno</span>
                    <select class="checkmate-select">
                      <option>Matutino</option>
                      <option>Vespertino</option>
                    </select>
                  </label>
                  <label class="checkmate-form-field">
                    <span class="checkmate-label">Grupo</span>
                    <select class="checkmate-select">
                      @for (group of snapshot().groups; track group.id) {
                        <option>{{ group.label }}</option>
                      }
                    </select>
                  </label>
                </div>

                <div class="management-table-wrap">
                  <table class="management-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Matricula</th>
                        <th>Grupo</th>
                        <th>Asistencia</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (student of snapshot().students; track student.id) {
                        <tr>
                          <td>
                            <strong>{{ student.name }}</strong>
                            <small>{{ student.email }}</small>
                          </td>
                          <td>{{ student.controlNumber }}</td>
                          <td>{{ student.group }}</td>
                          <td>{{ student.attendanceRate }}%</td>
                          <td><span [class]="statusClass(student.status)">{{ student.status.label }}</span></td>
                          <td>
                            <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/students/' + student.id">
                              Detalles
                            </a>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <aside class="checkmate-card management-summary">
                <h2>Resumen del dia</h2>
                <strong>{{ snapshot().charts.attendanceRate }}%</strong>
                <p>Asistencia general de la carrera</p>
                <dl class="management-metrics">
                  <div>
                    <dt>Alumnos</dt>
                    <dd>{{ snapshot().charts.totalStudents }}</dd>
                  </div>
                  <div>
                    <dt>Faltas</dt>
                    <dd>{{ snapshot().charts.absencesTotal }}</dd>
                  </div>
                </dl>
              </aside>
            </div>
          }

          @case ('student-detail') {
            @if (selectedStudent(); as student) {
              <div class="management-detail-grid">
                <article class="checkmate-card management-profile-card">
                  <img [src]="student.avatarUrl" [alt]="student.name" />
                  <h2>{{ student.name }}</h2>
                  <span [class]="statusClass(student.status)">{{ student.status.label }}</span>
                  <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/students/' + student.id + '/attendance'">
                    <i class="fa-solid fa-calendar-check" aria-hidden="true"></i>
                    Ver asistencias
                  </a>
                  <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/students/' + student.id + '/justifications'">
                    <i class="fa-solid fa-file-lines" aria-hidden="true"></i>
                    Ver justificantes
                  </a>
                  @if (canEditStudents() && !editingStudent()) {
                    <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="startEditingStudent(student)">
                      <i class="fa-solid fa-pen" aria-hidden="true"></i>
                      Editar datos
                    </button>
                  }
                </article>

                <article class="checkmate-card management-info-panel">
                  <h2>Informacion personal</h2>
                  <dl class="management-data-grid">
                    <div><dt>Carrera</dt><dd>{{ student.career }}</dd></div>
                    <div><dt>Grupo</dt><dd>{{ student.group }}</dd></div>
                    <div><dt>Matricula</dt><dd>{{ student.controlNumber }}</dd></div>
                    <div><dt>Nivel</dt><dd>{{ student.level }}</dd></div>
                  </dl>
                </article>

                @if (editingStudent()) {
                  <form class="checkmate-card management-form" [formGroup]="studentForm" (ngSubmit)="saveStudent(student)">
                    <h2>Editar datos del alumno</h2>
                    <div class="management-form__grid">
                      <label class="checkmate-form-field">
                        <span class="checkmate-label">Telefono</span>
                        <input class="checkmate-input" type="tel" formControlName="phone" />
                      </label>
                      <label class="checkmate-form-field">
                        <span class="checkmate-label">Direccion</span>
                        <input class="checkmate-input" type="text" formControlName="address" />
                      </label>
                      <label class="checkmate-form-field">
                        <span class="checkmate-label">Estado</span>
                        <select class="checkmate-select" formControlName="active">
                          <option [ngValue]="true">Activo</option>
                          <option [ngValue]="false">Inactivo</option>
                        </select>
                      </label>
                      <label class="checkmate-form-field management-form__full">
                        <span class="checkmate-label">Foto de perfil</span>
                        <app-file-upload
                          title="Haz clic para subir una foto"
                          description="JPG o PNG, maximo 3MB."
                          accept="image/png,image/jpeg"
                          [maxSizeMb]="3"
                          (filesSelected)="selectStudentPhoto($event)"
                          (fileRemoved)="clearStudentPhoto()"
                        />
                      </label>
                    </div>
                    <footer class="management-form__footer">
                      <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="cancelEditingStudent()">
                        Cancelar
                      </button>
                      <button type="submit" class="btn-checkmate btn-checkmate-primary" [disabled]="submitting()">
                        Guardar
                      </button>
                    </footer>
                  </form>
                }

                <article class="checkmate-card management-info-panel">
                  <h2>Datos de contacto</h2>
                  <dl class="management-data-grid">
                    <div><dt>Correo institucional</dt><dd>{{ student.email }}</dd></div>
                    <div><dt>Telefono movil</dt><dd>{{ student.phone }}</dd></div>
                    <div><dt>Direccion</dt><dd>{{ student.address || 'Sin direccion registrada' }}</dd></div>
                  </dl>
                </article>

                <article class="checkmate-card management-info-panel management-tutors-panel">
                  <header class="management-tutors-panel__header">
                    <h2>Tutores legales</h2>
                    @if (canEditStudents() && !addingTutor()) {
                      <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="startAddingTutor()">
                        <i class="fa-solid fa-plus" aria-hidden="true"></i>
                        Agregar tutor
                      </button>
                    }
                  </header>

                  @for (tutor of student.tutors; track tutor.id) {
                    @if (editingTutorId() === tutor.id) {
                      <form class="management-form" [formGroup]="tutorEditForm" (ngSubmit)="saveTutorEdit(student, tutor)">
                        <div class="management-form__grid">
                          <label class="checkmate-form-field">
                            <span class="checkmate-label">Telefono</span>
                            <input class="checkmate-input" type="tel" formControlName="phone" />
                          </label>
                          <label class="checkmate-form-field">
                            <span class="checkmate-label">Relacion con el alumno</span>
                            <input class="checkmate-input" type="text" formControlName="relationship" />
                          </label>
                          <label class="checkmate-form-field management-form__full">
                            <input type="checkbox" formControlName="isPrimary" />
                            <span class="checkmate-label">Tutor principal</span>
                          </label>
                        </div>
                        <footer class="management-form__footer">
                          <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="cancelEditingTutor()">
                            Cancelar
                          </button>
                          <button type="submit" class="btn-checkmate btn-checkmate-primary" [disabled]="submitting()">
                            Guardar
                          </button>
                        </footer>
                      </form>
                    } @else {
                      <div class="management-tutor-row">
                        <div>
                          <strong>{{ tutor.fullName }}</strong>
                          @if (tutor.isPrimary) {
                            <span class="status-badge status-badge--info">Principal</span>
                          }
                          <small>{{ tutor.relationship }} - {{ tutor.phone }}</small>
                        </div>
                        @if (canEditStudents()) {
                          <div class="management-tutor-row__actions">
                            <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="startEditingTutor(tutor)">
                              Editar
                            </button>
                            <button type="button" class="btn-checkmate btn-checkmate-danger" (click)="removeTutor(student, tutor)">
                              Quitar
                            </button>
                          </div>
                        }
                      </div>
                    }
                  } @empty {
                    <p class="dropdown-empty">Sin tutores registrados.</p>
                  }

                  @if (addingTutor()) {
                    <form class="management-form" [formGroup]="tutorForm" (ngSubmit)="saveNewTutor(student)">
                      <div class="management-form__grid">
                        <label class="checkmate-form-field">
                          <span class="checkmate-label">Nombre(s)</span>
                          <input class="checkmate-input" type="text" formControlName="firstName" />
                        </label>
                        <label class="checkmate-form-field">
                          <span class="checkmate-label">Apellido paterno</span>
                          <input class="checkmate-input" type="text" formControlName="firstSurname" />
                        </label>
                        <label class="checkmate-form-field">
                          <span class="checkmate-label">Apellido materno</span>
                          <input class="checkmate-input" type="text" formControlName="secondSurname" />
                        </label>
                        <label class="checkmate-form-field">
                          <span class="checkmate-label">Telefono</span>
                          <input class="checkmate-input" type="tel" formControlName="phone" />
                        </label>
                        <label class="checkmate-form-field">
                          <span class="checkmate-label">Relacion con el alumno</span>
                          <input class="checkmate-input" type="text" formControlName="relationship" placeholder="Madre, Padre, Tutor..." />
                        </label>
                        <label class="checkmate-form-field management-form__full">
                          <input type="checkbox" formControlName="isPrimary" />
                          <span class="checkmate-label">Tutor principal</span>
                        </label>
                      </div>
                      <footer class="management-form__footer">
                        <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="cancelAddingTutor()">
                          Cancelar
                        </button>
                        <button type="submit" class="btn-checkmate btn-checkmate-primary" [disabled]="submitting()">
                          Agregar
                        </button>
                      </footer>
                    </form>
                  }
                </article>
              </div>
            }
          }

          @case ('student-attendance') {
            @if (selectedStudent(); as student) {
              <div class="checkmate-card management-student-banner">
                <div>
                  <h2>{{ student.name }}</h2>
                  <p>Matricula: {{ student.controlNumber }} · Grupo: {{ student.group }}</p>
                </div>
                <strong>{{ student.attendanceRate }}%</strong>
              </div>
              <ng-container [ngTemplateOutlet]="attendanceTable" />
            }
          }

          @case ('student-justifications') {
            <ng-container [ngTemplateOutlet]="justificationsTable" />
          }

          @case ('teachers') {
            <div class="checkmate-card management-table-card">
              <div class="management-toolbar">
                <label class="checkmate-form-field">
                  <span class="checkmate-label">Carrera</span>
                  <select class="checkmate-select">
                    <option>TICS</option>
                    <option>Ingenieria en Sistemas</option>
                  </select>
                </label>
                <label class="checkmate-form-field">
                  <span class="checkmate-label">Turno</span>
                  <select class="checkmate-select">
                    <option>Matutino</option>
                    <option>Vespertino</option>
                  </select>
                </label>
              </div>
              <div class="management-table-wrap">
                <table class="management-table">
                  <thead>
                    <tr>
                      <th>Profesor</th>
                      <th>ID</th>
                      <th>Materias</th>
                      <th>Horarios</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (teacher of snapshot().teachers; track teacher.id) {
                      <tr>
                        <td><strong>{{ teacher.name }}</strong><small>{{ teacher.email }}</small></td>
                        <td>{{ teacher.employeeNumber }}</td>
                        <td>{{ teacher.subjects.join(', ') }}</td>
                        <td>{{ teacher.schedulesCount }}</td>
                        <td><span [class]="statusClass(teacher.status)">{{ teacher.status.label }}</span></td>
                        <td>
                          <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/teachers/' + teacher.id">
                            Detalles
                          </a>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          @case ('teacher-detail') {
            @if (selectedTeacher(); as teacher) {
              <div class="management-detail-grid">
                <article class="checkmate-card management-profile-wide">
                  <img [src]="teacher.avatarUrl" [alt]="teacher.name" />
                  <div>
                    <h2>{{ teacher.name }}</h2>
                    <dl class="management-data-grid">
                      <div><dt>Correo</dt><dd>{{ teacher.email }}</dd></div>
                      <div><dt>Telefono</dt><dd>{{ teacher.phone }}</dd></div>
                      <div><dt>Carrera</dt><dd>{{ teacher.career }}</dd></div>
                      <div><dt>Grupos</dt><dd>{{ teacher.activeGroups.join(', ') }}</dd></div>
                    </dl>
                  </div>
                  <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/teachers/' + teacher.id + '/attendance'">
                    Ver asistencias
                  </a>
                </article>

                <article class="checkmate-card management-info-panel">
                  <h2>Grupos asignados</h2>
                  <div class="management-list">
                    @for (group of teacher.activeGroups; track group) {
                      <div class="management-row">
                        <span class="management-icon"><i class="fa-solid fa-users" aria-hidden="true"></i></span>
                        <strong>{{ group }}</strong>
                      </div>
                    }
                  </div>
                </article>
              </div>
            }
          }

          @case ('teacher-attendance') {
            <ng-container [ngTemplateOutlet]="attendanceTable" />
          }

          @case ('subjects') {
            @if (isAdmin()) {
              <div class="checkmate-card management-table-card">
                <div class="management-table-wrap">
                  <table class="management-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Codigo</th>
                        <th>Carreras</th>
                        <th>Horarios</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @if (subjectsLoading()) {
                        <tr><td colspan="6">Cargando materias...</td></tr>
                      } @else {
                        @for (subject of subjects(); track subject.id) {
                          <tr>
                            <td><strong>{{ subject.name }}</strong></td>
                            <td>{{ subject.code }}</td>
                            <td>{{ subjectCareersLabel(subject) }}</td>
                            <td>{{ subject.schedulesCount }}</td>
                            <td>
                              <span [class]="statusClass(subject.isActive ? { label: 'Activa', tone: 'success' } : { label: 'Inactiva', tone: 'neutral' })">
                                {{ subject.isActive ? 'Activa' : 'Inactiva' }}
                              </span>
                            </td>
                            <td>
                              <div class="management-actions">
                                <a
                                  class="btn-checkmate btn-checkmate-secondary"
                                  [routerLink]="baseRoute() + '/subjects/' + subject.id + '/edit'"
                                >
                                  Editar
                                </a>
                                @if (subject.isActive) {
                                  <button
                                    type="button"
                                    class="btn-checkmate btn-checkmate-danger"
                                    (click)="deactivateSubject(subject)"
                                  >
                                    Dar de baja
                                  </button>
                                } @else {
                                  <button
                                    type="button"
                                    class="btn-checkmate btn-checkmate-primary"
                                    (click)="reactivateSubject(subject)"
                                  >
                                    Reactivar
                                  </button>
                                }
                              </div>
                            </td>
                          </tr>
                        } @empty {
                          <tr><td colspan="6">No hay materias registradas.</td></tr>
                        }
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            } @else {
              <div class="management-card-grid">
                @for (subject of snapshot().subjects; track subject.id) {
                  <article class="checkmate-card management-card">
                    <div class="management-card__header">
                      <span class="management-icon"><i class="fa-solid fa-book-open" aria-hidden="true"></i></span>
                      <span class="status-badge status-badge--neutral">{{ subject.semester }}</span>
                    </div>
                    <h2>{{ subject.name }}</h2>
                    <p>{{ subject.teacher }}</p>
                    <dl class="management-data-grid">
                      <div><dt>Grupo</dt><dd>{{ subject.group }}</dd></div>
                      <div><dt>Horario</dt><dd>{{ subject.schedule }}</dd></div>
                      <div><dt>Ubicacion</dt><dd>{{ subject.classroom }}</dd></div>
                    </dl>
                  </article>
                }
              </div>
            }
          }

          @case ('subject-create') {
            <ng-container [ngTemplateOutlet]="subjectFormTemplate" [ngTemplateOutletContext]="{ editing: false }" />
          }

          @case ('subject-edit') {
            @if (subjectDetailLoading()) {
              <div class="management-loading checkmate-card">
                <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                Cargando materia...
              </div>
            } @else if (subjectDetail()) {
              <ng-container [ngTemplateOutlet]="subjectFormTemplate" [ngTemplateOutletContext]="{ editing: true }" />
            } @else {
              <div class="empty-state checkmate-card">
                <p>No se encontro la materia solicitada.</p>
                <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/subjects'">
                  Volver a materias
                </a>
              </div>
            }
          }

          @case ('schedules') {
            @if (isAdmin()) {
              <div class="checkmate-card management-table-card">
                <div class="segmented-control">
                  <button
                    type="button"
                    [class.is-active]="selectedAdminScheduleDay() === 'TODOS'"
                    (click)="selectedAdminScheduleDay.set('TODOS')"
                  >
                    Todos
                  </button>
                  @for (day of scheduleDays(); track day) {
                    <button
                      type="button"
                      [class.is-active]="day.toUpperCase() === selectedAdminScheduleDay()"
                      (click)="selectedAdminScheduleDay.set(day.toUpperCase())"
                    >
                      {{ day }}
                    </button>
                  }
                </div>
                <div class="management-table-wrap">
                  <table class="management-table">
                    <thead>
                      <tr>
                        <th>Dia</th>
                        <th>Hora</th>
                        <th>Materia</th>
                        <th>Profesor</th>
                        <th>Grupo</th>
                        <th>Aula</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      @if (schedulesLoading()) {
                        <tr><td colspan="7">Cargando horarios...</td></tr>
                      } @else {
                        @for (schedule of adminSchedulesForSelectedDay(); track schedule.id) {
                          <tr>
                            <td>{{ schedule.day }}</td>
                            <td>{{ schedule.time }}</td>
                            <td><strong>{{ schedule.subject }}</strong></td>
                            <td>{{ schedule.teacher }}</td>
                            <td>{{ schedule.group }}</td>
                            <td>{{ schedule.classroom }}</td>
                            <td>
                              <div class="management-actions">
                                <a
                                  class="btn-checkmate btn-checkmate-secondary"
                                  [routerLink]="baseRoute() + '/schedules/' + schedule.id + '/edit'"
                                >
                                  Editar
                                </a>
                                <button
                                  type="button"
                                  class="btn-checkmate btn-checkmate-danger"
                                  (click)="deactivateSchedule(schedule)"
                                >
                                  Dar de baja
                                </button>
                              </div>
                            </td>
                          </tr>
                        } @empty {
                          <tr><td colspan="7">No hay horarios registrados.</td></tr>
                        }
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            } @else {
              <div class="checkmate-card management-table-card">
                <div class="segmented-control">
                  @for (day of scheduleDays(); track day) {
                    <button
                      type="button"
                      [class.is-active]="day.toUpperCase() === selectedScheduleDay()"
                      (click)="selectedScheduleDay.set(day.toUpperCase())"
                    >
                      {{ day }}
                    </button>
                  }
                </div>
                <div class="management-table-wrap">
                  <table class="management-table">
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Materia</th>
                        <th>Profesor</th>
                        <th>Grupo</th>
                        <th>Aula</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (schedule of directorSchedulesForSelectedDay(); track schedule.id) {
                        <tr>
                          <td>{{ schedule.time }}</td>
                          <td><strong>{{ schedule.subject }}</strong></td>
                          <td>{{ schedule.teacher }}</td>
                          <td>{{ schedule.group }}</td>
                          <td>{{ schedule.classroom }}</td>
                        </tr>
                      } @empty {
                        <tr><td colspan="5">No hay clases este dia.</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          }

          @case ('schedule-create') {
            <ng-container [ngTemplateOutlet]="scheduleFormTemplate" [ngTemplateOutletContext]="{ editing: false }" />
          }

          @case ('schedule-edit') {
            @if (scheduleDetailLoading()) {
              <div class="management-loading checkmate-card">
                <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                Cargando horario...
              </div>
            } @else if (scheduleDetail()) {
              <ng-container [ngTemplateOutlet]="scheduleFormTemplate" [ngTemplateOutletContext]="{ editing: true }" />
            } @else {
              <div class="empty-state checkmate-card">
                <p>No se encontro el horario solicitado.</p>
                <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/schedules'">
                  Volver a horarios
                </a>
              </div>
            }
          }

          @case ('school-years') {
            <div class="checkmate-card management-table-card">
              <div class="management-table-wrap">
                <table class="management-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Estado</th>
                      <th>Grupos</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @if (schoolYearsLoading()) {
                      <tr><td colspan="6">Cargando periodos...</td></tr>
                    } @else {
                      @for (year of schoolYears(); track year.id) {
                        <tr>
                          <td><strong>{{ year.name }}</strong></td>
                          <td>{{ year.startDate }}</td>
                          <td>{{ year.endDate }}</td>
                          <td>{{ year.status }}</td>
                          <td>{{ year.groupsCount }}</td>
                          <td>
                            <a
                              class="btn-checkmate btn-checkmate-secondary"
                              [routerLink]="baseRoute() + '/academic-periods/' + year.id + '/edit'"
                            >
                              Editar
                            </a>
                          </td>
                        </tr>
                      } @empty {
                        <tr><td colspan="6">No hay periodos academicos registrados.</td></tr>
                      }
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          @case ('school-year-create') {
            <ng-container [ngTemplateOutlet]="schoolYearFormTemplate" [ngTemplateOutletContext]="{ editing: false }" />
          }

          @case ('school-year-edit') {
            @if (schoolYearDetail()) {
              <ng-container [ngTemplateOutlet]="schoolYearFormTemplate" [ngTemplateOutletContext]="{ editing: true }" />
            } @else {
              <div class="empty-state checkmate-card">
                <p>No se encontro el periodo academico solicitado.</p>
                <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/academic-periods'">
                  Volver a periodos academicos
                </a>
              </div>
            }
          }

          @case ('careers') {
            <div class="checkmate-card management-table-card">
              <div class="management-table-wrap">
                <table class="management-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Codigo</th>
                      <th>Director</th>
                      <th>Grupos</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @if (careersLoading()) {
                      <tr><td colspan="6">Cargando carreras...</td></tr>
                    } @else {
                      @for (career of careers(); track career.id) {
                        <tr>
                          <td><strong>{{ career.name }}</strong>@if (career.shortName) { <span> ({{ career.shortName }})</span> }</td>
                          <td>{{ career.code }}</td>
                          <td>{{ career.directorName }}</td>
                          <td>{{ career.groupsCount }}</td>
                          <td>
                            <span [class]="statusClass(career.isActive ? { label: 'Activa', tone: 'success' } : { label: 'Inactiva', tone: 'neutral' })">
                              {{ career.isActive ? 'Activa' : 'Inactiva' }}
                            </span>
                          </td>
                          <td>
                            <div class="management-actions">
                              <a
                                class="btn-checkmate btn-checkmate-secondary"
                                [routerLink]="baseRoute() + '/careers/' + career.id + '/edit'"
                              >
                                Editar
                              </a>
                              @if (career.isActive) {
                                <button
                                  type="button"
                                  class="btn-checkmate btn-checkmate-danger"
                                  (click)="deactivateCareer(career)"
                                >
                                  Dar de baja
                                </button>
                              } @else {
                                <button
                                  type="button"
                                  class="btn-checkmate btn-checkmate-primary"
                                  (click)="reactivateCareer(career)"
                                >
                                  Reactivar
                                </button>
                              }
                            </div>
                          </td>
                        </tr>
                      } @empty {
                        <tr><td colspan="6">No hay carreras registradas.</td></tr>
                      }
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          @case ('career-create') {
            <ng-container [ngTemplateOutlet]="careerFormTemplate" [ngTemplateOutletContext]="{ editing: false }" />
          }

          @case ('career-edit') {
            @if (careerDetailLoading()) {
              <div class="management-loading checkmate-card">
                <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                Cargando carrera...
              </div>
            } @else if (careerDetail()) {
              <ng-container [ngTemplateOutlet]="careerFormTemplate" [ngTemplateOutletContext]="{ editing: true }" />
            } @else {
              <div class="empty-state checkmate-card">
                <p>No se encontro la carrera solicitada.</p>
                <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/careers'">
                  Volver a carreras
                </a>
              </div>
            }
          }

          @case ('attendance-settings') {
            <div class="checkmate-card management-table-card">
              <div class="management-table-wrap">
                <table class="management-table">
                  <thead>
                    <tr>
                      <th>Horario</th>
                      <th>Tolerancia a tiempo</th>
                      <th>Tolerancia de retardo</th>
                      <th>Registro manual</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @if (attendanceSettingsLoading()) {
                      <tr><td colspan="6">Cargando reglas de asistencia...</td></tr>
                    } @else {
                      @for (setting of attendanceSettings(); track setting.id) {
                        <tr>
                          <td>{{ setting.scheduleLabel }}</td>
                          <td>{{ setting.presentToleranceMinutes }} min</td>
                          <td>{{ setting.lateToleranceMinutes }} min</td>
                          <td>{{ setting.allowManualAttendance ? 'Si' : 'No' }}</td>
                          <td>
                            <span [class]="statusClass(setting.isActive ? { label: 'Activa', tone: 'success' } : { label: 'Inactiva', tone: 'neutral' })">
                              {{ setting.isActive ? 'Activa' : 'Inactiva' }}
                            </span>
                          </td>
                          <td>
                            <div class="management-actions">
                              <a
                                class="btn-checkmate btn-checkmate-secondary"
                                [routerLink]="baseRoute() + '/attendance-settings/' + setting.id + '/edit'"
                              >
                                Editar
                              </a>
                              @if (setting.isActive) {
                                <button
                                  type="button"
                                  class="btn-checkmate btn-checkmate-danger"
                                  (click)="deactivateAttendanceSetting(setting)"
                                >
                                  Desactivar
                                </button>
                              } @else {
                                <button
                                  type="button"
                                  class="btn-checkmate btn-checkmate-primary"
                                  (click)="reactivateAttendanceSetting(setting)"
                                >
                                  Activar
                                </button>
                              }
                            </div>
                          </td>
                        </tr>
                      } @empty {
                        <tr><td colspan="6">No hay reglas de asistencia registradas.</td></tr>
                      }
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          @case ('attendance-setting-create') {
            <ng-container
              [ngTemplateOutlet]="attendanceSettingFormTemplate"
              [ngTemplateOutletContext]="{ editing: false }"
            />
          }

          @case ('attendance-setting-edit') {
            @if (attendanceSettingDetailLoading()) {
              <div class="management-loading checkmate-card">
                <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                Cargando regla de asistencia...
              </div>
            } @else if (attendanceSettingDetail()) {
              <ng-container
                [ngTemplateOutlet]="attendanceSettingFormTemplate"
                [ngTemplateOutletContext]="{ editing: true }"
              />
            } @else {
              <div class="empty-state checkmate-card">
                <p>No se encontro la regla de asistencia solicitada.</p>
                <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/attendance-settings'">
                  Volver a reglas de asistencia
                </a>
              </div>
            }
          }

          @case ('classrooms') {
            <div class="checkmate-card management-table-card">
              <div class="management-table-wrap">
                <table class="management-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Edificio</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @if (classroomsLoading()) {
                      <tr><td colspan="3">Cargando salones...</td></tr>
                    } @else {
                      @for (classroom of classrooms(); track classroom.id) {
                        <tr>
                          <td><strong>{{ classroom.name }}</strong></td>
                          <td>{{ classroom.building }}</td>
                          <td>
                            <div class="management-actions">
                              <a
                                class="btn-checkmate btn-checkmate-secondary"
                                [routerLink]="baseRoute() + '/classrooms/' + classroom.id + '/edit'"
                              >
                                Editar
                              </a>
                              <button
                                type="button"
                                class="btn-checkmate btn-checkmate-danger"
                                (click)="deleteClassroom(classroom)"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      } @empty {
                        <tr><td colspan="3">No hay salones registrados.</td></tr>
                      }
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          @case ('classroom-create') {
            <ng-container [ngTemplateOutlet]="classroomFormTemplate" [ngTemplateOutletContext]="{ editing: false }" />
          }

          @case ('classroom-edit') {
            @if (classroomDetailLoading()) {
              <div class="management-loading checkmate-card">
                <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                Cargando salon...
              </div>
            } @else if (classroomDetail()) {
              <ng-container [ngTemplateOutlet]="classroomFormTemplate" [ngTemplateOutletContext]="{ editing: true }" />
            } @else {
              <div class="empty-state checkmate-card">
                <p>No se encontro el salon solicitado.</p>
                <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/classrooms'">
                  Volver a salones
                </a>
              </div>
            }
          }

          @case ('attendance') {
            <div class="management-split">
              <ng-container [ngTemplateOutlet]="attendanceTable" />
              <aside class="checkmate-card management-summary">
                <h2>Revision de asistencias</h2>
                <p>Usa los filtros para auditar faltas, retardos y clases no impartidas.</p>
                <dl class="management-metrics">
                  <div><dt>Asistencia</dt><dd>{{ snapshot().charts.attendanceRate }}%</dd></div>
                  <div><dt>Faltas</dt><dd>{{ snapshot().charts.absencesTotal }}</dd></div>
                </dl>
              </aside>
            </div>
          }

          @case ('justifications') {
            <ng-container [ngTemplateOutlet]="justificationsTable" />
          }

          @case ('devices') {
            <div class="management-card-grid">
              @for (device of snapshot().devices; track device.id) {
                <article class="checkmate-card management-card management-card--device">
                  <div class="management-card__header">
                    <span class="management-icon"><i class="fa-solid fa-microchip" aria-hidden="true"></i></span>
                    <span [class]="statusClass(device.status)">{{ device.status.label }}</span>
                  </div>
                  <h2>{{ device.name }}</h2>
                  <p>ID: {{ device.id }}</p>
                  <dl class="management-data-grid">
                    <div><dt>IP local</dt><dd>{{ device.ipAddress }}</dd></div>
                    <div><dt>Salon</dt><dd>{{ device.classroom }}</dd></div>
                    <div><dt>Edificio</dt><dd>{{ device.building }}</dd></div>
                    <div><dt>Ultima sincronizacion</dt><dd>{{ device.lastSync }}</dd></div>
                  </dl>
                  <div class="management-actions">
                    <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="pingDevice(device)">
                      Probar
                    </button>
                    @if (canEditDevices()) {
                      <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/nfc-devices/' + device.id + '/edit'">
                        Editar
                      </a>
                    }
                  </div>
                </article>
              }
            </div>
          }

          @case ('device-create') {
            <form class="checkmate-card management-form" [formGroup]="createDeviceForm" (ngSubmit)="createDevice()">
              <div class="management-form__grid">
                <label class="checkmate-form-field">
                  <span class="checkmate-label">MAC address</span>
                  <input
                    class="checkmate-input"
                    type="text"
                    formControlName="macAddress"
                    placeholder="00:1A:2B:3C:4D:5E"
                  />
                  @if (createDeviceForm.controls.macAddress.touched && createDeviceForm.controls.macAddress.invalid) {
                    <p class="checkmate-field-error">Formato de MAC invalido. Usa AA:BB:CC:DD:EE:FF.</p>
                  }
                </label>
                <label class="checkmate-form-field">
                  <span class="checkmate-label">IP (opcional)</span>
                  <input class="checkmate-input" type="text" formControlName="ipAddress" />
                </label>
                <label class="checkmate-form-field management-form__full">
                  <span class="checkmate-label">Salon</span>
                  <select class="checkmate-select" formControlName="classroomId">
                    <option value="" disabled>Selecciona un salon</option>
                    @for (classroom of classrooms(); track classroom.id) {
                      <option [value]="classroom.id">{{ classroom.name }} - {{ classroom.building }}</option>
                    }
                  </select>
                  @if (classrooms().length === 0) {
                    <p class="checkmate-field-error">No hay salones disponibles.</p>
                  }
                </label>
              </div>
              <footer class="management-form__footer">
                <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/nfc-devices'">Cancelar</a>
                <button class="btn-checkmate btn-checkmate-primary" type="submit" [disabled]="submitting()">
                  Crear dispositivo
                </button>
              </footer>
            </form>
          }

          @case ('device-edit') {
            @if (selectedDevice(); as device) {
              <form class="checkmate-card management-form" [formGroup]="deviceForm" (ngSubmit)="saveDevice(device)">
                <div class="management-form__grid">
                  <label class="checkmate-form-field">
                    <span class="checkmate-label">MAC address</span>
                    <input class="checkmate-input" type="text" formControlName="macAddress" readonly />
                  </label>
                  <label class="checkmate-form-field">
                    <span class="checkmate-label">IP</span>
                    <input class="checkmate-input" type="text" formControlName="ipAddress" [readonly]="!canEditDevices()" />
                  </label>
                  <label class="checkmate-form-field management-form__full">
                    <span class="checkmate-label">Salon</span>
                    <select class="checkmate-select" formControlName="classroomId">
                      @for (classroom of classrooms(); track classroom.id) {
                        <option [value]="classroom.id">{{ classroom.name }} - {{ classroom.building }}</option>
                      }
                    </select>
                  </label>
                </div>
                <aside class="management-form__aside">
                  <span [class]="statusClass(device.status)">{{ device.status.label }}</span>
                  <p>Solo el administrador puede editar dispositivos. El director puede consultarlos y probarlos.</p>
                  <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="pingDevice(device)">
                    Probar dispositivo
                  </button>
                </aside>
                <footer class="management-form__footer">
                  <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/nfc-devices'">Cancelar</a>
                  @if (canEditDevices()) {
                    <button class="btn-checkmate btn-checkmate-primary" type="submit" [disabled]="submitting()">Guardar</button>
                  }
                </footer>
              </form>
            } @else {
              <div class="empty-state checkmate-card">
                <p>No se encontro el dispositivo solicitado.</p>
                <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/nfc-devices'">
                  Volver a dispositivos
                </a>
              </div>
            }
          }

          @case ('incidents') {
            <div class="management-split">
              <div class="checkmate-card management-table-card">
                <div class="management-toolbar">
                  <div class="teacher-tabs">
                    @for (tab of incidentTabs; track tab.key) {
                      <button type="button" [class.is-active]="incidentTab() === tab.key" (click)="incidentTab.set(tab.key)">
                        {{ tab.label }}
                      </button>
                    }
                  </div>
                </div>
                <div class="management-list">
                  @for (incident of filteredIncidents(); track incident.id) {
                    <article class="management-record">
                      <span class="management-icon management-icon--danger">
                        <i class="fa-solid fa-fire" aria-hidden="true"></i>
                      </span>
                      <div>
                        <h2>{{ incident.title }}</h2>
                        <p>{{ incident.date }} · {{ incident.groups.join(', ') || 'Sin grupos' }}</p>
                      </div>
                      <span [class]="statusClass(incident.severity)">{{ incident.severity.label }}</span>
                      <span [class]="statusClass(incident.status)">{{ incident.status.label }}</span>
                      <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/incidents/' + incident.id">
                        Detalles
                      </a>
                    </article>
                  } @empty {
                    <p class="dropdown-empty">No hay incidentes en esta categoria.</p>
                  }
                </div>
              </div>
              <aside class="checkmate-card management-summary">
                <h2>Resumen</h2>
                <dl class="management-metrics">
                  <div><dt>Activos</dt><dd>{{ incidentCountByStatus('ACTIVO') }}</dd></div>
                  <div><dt>Resueltos</dt><dd>{{ incidentCountByStatus('RESUELTO') }}</dd></div>
                  <div><dt>Cancelados</dt><dd>{{ incidentCountByStatus('CANCELADO') }}</dd></div>
                </dl>
              </aside>
            </div>
          }

          @case ('incident-new') {
            <form class="checkmate-card management-form" [formGroup]="incidentForm" (ngSubmit)="submitIncident()">
              <div class="management-type-grid">
                @for (type of incidentTypes; track type.value) {
                  <button
                    type="button"
                    class="management-type-card"
                    [class.is-active]="incidentForm.controls.type.value === type.value"
                    (click)="incidentForm.controls.type.setValue(type.value)"
                  >
                    <i [class]="type.icon" aria-hidden="true"></i>
                    <strong>{{ type.label }}</strong>
                    <small>{{ type.caption }}</small>
                  </button>
                }
              </div>
              <div class="management-form__grid">
                <label class="checkmate-form-field">
                  <span class="checkmate-label">Titulo del incidente</span>
                  <input class="checkmate-input" type="text" formControlName="title" placeholder="Ej. Fuga de gas detectada" />
                </label>
                <label class="checkmate-form-field">
                  <span class="checkmate-label">Severidad</span>
                  <select class="checkmate-select" formControlName="severity">
                    <option value="CRITICA">Critica</option>
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Media</option>
                    <option value="BAJA">Baja</option>
                  </select>
                </label>
                <label class="checkmate-form-field management-form__full">
                  <span class="checkmate-label">Descripcion</span>
                  <textarea class="checkmate-textarea" formControlName="description" placeholder="Describe la situacion con detalle"></textarea>
                </label>
              </div>

              <div class="management-form__grid">
                <label class="checkmate-form-field">
                  <span class="checkmate-label">Grupo afectado</span>
                  <select
                    class="checkmate-select"
                    [ngModel]="selectedIncidentGroupId()"
                    [ngModelOptions]="{ standalone: true }"
                    (ngModelChange)="onIncidentGroupChange($event)"
                  >
                    <option value="">Selecciona un grupo</option>
                    @for (group of snapshot().groups; track group.id) {
                      <option [value]="group.id">{{ group.label }} - {{ group.career }}</option>
                    }
                  </select>
                </label>

                <label class="checkmate-form-field">
                  <span class="checkmate-label">Horario (ancla del incidente)</span>
                  <select
                    class="checkmate-select"
                    [ngModel]="selectedIncidentScheduleId()"
                    [ngModelOptions]="{ standalone: true }"
                    (ngModelChange)="selectedIncidentScheduleId.set($event)"
                    [disabled]="!selectedIncidentGroupId() || loadingIncidentGroupData()"
                  >
                    <option value="">Selecciona un horario</option>
                    @for (schedule of incidentGroupSchedules(); track schedule.id) {
                      <option [value]="schedule.id">{{ schedule.day }} {{ schedule.time }} - {{ schedule.subject }}</option>
                    }
                  </select>
                </label>
              </div>

              @if (selectedIncidentGroupId()) {
                <div class="checkmate-form-field">
                  <span class="checkmate-label">Alumnos afectados</span>
                  <div class="teacher-checkbox-list">
                    @for (student of incidentGroupStudents(); track student.id) {
                      <label class="checkmate-checkbox">
                        <input
                          type="checkbox"
                          [checked]="isIncidentStudentSelected(student.id)"
                          (change)="toggleIncidentStudent(student.id)"
                        />
                        <span>{{ student.name }} - {{ student.controlNumber }}</span>
                      </label>
                    } @empty {
                      <p class="dropdown-empty">Este grupo no tiene alumnos activos.</p>
                    }
                  </div>
                </div>
              }

              <div class="management-form__grid">
                <app-file-upload
                  class="management-form__full"
                  title="Evidencia"
                  description="Haz clic para subir o arrastra el archivo."
                  accept="image/png,image/jpeg,application/pdf"
                  [maxSizeMb]="10"
                  (filesSelected)="setIncidentEvidence($event)"
                  (fileRemoved)="clearIncidentEvidence()"
                />
              </div>

              <footer class="management-form__footer">
                <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/incidents'">Cancelar</a>
                <button
                  class="btn-checkmate btn-checkmate-primary"
                  type="submit"
                  [disabled]="incidentForm.invalid || submitting() || !selectedIncidentScheduleId() || !selectedIncidentStudentIds().length"
                >
                  <i class="fa-solid fa-floppy-disk" aria-hidden="true"></i>
                  Guardar incidente
                </button>
              </footer>
            </form>
          }

          @case ('incident-detail') {
            @if (incidentDetailLoading()) {
              <div class="management-loading checkmate-card">
                <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                Cargando incidente...
              </div>
            } @else if (incidentDetail(); as incident) {
              <div class="management-detail-grid">
                <article class="checkmate-card management-info-panel management-info-panel--wide">
                  <div class="management-card__header">
                    <span class="management-icon management-icon--danger"><i class="fa-solid fa-fire" aria-hidden="true"></i></span>
                    <span [class]="statusClass(incident.status)">{{ incident.status.label }}</span>
                  </div>
                  <h2>{{ incident.title }}</h2>
                  <dl class="management-data-grid">
                    <div><dt>Tipo</dt><dd>{{ incident.type }}</dd></div>
                    <div><dt>Reportado por</dt><dd>{{ incident.reportedBy }}</dd></div>
                    <div><dt>Fecha</dt><dd>{{ incident.date }}</dd></div>
                    <div><dt>Grupos afectados</dt><dd>{{ incident.groups.join(', ') || 'Sin grupos' }}</dd></div>
                  </dl>
                  <h3>Descripcion</h3>
                  <p>{{ incident.description || 'Sin descripcion registrada.' }}</p>
                  @if (incident.evidenceUrl) {
                    <a class="btn-checkmate btn-checkmate-secondary" [href]="incident.evidenceUrl" target="_blank" rel="noreferrer">
                      Abrir evidencia
                    </a>
                  }
                  <div class="management-actions">
                    <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/incidents/' + incident.id + '/attendance'">
                      Pase de lista ({{ presentCount(incident) }}/{{ incident.roster.length }})
                    </a>
                    @if (canCloseIncident(incident)) {
                      <button type="button" class="btn-checkmate btn-checkmate-danger" (click)="closeIncident(incident)">
                        Concluir incidente
                      </button>
                    }
                  </div>
                </article>

                <aside class="checkmate-card management-summary">
                  <h2>Historial</h2>
                  <div class="management-timeline">
                    @for (item of incident.history; track item.id) {
                      <article>
                        <strong>{{ item.date }} - {{ item.description }}</strong>
                        <small>{{ item.actor }}</small>
                      </article>
                    } @empty {
                      <p class="dropdown-empty">Sin historial disponible.</p>
                    }
                  </div>
                </aside>
              </div>
            }
          }

          @case ('incident-attendance') {
            @if (incidentDetailLoading()) {
              <div class="management-loading checkmate-card">
                <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                Cargando incidente...
              </div>
            } @else if (incidentDetail(); as incident) {
              <form class="checkmate-card management-form" (ngSubmit)="submitEmergencyList(incident)">
                <header class="management-card__header">
                  <h2>{{ incident.title }}</h2>
                  <span [class]="statusClass(incident.status)">{{ incident.status.label }}</span>
                </header>
                <div class="management-table-wrap">
                  <table class="management-table">
                    <thead>
                      <tr>
                        <th>No. de control</th>
                        <th>Alumno</th>
                        <th>Estado</th>
                        <th>Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of incident.roster; track item.studentId) {
                        <tr [class.is-present]="item.status === 'PRESENTE'" [class.is-absent]="item.status === 'AUSENTE'">
                          <td>{{ item.controlNumber }}</td>
                          <td><strong>{{ item.name }}</strong></td>
                          <td>
                            <select
                              class="checkmate-select"
                              [ngModel]="item.status"
                              [ngModelOptions]="{ standalone: true }"
                              (ngModelChange)="updateRosterStatus(item.studentId, $event)"
                            >
                              <option value="DESCONOCIDO">Sin confirmar</option>
                              <option value="PRESENTE">Presente</option>
                              <option value="AUSENTE">Faltante</option>
                              <option value="EXTRAVIADO">Extraviado</option>
                              <option value="SEGURO">A salvo (fuera del plantel)</option>
                            </select>
                          </td>
                          <td>
                            <input
                              class="checkmate-input"
                              type="text"
                              placeholder="Nota opcional"
                              [ngModel]="item.notes"
                              [ngModelOptions]="{ standalone: true }"
                              (ngModelChange)="updateRosterNotes(item.studentId, $event)"
                            />
                          </td>
                        </tr>
                      } @empty {
                        <tr><td colspan="4">Sin alumnos asociados a este incidente.</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
                <footer class="management-form__footer">
                  <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/incidents/' + incident.id">Cancelar</a>
                  <button class="btn-checkmate btn-checkmate-primary" type="submit" [disabled]="submitting()">Guardar registro</button>
                </footer>
              </form>
            }
          }

          @case ('claims') {
            <div class="checkmate-card management-table-card">
              <div class="management-toolbar">
                <label class="checkmate-form-field">
                  <span class="checkmate-label">Estado</span>
                  <select class="checkmate-select"><option>Todos</option><option>Seguimiento</option><option>Rechazada</option></select>
                </label>
                <label class="checkmate-form-field">
                  <span class="checkmate-label">Grupo</span>
                  <select class="checkmate-select"><option>Todos</option><option>10A</option><option>10B</option></select>
                </label>
              </div>
              <div class="management-table-wrap">
                <table class="management-table">
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      <th>Materia</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (claim of snapshot().claims; track claim.id) {
                      <tr>
                        <td><strong>{{ claim.studentName }}</strong><small>{{ claim.group }}</small></td>
                        <td>{{ claim.subject }}</td>
                        <td>{{ claim.date }}</td>
                        <td><span [class]="statusClass(claim.status)">{{ claim.status.label }}</span></td>
                        <td>
                          <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/claims/' + claim.id">Detalles</a>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          @case ('claim-detail') {
            @if (selectedClaim(); as claim) {
              <div class="management-detail-grid">
                <article class="checkmate-card management-info-panel management-info-panel--wide">
                  <div class="management-card__header">
                    <h2>Detalle de reclamacion - {{ claim.studentName }}</h2>
                    <span [class]="statusClass(claim.status)">{{ claim.status.label }}</span>
                  </div>
                  <dl class="management-data-grid">
                    <div><dt>Grupo</dt><dd>{{ claim.group }}</dd></div>
                    <div><dt>Materia</dt><dd>{{ claim.subject }}</dd></div>
                    <div><dt>Fecha</dt><dd>{{ claim.date }}</dd></div>
                  </dl>
                  <h3>Descripcion del reclamo</h3>
                  <p>{{ claim.description }}</p>
                  <label class="checkmate-form-field">
                    <span class="checkmate-label">Comentario de seguimiento</span>
                    <textarea class="checkmate-textarea" [formControl]="claimComment"></textarea>
                  </label>
                  <div class="management-actions management-actions--spread">
                    <button type="button" class="btn-checkmate btn-checkmate-danger" (click)="claimAction(claim, 'RECHAZADO')">Rechazar</button>
                    <button type="button" class="btn-checkmate btn-checkmate-success" (click)="claimAction(claim, 'EN_PROCESO')">Seguimiento</button>
                    <button type="button" class="btn-checkmate btn-checkmate-warning" (click)="claimAction(claim, 'CONTACTADO')">Contactar</button>
                    <button type="button" class="btn-checkmate btn-checkmate-primary" (click)="claimAction(claim, 'ACEPTADO')">Concluir</button>
                  </div>
                </article>
                <aside class="checkmate-card management-summary">
                  <h2>Evidencia</h2>
                  @if (claim.evidenceUrl) {
                    <div class="management-evidence">{{ claim.evidenceUrl }}</div>
                  } @else {
                    <p>No hay evidencia adjunta.</p>
                  }
                </aside>
              </div>
            }
          }

          @case ('statistics') {
            <div class="stats-grid">
              <article class="stat-card stat-card--info">
                <span class="stat-card__icon"><i class="fa-solid fa-user-graduate" aria-hidden="true"></i></span>
                <div><span class="stat-card__label">Alumnos</span><strong>{{ snapshot().charts.totalStudents }}</strong><p>Activos en carrera</p></div>
              </article>
              <article class="stat-card stat-card--success">
                <span class="stat-card__icon"><i class="fa-solid fa-calendar-check" aria-hidden="true"></i></span>
                <div><span class="stat-card__label">Asistencia</span><strong>{{ snapshot().charts.attendanceRate }}%</strong><p>Promedio general</p></div>
              </article>
              <article class="stat-card stat-card--danger">
                <span class="stat-card__icon"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></span>
                <div><span class="stat-card__label">Incidentes</span><strong>{{ snapshot().charts.incidentsTotal }}</strong><p>Registrados</p></div>
              </article>
              <article class="stat-card stat-card--warning">
                <span class="stat-card__icon"><i class="fa-solid fa-file-circle-question" aria-hidden="true"></i></span>
                <div><span class="stat-card__label">Justificantes</span><strong>{{ snapshot().charts.justifications.pending }}</strong><p>Pendientes</p></div>
              </article>
            </div>
            <div class="management-chart-grid">
              <article class="checkmate-card management-chart">
                <h2>Faltas del dia</h2>
                <div class="management-donut" style="--value: 15"><span>15%</span></div>
              </article>
              <article class="checkmate-card management-chart">
                <h2>Justificantes del dia</h2>
                <div class="management-donut" style="--value: 60"><span>{{ snapshot().charts.justifications.approved }}</span></div>
              </article>
            </div>
          }

          @case ('audit') {
            <div class="management-card-grid">
              @for (entity of auditEntities; track entity.key) {
                <article class="checkmate-card management-card">
                  <div class="management-card__header">
                    <span class="management-icon"><i [class]="entity.icon" aria-hidden="true"></i></span>
                  </div>
                  <h2>{{ entity.label }}</h2>
                  <p>Registro de actividad filtrado por {{ entity.label.toLowerCase() }}.</p>
                  <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/audit/' + entity.key">
                    Acceder
                  </a>
                </article>
              }
            </div>
          }

          @case ('audit-list') {
            <div class="checkmate-card management-table-card">
              <div class="management-toolbar">
                <label class="checkmate-form-field"><span class="checkmate-label">Fecha inicio</span><input class="checkmate-input" type="date" /></label>
                <label class="checkmate-form-field"><span class="checkmate-label">Fecha fin</span><input class="checkmate-input" type="date" /></label>
                <label class="checkmate-form-field"><span class="checkmate-label">Modulo</span><select class="checkmate-select"><option>{{ auditEntityLabel() }}</option></select></label>
              </div>
              <div class="management-table-wrap">
                <table class="management-table">
                  <thead><tr><th>Fecha</th><th>Descripcion</th><th>Nivel</th><th>Usuario</th></tr></thead>
                  <tbody>
                    @if (auditLogsLoading()) {
                      <tr><td colspan="4">Cargando registros...</td></tr>
                    } @else {
                      @for (log of auditLogs(); track log.id) {
                        <tr>
                          <td>{{ log.date }}</td>
                          <td>{{ log.description }}</td>
                          <td><span [class]="statusClass(log.level)">{{ log.level.label }}</span></td>
                          <td>{{ log.performedBy }}</td>
                        </tr>
                      } @empty {
                        <tr><td colspan="4">No hay registros de auditoria para {{ auditEntityLabel().toLowerCase() }}.</td></tr>
                      }
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        }
      }

      <ng-template #attendanceTable>
        <div class="checkmate-card management-table-card">
          <div class="management-toolbar">
            <label class="checkmate-form-field"><span class="checkmate-label">Rango de fecha</span><input class="checkmate-input" type="date" /></label>
            <label class="checkmate-form-field"><span class="checkmate-label">Tipo de asistencia</span><select class="checkmate-select"><option>Todos los estados</option></select></label>
            <label class="checkmate-form-field"><span class="checkmate-label">Materia</span><select class="checkmate-select"><option>Todas las materias</option></select></label>
          </div>
          <div class="management-table-wrap">
            <table class="management-table">
              <thead><tr><th>Fecha</th><th>Materia</th><th>Hora</th><th>Aula</th><th>Estado</th></tr></thead>
              <tbody>
                @for (record of attendanceRows(); track record.id) {
                  <tr>
                    <td>{{ record.date }}</td>
                    <td><strong>{{ record.subject }}</strong></td>
                    <td>{{ record.time }}</td>
                    <td>{{ record.classroom }}</td>
                    <td><span [class]="statusClass(record.status)">{{ record.status.label }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </ng-template>

      <ng-template #justificationsTable>
        <div class="checkmate-card management-table-card">
          <div class="management-toolbar">
            <label class="checkmate-form-field"><span class="checkmate-label">Fecha</span><input class="checkmate-input" type="date" /></label>
            <label class="checkmate-form-field"><span class="checkmate-label">Estado</span><select class="checkmate-select"><option>Todos los estados</option></select></label>
          </div>
          <div class="management-table-wrap">
            <table class="management-table">
              <thead><tr><th>Fecha</th><th>Alumno</th><th>Motivo</th><th>Materia</th><th>Estado</th></tr></thead>
              <tbody>
                @for (item of visibleJustifications(); track item.id) {
                  <tr>
                    <td>{{ item.date }}</td>
                    <td><strong>{{ item.studentName }}</strong></td>
                    <td>{{ item.reason }}</td>
                    <td>{{ item.subject }}</td>
                    <td><span [class]="statusClass(item.status)">{{ item.status.label }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </ng-template>

      <ng-template #scheduleFormTemplate let-editing="editing">
        <form class="checkmate-card management-form" [formGroup]="scheduleForm" (ngSubmit)="submitScheduleForm()">
          <div class="management-form__grid">
            <label class="checkmate-form-field">
              <span class="checkmate-label">Ciclo escolar</span>
              <select
                class="checkmate-select"
                formControlName="schoolYearId"
                [class.is-invalid]="scheduleForm.controls.schoolYearId.touched && scheduleForm.controls.schoolYearId.invalid"
              >
                <option value="" disabled>Selecciona un ciclo</option>
                @for (year of schoolYears(); track year.id) {
                  <option [value]="year.id">{{ year.name }}</option>
                }
              </select>
              @if (scheduleForm.controls.schoolYearId.touched && scheduleForm.controls.schoolYearId.invalid) {
                <p class="checkmate-field-error">Selecciona un ciclo escolar.</p>
              }
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Grupo</span>
              <select
                class="checkmate-select"
                formControlName="groupId"
                [class.is-invalid]="scheduleForm.controls.groupId.touched && scheduleForm.controls.groupId.invalid"
              >
                <option value="" disabled>Selecciona un grupo</option>
                @for (group of snapshot().groups; track group.id) {
                  <option [value]="group.id">{{ group.label }} - {{ group.career }}</option>
                }
              </select>
              @if (scheduleForm.controls.groupId.touched && scheduleForm.controls.groupId.invalid) {
                <p class="checkmate-field-error">Selecciona un grupo.</p>
              }
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Materia</span>
              <select
                class="checkmate-select"
                formControlName="subjectId"
                [class.is-invalid]="scheduleForm.controls.subjectId.touched && scheduleForm.controls.subjectId.invalid"
              >
                <option value="" disabled>Selecciona una materia</option>
                @for (subject of snapshot().subjects; track subject.id) {
                  <option [value]="subject.id">{{ subject.name }}</option>
                }
              </select>
              @if (scheduleForm.controls.subjectId.touched && scheduleForm.controls.subjectId.invalid) {
                <p class="checkmate-field-error">Selecciona una materia.</p>
              }
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Profesor</span>
              <select
                class="checkmate-select"
                formControlName="teacherId"
                [class.is-invalid]="scheduleForm.controls.teacherId.touched && scheduleForm.controls.teacherId.invalid"
              >
                <option value="" disabled>Selecciona un profesor</option>
                @for (teacher of snapshot().teachers; track teacher.id) {
                  <option [value]="teacher.id">{{ teacher.name }}</option>
                }
              </select>
              @if (scheduleForm.controls.teacherId.touched && scheduleForm.controls.teacherId.invalid) {
                <p class="checkmate-field-error">Selecciona un profesor.</p>
              }
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Salon</span>
              <select
                class="checkmate-select"
                formControlName="classroomId"
                [class.is-invalid]="scheduleForm.controls.classroomId.touched && scheduleForm.controls.classroomId.invalid"
              >
                <option value="" disabled>Selecciona un salon</option>
                @for (classroom of classrooms(); track classroom.id) {
                  <option [value]="classroom.id">{{ classroom.name }} - {{ classroom.building }}</option>
                }
              </select>
              @if (scheduleForm.controls.classroomId.touched && scheduleForm.controls.classroomId.invalid) {
                <p class="checkmate-field-error">Selecciona un salon.</p>
              }
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Dia</span>
              <select class="checkmate-select" formControlName="dayOfWeek">
                @for (day of dayOfWeekOptions; track day.value) {
                  <option [value]="day.value">{{ day.label }}</option>
                }
              </select>
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Hora de inicio</span>
              <input
                class="checkmate-input"
                type="time"
                formControlName="startTime"
                [class.is-invalid]="scheduleForm.controls.startTime.touched && scheduleForm.controls.startTime.invalid"
              />
              @if (scheduleForm.controls.startTime.touched && scheduleForm.controls.startTime.invalid) {
                <p class="checkmate-field-error">Indica la hora de inicio.</p>
              }
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Hora de fin</span>
              <input
                class="checkmate-input"
                type="time"
                formControlName="endTime"
                [class.is-invalid]="scheduleForm.controls.endTime.touched && scheduleForm.controls.endTime.invalid"
              />
              @if (scheduleForm.controls.endTime.touched && scheduleForm.controls.endTime.invalid) {
                <p class="checkmate-field-error">Indica la hora de fin.</p>
              }
            </label>
          </div>
          <footer class="management-form__footer">
            <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/schedules'">Cancelar</a>
            <button class="btn-checkmate btn-checkmate-primary" type="submit" [disabled]="submitting()">
              {{ editing ? 'Guardar cambios' : 'Crear horario' }}
            </button>
          </footer>
        </form>
      </ng-template>

      <ng-template #schoolYearFormTemplate let-editing="editing">
        <form class="checkmate-card management-form" [formGroup]="schoolYearForm" (ngSubmit)="submitSchoolYearForm()">
          <div class="management-form__grid">
            <label class="checkmate-form-field">
              <span class="checkmate-label">Nombre (AAAA-AAAA)</span>
              <input class="checkmate-input" type="text" formControlName="name" placeholder="2026-2027" />
              @if (schoolYearForm.controls.name.touched && schoolYearForm.controls.name.invalid) {
                <p class="checkmate-field-error">Usa el formato AAAA-AAAA, ej. 2026-2027.</p>
              }
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Fecha de inicio</span>
              <input class="checkmate-input" type="date" formControlName="startDate" />
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Fecha de fin</span>
              <input class="checkmate-input" type="date" formControlName="endDate" />
            </label>
            @if (editing) {
              <label class="checkmate-form-field">
                <span class="checkmate-label">Estado</span>
                <select class="checkmate-select" formControlName="status">
                  <option value="PROXIMO">Proximo</option>
                  <option value="ACTIVO">Activo</option>
                  <option value="FINALIZADO">Finalizado</option>
                </select>
              </label>
            }
          </div>
          <footer class="management-form__footer">
            <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/academic-periods'">Cancelar</a>
            <button class="btn-checkmate btn-checkmate-primary" type="submit" [disabled]="submitting()">
              {{ editing ? 'Guardar cambios' : 'Crear periodo' }}
            </button>
          </footer>
        </form>
      </ng-template>

      <ng-template #careerFormTemplate let-editing="editing">
        <form class="checkmate-card management-form" [formGroup]="careerForm" (ngSubmit)="submitCareerForm()">
          <div class="management-form__grid">
            <label class="checkmate-form-field">
              <span class="checkmate-label">Nombre</span>
              <input class="checkmate-input" type="text" formControlName="name" placeholder="Ingenieria en Sistemas" />
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Nombre corto (opcional)</span>
              <input class="checkmate-input" type="text" formControlName="shortName" placeholder="ISC" />
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Codigo</span>
              <input class="checkmate-input" type="text" formControlName="code" placeholder="ISC-01" />
              @if (careerForm.controls.code.touched && careerForm.controls.code.invalid) {
                <p class="checkmate-field-error">Usa mayusculas, numeros y guiones (2-30 caracteres).</p>
              }
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Director de carrera</span>
              <select class="checkmate-select" formControlName="directorId">
                <option value="" disabled>Selecciona un director</option>
                @for (director of careerDirectors(); track director.id) {
                  <option [value]="director.id">{{ director.fullName }}</option>
                }
              </select>
            </label>
          </div>
          <footer class="management-form__footer">
            <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/careers'">Cancelar</a>
            <button class="btn-checkmate btn-checkmate-primary" type="submit" [disabled]="submitting()">
              {{ editing ? 'Guardar cambios' : 'Crear carrera' }}
            </button>
          </footer>
        </form>
      </ng-template>

      <ng-template #subjectFormTemplate let-editing="editing">
        <form class="checkmate-card management-form" [formGroup]="subjectForm" (ngSubmit)="submitSubjectForm()">
          <div class="management-form__grid">
            <label class="checkmate-form-field">
              <span class="checkmate-label">Nombre</span>
              <input class="checkmate-input" type="text" formControlName="name" placeholder="Matematicas" />
              @if (subjectForm.controls.name.touched && subjectForm.controls.name.invalid) {
                <p class="checkmate-field-error">El nombre debe tener entre 3 y 100 caracteres.</p>
              }
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Codigo</span>
              <input class="checkmate-input" type="text" formControlName="code" placeholder="MAT-01" />
              @if (subjectForm.controls.code.touched && subjectForm.controls.code.invalid) {
                <p class="checkmate-field-error">Usa mayusculas, numeros y guiones (2-30 caracteres).</p>
              }
            </label>
            <label class="checkmate-form-field management-form__full">
              <span class="checkmate-label">Descripcion (opcional)</span>
              <textarea class="checkmate-textarea" rows="3" formControlName="description" maxlength="255" placeholder="Descripcion breve de la materia"></textarea>
            </label>
          </div>
          <div class="checkmate-form-field">
            <span class="checkmate-label">Carreras</span>
            <small>Selecciona las carreras donde se imparte esta materia. Si no seleccionas ninguna quedara sin asignar.</small>
            <div class="teacher-checkbox-list">
              @for (career of activeCareersForSubjectPicker(); track career.id) {
                <label class="checkmate-checkbox">
                  <input
                    type="checkbox"
                    [checked]="isSubjectCareerSelected(career.id)"
                    (change)="toggleSubjectCareer(career.id)"
                  />
                  <span>{{ career.name }}@if (career.shortName) { ({{ career.shortName }}) }</span>
                </label>
              } @empty {
                <p class="dropdown-empty">No hay carreras activas registradas.</p>
              }
            </div>
          </div>
          <footer class="management-form__footer">
            <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/subjects'">Cancelar</a>
            <button class="btn-checkmate btn-checkmate-primary" type="submit" [disabled]="submitting()">
              {{ editing ? 'Guardar cambios' : 'Crear materia' }}
            </button>
          </footer>
        </form>
      </ng-template>

      <ng-template #attendanceSettingFormTemplate let-editing="editing">
        <form
          class="checkmate-card management-form"
          [formGroup]="attendanceSettingForm"
          (ngSubmit)="submitAttendanceSettingForm()"
        >
          <div class="management-form__grid">
            <label class="checkmate-form-field">
              <span class="checkmate-label">Horario</span>
              <select class="checkmate-select" formControlName="scheduleId">
                <option value="" disabled>Selecciona un horario</option>
                @for (schedule of schedules(); track schedule.id) {
                  <option [value]="schedule.id">
                    {{ schedule.subject }} - {{ schedule.group }} ({{ schedule.day }} {{ schedule.time }})
                  </option>
                }
              </select>
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Tolerancia a tiempo (minutos)</span>
              <input class="checkmate-input" type="number" min="0" max="255" formControlName="presentToleranceMinutes" />
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Tolerancia de retardo (minutos)</span>
              <input class="checkmate-input" type="number" min="0" max="255" formControlName="lateToleranceMinutes" />
              @if (attendanceSettingForm.controls.lateToleranceMinutes.touched && attendanceSettingForm.errors?.['lateNotGreater']) {
                <p class="checkmate-field-error">La tolerancia de retardo debe ser mayor a la de asistencia a tiempo.</p>
              }
            </label>
            <label class="checkmate-form-field checkmate-form-field--checkbox">
              <input class="checkmate-checkbox" type="checkbox" formControlName="allowManualAttendance" />
              <span class="checkmate-label">Permitir registro manual de asistencia</span>
            </label>
          </div>
          <footer class="management-form__footer">
            <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/attendance-settings'">Cancelar</a>
            <button class="btn-checkmate btn-checkmate-primary" type="submit" [disabled]="submitting()">
              {{ editing ? 'Guardar cambios' : 'Crear regla' }}
            </button>
          </footer>
        </form>
      </ng-template>

      <ng-template #classroomFormTemplate let-editing="editing">
        <form class="checkmate-card management-form" [formGroup]="classroomForm" (ngSubmit)="submitClassroomForm()">
          <div class="management-form__grid">
            <label class="checkmate-form-field">
              <span class="checkmate-label">Nombre</span>
              <input class="checkmate-input" type="text" formControlName="name" placeholder="Aula 103" />
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Edificio</span>
              <input class="checkmate-input" type="text" formControlName="building" placeholder="Edificio A" />
            </label>
          </div>
          <footer class="management-form__footer">
            <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/classrooms'">Cancelar</a>
            <button class="btn-checkmate btn-checkmate-primary" type="submit" [disabled]="submitting()">
              {{ editing ? 'Guardar cambios' : 'Crear salon' }}
            </button>
          </footer>
        </form>
      </ng-template>
    </section>
  `,
})
export class ManagementWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly managementData = inject(ManagementDataService);
  private readonly toastService = inject(ToastService);
  private readonly dialogService = inject(DialogService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly view = signal<ManagementView>('students');
  protected readonly snapshot = signal<ManagementSnapshot>(EMPTY_MANAGEMENT_SNAPSHOT);
  protected readonly classrooms = signal<ManagementClassroom[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal('');
  protected readonly selectedStudentId = signal('');
  protected readonly selectedTeacherId = signal('');
  protected readonly selectedIncidentId = signal('');
  protected readonly selectedClaimId = signal('');
  protected readonly selectedDeviceId = signal('');
  protected readonly schedules = signal<ManagementSchedule[]>([]);
  protected readonly schedulesLoading = signal(false);
  protected readonly selectedScheduleDay = signal('LUNES');
  protected readonly selectedAdminScheduleDay = signal('TODOS');
  protected readonly scheduleDetail = signal<ManagementSchedule | null>(null);
  protected readonly scheduleDetailLoading = signal(false);
  protected readonly selectedScheduleId = signal('');
  protected readonly schoolYears = signal<ManagementSchoolYear[]>([]);
  protected readonly schoolYearsLoading = signal(false);
  protected readonly schoolYearDetail = signal<ManagementSchoolYear | null>(null);
  protected readonly selectedSchoolYearId = signal('');
  protected readonly careers = signal<ManagementCareer[]>([]);
  protected readonly careersLoading = signal(false);
  protected readonly careerDetail = signal<ManagementCareer | null>(null);
  protected readonly careerDetailLoading = signal(false);
  protected readonly selectedCareerId = signal('');
  protected readonly careerDirectors = signal<ManagementCareerDirector[]>([]);
  protected readonly subjects = signal<ManagementSubject[]>([]);
  protected readonly subjectsLoading = signal(false);
  protected readonly subjectDetail = signal<ManagementSubject | null>(null);
  protected readonly subjectDetailLoading = signal(false);
  protected readonly selectedSubjectId = signal('');
  protected readonly selectedSubjectCareerIds = signal<string[]>([]);
  protected readonly attendanceSettings = signal<ManagementAttendanceSetting[]>([]);
  protected readonly attendanceSettingsLoading = signal(false);
  protected readonly attendanceSettingDetail = signal<ManagementAttendanceSetting | null>(null);
  protected readonly attendanceSettingDetailLoading = signal(false);
  protected readonly selectedAttendanceSettingId = signal('');
  protected readonly classroomsLoading = signal(false);
  protected readonly classroomDetail = signal<ManagementClassroom | null>(null);
  protected readonly classroomDetailLoading = signal(false);
  protected readonly selectedClassroomId = signal('');
  protected readonly auditEntity = signal<ManagementAuditLog['entity']>('students');
  protected readonly auditLogsByEntity = signal<Partial<Record<ManagementAuditLog['entity'], ManagementAuditLog[]>>>(
    {},
  );
  protected readonly auditLogsLoading = signal(false);
  protected readonly submitting = signal(false);

  protected readonly incidentForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] }),
    type: new FormControl('FIRE', { nonNullable: true, validators: [Validators.required] }),
    severity: new FormControl('CRITICA', { nonNullable: true, validators: [Validators.required] }),
    evidence: new FormControl<File | null>(null),
  });

  protected readonly selectedIncidentGroupId = signal('');
  protected readonly selectedIncidentScheduleId = signal('');
  protected readonly selectedIncidentStudentIds = signal<string[]>([]);
  protected readonly incidentGroupSchedules = signal<ManagementSchedule[]>([]);
  protected readonly incidentGroupStudents = signal<ManagementStudent[]>([]);
  protected readonly loadingIncidentGroupData = signal(false);
  protected readonly incidentTab = signal<'ACTIVO' | 'RESUELTO' | 'CANCELADO' | 'TODOS'>('ACTIVO');
  protected readonly incidentTabs: { key: 'ACTIVO' | 'RESUELTO' | 'CANCELADO' | 'TODOS'; label: string }[] = [
    { key: 'ACTIVO', label: 'Activos' },
    { key: 'RESUELTO', label: 'Resueltos' },
    { key: 'CANCELADO', label: 'Cancelados' },
    { key: 'TODOS', label: 'Todos' },
  ];
  protected readonly incidentDetail = signal<ManagementIncident | null>(null);
  protected readonly incidentDetailLoading = signal(false);

  protected readonly deviceForm = new FormGroup({
    macAddress: new FormControl('', { nonNullable: true }),
    ipAddress: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    classroomId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly createDeviceForm = new FormGroup({
    macAddress: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/)],
    }),
    ipAddress: new FormControl('', { nonNullable: true }),
    classroomId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly scheduleForm = new FormGroup({
    schoolYearId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    groupId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    subjectId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    teacherId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    classroomId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dayOfWeek: new FormControl('LUNES', { nonNullable: true, validators: [Validators.required] }),
    startTime: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    endTime: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly dayOfWeekOptions = [
    { value: 'LUNES', label: 'Lunes' },
    { value: 'MARTES', label: 'Martes' },
    { value: 'MIERCOLES', label: 'Miercoles' },
    { value: 'JUEVES', label: 'Jueves' },
    { value: 'VIERNES', label: 'Viernes' },
    { value: 'SABADO', label: 'Sabado' },
    { value: 'DOMINGO', label: 'Domingo' },
  ];

  protected readonly schoolYearForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{4}-\d{4}$/)],
    }),
    startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl('PROXIMO', { nonNullable: true }),
  });

  protected readonly careerForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    shortName: new FormControl('', { nonNullable: true }),
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Z0-9-]{2,30}$/)],
    }),
    directorId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly subjectForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Z0-9-]{2,30}$/)],
    }),
    description: new FormControl('', { nonNullable: true }),
  });

  protected readonly attendanceSettingForm = new FormGroup(
    {
      scheduleId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      presentToleranceMinutes: new FormControl(5, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0), Validators.max(255)],
      }),
      lateToleranceMinutes: new FormControl(15, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0), Validators.max(255)],
      }),
      allowManualAttendance: new FormControl(true, { nonNullable: true }),
    },
    {
      validators: (group) => {
        const present = group.get('presentToleranceMinutes')?.value ?? 0;
        const late = group.get('lateToleranceMinutes')?.value ?? 0;
        return late > present ? null : { lateNotGreater: true };
      },
    },
  );

  protected readonly classroomForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(45)] }),
    building: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(45)] }),
  });

  protected readonly editingStudent = signal(false);
  protected readonly addingTutor = signal(false);
  protected readonly editingTutorId = signal<string | null>(null);
  private studentPhoto: File | null = null;

  protected readonly studentForm = new FormGroup({
    phone: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^\d{10}$/)] }),
    address: new FormControl('', { nonNullable: true }),
    active: new FormControl(true, { nonNullable: true }),
  });

  protected readonly tutorForm = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    firstSurname: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    secondSurname: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{10}$/)] }),
    relationship: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    isPrimary: new FormControl(false, { nonNullable: true }),
  });

  protected readonly tutorEditForm = new FormGroup({
    phone: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^\d{10}$/)] }),
    relationship: new FormControl('', { nonNullable: true }),
    isPrimary: new FormControl(false, { nonNullable: true }),
  });

  protected readonly claimComment = new FormControl('', { nonNullable: true });

  protected readonly incidentTypes = [
    { label: 'Incendio', value: 'FIRE', icon: 'fa-solid fa-fire', caption: 'Alta prioridad' },
    { label: 'Gas', value: 'GAS', icon: 'fa-solid fa-flask', caption: 'Riesgo quimico' },
    { label: 'Terremoto', value: 'EARTHQUAKE', icon: 'fa-solid fa-wave-square', caption: 'Evacuacion' },
    { label: 'Otro', value: 'OTHER', icon: 'fa-solid fa-circle-info', caption: 'Clasificacion general' },
  ];

  protected readonly auditEntities = [
    { key: 'students' as const, label: 'Alumnos', icon: 'fa-solid fa-user-graduate' },
    { key: 'devices' as const, label: 'Dispositivos', icon: 'fa-solid fa-microchip' },
    { key: 'groups' as const, label: 'Grupos', icon: 'fa-solid fa-users' },
    { key: 'teachers' as const, label: 'Profesores', icon: 'fa-solid fa-chalkboard-user' },
  ];

  protected readonly activeCareersForSubjectPicker = computed<ManagementCareer[]>(() =>
    this.careers().filter((career) => career.isActive),
  );

  protected readonly selectedStudent = computed<ManagementStudent | null>(() => {
    const students = this.snapshot().students;
    return students.find((student) => student.id === this.selectedStudentId()) ?? students[0] ?? null;
  });

  protected readonly selectedTeacher = computed<ManagementTeacher | null>(() => {
    const teachers = this.snapshot().teachers;
    return teachers.find((teacher) => teacher.id === this.selectedTeacherId()) ?? teachers[0] ?? null;
  });

  protected readonly selectedClaim = computed<ManagementClaim | null>(() => {
    const claims = this.snapshot().claims;
    return claims.find((claim) => claim.id === this.selectedClaimId()) ?? claims[0] ?? null;
  });

  protected readonly selectedDevice = computed<ManagementDevice | null>(() => {
    const id = this.selectedDeviceId();

    if (!id) {
      return null;
    }

    return this.snapshot().devices.find((device) => device.id === id) ?? null;
  });

  ngOnInit(): void {
    combineLatest([this.route.data, this.route.paramMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([data, params]) => {
        this.view.set((data['managementView'] as ManagementView | undefined) ?? 'students');
        this.applyParams(params);
        this.patchDeviceForm();
        this.maybeLoadIncidentDetail();
        this.maybeLoadAuditLogs();
        this.maybeLoadSchedules();
        this.maybeLoadSchoolYears();
        this.maybeLoadCareers();
        this.maybeLoadSubjects();
        this.maybeLoadAttendanceSettings();
        this.maybeLoadClassrooms();
      });

    this.loadSnapshot();
    this.loadClassrooms();
  }

  private maybeLoadAuditLogs(): void {
    if (this.view() !== 'audit-list') {
      return;
    }

    const entity = this.auditEntity();

    if (this.auditLogsByEntity()[entity]) {
      return;
    }

    this.auditLogsLoading.set(true);
    this.managementData
      .getLogs(entity)
      .pipe(
        finalize(() => this.auditLogsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (logs) => this.auditLogsByEntity.update((current) => ({ ...current, [entity]: logs })),
        error: () => this.auditLogsByEntity.update((current) => ({ ...current, [entity]: [] })),
      });
  }

  private maybeLoadSchedules(): void {
    if (this.currentRole() !== UserRole.ADMIN) {
      return;
    }

    const needsList =
      this.view() === 'schedules' ||
      this.view() === 'attendance-setting-create' ||
      this.view() === 'attendance-setting-edit';

    if (needsList && (this.view() === 'schedules' || !this.schedules().length)) {
      this.schedulesLoading.set(true);
      this.managementData
        .getSchedules()
        .pipe(
          finalize(() => this.schedulesLoading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((schedules) => this.schedules.set(schedules));
      return;
    }

    if (this.view() === 'schedule-edit') {
      const id = this.selectedScheduleId();

      if (!id) {
        return;
      }

      this.scheduleDetailLoading.set(true);
      this.managementData
        .getSchedule(id)
        .pipe(
          finalize(() => this.scheduleDetailLoading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (schedule) => {
            this.scheduleDetail.set(schedule);
            this.scheduleForm.patchValue({
              schoolYearId: schedule.schoolYearId,
              groupId: schedule.groupId,
              subjectId: schedule.subjectId,
              teacherId: schedule.teacherId,
              classroomId: schedule.classroomId,
              dayOfWeek: schedule.day,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
            });
          },
          error: () => this.scheduleDetail.set(null),
        });
    }
  }

  private maybeLoadSchoolYears(): void {
    if (this.currentRole() !== UserRole.ADMIN) {
      return;
    }

    const needsList =
      this.view() === 'school-years' || this.view() === 'schedule-create' || this.view() === 'schedule-edit';

    if (needsList && !this.schoolYears().length && !this.schoolYearsLoading()) {
      this.schoolYearsLoading.set(true);
      this.managementData
        .getSchoolYears()
        .pipe(
          finalize(() => this.schoolYearsLoading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((years) => this.schoolYears.set(years));
    }

    if (this.view() === 'school-year-edit') {
      const id = this.selectedSchoolYearId();

      if (!id) {
        return;
      }

      this.managementData
        .getSchoolYear(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (year) => {
            this.schoolYearDetail.set(year);
            this.schoolYearForm.patchValue({
              name: year.name,
              startDate: year.startDate,
              endDate: year.endDate,
              status: year.status,
            });
          },
          error: () => this.schoolYearDetail.set(null),
        });
    }
  }

  private maybeLoadCareers(): void {
    if (this.currentRole() !== UserRole.ADMIN) {
      return;
    }

    if (
      (this.view() === 'careers' || this.view() === 'career-create' || this.view() === 'career-edit') &&
      !this.careerDirectors().length
    ) {
      this.managementData
        .getCareerDirectors()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((directors) => this.careerDirectors.set(directors));
    }

    if (this.view() === 'careers') {
      this.careersLoading.set(true);
      this.managementData
        .getCareers()
        .pipe(
          finalize(() => this.careersLoading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((careers) => this.careers.set(careers));
      return;
    }

    if (this.view() === 'career-edit') {
      const id = this.selectedCareerId();

      if (!id) {
        return;
      }

      this.careerDetailLoading.set(true);
      this.managementData
        .getCareer(id)
        .pipe(
          finalize(() => this.careerDetailLoading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (career) => {
            this.careerDetail.set(career);
            this.careerForm.patchValue({
              name: career.name,
              shortName: career.shortName,
              code: career.code,
              directorId: career.directorId,
            });
          },
          error: () => this.careerDetail.set(null),
        });
    }
  }

  private maybeLoadSubjects(): void {
    if (this.currentRole() !== UserRole.ADMIN) {
      return;
    }

    if (this.view() === 'subjects') {
      this.subjectsLoading.set(true);
      this.managementData
        .getSubjects()
        .pipe(
          finalize(() => this.subjectsLoading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((subjects) => this.subjects.set(subjects));
      return;
    }

    if ((this.view() === 'subject-create' || this.view() === 'subject-edit') && !this.careers().length) {
      this.managementData
        .getCareers()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((careers) => this.careers.set(careers));
    }

    if (this.view() === 'subject-create') {
      this.selectedSubjectCareerIds.set([]);
      return;
    }

    if (this.view() === 'subject-edit') {
      const id = this.selectedSubjectId();

      if (!id) {
        return;
      }

      this.subjectDetailLoading.set(true);
      this.managementData
        .getSubject(id)
        .pipe(
          finalize(() => this.subjectDetailLoading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (subject) => {
            this.subjectDetail.set(subject);
            this.selectedSubjectCareerIds.set(subject.careers.map((career) => career.id));
            this.subjectForm.patchValue({
              name: subject.name,
              code: subject.code,
              description: subject.description,
            });
          },
          error: () => this.subjectDetail.set(null),
        });
    }
  }

  private maybeLoadAttendanceSettings(): void {
    if (this.currentRole() !== UserRole.ADMIN) {
      return;
    }

    if (this.view() === 'attendance-settings') {
      this.attendanceSettingsLoading.set(true);
      this.managementData
        .getAttendanceSettings()
        .pipe(
          finalize(() => this.attendanceSettingsLoading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((settings) => this.attendanceSettings.set(settings));
      return;
    }

    if (this.view() === 'attendance-setting-edit') {
      const id = this.selectedAttendanceSettingId();

      if (!id) {
        return;
      }

      this.attendanceSettingDetailLoading.set(true);
      this.managementData
        .getAttendanceSetting(id)
        .pipe(
          finalize(() => this.attendanceSettingDetailLoading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (setting) => {
            this.attendanceSettingDetail.set(setting);
            this.attendanceSettingForm.patchValue({
              scheduleId: setting.scheduleId,
              presentToleranceMinutes: setting.presentToleranceMinutes,
              lateToleranceMinutes: setting.lateToleranceMinutes,
              allowManualAttendance: setting.allowManualAttendance,
            });
          },
          error: () => this.attendanceSettingDetail.set(null),
        });
    }
  }

  private maybeLoadClassrooms(): void {
    if (this.currentRole() !== UserRole.ADMIN) {
      return;
    }

    if (this.view() === 'classrooms') {
      this.classroomsLoading.set(true);
      this.managementData
        .getClassrooms()
        .pipe(
          finalize(() => this.classroomsLoading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((classrooms) => this.classrooms.set(classrooms));
      return;
    }

    if (this.view() === 'classroom-edit') {
      const id = this.selectedClassroomId();

      if (!id) {
        return;
      }

      this.classroomDetailLoading.set(true);
      this.managementData
        .getClassroom(id)
        .pipe(
          finalize(() => this.classroomDetailLoading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (classroom) => {
            this.classroomDetail.set(classroom);
            this.classroomForm.patchValue({
              name: classroom.name,
              building: classroom.building,
            });
          },
          error: () => this.classroomDetail.set(null),
        });
    }
  }

  protected submitClassroomForm(): void {
    if (this.classroomForm.invalid || this.submitting()) {
      this.classroomForm.markAllAsTouched();
      return;
    }

    const raw = this.classroomForm.getRawValue();
    const payload: ClassroomFormPayload = {
      name: raw.name,
      building: raw.building,
    };

    const editingId = this.view() === 'classroom-edit' ? this.selectedClassroomId() : '';
    const request$ = editingId
      ? this.managementData.updateClassroom(editingId, payload)
      : this.managementData.createClassroom(payload);

    this.submitting.set(true);
    request$.pipe(finalize(() => this.submitting.set(false))).subscribe((result) => {
      if (result.success) {
        this.toastService.success(
          editingId ? 'Salon actualizado' : 'Salon creado',
          editingId ? 'Los cambios fueron guardados.' : 'El nuevo salon quedo registrado.',
        );
        this.classrooms.set([]);
        void this.router.navigateByUrl(`${this.baseRoute()}/classrooms`);
        return;
      }

      this.toastService.error(
        editingId ? 'No se pudo guardar' : 'No se pudo crear',
        result.message ?? 'Verifica que no exista ya un salon con ese nombre en ese edificio.',
      );
    });
  }

  protected async deleteClassroom(classroom: ManagementClassroom): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Eliminar salon',
      message: `${classroom.name} (${classroom.building}) se eliminara. Esto solo es posible si no tiene dispositivos ni horarios asignados.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'fa-regular fa-trash-can',
    });

    if (!confirmed) {
      return;
    }

    this.managementData.deleteClassroom(classroom.id).subscribe((result) => {
      if (result.success) {
        this.toastService.success('Salon eliminado', 'El salon ya no esta disponible.');
        this.classrooms.update((current) => current.filter((item) => item.id !== classroom.id));
        return;
      }

      this.toastService.error('No se pudo completar', result.message ?? 'Intenta nuevamente.');
    });
  }

  protected submitCareerForm(): void {
    if (this.careerForm.invalid || this.submitting()) {
      this.careerForm.markAllAsTouched();
      return;
    }

    const raw = this.careerForm.getRawValue();
    const payload: CareerFormPayload = {
      name: raw.name,
      shortName: raw.shortName,
      code: raw.code,
      directorId: raw.directorId,
    };

    const editingId = this.view() === 'career-edit' ? this.selectedCareerId() : '';
    const request$ = editingId
      ? this.managementData.updateCareer(editingId, payload)
      : this.managementData.createCareer(payload);

    this.submitting.set(true);
    request$.pipe(finalize(() => this.submitting.set(false))).subscribe((result) => {
      if (result.success) {
        this.toastService.success(
          editingId ? 'Carrera actualizada' : 'Carrera creada',
          editingId ? 'Los cambios fueron guardados.' : 'La nueva carrera quedo registrada.',
        );
        this.careers.set([]);
        void this.router.navigateByUrl(`${this.baseRoute()}/careers`);
        return;
      }

      this.toastService.error(
        editingId ? 'No se pudo guardar' : 'No se pudo crear',
        result.message ?? 'Verifica los datos e intenta nuevamente.',
      );
    });
  }

  protected async deactivateCareer(career: ManagementCareer): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Dar de baja carrera',
      message: `${career.name} dejara de estar activa. Solo es posible si no tiene grupos activos asignados.`,
      confirmText: 'Dar de baja',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'fa-regular fa-building-columns',
    });

    if (!confirmed) {
      return;
    }

    this.managementData.deactivateCareer(career.id).subscribe((result) => {
      if (result.success) {
        this.toastService.success('Carrera dada de baja', 'La carrera ya no esta activa.');
        this.careers.update((current) =>
          current.map((item) => (item.id === career.id ? { ...item, isActive: false } : item)),
        );
        return;
      }

      this.toastService.error('No se pudo completar', result.message ?? 'Intenta nuevamente.');
    });
  }

  protected reactivateCareer(career: ManagementCareer): void {
    this.managementData.reactivateCareer(career.id).subscribe((result) => {
      if (result.success) {
        this.toastService.success('Carrera reactivada', 'La carrera vuelve a estar activa.');
        this.careers.update((current) =>
          current.map((item) => (item.id === career.id ? { ...item, isActive: true } : item)),
        );
        return;
      }

      this.toastService.error('No se pudo completar', result.message ?? 'Intenta nuevamente.');
    });
  }

  protected submitSubjectForm(): void {
    if (this.subjectForm.invalid || this.submitting()) {
      this.subjectForm.markAllAsTouched();
      return;
    }

    const raw = this.subjectForm.getRawValue();
    const payload: SubjectFormPayload = {
      name: raw.name,
      code: raw.code,
      description: raw.description,
      careerIds: this.selectedSubjectCareerIds(),
    };

    const editingId = this.view() === 'subject-edit' ? this.selectedSubjectId() : '';
    const request$ = editingId
      ? this.managementData.updateSubject(editingId, payload)
      : this.managementData.createSubject(payload);

    this.submitting.set(true);
    request$.pipe(finalize(() => this.submitting.set(false))).subscribe((result) => {
      if (result.success) {
        this.toastService.success(
          editingId ? 'Materia actualizada' : 'Materia creada',
          editingId ? 'Los cambios fueron guardados.' : 'La nueva materia quedo registrada.',
        );
        this.subjects.set([]);
        void this.router.navigateByUrl(`${this.baseRoute()}/subjects`);
        return;
      }

      this.toastService.error(
        editingId ? 'No se pudo guardar' : 'No se pudo crear',
        result.message ?? 'Verifica los datos e intenta nuevamente.',
      );
    });
  }

  protected async deactivateSubject(subject: ManagementSubject): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Dar de baja materia',
      message: `${subject.name} dejara de estar activa. Solo es posible si no tiene horarios activos asignados.`,
      confirmText: 'Dar de baja',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'fa-solid fa-book-open',
    });

    if (!confirmed) {
      return;
    }

    this.managementData.deactivateSubject(subject.id).subscribe((result) => {
      if (result.success) {
        this.toastService.success('Materia dada de baja', 'La materia ya no esta activa.');
        this.subjects.update((current) =>
          current.map((item) => (item.id === subject.id ? { ...item, isActive: false } : item)),
        );
        return;
      }

      this.toastService.error('No se pudo completar', result.message ?? 'Intenta nuevamente.');
    });
  }

  protected reactivateSubject(subject: ManagementSubject): void {
    this.managementData.reactivateSubject(subject.id).subscribe((result) => {
      if (result.success) {
        this.toastService.success('Materia reactivada', 'La materia vuelve a estar activa.');
        this.subjects.update((current) =>
          current.map((item) => (item.id === subject.id ? { ...item, isActive: true } : item)),
        );
        return;
      }

      this.toastService.error('No se pudo completar', result.message ?? 'Intenta nuevamente.');
    });
  }

  protected submitAttendanceSettingForm(): void {
    if (this.attendanceSettingForm.invalid || this.submitting()) {
      this.attendanceSettingForm.markAllAsTouched();
      return;
    }

    const raw = this.attendanceSettingForm.getRawValue();
    const payload: AttendanceSettingFormPayload = {
      scheduleId: raw.scheduleId,
      presentToleranceMinutes: raw.presentToleranceMinutes,
      lateToleranceMinutes: raw.lateToleranceMinutes,
      allowManualAttendance: raw.allowManualAttendance,
    };

    const editingId = this.view() === 'attendance-setting-edit' ? this.selectedAttendanceSettingId() : '';
    const request$ = editingId
      ? this.managementData.updateAttendanceSetting(editingId, payload)
      : this.managementData.createAttendanceSetting(payload);

    this.submitting.set(true);
    request$.pipe(finalize(() => this.submitting.set(false))).subscribe((result) => {
      if (result.success) {
        this.toastService.success(
          editingId ? 'Regla actualizada' : 'Regla creada',
          editingId ? 'Los cambios fueron guardados.' : 'La nueva regla de asistencia quedo registrada.',
        );
        this.attendanceSettings.set([]);
        void this.router.navigateByUrl(`${this.baseRoute()}/attendance-settings`);
        return;
      }

      this.toastService.error(
        editingId ? 'No se pudo guardar' : 'No se pudo crear',
        result.message ?? 'Verifica los datos e intenta nuevamente.',
      );
    });
  }

  protected async deactivateAttendanceSetting(setting: ManagementAttendanceSetting): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Desactivar regla de asistencia',
      message: `La regla para ${setting.scheduleLabel} dejara de aplicarse.`,
      confirmText: 'Desactivar',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'fa-regular fa-calendar-xmark',
    });

    if (!confirmed) {
      return;
    }

    this.managementData.deactivateAttendanceSetting(setting.id).subscribe((result) => {
      if (result.success) {
        this.toastService.success('Regla desactivada', 'La regla ya no esta activa.');
        this.attendanceSettings.update((current) =>
          current.map((item) => (item.id === setting.id ? { ...item, isActive: false } : item)),
        );
        return;
      }

      this.toastService.error('No se pudo completar', result.message ?? 'Intenta nuevamente.');
    });
  }

  protected reactivateAttendanceSetting(setting: ManagementAttendanceSetting): void {
    this.managementData.reactivateAttendanceSetting(setting.id).subscribe((result) => {
      if (result.success) {
        this.toastService.success('Regla activada', 'La regla vuelve a estar activa.');
        this.attendanceSettings.update((current) =>
          current.map((item) => (item.id === setting.id ? { ...item, isActive: true } : item)),
        );
        return;
      }

      this.toastService.error('No se pudo completar', result.message ?? 'Intenta nuevamente.');
    });
  }

  protected submitScheduleForm(): void {
    if (this.scheduleForm.invalid || this.submitting()) {
      this.scheduleForm.markAllAsTouched();

      if (this.scheduleForm.invalid) {
        this.toastService.error('Faltan datos', 'Completa todos los campos del horario antes de guardar.');
      }

      return;
    }

    const raw = this.scheduleForm.getRawValue();
    const payload: ScheduleFormPayload = {
      schoolYearId: raw.schoolYearId,
      groupId: raw.groupId,
      subjectId: raw.subjectId,
      teacherId: raw.teacherId,
      classroomId: raw.classroomId,
      dayOfWeek: raw.dayOfWeek,
      startTime: raw.startTime,
      endTime: raw.endTime,
    };

    const editingId = this.view() === 'schedule-edit' ? this.selectedScheduleId() : '';
    const request$ = editingId
      ? this.managementData.updateSchedule(editingId, payload)
      : this.managementData.createSchedule(payload);

    this.submitting.set(true);
    request$.pipe(finalize(() => this.submitting.set(false))).subscribe((result) => {
      if (result.success) {
        this.toastService.success(
          editingId ? 'Horario actualizado' : 'Horario creado',
          editingId ? 'Los cambios fueron guardados.' : 'El nuevo horario quedo registrado.',
        );
        this.schedules.set([]);
        void this.router.navigateByUrl(`${this.baseRoute()}/schedules`);
        return;
      }

      this.toastService.error(
        editingId ? 'No se pudo guardar' : 'No se pudo crear',
        result.message ?? 'Verifica que no haya un conflicto de horario.',
      );
    });
  }

  protected async deactivateSchedule(schedule: ManagementSchedule): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Dar de baja horario',
      message: `${schedule.subject} - ${schedule.group} (${schedule.day} ${schedule.time}) dejara de estar activo.`,
      confirmText: 'Dar de baja',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'fa-regular fa-calendar-xmark',
    });

    if (!confirmed) {
      return;
    }

    this.managementData.deactivateSchedule(schedule.id).subscribe((result) => {
      if (result.success) {
        this.toastService.success('Horario dado de baja', 'El horario ya no esta activo.');
        this.schedules.update((current) => current.filter((item) => item.id !== schedule.id));
        return;
      }

      this.toastService.error('No se pudo completar', result.message ?? 'Intenta nuevamente.');
    });
  }

  protected submitSchoolYearForm(): void {
    if (this.schoolYearForm.invalid || this.submitting()) {
      this.schoolYearForm.markAllAsTouched();
      return;
    }

    const raw = this.schoolYearForm.getRawValue();
    const editingId = this.view() === 'school-year-edit' ? this.selectedSchoolYearId() : '';
    const payload: SchoolYearFormPayload = {
      name: raw.name,
      startDate: raw.startDate,
      endDate: raw.endDate,
      ...(editingId ? { status: raw.status } : {}),
    };

    const request$ = editingId
      ? this.managementData.updateSchoolYear(editingId, payload)
      : this.managementData.createSchoolYear(payload);

    this.submitting.set(true);
    request$.pipe(finalize(() => this.submitting.set(false))).subscribe((result) => {
      if (result.success) {
        this.toastService.success(
          editingId ? 'Periodo actualizado' : 'Periodo creado',
          editingId ? 'Los cambios fueron guardados.' : 'El nuevo periodo academico quedo registrado.',
        );
        this.schoolYears.set([]);
        void this.router.navigateByUrl(`${this.baseRoute()}/academic-periods`);
        return;
      }

      this.toastService.error(
        editingId ? 'No se pudo guardar' : 'No se pudo crear',
        result.message ?? 'Verifica los datos e intenta nuevamente.',
      );
    });
  }

  private maybeLoadIncidentDetail(): void {
    if (this.view() !== 'incident-detail' && this.view() !== 'incident-attendance') {
      return;
    }

    const id = this.selectedIncidentId() || this.snapshot().incidents[0]?.id;

    if (!id || id === this.incidentDetail()?.id) {
      return;
    }

    this.incidentDetailLoading.set(true);
    this.managementData
      .getIncident(id)
      .pipe(
        finalize(() => this.incidentDetailLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (incident) => this.incidentDetail.set(incident),
        error: () => this.incidentDetail.set(null),
      });
  }

  private loadClassrooms(): void {
    this.managementData
      .getClassrooms()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((classrooms) => this.classrooms.set(classrooms));
  }

  protected loadSnapshot(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.managementData
      .getSnapshot()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (snapshot) => {
          this.snapshot.set(snapshot);
          this.patchDeviceForm();
          this.maybeLoadIncidentDetail();
        },
        error: () => {
          this.snapshot.set(EMPTY_MANAGEMENT_SNAPSHOT);
          this.loadError.set('No se pudo cargar la informacion. Verifica tu conexion o vuelve a iniciar sesion.');
        },
      });
  }

  protected eyebrow(): string {
    return this.currentRole() === UserRole.ADMIN ? 'Portal administrativo' : 'Direccion de carrera';
  }

  protected pageTitle(): string {
    const titles: Record<ManagementView, string> = {
      groups: 'Grupos academicos',
      students: 'Alumnos',
      'student-detail': 'Alumno',
      'student-attendance': 'Registro de asistencias del alumno',
      'student-justifications': 'Justificantes del alumno',
      teachers: 'Profesores',
      'teacher-detail': 'Perfil del profesor',
      'teacher-attendance': 'Revision de asistencias',
      subjects: 'Materias',
      'subject-create': 'Nueva materia',
      'subject-edit': 'Editar materia',
      schedules: 'Horario de clases',
      'schedule-create': 'Nuevo horario',
      'schedule-edit': 'Editar horario',
      'school-years': 'Periodos academicos',
      'school-year-create': 'Nuevo periodo academico',
      'school-year-edit': 'Editar periodo academico',
      careers: 'Carreras',
      'career-create': 'Nueva carrera',
      'career-edit': 'Editar carrera',
      'attendance-settings': 'Reglas de asistencia',
      'attendance-setting-create': 'Nueva regla de asistencia',
      'attendance-setting-edit': 'Editar regla de asistencia',
      classrooms: 'Salones',
      'classroom-create': 'Nuevo salon',
      'classroom-edit': 'Editar salon',
      attendance: 'Revision de asistencias',
      justifications: 'Justificantes',
      devices: 'Gestion de dispositivos',
      'device-create': 'Nuevo dispositivo',
      'device-edit': this.canEditDevices() ? 'Editar dispositivo' : 'Detalle del dispositivo',
      incidents: 'Gestion de incidentes',
      'incident-new': 'Crear nuevo incidente',
      'incident-detail': 'Detalles del incidente',
      'incident-attendance': 'Pase de lista - incidente',
      claims: 'Gestion de reclamaciones',
      'claim-detail': 'Detalles de reclamacion',
      statistics: 'Centro de estadisticas y graficas',
      audit: 'Registro de actividad',
      'audit-list': 'Registros de actividad',
    };

    return titles[this.view()];
  }

  protected pageDescription(): string {
    const descriptions: Record<ManagementView, string> = {
      groups: 'Consulta grupos, tutores, carga academica y asistencia general.',
      students: 'Filtra alumnos por carrera, turno y grupo para consultar expedientes.',
      'student-detail': 'Informacion academica y datos de contacto del alumno seleccionado.',
      'student-attendance': 'Historial filtrable de asistencias, faltas y retardos.',
      'student-justifications': 'Documentos enviados para justificar ausencias.',
      teachers: 'Consulta docentes, materias asignadas y carga horaria.',
      'teacher-detail': 'Perfil academico y grupos asignados al profesor.',
      'teacher-attendance': 'Revision historica de asistencias por clase.',
      subjects: this.isAdmin()
        ? 'Administra el catalogo de materias: nombre, codigo y estado.'
        : 'Materias con profesor, grupo, horario y ubicacion.',
      'subject-create': 'Registra una nueva materia con su nombre y codigo.',
      'subject-edit': 'Actualiza el nombre, codigo o descripcion de esta materia.',
      schedules: 'Horario semanal de grupos y profesores de la carrera.',
      'schedule-create': 'Registra un nuevo horario de clase con su profesor, grupo y salon.',
      'schedule-edit': 'Actualiza el profesor, grupo, salon u horario de esta clase.',
      'school-years': 'Ciclos escolares registrados y su estado actual.',
      'school-year-create': 'Registra un nuevo ciclo escolar con sus fechas.',
      'school-year-edit': 'Actualiza las fechas o el estado de este ciclo escolar.',
      careers: 'Programas academicos, su codigo y el director de carrera asignado.',
      'career-create': 'Registra una nueva carrera y asigna su director.',
      'career-edit': 'Actualiza el nombre, codigo o director de esta carrera.',
      'attendance-settings': 'Tolerancias y reglas del pase de lista por horario.',
      'attendance-setting-create': 'Configura las tolerancias de asistencia de un horario.',
      'attendance-setting-edit': 'Actualiza las tolerancias de asistencia de este horario.',
      classrooms: 'Aulas y laboratorios donde se imparten clases y se instalan los dispositivos NFC.',
      'classroom-create': 'Registra un nuevo salon con su nombre y edificio.',
      'classroom-edit': 'Actualiza el nombre o edificio de este salon.',
      attendance: 'Audita registros de asistencia y estados por materia.',
      justifications: 'Seguimiento de justificantes aprobados, pendientes y rechazados.',
      devices: 'Monitorea terminales NFC y estado operativo por aula.',
      'device-create': 'Registra un nuevo dispositivo NFC con su direccion MAC y salon.',
      'device-edit': 'Consulta o actualiza datos del dispositivo segun permisos disponibles.',
      incidents: 'Lista incidentes, filtra estados y consulta seguimiento.',
      'incident-new': 'Reporta un incidente con evidencia y severidad.',
      'incident-detail': 'Informacion, historial y acciones del incidente.',
      'incident-attendance': 'Valida presentes y faltantes durante un evento critico.',
      claims: 'Da seguimiento a reclamaciones academicas o de asistencia.',
      'claim-detail': 'Revisa evidencia, comentarios y acciones de resolucion.',
      statistics: 'Indicadores y graficas del periodo actual.',
      audit: 'Selecciona el modulo que deseas auditar.',
      'audit-list': 'Consulta trazabilidad por modulo dentro del alcance del director.',
    };

    return descriptions[this.view()];
  }

  protected breadcrumbs(): BreadcrumbItem[] {
    const base = this.baseRoute();
    const root: BreadcrumbItem = { label: 'Inicio', route: `${base}/dashboard` };

    switch (this.view()) {
      case 'student-detail':
        return [root, { label: 'Alumnos', route: `${base}/students` }, { label: this.selectedStudent()?.name ?? 'Alumno' }];
      case 'student-attendance':
        return [
          root,
          { label: 'Alumnos', route: `${base}/students` },
          { label: this.selectedStudent()?.name ?? 'Alumno', route: `${base}/students/${this.selectedStudent()?.id ?? ''}` },
          { label: 'Asistencias' },
        ];
      case 'student-justifications':
        return [
          root,
          { label: 'Alumnos', route: `${base}/students` },
          { label: this.selectedStudent()?.name ?? 'Alumno', route: `${base}/students/${this.selectedStudent()?.id ?? ''}` },
          { label: 'Justificantes' },
        ];
      case 'teacher-detail':
        return [root, { label: 'Profesores', route: `${base}/teachers` }, { label: this.selectedTeacher()?.name ?? 'Profesor' }];
      case 'teacher-attendance':
        return [
          root,
          { label: 'Profesores', route: `${base}/teachers` },
          { label: this.selectedTeacher()?.name ?? 'Profesor', route: `${base}/teachers/${this.selectedTeacher()?.id ?? ''}` },
          { label: 'Asistencias' },
        ];
      case 'incident-new':
        return [root, { label: 'Incidentes', route: `${base}/incidents` }, { label: 'Nuevo' }];
      case 'incident-detail':
        return [root, { label: 'Incidentes', route: `${base}/incidents` }, { label: this.incidentDetail()?.title ?? 'Detalle' }];
      case 'incident-attendance':
        return [
          root,
          { label: 'Incidentes', route: `${base}/incidents` },
          { label: this.incidentDetail()?.title ?? 'Detalle', route: `${base}/incidents/${this.incidentDetail()?.id ?? ''}` },
          { label: 'Pase de lista' },
        ];
      case 'claim-detail':
        return [root, { label: 'Reclamos', route: `${base}/claims` }, { label: this.selectedClaim()?.studentName ?? 'Detalle' }];
      case 'device-create':
        return [root, { label: 'Dispositivos', route: `${base}/nfc-devices` }, { label: 'Nuevo' }];
      case 'device-edit':
        return [root, { label: 'Dispositivos', route: `${base}/nfc-devices` }, { label: this.selectedDevice()?.name ?? 'Detalle' }];
      case 'audit-list':
        return [root, { label: 'Auditoria', route: `${base}/audit` }, { label: this.auditEntityLabel() }];
      default:
        return [root, { label: this.pageTitle() }];
    }
  }

  protected baseRoute(): string {
    const role = this.currentRole();
    return role ? ROUTE_PATHS.rolePrefix[role] : '/director';
  }

  protected currentRole(): UserRole | undefined {
    return this.authService.currentUser()?.role;
  }

  protected isAdmin(): boolean {
    return this.currentRole() === UserRole.ADMIN;
  }

  protected canEditDevices(): boolean {
    return this.currentRole() === UserRole.ADMIN;
  }

  protected canEditStudents(): boolean {
    return this.currentRole() === UserRole.ADMIN;
  }

  protected canCreateIncidents(): boolean {
    return this.currentRole() === UserRole.CAREER_DIRECTOR || this.currentRole() === UserRole.ADMIN;
  }

  protected canCloseIncident(incident: ManagementIncident): boolean {
    return (
      (this.currentRole() === UserRole.CAREER_DIRECTOR || this.currentRole() === UserRole.ADMIN) &&
      incident.status.label.toUpperCase() === 'ACTIVO'
    );
  }

  protected incidentCountByStatus(status: string): number {
    return this.snapshot().incidents.filter((incident) => incident.status.label.toUpperCase() === status).length;
  }

  protected filteredIncidents(): ManagementIncident[] {
    const tab = this.incidentTab();
    const incidents = this.snapshot().incidents;

    return tab === 'TODOS' ? incidents : incidents.filter((incident) => incident.status.label.toUpperCase() === tab);
  }

  protected presentCount(incident: ManagementIncident): number {
    return incident.roster.filter((item) => item.status === 'PRESENTE' || item.status === 'SEGURO').length;
  }

  protected onIncidentGroupChange(groupId: string): void {
    this.selectedIncidentGroupId.set(groupId);
    this.selectedIncidentScheduleId.set('');
    this.selectedIncidentStudentIds.set([]);
    this.incidentGroupSchedules.set([]);
    this.incidentGroupStudents.set([]);

    if (!groupId) {
      return;
    }

    this.loadingIncidentGroupData.set(true);
    forkJoin({
      schedules: this.managementData.getGroupSchedule(groupId),
      students: this.managementData.getGroupStudentsForIncident(groupId),
    })
      .pipe(
        finalize(() => this.loadingIncidentGroupData.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ schedules, students }) => {
        this.incidentGroupSchedules.set(schedules);
        this.incidentGroupStudents.set(students);
      });
  }

  protected isIncidentStudentSelected(studentId: string): boolean {
    return this.selectedIncidentStudentIds().includes(studentId);
  }

  protected toggleIncidentStudent(studentId: string): void {
    this.selectedIncidentStudentIds.update((current) =>
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId],
    );
  }

  protected subjectCareersLabel(subject: ManagementSubject): string {
    if (subject.careers.length === 0) {
      return 'Sin asignar';
    }

    return subject.careers.map((career) => career.shortName || career.name).join(', ');
  }

  protected isSubjectCareerSelected(careerId: string): boolean {
    return this.selectedSubjectCareerIds().includes(careerId);
  }

  protected toggleSubjectCareer(careerId: string): void {
    this.selectedSubjectCareerIds.update((current) =>
      current.includes(careerId) ? current.filter((id) => id !== careerId) : [...current, careerId],
    );
  }

  protected updateRosterStatus(studentId: string, status: IncidentRosterStatus): void {
    this.incidentDetail.update((incident) =>
      incident
        ? {
            ...incident,
            roster: incident.roster.map((item) => (item.studentId === studentId ? { ...item, status } : item)),
          }
        : incident,
    );
  }

  protected updateRosterNotes(studentId: string, notes: string): void {
    this.incidentDetail.update((incident) =>
      incident
        ? {
            ...incident,
            roster: incident.roster.map((item) => (item.studentId === studentId ? { ...item, notes } : item)),
          }
        : incident,
    );
  }

  protected statusClass(status: ManagementStatus): string {
    return `status-badge status-badge--${status.tone}`;
  }

  protected scheduleDays(): string[] {
    return ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
  }

  protected directorSchedulesForSelectedDay(): ManagementSchedule[] {
    return this.snapshot().schedules.filter((schedule) => schedule.day.toUpperCase() === this.selectedScheduleDay());
  }

  protected adminSchedulesForSelectedDay(): ManagementSchedule[] {
    const day = this.selectedAdminScheduleDay();

    if (day === 'TODOS') {
      return this.schedules();
    }

    return this.schedules().filter((schedule) => schedule.day.toUpperCase() === day);
  }

  protected attendanceRows() {
    const student = this.selectedStudent();

    if (student?.recentAttendance.length) {
      return student.recentAttendance;
    }

    return this.snapshot().students.flatMap((item) => item.recentAttendance);
  }

  protected visibleJustifications(): ManagementJustification[] {
    const studentId = this.selectedStudentId();

    if (this.view() === 'student-justifications' && studentId) {
      return this.snapshot().justifications.filter((item) => item.studentId === studentId);
    }

    return this.snapshot().justifications;
  }

  protected auditLogs(): ManagementAuditLog[] {
    return this.auditLogsByEntity()[this.auditEntity()] ?? [];
  }

  protected auditEntityLabel(): string {
    return this.auditEntities.find((entity) => entity.key === this.auditEntity())?.label ?? 'Alumnos';
  }

  protected setIncidentEvidence(files: File[]): void {
    this.incidentForm.controls.evidence.setValue(files[0] ?? null);
  }

  protected clearIncidentEvidence(): void {
    this.incidentForm.controls.evidence.setValue(null);
  }

  protected submitIncident(): void {
    const hasSelection = Boolean(this.selectedIncidentScheduleId()) && this.selectedIncidentStudentIds().length > 0;

    if (this.incidentForm.invalid || this.submitting() || !hasSelection) {
      this.incidentForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const rawPayload = this.incidentForm.getRawValue();
    const payload: IncidentCreatePayload = {
      ...rawPayload,
      scheduleId: this.selectedIncidentScheduleId(),
      studentIds: this.selectedIncidentStudentIds(),
    };

    this.managementData
      .createIncident(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe((result) => {
        if (!result.success) {
          this.toastService.error(
            'No se pudo crear el incidente',
            result.message ?? 'Revisa la informacion e intenta nuevamente.',
          );
          return;
        }

        this.toastService.success('Incidente guardado', 'El registro quedo listo para seguimiento.');
        void this.router.navigateByUrl(`${this.baseRoute()}/incidents`);
      });
  }

  protected pingDevice(device: ManagementDevice): void {
    this.managementData.pingDevice(device.id).subscribe((success) => {
      if (success) {
        this.toastService.success('Dispositivo disponible', `${device.name} respondio correctamente.`);
        return;
      }

      this.toastService.warning('Sin respuesta', 'No fue posible confirmar la conexion del dispositivo.');
    });
  }

  protected createDevice(): void {
    if (this.createDeviceForm.invalid || this.submitting()) {
      this.createDeviceForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.managementData
      .createDevice({
        macAddress: this.createDeviceForm.controls.macAddress.value,
        ipAddress: this.createDeviceForm.controls.ipAddress.value,
        classroomId: this.createDeviceForm.controls.classroomId.value,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe((result) => {
        if (result.success) {
          this.toastService.success('Dispositivo creado', 'El nuevo dispositivo quedo registrado.');
          this.createDeviceForm.reset({ macAddress: '', ipAddress: '', classroomId: '' });
          this.loadSnapshot();
          void this.router.navigateByUrl(`${this.baseRoute()}/nfc-devices`);
          return;
        }

        this.toastService.error('No se pudo crear', result.message ?? 'Verifica la MAC y el salon seleccionado.');
      });
  }

  protected saveDevice(device: ManagementDevice): void {
    if (!this.canEditDevices()) {
      this.toastService.info('Solo lectura', 'Director puede consultar y probar dispositivos, pero no editarlos.');
      return;
    }

    if (this.deviceForm.invalid || this.submitting()) {
      this.deviceForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.managementData
      .updateDevice(device.id, {
        ipAddress: this.deviceForm.controls.ipAddress.value,
        isActive: device.status.tone === 'success',
        classroomId: this.deviceForm.controls.classroomId.value,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe((result) => {
        if (result.success) {
          this.toastService.success('Dispositivo actualizado', 'Los cambios fueron guardados.');
          void this.router.navigateByUrl(`${this.baseRoute()}/nfc-devices`);
          return;
        }

        this.toastService.error(
          'No se pudo guardar',
          result.message ?? 'No tienes permiso para editar este dispositivo.',
        );
      });
  }

  protected startEditingStudent(student: ManagementStudent): void {
    this.studentForm.reset({ phone: student.phone, address: student.address, active: student.status.tone === 'success' });
    this.studentPhoto = null;
    this.editingStudent.set(true);
  }

  protected cancelEditingStudent(): void {
    this.editingStudent.set(false);
    this.studentPhoto = null;
  }

  protected selectStudentPhoto(files: File[]): void {
    this.studentPhoto = files[0] ?? null;
  }

  protected clearStudentPhoto(): void {
    this.studentPhoto = null;
  }

  protected saveStudent(student: ManagementStudent): void {
    if (this.studentForm.invalid || this.submitting()) {
      this.studentForm.markAllAsTouched();
      return;
    }

    const { phone, address, active } = this.studentForm.getRawValue();

    this.submitting.set(true);
    this.managementData
      .updateStudent(student.id, { phone, address, active, photo: this.studentPhoto })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe((result) => {
        if (result.success && result.student) {
          this.replaceStudent(result.student);
          this.editingStudent.set(false);
          this.studentPhoto = null;
          this.toastService.success('Alumno actualizado', 'Los cambios fueron guardados.');
          return;
        }

        this.toastService.error('No se pudo guardar', result.message ?? 'No se pudo actualizar al alumno.');
      });
  }

  protected startAddingTutor(): void {
    this.tutorForm.reset({
      firstName: '',
      firstSurname: '',
      secondSurname: '',
      phone: '',
      relationship: '',
      isPrimary: false,
    });
    this.addingTutor.set(true);
  }

  protected cancelAddingTutor(): void {
    this.addingTutor.set(false);
  }

  protected saveNewTutor(student: ManagementStudent): void {
    if (this.tutorForm.invalid || this.submitting()) {
      this.tutorForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.managementData
      .addStudentTutor(student.id, this.tutorForm.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe((result) => {
        if (result.success && result.student) {
          this.replaceStudent(result.student);
          this.addingTutor.set(false);
          this.toastService.success('Tutor agregado', 'El tutor se agrego correctamente.');
          return;
        }

        this.toastService.error('No se pudo agregar', result.message ?? 'No se pudo agregar al tutor.');
      });
  }

  protected startEditingTutor(tutor: ManagementTutor): void {
    this.tutorEditForm.reset({ phone: tutor.phone, relationship: tutor.relationship, isPrimary: tutor.isPrimary });
    this.editingTutorId.set(tutor.id);
  }

  protected cancelEditingTutor(): void {
    this.editingTutorId.set(null);
  }

  protected saveTutorEdit(student: ManagementStudent, tutor: ManagementTutor): void {
    if (this.tutorEditForm.invalid || this.submitting()) {
      this.tutorEditForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.managementData
      .updateStudentTutor(student.id, tutor.id, this.tutorEditForm.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe((result) => {
        if (result.success && result.student) {
          this.replaceStudent(result.student);
          this.editingTutorId.set(null);
          this.toastService.success('Tutor actualizado', 'Los cambios fueron guardados.');
          return;
        }

        this.toastService.error('No se pudo guardar', result.message ?? 'No se pudo actualizar al tutor.');
      });
  }

  protected async removeTutor(student: ManagementStudent, tutor: ManagementTutor): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Quitar tutor?',
      message: `${tutor.fullName} dejara de estar asociado a este alumno.`,
      confirmText: 'Quitar',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'fa-solid fa-user-shield',
    });

    if (!confirmed) {
      return;
    }

    this.submitting.set(true);
    this.managementData
      .removeStudentTutor(student.id, tutor.id)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe((result) => {
        if (result.success && result.student) {
          this.replaceStudent(result.student);
          this.toastService.success('Tutor eliminado', 'El tutor ya no esta asociado a este alumno.');
          return;
        }

        this.toastService.error('No se pudo quitar', result.message ?? 'No se pudo quitar al tutor.');
      });
  }

  private replaceStudent(student: ManagementStudent): void {
    this.snapshot.update((snapshot) => ({
      ...snapshot,
      students: snapshot.students.map((item) => (item.id === student.id ? student : item)),
    }));
  }

  protected submitEmergencyList(incident: ManagementIncident): void {
    if (this.submitting()) {
      return;
    }

    const present = incident.roster.filter((item) => item.status === 'PRESENTE').length;
    const absent = incident.roster.filter((item) => item.status === 'AUSENTE').length;

    this.submitting.set(true);
    this.managementData
      .updateIncidentStudents(incident.id, incident.roster)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe((result) => {
        if (!result.success) {
          this.toastService.error(
            'No se pudo guardar',
            result.message ?? 'El pase de lista del incidente no fue actualizado.',
          );
          return;
        }

        this.toastService.success('Pase de lista guardado', `${present} presentes y ${absent} faltantes registrados.`);
        void this.router.navigateByUrl(`${this.baseRoute()}/incidents/${incident.id}`);
      });
  }

  protected async closeIncident(incident: ManagementIncident): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Concluir incidente',
      message: 'Esta accion cerrara el incidente y dejara el historial como evidencia.',
      confirmText: 'Concluir',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'fa-solid fa-shield-halved',
    });

    if (!confirmed) {
      return;
    }

    this.managementData.closeIncident(incident.id, 'RESOLVED').subscribe((result) => {
      if (result.success) {
        this.toastService.success('Incidente concluido', 'El incidente fue cerrado correctamente.');
        const updated = { ...incident, status: { label: 'RESUELTO', tone: 'success' as const } };
        this.incidentDetail.set(updated);
        this.snapshot.update((snapshot) => ({
          ...snapshot,
          incidents: snapshot.incidents.map((item) => (item.id === incident.id ? updated : item)),
        }));
        return;
      }

      this.toastService.error(
        'No se pudo concluir',
        result.message ?? 'No se pudo completar la accion. Intenta nuevamente.',
      );
    });
  }

  protected claimAction(claim: ManagementClaim, action: string): void {
    this.managementData.updateClaimAction(claim.id, action, this.claimComment.value).subscribe((result) => {
      if (!result.success) {
        this.toastService.error('Accion no aplicada', result.message ?? 'No fue posible actualizar la reclamacion.');
        return;
      }

      this.toastService.success('Reclamacion actualizada', 'El seguimiento fue registrado.');
      const status = this.claimStatusFromAction(action);
      this.snapshot.update((snapshot) => ({
        ...snapshot,
        claims: snapshot.claims.map((item) => (item.id === claim.id ? { ...item, status } : item)),
      }));
    });
  }

  private applyParams(params: ParamMap): void {
    this.selectedStudentId.set(params.get('studentId') ?? '');
    this.selectedTeacherId.set(params.get('teacherId') ?? '');
    this.selectedIncidentId.set(params.get('incidentId') ?? '');
    this.selectedClaimId.set(params.get('claimId') ?? '');
    this.selectedDeviceId.set(params.get('deviceId') ?? '');
    this.selectedScheduleId.set(params.get('scheduleId') ?? '');
    this.selectedSchoolYearId.set(params.get('schoolYearId') ?? '');
    this.selectedCareerId.set(params.get('careerId') ?? '');
    this.selectedSubjectId.set(params.get('subjectId') ?? '');
    this.selectedAttendanceSettingId.set(params.get('attendanceSettingId') ?? '');
    this.selectedClassroomId.set(params.get('classroomId') ?? '');
    this.auditEntity.set(this.readAuditEntity(params.get('entity')));
  }

  private readAuditEntity(entity: string | null): ManagementAuditLog['entity'] {
    return entity === 'teachers' || entity === 'groups' || entity === 'devices' ? entity : 'students';
  }

  private patchDeviceForm(): void {
    const device = this.selectedDevice();

    if (!device) {
      return;
    }

    this.deviceForm.patchValue(
      {
        macAddress: device.macAddress,
        ipAddress: device.ipAddress,
        classroomId: device.classroomId,
      },
      { emitEvent: false },
    );

    if (this.canEditDevices()) {
      this.deviceForm.controls.classroomId.enable({ emitEvent: false });
    } else {
      this.deviceForm.controls.classroomId.disable({ emitEvent: false });
    }
  }

  private claimStatusFromAction(action: string): ManagementStatus {
    const statuses: Record<string, ManagementStatus> = {
      RECHAZADO: { label: 'Rechazada', tone: 'danger' },
      EN_PROCESO: { label: 'Seguimiento', tone: 'success' },
      CONTACTADO: { label: 'Contactado', tone: 'warning' },
      ACEPTADO: { label: 'Concluida', tone: 'success' },
    };

    return statuses[action] ?? { label: 'Actualizada', tone: 'neutral' };
  }
}
