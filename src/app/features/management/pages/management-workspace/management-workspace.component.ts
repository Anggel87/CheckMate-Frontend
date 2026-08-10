import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { combineLatest, finalize } from 'rxjs';
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
  EMPTY_MANAGEMENT_SNAPSHOT,
  IncidentCreatePayload,
  ManagementAuditLog,
  ManagementClaim,
  ManagementDevice,
  ManagementGroup,
  ManagementIncident,
  ManagementIncidentRosterItem,
  ManagementJustification,
  ManagementSnapshot,
  ManagementStatus,
  ManagementStudent,
  ManagementTeacher,
  ManagementView,
} from '../../models/management.model';

@Component({
  selector: 'app-management-workspace',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, ReactiveFormsModule, BreadcrumbsComponent, FileUploadComponent],
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

                <article class="checkmate-card management-info-panel">
                  <h2>Datos de contacto</h2>
                  <dl class="management-data-grid">
                    <div><dt>Correo institucional</dt><dd>{{ student.email }}</dd></div>
                    <div><dt>Telefono movil</dt><dd>{{ student.phone }}</dd></div>
                    <div><dt>Tutor familiar</dt><dd>{{ student.tutorName }}</dd></div>
                  </dl>
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

          @case ('schedules') {
            <div class="checkmate-card management-table-card">
              <div class="segmented-control">
                @for (day of scheduleDays(); track day) {
                  <button type="button" [class.is-active]="day === 'Lunes'">{{ day }}</button>
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
                    @for (schedule of snapshot().schedules; track schedule.id) {
                      <tr>
                        <td>{{ schedule.time }}</td>
                        <td><strong>{{ schedule.subject }}</strong></td>
                        <td>{{ schedule.teacher }}</td>
                        <td>{{ schedule.group }}</td>
                        <td>{{ schedule.classroom }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
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
                    <input class="checkmate-input" type="text" formControlName="ipAddress" />
                  </label>
                  <label class="checkmate-form-field">
                    <span class="checkmate-label">Salon</span>
                    <input class="checkmate-input" type="text" formControlName="classroom" />
                  </label>
                  <label class="checkmate-form-field">
                    <span class="checkmate-label">Edificio</span>
                    <input class="checkmate-input" type="text" formControlName="building" />
                  </label>
                  <label class="checkmate-form-field management-form__full">
                    <span class="checkmate-label">Tutor</span>
                    <input class="checkmate-input" type="text" formControlName="tutor" />
                  </label>
                </div>
                <aside class="management-form__aside">
                  <span [class]="statusClass(device.status)">{{ device.status.label }}</span>
                  <p>El endpoint de edicion de dispositivos esta documentado para Administrador. Director conserva consulta y prueba.</p>
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
            }
          }

          @case ('incidents') {
            <div class="management-split">
              <div class="checkmate-card management-table-card">
                <div class="management-toolbar">
                  <label class="checkmate-form-field">
                    <span class="checkmate-label">Estado</span>
                    <select class="checkmate-select"><option>Todos</option><option>Activo</option><option>Concluido</option></select>
                  </label>
                  <label class="checkmate-form-field">
                    <span class="checkmate-label">Severidad</span>
                    <select class="checkmate-select"><option>Todas</option><option>Critico</option><option>Urgente</option></select>
                  </label>
                </div>
                <div class="management-list">
                  @for (incident of snapshot().incidents; track incident.id) {
                    <article class="management-record">
                      <span class="management-icon management-icon--danger">
                        <i class="fa-solid fa-fire" aria-hidden="true"></i>
                      </span>
                      <div>
                        <h2>{{ incident.title }}</h2>
                        <p>{{ incident.date }} · {{ incident.location }}</p>
                      </div>
                      <span [class]="statusClass(incident.severity)">{{ incident.severity.label }}</span>
                      <a class="btn-checkmate btn-checkmate-primary" [routerLink]="baseRoute() + '/incidents/' + incident.id">
                        Detalles
                      </a>
                    </article>
                  }
                </div>
              </div>
              <aside class="checkmate-card management-summary">
                <h2>Resumen semanal</h2>
                <dl class="management-metrics">
                  <div><dt>Criticos</dt><dd>04</dd></div>
                  <div><dt>En curso</dt><dd>12</dd></div>
                  <div><dt>Resueltos</dt><dd>28</dd></div>
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
                <label class="checkmate-form-field">
                  <span class="checkmate-label">Ubicacion especifica</span>
                  <input class="checkmate-input" type="text" formControlName="location" placeholder="Ej. Laboratorio 4" />
                </label>
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
                <button class="btn-checkmate btn-checkmate-primary" type="submit" [disabled]="incidentForm.invalid || submitting()">
                  <i class="fa-solid fa-floppy-disk" aria-hidden="true"></i>
                  Guardar incidente
                </button>
              </footer>
            </form>
          }

          @case ('incident-detail') {
            @if (selectedIncident(); as incident) {
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
                    <div><dt>Ubicacion</dt><dd>{{ incident.location }}</dd></div>
                  </dl>
                  <h3>Descripcion</h3>
                  <p>{{ incident.description }}</p>
                  <div class="management-actions">
                    <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/incidents/' + incident.id + '/attendance'">
                      Pase de lista
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
                    }
                  </div>
                </aside>
              </div>
            }
          }

          @case ('incident-attendance') {
            @if (selectedIncident(); as incident) {
              <form class="checkmate-card management-form" (ngSubmit)="submitEmergencyList(incident)">
                <div class="management-toolbar">
                  <label class="checkmate-form-field">
                    <span class="checkmate-label">Carrera</span>
                    <select class="checkmate-select"><option>Ingenieria en Sistemas</option></select>
                  </label>
                  <label class="checkmate-form-field">
                    <span class="checkmate-label">Turno</span>
                    <select class="checkmate-select"><option>Matutino</option></select>
                  </label>
                  <label class="checkmate-form-field">
                    <span class="checkmate-label">Grupo</span>
                    <select class="checkmate-select"><option>10B</option></select>
                  </label>
                  <label class="checkmate-form-field">
                    <span class="checkmate-label">Tipo</span>
                    <input class="checkmate-input" [value]="incident.title" readonly />
                  </label>
                </div>
                <div class="management-table-wrap">
                  <table class="management-table">
                    <thead>
                      <tr>
                        <th>No. de control</th>
                        <th>Alumno</th>
                        <th>Estado</th>
                        <th>Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of incident.roster; track item.studentId) {
                        <tr [class.is-present]="item.status === 'PRESENTE'" [class.is-absent]="item.status === 'AUSENTE'">
                          <td>{{ item.controlNumber }}</td>
                          <td><strong>{{ item.name }}</strong></td>
                          <td>{{ rosterStatusLabel(item) }}</td>
                          <td>
                            <div class="management-actions">
                              <button type="button" class="btn-checkmate btn-checkmate-success" (click)="markRoster(incident.id, item.studentId, 'PRESENTE')">
                                Presente
                              </button>
                              <button type="button" class="btn-checkmate btn-checkmate-danger" (click)="markRoster(incident.id, item.studentId, 'AUSENTE')">
                                Faltante
                              </button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
                <div class="management-form__grid">
                  <label class="checkmate-form-field">
                    <span class="checkmate-label">Comentario</span>
                    <textarea class="checkmate-textarea" [formControl]="attendanceComment" placeholder="Notas generales del conteo"></textarea>
                  </label>
                  <app-file-upload
                    title="Evidencia"
                    description="Arrastra archivos aqui o haz clic para subir."
                    accept="image/png,image/jpeg,application/pdf"
                    [maxSizeMb]="10"
                  />
                </div>
                <footer class="management-form__footer">
                  <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="baseRoute() + '/incidents/' + incident.id">Cancelar</a>
                  <button class="btn-checkmate btn-checkmate-primary" type="submit">Guardar registro</button>
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
                    @for (log of auditLogs(); track log.id) {
                      <tr>
                        <td>{{ log.date }}</td>
                        <td>{{ log.description }}</td>
                        <td><span [class]="statusClass(log.level)">{{ log.level.label }}</span></td>
                        <td>{{ log.performedBy }}</td>
                      </tr>
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
  protected readonly loading = signal(false);
  protected readonly loadError = signal('');
  protected readonly selectedStudentId = signal('');
  protected readonly selectedTeacherId = signal('');
  protected readonly selectedIncidentId = signal('');
  protected readonly selectedClaimId = signal('');
  protected readonly selectedDeviceId = signal('');
  protected readonly auditEntity = signal<ManagementAuditLog['entity']>('students');
  protected readonly submitting = signal(false);

  protected readonly incidentForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] }),
    type: new FormControl('FIRE', { nonNullable: true, validators: [Validators.required] }),
    severity: new FormControl('CRITICA', { nonNullable: true, validators: [Validators.required] }),
    location: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }),
    evidence: new FormControl<File | null>(null),
  });

  protected readonly deviceForm = new FormGroup({
    macAddress: new FormControl('', { nonNullable: true }),
    ipAddress: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    classroom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    building: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tutor: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly attendanceComment = new FormControl('', { nonNullable: true });
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

  protected readonly selectedStudent = computed<ManagementStudent | null>(() => {
    const students = this.snapshot().students;
    return students.find((student) => student.id === this.selectedStudentId()) ?? students[0] ?? null;
  });

  protected readonly selectedTeacher = computed<ManagementTeacher | null>(() => {
    const teachers = this.snapshot().teachers;
    return teachers.find((teacher) => teacher.id === this.selectedTeacherId()) ?? teachers[0] ?? null;
  });

  protected readonly selectedIncident = computed<ManagementIncident | null>(() => {
    const incidents = this.snapshot().incidents;
    return incidents.find((incident) => incident.id === this.selectedIncidentId()) ?? incidents[0] ?? null;
  });

  protected readonly selectedClaim = computed<ManagementClaim | null>(() => {
    const claims = this.snapshot().claims;
    return claims.find((claim) => claim.id === this.selectedClaimId()) ?? claims[0] ?? null;
  });

  protected readonly selectedDevice = computed<ManagementDevice | null>(() => {
    const devices = this.snapshot().devices;
    return devices.find((device) => device.id === this.selectedDeviceId()) ?? devices[0] ?? null;
  });

  ngOnInit(): void {
    combineLatest([this.route.data, this.route.paramMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([data, params]) => {
        this.view.set((data['managementView'] as ManagementView | undefined) ?? 'students');
        this.applyParams(params);
        this.patchDeviceForm();
      });

    this.loadSnapshot();
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
        },
        error: () => {
          this.snapshot.set(EMPTY_MANAGEMENT_SNAPSHOT);
          this.loadError.set('La API real no respondio en localhost:8000 o la sesion no tiene permiso vigente.');
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
      schedules: 'Horario de clases',
      attendance: 'Revision de asistencias',
      justifications: 'Justificantes',
      devices: 'Gestion de dispositivos',
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
      subjects: 'Materias con profesor, grupo, horario y ubicacion.',
      schedules: 'Horario semanal de grupos y profesores de la carrera.',
      attendance: 'Audita registros de asistencia y estados por materia.',
      justifications: 'Seguimiento de justificantes aprobados, pendientes y rechazados.',
      devices: 'Monitorea terminales NFC y estado operativo por aula.',
      'device-edit': 'Consulta o actualiza datos del dispositivo segun permisos disponibles.',
      incidents: 'Lista incidentes, filtra estados y consulta seguimiento.',
      'incident-new': 'Reporta un incidente con evidencia y severidad.',
      'incident-detail': 'Informacion, historial y acciones del incidente.',
      'incident-attendance': 'Valida presentes y faltantes durante un evento critico.',
      claims: 'Da seguimiento a reclamaciones academicas o de asistencia.',
      'claim-detail': 'Revisa evidencia, comentarios y acciones de resolucion.',
      statistics: 'Indicadores operativos conectados a las graficas del backend cuando estan disponibles.',
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
        return [root, { label: 'Incidentes', route: `${base}/incidents` }, { label: this.selectedIncident()?.title ?? 'Detalle' }];
      case 'incident-attendance':
        return [
          root,
          { label: 'Incidentes', route: `${base}/incidents` },
          { label: this.selectedIncident()?.title ?? 'Detalle', route: `${base}/incidents/${this.selectedIncident()?.id ?? ''}` },
          { label: 'Pase de lista' },
        ];
      case 'claim-detail':
        return [root, { label: 'Reclamos', route: `${base}/claims` }, { label: this.selectedClaim()?.studentName ?? 'Detalle' }];
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

  protected canEditDevices(): boolean {
    return this.currentRole() === UserRole.ADMIN;
  }

  protected canCreateIncidents(): boolean {
    return this.currentRole() === UserRole.CAREER_DIRECTOR;
  }

  protected canCloseIncident(incident: ManagementIncident): boolean {
    return (
      this.currentRole() === UserRole.CAREER_DIRECTOR &&
      incident.status.label.toLowerCase() !== 'concluido'
    );
  }

  protected statusClass(status: ManagementStatus): string {
    return `status-badge status-badge--${status.tone}`;
  }

  protected scheduleDays(): string[] {
    return ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
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
    const entity = this.auditEntity();
    const logs = this.snapshot().logs.filter((log) => log.entity === entity);
    return logs.length ? logs : this.snapshot().logs;
  }

  protected auditEntityLabel(): string {
    return this.auditEntities.find((entity) => entity.key === this.auditEntity())?.label ?? 'Alumnos';
  }

  protected rosterStatusLabel(item: ManagementIncidentRosterItem): string {
    if (item.status === 'PRESENTE') {
      return 'Presente';
    }

    if (item.status === 'AUSENTE') {
      return 'Faltante';
    }

    return 'Sin confirmar';
  }

  protected setIncidentEvidence(files: File[]): void {
    this.incidentForm.controls.evidence.setValue(files[0] ?? null);
  }

  protected clearIncidentEvidence(): void {
    this.incidentForm.controls.evidence.setValue(null);
  }

  protected submitIncident(): void {
    if (this.incidentForm.invalid || this.submitting()) {
      this.incidentForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const rawPayload = this.incidentForm.getRawValue();
    const payload: IncidentCreatePayload = {
      ...rawPayload,
      scheduleId: this.snapshot().schedules[0]?.id ?? '1',
      studentIds: this.snapshot()
        .students.slice(0, 5)
        .map((student) => student.id),
    };

    this.managementData
      .createIncident(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe((success) => {
        if (!success) {
          this.toastService.error('No se pudo crear el incidente', 'Revisa la informacion e intenta nuevamente.');
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
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe((success) => {
        if (success) {
          this.toastService.success('Dispositivo actualizado', 'Los cambios fueron guardados.');
          void this.router.navigateByUrl(`${this.baseRoute()}/nfc-devices`);
          return;
        }

        this.toastService.error('No se pudo guardar', 'El endpoint de edicion no esta disponible para este rol.');
      });
  }

  protected markRoster(incidentId: string, studentId: string, status: 'PRESENTE' | 'AUSENTE'): void {
    this.snapshot.update((snapshot) => ({
      ...snapshot,
      incidents: snapshot.incidents.map((incident) =>
        incident.id === incidentId
          ? {
              ...incident,
              roster: incident.roster.map((item) =>
                item.studentId === studentId ? { ...item, status } : item,
              ),
            }
          : incident,
      ),
    }));
  }

  protected submitEmergencyList(incident: ManagementIncident): void {
    const present = incident.roster.filter((item) => item.status === 'PRESENTE').length;
    const absent = incident.roster.filter((item) => item.status === 'AUSENTE').length;

    this.managementData.updateIncidentStudents(incident, this.attendanceComment.value).subscribe((success) => {
      if (!success) {
        this.toastService.error('No se pudo guardar', 'El pase de lista del incidente no fue actualizado.');
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

    this.managementData.closeIncident(incident.id, 'RESOLVED').subscribe((success) => {
      if (success) {
        this.toastService.success('Incidente concluido', 'El incidente fue cerrado correctamente.');
        this.snapshot.update((snapshot) => ({
          ...snapshot,
          incidents: snapshot.incidents.map((item) =>
            item.id === incident.id ? { ...item, status: { label: 'Concluido', tone: 'success' } } : item,
          ),
        }));
        return;
      }

      this.toastService.error('No se pudo concluir', 'El servidor rechazo la operacion.');
    });
  }

  protected claimAction(claim: ManagementClaim, action: string): void {
    this.managementData.updateClaimAction(claim.id, action, this.claimComment.value).subscribe((success) => {
      if (!success) {
        this.toastService.error('Accion no aplicada', 'No fue posible actualizar la reclamacion.');
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
        classroom: device.classroom,
        building: device.building,
        tutor: device.tutor,
      },
      { emitEvent: false },
    );
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
