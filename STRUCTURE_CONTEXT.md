# CheckMate Frontend — Contexto y estructura del proyecto Angular

Este documento define el contexto funcional, la arquitectura frontend, la organización de carpetas, la división por roles, la separación por módulos y las reglas de desarrollo que deberán seguirse dentro de la aplicación web de **CheckMate desarrollada con Angular**.

Todo desarrollador o asistente de programación, incluyendo Codex, deberá leer este documento antes de:

* Crear nuevas pantallas.
* Crear componentes.
* Crear formularios.
* Agregar rutas.
* Modificar la navegación.
* Consumir endpoints.
* Implementar permisos.
* Crear dashboards.
* Crear servicios.
* Crear modelos o interfaces.
* Modificar la estructura del proyecto.
* Agregar módulos funcionales.
* Crear componentes compartidos.

Este documento deberá utilizarse junto con:

```text
BRANDING.md
```

`BRANDING.md` contiene las reglas visuales de CheckMate:

* Tipografía Inter.
* Paleta de colores.
* Diseño Cupertino / Apple-like.
* Botones.
* Formularios.
* Tablas.
* Alertas.
* Modales.
* Badges.
* Iconos Font Awesome.
* Estados de asistencia.
* Diseño responsivo.

---

# 1. Contexto general de CheckMate

## 1.1 Nombre del sistema

**CheckMate**

## 1.2 Tipo de aplicación

CheckMate es un sistema híbrido compuesto por:

* Aplicación web administrativa desarrollada con Angular.
* Aplicación móvil.
* API backend.
* Dispositivo IoT basado en Raspberry.
* Lector RFID/NFC PN532.
* Pantalla de confirmación.
* Indicadores LED.
* Buzzer.
* Sistema de notificaciones.
* Módulo de seguridad para emergencias.

Este documento se concentra únicamente en la estructura y desarrollo de la aplicación web Angular.

---

# 2. Propósito del frontend Angular

La aplicación Angular será responsable de proporcionar las interfaces web necesarias para que los usuarios puedan consultar, administrar y utilizar las funciones de CheckMate según su rol.

El frontend deberá:

* Mostrar información proporcionada por la API.
* Controlar la navegación por roles.
* Ocultar acciones no autorizadas.
* Aplicar permisos visuales.
* Validar formularios.
* Mostrar errores provenientes del backend.
* Gestionar estados de carga.
* Mostrar notificaciones.
* Presentar reportes y estadísticas.
* Permitir el seguimiento de asistencias.
* Gestionar reclamos y justificantes.
* Mostrar información de emergencias.
* Mantener una interfaz uniforme.
* Adaptarse a escritorio, tablet y móvil.

El frontend no deberá contener reglas críticas de negocio que correspondan al backend.

---

# 3. Problema que resuelve

El sistema busca reemplazar o reducir el pase de lista manual utilizado actualmente en las instituciones educativas.

El proceso manual puede provocar:

* Pérdida de tiempo de clase.
* Errores de captura.
* Registros incompletos.
* Duplicación de información.
* Retrasos en la generación de reportes.
* Dificultad para consultar asistencias.
* Falta de seguimiento de inasistencias.
* Problemas para gestionar justificantes.
* Ausencia de información en tiempo real.
* Dificultad para contar alumnos durante emergencias.

La aplicación Angular permitirá que cada usuario consulte o administre la información correspondiente desde una interfaz limpia, segura y organizada.

---

# 4. Objetivo del frontend

Desarrollar una aplicación web moderna, modular, escalable y responsiva que permita administrar y consultar la información del sistema CheckMate de acuerdo con el rol y los permisos del usuario autenticado.

La aplicación deberá facilitar:

* Administración de usuarios.
* Administración académica.
* Gestión de asistencias.
* Visualización de estadísticas.
* Generación de reportes.
* Gestión de reclamos.
* Gestión de justificantes.
* Gestión de dispositivos NFC.
* Monitoreo de emergencias.
* Consulta de información académica.

---

# 5. Roles del sistema

La aplicación tendrá cinco roles principales:

```typescript
export enum UserRole {
  ADMIN = 'ADMIN',
  CAREER_DIRECTOR = 'CAREER_DIRECTOR',
  TEACHER = 'TEACHER',
  TUTOR_TEACHER = 'TUTOR_TEACHER',
  STUDENT = 'STUDENT',
}
```

| Identificador     | Nombre mostrado     |
| ----------------- | ------------------- |
| `ADMIN`           | Administrador       |
| `CAREER_DIRECTOR` | Director de carrera |
| `TEACHER`         | Profesor            |
| `TUTOR_TEACHER`   | Profesor tutor      |
| `STUDENT`         | Alumno              |

Los identificadores utilizados internamente deberán mantenerse en inglés.

Los nombres mostrados en la interfaz deberán estar en español.

---

# 6. Acceso por rol

## 6.1 Administrador

El administrador podrá acceder a:

* Dashboard administrativo.
* Usuarios.
* Alumnos.
* Profesores.
* Directores.
* Profesores tutores.
* Carreras.
* Grupos.
* Materias.
* Horarios.
* Ciclos escolares.
* Asistencias.
* Configuración de asistencias.
* Dispositivos NFC.
* Tarjetas NFC.
* Reclamos.
* Justificantes.
* Reportes.
* Estadísticas.
* Notificaciones.
* Emergencias.
* Incidentes.
* Configuración general.
* Auditoría.

---

## 6.2 Director de carrera

El director podrá acceder a la información relacionada con su carrera:

* Dashboard de dirección.
* Alumnos de su carrera.
* Profesores de su carrera.
* Grupos.
* Materias.
* Horarios.
* Asistencias.
* Reclamos.
* Justificantes.
* Reportes.
* Estadísticas.
* Alertas académicas.
* Emergencias.

No deberá visualizar información de otras carreras, salvo que la API y sus permisos lo autoricen.

---

## 6.3 Profesor

El profesor podrá acceder a:

* Dashboard del profesor.
* Horario personal.
* Clases asignadas.
* Grupos asignados.
* Lista de alumnos.
* Registro de asistencia.
* Modificación autorizada de asistencia.
* Reclamos relacionados con sus clases.
* Justificantes relacionados con sus alumnos.
* Estadísticas de sus grupos.
* Notificaciones.
* Conteo de alumnos durante emergencias.

---

## 6.4 Profesor tutor

El profesor tutor podrá acceder a:

* Dashboard de tutoría.
* Alumnos tutorados.
* Grupos tutorados.
* Asistencias.
* Faltas recurrentes.
* Retardos recurrentes.
* Reclamos.
* Justificantes.
* Alertas académicas.
* Estadísticas.
* Seguimiento de alumnos.
* Notificaciones.
* Emergencias.

El profesor tutor también podrá tener las funciones normales de profesor cuando tenga clases asignadas.

---

## 6.5 Alumno

El alumno podrá acceder únicamente a su propia información:

* Dashboard personal.
* Perfil.
* Horario.
* Materias.
* Historial de asistencia.
* Faltas.
* Retardos.
* Asistencias justificadas.
* Reclamos.
* Justificantes.
* Archivos adjuntos.
* Estado de solicitudes.
* Notificaciones.
* Avisos de emergencia.

El alumno no deberá visualizar información privada de otros alumnos.

---

# 7. Principio principal de arquitectura

La aplicación deberá organizarse utilizando una arquitectura:

```text
Feature First + Role Based Access
```

Esto significa que:

* Las funcionalidades se organizarán por módulos.
* Los roles controlarán el acceso a los módulos.
* Los componentes comunes se reutilizarán.
* Los dashboards podrán ser diferentes por rol.
* La lógica no deberá duplicarse para cada rol.
* Los permisos se aplicarán mediante guards, directivas y validaciones.
* Los módulos se cargarán de forma diferida cuando sea posible.

## Regla principal

> Las funcionalidades se dividen por módulos y los roles determinan qué módulos, pantallas, acciones y datos puede utilizar cada usuario.

No deberán crearse cinco versiones completas de un mismo módulo únicamente porque existen cinco roles.

Ejemplo incorrecto:

```text
admin-attendance/
director-attendance/
teacher-attendance/
tutor-attendance/
student-attendance/
```

Ejemplo recomendado:

```text
features/attendance/
```

Dentro del módulo se deberán crear las páginas necesarias:

```text
features/attendance/pages/
├── attendance-list/
├── attendance-detail/
├── take-attendance/
├── attendance-history/
└── my-attendance/
```

El acceso a cada página será controlado por:

* Rutas.
* Guards.
* Permisos.
* Rol.
* Información proporcionada por la API.

---

# 8. Arquitectura general recomendada

La aplicación deberá utilizar una estructura clara y predecible.

```text
src/
├── app/
│   ├── core/
│   ├── shared/
│   ├── layouts/
│   ├── features/
│   ├── roles/
│   ├── app.component.ts
│   ├── app.component.html
│   ├── app.config.ts
│   └── app.routes.ts
│
├── assets/
│   ├── images/
│   ├── icons/
│   ├── logos/
│   ├── illustrations/
│   └── fonts/
│
├── environments/
│   ├── environment.ts
│   └── environment.development.ts
│
├── styles/
│   ├── abstracts/
│   ├── base/
│   ├── components/
│   ├── layout/
│   ├── utilities/
│   └── themes/
│
├── index.html
├── main.ts
└── styles.scss
```

---

# 9. Estructura completa de `app`

```text
src/app/
├── core/
│   ├── authentication/
│   ├── authorization/
│   ├── guards/
│   ├── interceptors/
│   ├── services/
│   ├── models/
│   ├── constants/
│   ├── tokens/
│   ├── errors/
│   └── config/
│
├── shared/
│   ├── components/
│   ├── forms/
│   ├── directives/
│   ├── pipes/
│   ├── validators/
│   ├── utils/
│   ├── models/
│   └── types/
│
├── layouts/
│   ├── authenticated-layout/
│   ├── guest-layout/
│   ├── emergency-layout/
│   └── components/
│
├── roles/
│   ├── admin/
│   ├── career-director/
│   ├── teacher/
│   ├── tutor-teacher/
│   └── student/
│
├── features/
│   ├── authentication/
│   ├── dashboard/
│   ├── users/
│   ├── students/
│   ├── teachers/
│   ├── careers/
│   ├── groups/
│   ├── subjects/
│   ├── schedules/
│   ├── academic-periods/
│   ├── attendance/
│   ├── attendance-settings/
│   ├── nfc-devices/
│   ├── nfc-cards/
│   ├── reports/
│   ├── statistics/
│   ├── claims/
│   ├── justifications/
│   ├── notifications/
│   ├── emergencies/
│   ├── incidents/
│   ├── audit/
│   ├── profile/
│   └── settings/
│
├── app.component.ts
├── app.component.html
├── app.config.ts
└── app.routes.ts
```

---

# 10. Carpeta `core`

La carpeta `core` deberá contener elementos globales que normalmente se cargan una sola vez durante la ejecución de la aplicación.

```text
core/
├── authentication/
│   ├── auth.service.ts
│   ├── auth.store.ts
│   ├── auth.models.ts
│   └── session.service.ts
│
├── authorization/
│   ├── permission.service.ts
│   ├── role.service.ts
│   ├── permission.models.ts
│   └── permission.constants.ts
│
├── guards/
│   ├── auth.guard.ts
│   ├── guest.guard.ts
│   ├── role.guard.ts
│   ├── permission.guard.ts
│   └── pending-changes.guard.ts
│
├── interceptors/
│   ├── auth.interceptor.ts
│   ├── error.interceptor.ts
│   ├── loading.interceptor.ts
│   └── request.interceptor.ts
│
├── services/
│   ├── api.service.ts
│   ├── loading.service.ts
│   ├── notification.service.ts
│   ├── storage.service.ts
│   ├── dialog.service.ts
│   └── connectivity.service.ts
│
├── models/
│   ├── api-response.model.ts
│   ├── api-error.model.ts
│   ├── authenticated-user.model.ts
│   ├── pagination.model.ts
│   └── menu-item.model.ts
│
├── constants/
│   ├── api-routes.constants.ts
│   ├── route-paths.constants.ts
│   └── storage-keys.constants.ts
│
├── errors/
│   ├── forbidden.error.ts
│   ├── unauthorized.error.ts
│   └── validation.error.ts
│
└── config/
    ├── app.config.ts
    └── navigation.config.ts
```

## Reglas para `core`

* No deberá contener componentes específicos de un módulo.
* No deberá contener formularios de alumnos, profesores o asistencias.
* No deberá importar módulos funcionales.
* Deberá concentrar autenticación, seguridad, HTTP y servicios globales.
* Los servicios globales deberán utilizar `providedIn: 'root'`.

---

# 11. Carpeta `shared`

La carpeta `shared` deberá contener elementos reutilizables en diferentes módulos.

```text
shared/
├── components/
│   ├── buttons/
│   ├── cards/
│   ├── tables/
│   ├── badges/
│   ├── modals/
│   ├── alerts/
│   ├── navigation/
│   ├── pagination/
│   ├── loading/
│   ├── empty-state/
│   ├── search-bar/
│   ├── filters/
│   ├── file-upload/
│   ├── page-header/
│   └── status-indicator/
│
├── forms/
│   ├── form-field/
│   ├── text-input/
│   ├── select-input/
│   ├── date-input/
│   ├── time-input/
│   ├── textarea-input/
│   ├── checkbox-input/
│   ├── radio-input/
│   ├── file-input/
│   └── form-errors/
│
├── directives/
│   ├── has-role.directive.ts
│   ├── has-permission.directive.ts
│   ├── autofocus.directive.ts
│   └── prevent-double-click.directive.ts
│
├── pipes/
│   ├── attendance-status.pipe.ts
│   ├── role-name.pipe.ts
│   ├── date-time.pipe.ts
│   └── file-size.pipe.ts
│
├── validators/
│   ├── password.validator.ts
│   ├── date-range.validator.ts
│   ├── file-type.validator.ts
│   └── file-size.validator.ts
│
├── utils/
│   ├── date.utils.ts
│   ├── form.utils.ts
│   ├── file.utils.ts
│   └── query-params.utils.ts
│
├── models/
└── types/
```

## Regla para componentes compartidos

Un componente deberá colocarse en `shared` cuando:

* Se utilice en dos o más módulos.
* No dependa de una funcionalidad específica.
* Pueda recibir su información mediante inputs.
* Pueda emitir acciones mediante outputs.
* No contenga reglas de negocio particulares.

Ejemplos:

```text
page-header
confirmation-modal
empty-state
loading-spinner
status-badge
pagination
search-bar
file-upload
```

---

# 12. Carpeta `layouts`

Los layouts definirán la estructura visual principal de la aplicación.

```text
layouts/
├── authenticated-layout/
│   ├── authenticated-layout.component.ts
│   ├── authenticated-layout.component.html
│   └── authenticated-layout.component.scss
│
├── guest-layout/
│   ├── guest-layout.component.ts
│   ├── guest-layout.component.html
│   └── guest-layout.component.scss
│
├── emergency-layout/
│   ├── emergency-layout.component.ts
│   ├── emergency-layout.component.html
│   └── emergency-layout.component.scss
│
└── components/
    ├── sidebar/
    ├── topbar/
    ├── mobile-navigation/
    ├── user-menu/
    ├── notification-menu/
    ├── breadcrumbs/
    └── page-container/
```

## `authenticated-layout`

Se utilizará para usuarios que hayan iniciado sesión.

Deberá incluir:

* Sidebar.
* Topbar.
* Nombre del usuario.
* Rol.
* Notificaciones.
* Botón de cerrar sesión.
* Área principal mediante `router-outlet`.
* Navegación responsiva.
* Menú adaptado al rol.

## `guest-layout`

Se utilizará para:

* Inicio de sesión.
* Recuperación de contraseña.
* Cambio de contraseña.
* Verificación multifactor.
* Páginas públicas autorizadas.

## `emergency-layout`

Podrá utilizarse para mostrar información crítica durante una emergencia.

Deberá priorizar:

* Información clara.
* Acciones grandes.
* Conteos visibles.
* Estados de grupos.
* Alumnos localizados.
* Alumnos pendientes.
* Botones de confirmación.

---

# 13. Carpeta `roles`

La carpeta `roles` contendrá configuraciones y páginas exclusivas de cada rol.

```text
roles/
├── admin/
│   ├── pages/
│   │   └── admin-dashboard/
│   ├── config/
│   │   └── admin-menu.config.ts
│   └── admin.routes.ts
│
├── career-director/
│   ├── pages/
│   │   └── director-dashboard/
│   ├── config/
│   │   └── director-menu.config.ts
│   └── career-director.routes.ts
│
├── teacher/
│   ├── pages/
│   │   └── teacher-dashboard/
│   ├── config/
│   │   └── teacher-menu.config.ts
│   └── teacher.routes.ts
│
├── tutor-teacher/
│   ├── pages/
│   │   └── tutor-dashboard/
│   ├── config/
│   │   └── tutor-menu.config.ts
│   └── tutor-teacher.routes.ts
│
└── student/
    ├── pages/
    │   └── student-dashboard/
    ├── config/
    │   └── student-menu.config.ts
    └── student.routes.ts
```

## Qué debe colocarse en `roles`

* Dashboard exclusivo del rol.
* Configuración del menú.
* Rutas principales del rol.
* Contenedores exclusivos.
* Componentes que solamente tengan sentido para ese rol.

## Qué no debe colocarse en `roles`

No deberán duplicarse módulos completos.

Ejemplo incorrecto:

```text
roles/admin/students/
roles/director/students/
roles/tutor/students/
```

El módulo de alumnos deberá existir una sola vez:

```text
features/students/
```

Las rutas y permisos determinarán qué páginas puede utilizar cada rol.

---

# 14. Carpeta `features`

La carpeta `features` contendrá los módulos funcionales del sistema.

Cada módulo deberá ser independiente y deberá tener una responsabilidad clara.

Ejemplo:

```text
features/students/
├── pages/
├── components/
├── forms/
├── data-access/
├── models/
├── constants/
├── utils/
└── students.routes.ts
```

---

# 15. Estructura estándar de un módulo

La estructura recomendada para cada módulo será:

```text
feature-name/
├── pages/
├── components/
├── forms/
├── data-access/
├── models/
├── enums/
├── constants/
├── utils/
└── feature-name.routes.ts
```

No todos los módulos necesitan todas las carpetas.

Las carpetas deberán crearse únicamente cuando tengan contenido real.

---

# 16. Responsabilidad de las carpetas de un módulo

## `pages`

Contendrá componentes asociados directamente con una ruta.

Ejemplos:

```text
students/pages/
├── student-list/
├── student-create/
├── student-detail/
└── student-edit/
```

Una página deberá:

* Coordinar la vista.
* Leer parámetros de ruta.
* Solicitar información.
* Administrar estados generales.
* Componer componentes pequeños.
* Ejecutar navegación.
* Mostrar estados de carga y error.

Una página no deberá contener toda la interfaz en un solo archivo HTML.

---

## `components`

Contendrá componentes internos del módulo.

Ejemplo:

```text
students/components/
├── student-card/
├── student-table/
├── student-filters/
├── student-summary/
├── student-profile/
└── student-delete-dialog/
```

Estos componentes podrán conocer conceptos del módulo de alumnos.

No deberán colocarse en `shared` salvo que sean realmente reutilizables fuera de ese módulo.

---

## `forms`

Contendrá formularios completos y secciones reutilizables.

Ejemplo:

```text
students/forms/
├── student-form/
├── personal-information-form/
├── academic-information-form/
├── contact-information-form/
└── nfc-assignment-form/
```

Los formularios deberán dividirse cuando tengan varias secciones.

No se deberá crear un formulario de cientos de líneas dentro de una página.

---

## `data-access`

Contendrá la comunicación con la API y la administración de datos del módulo.

Ejemplo:

```text
students/data-access/
├── student-api.service.ts
├── student.facade.ts
├── student.store.ts
├── student.mapper.ts
└── student-query-params.ts
```

### Responsabilidades

* Ejecutar peticiones HTTP.
* Convertir respuestas de API.
* Mantener estado cuando sea necesario.
* Preparar parámetros de consulta.
* Centralizar endpoints del módulo.
* Evitar peticiones HTTP dentro de componentes visuales.

---

## `models`

Contendrá interfaces y tipos.

```text
students/models/
├── student.model.ts
├── student-list-item.model.ts
├── create-student-request.model.ts
├── update-student-request.model.ts
├── student-filters.model.ts
└── student-response.model.ts
```

No deberá utilizarse `any` para evitar definir modelos.

---

## `enums`

Contendrá valores limitados.

Ejemplo:

```text
attendance/enums/
├── attendance-status.enum.ts
└── attendance-source.enum.ts
```

---

## `constants`

Contendrá valores fijos del módulo.

Ejemplo:

```text
students/constants/
├── student-status-options.ts
└── student-table-columns.ts
```

---

## `utils`

Contendrá funciones puras relacionadas con el módulo.

No deberán utilizarse archivos genéricos como:

```text
helpers.ts
functions.ts
general.ts
utils.ts
```

Se deberán utilizar nombres claros:

```text
attendance-date.utils.ts
student-name.utils.ts
report-file.utils.ts
```

---

# 17. Ejemplo completo del módulo de alumnos

```text
features/students/
├── pages/
│   ├── student-list/
│   │   ├── student-list.component.ts
│   │   ├── student-list.component.html
│   │   └── student-list.component.scss
│   │
│   ├── student-create/
│   ├── student-detail/
│   └── student-edit/
│
├── components/
│   ├── student-table/
│   ├── student-filters/
│   ├── student-profile-card/
│   ├── student-attendance-summary/
│   └── student-delete-dialog/
│
├── forms/
│   ├── student-form/
│   ├── personal-information-form/
│   ├── academic-information-form/
│   └── nfc-information-form/
│
├── data-access/
│   ├── student-api.service.ts
│   ├── student.facade.ts
│   └── student.mapper.ts
│
├── models/
│   ├── student.model.ts
│   ├── student-list-item.model.ts
│   ├── create-student-request.model.ts
│   ├── update-student-request.model.ts
│   └── student-filters.model.ts
│
├── constants/
│   └── student-status-options.ts
│
└── students.routes.ts
```

---

# 18. División limpia de formularios

Los formularios complejos deberán dividirse por secciones.

Ejemplo de formulario de alumno:

```text
StudentForm
├── PersonalInformationForm
├── ContactInformationForm
├── AcademicInformationForm
└── NfcInformationForm
```

La página solamente deberá coordinar el formulario:

```html
<app-page-header
  title="Crear alumno"
  description="Registra la información personal y académica del alumno."
/>

<app-student-form
  [loading]="saving()"
  (submitted)="createStudent($event)"
  (cancelled)="returnToList()"
/>
```

El componente `StudentForm` deberá organizar las secciones:

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <app-personal-information-form
    [formGroup]="personalInformation"
  />

  <app-contact-information-form
    [formGroup]="contactInformation"
  />

  <app-academic-information-form
    [formGroup]="academicInformation"
  />

  <app-nfc-information-form
    [formGroup]="nfcInformation"
  />

  <div class="form-actions">
    <button
      type="button"
      class="btn-checkmate-secondary"
      (click)="cancelled.emit()"
    >
      Cancelar
    </button>

    <button
      type="submit"
      class="btn-checkmate-primary"
      [disabled]="form.invalid || loading()"
    >
      Guardar alumno
    </button>
  </div>
</form>
```

---

# 19. Reutilización entre creación y edición

No deberán crearse formularios completamente separados para crear y editar el mismo recurso.

Ejemplo incorrecto:

```text
create-student-form/
edit-student-form/
```

Ejemplo recomendado:

```text
student-form/
```

El mismo formulario deberá recibir valores iniciales.

```typescript
export interface StudentFormValue {
  name: string;
  enrollment: string;
  email: string;
  groupId: number | null;
  nfcUid: string | null;
}
```

Ejemplo conceptual:

```html
<app-student-form
  [initialValue]="student()"
  [loading]="saving()"
  (submitted)="updateStudent($event)"
/>
```

---

# 20. Módulos funcionales

## 20.1 Autenticación

```text
features/authentication/
├── pages/
│   ├── login/
│   ├── forgot-password/
│   ├── reset-password/
│   └── multi-factor-authentication/
│
├── forms/
│   ├── login-form/
│   ├── forgot-password-form/
│   ├── reset-password-form/
│   └── mfa-form/
│
├── data-access/
│   └── authentication-api.service.ts
│
├── models/
└── authentication.routes.ts
```

---

## 20.2 Asistencia

```text
features/attendance/
├── pages/
│   ├── attendance-list/
│   ├── attendance-detail/
│   ├── take-attendance/
│   ├── attendance-history/
│   ├── attendance-calendar/
│   └── my-attendance/
│
├── components/
│   ├── attendance-table/
│   ├── attendance-status-badge/
│   ├── attendance-summary/
│   ├── attendance-filters/
│   ├── student-attendance-row/
│   └── attendance-edit-dialog/
│
├── forms/
│   ├── take-attendance-form/
│   ├── manual-attendance-form/
│   └── attendance-correction-form/
│
├── data-access/
│   ├── attendance-api.service.ts
│   ├── attendance.facade.ts
│   └── attendance.mapper.ts
│
├── models/
├── enums/
└── attendance.routes.ts
```

Estados permitidos:

```typescript
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  JUSTIFIED = 'JUSTIFIED',
  PENDING = 'PENDING',
}
```

Fuentes posibles:

```typescript
export enum AttendanceSource {
  NFC = 'NFC',
  QR = 'QR',
  MANUAL = 'MANUAL',
  MOBILE = 'MOBILE',
  SYSTEM = 'SYSTEM',
}
```

---

## 20.3 Reclamos

```text
features/claims/
├── pages/
│   ├── claim-list/
│   ├── claim-create/
│   ├── claim-detail/
│   └── claim-review/
│
├── components/
│   ├── claim-card/
│   ├── claim-status-badge/
│   ├── claim-evidence-list/
│   └── claim-review-dialog/
│
├── forms/
│   ├── claim-form/
│   └── claim-review-form/
│
├── data-access/
├── models/
├── enums/
└── claims.routes.ts
```

---

## 20.4 Justificantes

```text
features/justifications/
├── pages/
│   ├── justification-list/
│   ├── justification-create/
│   ├── justification-detail/
│   └── justification-review/
│
├── components/
│   ├── justification-card/
│   ├── justification-status-badge/
│   ├── evidence-preview/
│   └── justification-review-dialog/
│
├── forms/
│   ├── justification-form/
│   └── justification-review-form/
│
├── data-access/
├── models/
├── enums/
└── justifications.routes.ts
```

---

## 20.5 Emergencias

```text
features/emergencies/
├── pages/
│   ├── emergency-dashboard/
│   ├── emergency-detail/
│   ├── emergency-count/
│   └── emergency-history/
│
├── components/
│   ├── emergency-status/
│   ├── student-count-card/
│   ├── group-count-card/
│   ├── missing-students-list/
│   ├── located-students-list/
│   └── emergency-action-panel/
│
├── forms/
│   ├── activate-emergency-form/
│   └── close-emergency-form/
│
├── data-access/
├── models/
├── enums/
└── emergencies.routes.ts
```

---

# 21. Rutas principales

La aplicación deberá utilizar carga diferida para las áreas principales.

Ejemplo conceptual de `app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./features/authentication/authentication.routes')
        .then((routes) => routes.AUTHENTICATION_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/authenticated-layout/authenticated-layout.component')
        .then((component) => component.AuthenticatedLayoutComponent),
    children: [
      {
        path: 'admin',
        loadChildren: () =>
          import('./roles/admin/admin.routes')
            .then((routes) => routes.ADMIN_ROUTES),
      },
      {
        path: 'director',
        loadChildren: () =>
          import('./roles/career-director/career-director.routes')
            .then((routes) => routes.CAREER_DIRECTOR_ROUTES),
      },
      {
        path: 'teacher',
        loadChildren: () =>
          import('./roles/teacher/teacher.routes')
            .then((routes) => routes.TEACHER_ROUTES),
      },
      {
        path: 'tutor',
        loadChildren: () =>
          import('./roles/tutor-teacher/tutor-teacher.routes')
            .then((routes) => routes.TUTOR_TEACHER_ROUTES),
      },
      {
        path: 'student',
        loadChildren: () =>
          import('./roles/student/student.routes')
            .then((routes) => routes.STUDENT_ROUTES),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component')
        .then((component) => component.NotFoundComponent),
  },
];
```

---

# 22. Rutas por rol

## Administrador

```text
/admin/dashboard
/admin/users
/admin/students
/admin/teachers
/admin/careers
/admin/groups
/admin/subjects
/admin/schedules
/admin/attendance
/admin/devices
/admin/reports
/admin/statistics
/admin/claims
/admin/justifications
/admin/emergencies
/admin/settings
```

## Director de carrera

```text
/director/dashboard
/director/students
/director/teachers
/director/groups
/director/subjects
/director/schedules
/director/attendance
/director/reports
/director/statistics
/director/claims
/director/justifications
/director/emergencies
```

## Profesor

```text
/teacher/dashboard
/teacher/schedule
/teacher/groups
/teacher/attendance
/teacher/claims
/teacher/justifications
/teacher/statistics
/teacher/notifications
/teacher/emergencies
```

## Profesor tutor

```text
/tutor/dashboard
/tutor/students
/tutor/groups
/tutor/attendance
/tutor/claims
/tutor/justifications
/tutor/alerts
/tutor/statistics
/tutor/notifications
/tutor/emergencies
```

## Alumno

```text
/student/dashboard
/student/profile
/student/schedule
/student/subjects
/student/attendance
/student/claims
/student/justifications
/student/notifications
/student/emergencies
```

---

# 23. Guards

La aplicación deberá contar con guards para:

* Usuarios autenticados.
* Usuarios invitados.
* Roles.
* Permisos.
* Cambios pendientes en formularios.

Ejemplo:

```typescript
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as UserRole[];
  const currentUser = authService.currentUser();

  if (!currentUser) {
    return router.createUrlTree(['/auth/login']);
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return router.createUrlTree(['/forbidden']);
  }

  return true;
};
```

Uso:

```typescript
{
  path: 'students',
  canActivate: [roleGuard],
  data: {
    roles: [
      UserRole.ADMIN,
      UserRole.CAREER_DIRECTOR,
      UserRole.TUTOR_TEACHER,
    ],
  },
  loadChildren: () =>
    import('../../features/students/students.routes')
      .then((routes) => routes.STUDENT_ROUTES),
}
```

Los guards mejoran la navegación, pero la API siempre deberá validar nuevamente los permisos.

---

# 24. Directivas de autorización

Se deberán utilizar directivas para ocultar acciones no permitidas.

Ejemplo:

```html
<button
  *appHasPermission="'students.create'"
  class="btn-checkmate-primary"
>
  <i class="fa-solid fa-plus"></i>
  Crear alumno
</button>
```

Ejemplo por rol:

```html
<section *appHasRole="[UserRole.ADMIN, UserRole.CAREER_DIRECTOR]">
  Contenido administrativo
</section>
```

No se deberán repetir condicionales extensos en las plantillas.

Ejemplo que debe evitarse:

```html
@if (
  user.role === 'ADMIN' ||
  user.role === 'CAREER_DIRECTOR' ||
  user.role === 'TUTOR_TEACHER'
) {
  ...
}
```

---

# 25. Servicios de API

Cada módulo deberá tener su propio servicio de acceso a datos.

Ejemplo:

```typescript
@Injectable({
  providedIn: 'root',
})
export class StudentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/students`;

  getAll(filters: StudentFilters): Observable<PaginatedResponse<StudentListItem>> {
    return this.http.get<PaginatedResponse<StudentListItem>>(
      this.apiUrl,
      { params: buildHttpParams(filters) },
    );
  }

  getById(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateStudentRequest): Observable<Student> {
    return this.http.post<Student>(this.apiUrl, data);
  }

  update(id: number, data: UpdateStudentRequest): Observable<Student> {
    return this.http.put<Student>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

No deberán ejecutarse peticiones HTTP directamente desde componentes visuales.

---

# 26. Modelos y respuestas

Las respuestas deberán tiparse.

Ejemplo:

```typescript
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
```

```typescript
export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}
```

```typescript
export interface ApiValidationError {
  message: string;
  errors: Record<string, string[]>;
}
```

No deberá utilizarse:

```typescript
Observable<any>
```

cuando sea posible definir el tipo correcto.

---

# 27. Manejo de estado

El estado deberá mantenerse lo más cerca posible de la funcionalidad que lo utiliza.

Se podrá utilizar:

* Signals.
* Servicios de estado.
* Facades.
* Stores específicos del módulo.

No deberá crearse un estado global para toda la aplicación sin necesidad.

Estado global recomendado:

* Usuario autenticado.
* Sesión.
* Permisos.
* Configuración general.
* Estado global de carga.
* Notificaciones principales.

Estado local recomendado:

* Filtros de una tabla.
* Página actual.
* Información de un formulario.
* Selección temporal.
* Datos de una pantalla.
* Modal abierto o cerrado.

## Regla obligatoria: la app usa `provideZonelessChangeDetection()`

`app.config.ts` habilita change detection **zoneless** (sin Zone.js). Esto significa que
mutar un campo de clase normal dentro de un `.subscribe()` **no vuelve a renderizar la
pantalla** — Angular no se entera del cambio hasta que ocurre un evento que sí dispara
detección (un click, por ejemplo). Por eso una pantalla puede quedarse "cargando" hasta
que el usuario toca algo.

Todo estado que se lea en la plantilla y se escriba dentro de una suscripción, un
`effect()` o un callback async **debe** ser un `signal()`:

```typescript
protected readonly loading = signal(true);
protected readonly students = signal<StudentListItem[]>([]);

constructor() {
  this.studentApi
    .getStudents()
    .pipe(finalize(() => this.loading.set(false)))
    .subscribe((students) => this.students.set(students));
}
```

No debe escribirse `this.students = students;` sobre un campo plano — eso es lo que
produce el bug de "solo carga al hacer clic en algo".

---

# 28. Manejo de formularios

Los formularios deberán desarrollarse con formularios reactivos.

Cada formulario deberá:

* Definir tipos.
* Mostrar errores debajo de los campos.
* Marcar campos obligatorios.
* Deshabilitar el envío durante la petición.
* Prevenir envíos duplicados.
* Mostrar errores de la API.
* Conservar la información cuando ocurra un error.
* Solicitar confirmación al abandonar cambios importantes.
* Separar formularios complejos en componentes.

Ejemplo:

```typescript
readonly form = this.formBuilder.nonNullable.group({
  name: ['', [
    Validators.required,
    Validators.maxLength(150),
  ]],
  enrollment: ['', [
    Validators.required,
    Validators.maxLength(30),
  ]],
  email: ['', [
    Validators.required,
    Validators.email,
  ]],
  groupId: this.formBuilder.control<number | null>(null, {
    validators: [Validators.required],
  }),
});
```

---

# 29. Manejo de errores

La aplicación deberá manejar:

* Error 400: solicitud inválida.
* Error 401: sesión no válida.
* Error 403: acceso denegado.
* Error 404: recurso no encontrado.
* Error 409: conflicto.
* Error 422: errores de validación.
* Error 429: demasiadas solicitudes.
* Error 500: error interno.
* Error de conexión.
* Tiempo de espera agotado.

El interceptor global deberá manejar errores generales.

Los errores específicos de un formulario deberán mostrarse dentro de su componente.

Ejemplos de mensajes:

```text
No se pudo guardar la información.
```

```text
Tu sesión ha expirado. Inicia sesión nuevamente.
```

```text
No tienes permiso para realizar esta acción.
```

```text
No fue posible conectar con el servidor.
```

## Mensajes reales de la API

CheckMate-API responde errores con un mensaje en español ya listo para el usuario final
(`{message, error_code, errors}`, ver `API_REFERENCE.md` sección 2). Los mensajes
genéricos de arriba son solo el **fallback**, no el mensaje por defecto que debe
mostrarse siempre.

Al mostrar un error de una petición HTTP:

* Debe usarse `apiErrorMessage(error, textoDeRespaldo)` (`shared/utils/api-error.util.ts`)
  para tomar el mensaje real de `error.error.message`, y caer al texto genérico solo si
  la API no mandó uno.
* Si la petición puede devolver **422** con errores por campo, debe usarse
  `apiFieldErrors(error)` para leer el diccionario `{campo: [mensajes]}`, y
  `applyServerErrors(form, fieldErrors)` (`shared/utils/form.utils.ts`) para marcarlos
  directamente en el formulario, no solo en un toast general.
* No deberán hardcodearse mensajes de error específicos de negocio (ej. "ya existe un
  justificante para esta falta") cuando la API ya los manda — repetirlos a mano los deja
  desactualizados en cuanto cambie la regla del lado del backend.

Ejemplo:

```typescript
.subscribe({
  error: (error: HttpErrorResponse) => {
    const fieldErrors = apiFieldErrors(error);

    if (fieldErrors) {
      applyServerErrors(this.form, fieldErrors);
    }

    this.toastService.error(
      'No se pudo guardar',
      apiErrorMessage(error, 'No se pudo completar la accion. Intenta nuevamente.'),
    );
  },
});
```

---

# 30. Estados obligatorios de cada página

Toda página que consulte datos deberá considerar:

```text
Loading
Success
Empty
Error
Forbidden
```

Ejemplo:

```html
@if (loading()) {
  <app-table-skeleton />
} @else if (error()) {
  <app-error-state
    title="No se pudieron cargar los alumnos"
    description="Intenta nuevamente."
    (retry)="loadStudents()"
  />
} @else if (students().length === 0) {
  <app-empty-state
    icon="fa-solid fa-user-graduate"
    title="No hay alumnos registrados"
    description="Agrega el primer alumno para comenzar."
  />
} @else {
  <app-student-table [students]="students()" />
}
```

---

# 31. Componentes pequeños y responsabilidad única

Los componentes deberán tener una responsabilidad clara.

Ejemplo incorrecto:

```text
attendance.component.ts
```

con:

* Filtros.
* Tabla.
* Modal.
* Formulario.
* Estadísticas.
* Paginación.
* Consulta HTTP.
* Exportación.
* Validaciones.
* Notificaciones.

Ejemplo correcto:

```text
AttendanceListPage
├── AttendanceSummary
├── AttendanceFilters
├── AttendanceTable
├── AttendancePagination
├── AttendanceEditDialog
└── AttendanceExportButton
```

---

# 32. Convención de nombres

## Componentes

```text
student-list.component.ts
student-form.component.ts
attendance-table.component.ts
```

## Servicios

```text
student-api.service.ts
attendance-api.service.ts
notification.service.ts
```

## Guards

```text
auth.guard.ts
role.guard.ts
permission.guard.ts
```

## Modelos

```text
student.model.ts
attendance.model.ts
api-response.model.ts
```

## Enums

```text
user-role.enum.ts
attendance-status.enum.ts
claim-status.enum.ts
```

## Rutas

```text
students.routes.ts
attendance.routes.ts
admin.routes.ts
```

Los nombres deberán estar en inglés dentro del código.

Los textos visibles deberán estar en español.

---

# 33. Estilos

Los estilos globales deberán dividirse de forma organizada.

```text
src/styles/
├── abstracts/
│   ├── variables.scss
│   ├── mixins.scss
│   └── functions.scss
│
├── base/
│   ├── reset.scss
│   ├── typography.scss
│   └── accessibility.scss
│
├── components/
│   ├── buttons.scss
│   ├── cards.scss
│   ├── forms.scss
│   ├── tables.scss
│   ├── badges.scss
│   ├── modals.scss
│   └── alerts.scss
│
├── layout/
│   ├── sidebar.scss
│   ├── topbar.scss
│   ├── page.scss
│   └── responsive.scss
│
├── utilities/
│   ├── spacing.scss
│   ├── display.scss
│   └── text.scss
│
└── themes/
    └── checkmate-theme.scss
```

No se deberán repetir los mismos estilos en diferentes componentes.

Los componentes podrán tener estilos propios para aspectos específicos, pero deberán utilizar las variables globales del branding.

---

# 34. Navegación

El menú deberá generarse según:

* Rol.
* Permisos.
* Módulos disponibles.
* Contexto del usuario.

Ejemplo:

```typescript
export interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
  permission?: string;
  children?: NavigationItem[];
}
```

Ejemplo de menú:

```typescript
export const ADMIN_MENU: NavigationItem[] = [
  {
    label: 'Dashboard',
    icon: 'fa-solid fa-house',
    route: '/admin/dashboard',
  },
  {
    label: 'Alumnos',
    icon: 'fa-solid fa-user-graduate',
    route: '/admin/students',
    permission: 'students.view',
  },
  {
    label: 'Asistencias',
    icon: 'fa-solid fa-calendar-check',
    route: '/admin/attendance',
    permission: 'attendance.view',
  },
];
```

No se deberán escribir manualmente cinco sidebars completos cuando solamente cambia la configuración del menú.

---

# 35. Responsividad

Todas las pantallas deberán funcionar en:

* Escritorio.
* Laptop.
* Tablet.
* Móvil.

Reglas:

* El sidebar deberá colapsarse en pantallas pequeñas.
* Las tablas deberán permitir scroll horizontal o convertirse en tarjetas.
* Los formularios deberán pasar de varias columnas a una columna.
* Los botones deberán conservar un área táctil adecuada.
* Los modales deberán adaptarse al ancho de la pantalla.
* Los filtros deberán poder contraerse.
* Los títulos y acciones deberán reorganizarse.
* No deberán utilizarse anchos fijos innecesarios.

---

# 36. Seguridad en frontend

El frontend deberá:

* No guardar contraseñas.
* No mostrar información sensible innecesaria.
* No depender únicamente del ocultamiento visual.
* Limpiar información de sesión al cerrar sesión.
* Manejar expiración de sesión.
* Evitar renderizar HTML no confiable.
* Validar archivos antes de enviarlos.
* Limitar tipo y tamaño de archivos.
* No incluir secretos en `environment.ts`.
* No incluir claves privadas.
* No incluir credenciales en el repositorio.
* No registrar tokens en consola.
* No registrar información personal sensible en consola.

La autorización definitiva siempre deberá realizarse en el backend.

---

# 37. Pruebas

La estructura de pruebas deberá reflejar los módulos.

```text
src/app/features/students/
├── pages/
│   └── student-list/
│       └── student-list.component.spec.ts
│
├── forms/
│   └── student-form/
│       └── student-form.component.spec.ts
│
└── data-access/
    └── student-api.service.spec.ts
```

Se deberán probar principalmente:

* Formularios.
* Validaciones.
* Guards.
* Directivas de permisos.
* Servicios HTTP.
* Estados vacíos.
* Estados de error.
* Cambios de rol.
* Navegación.
* Acciones importantes.

---

# 38. Reglas para Codex

Al modificar el frontend Angular de CheckMate, Codex deberá:

1. Leer `BRANDING.md`.
2. Leer `FRONTEND_STRUCTURE_AND_CONTEXT.md`.
3. Revisar la estructura existente antes de crear carpetas.
4. Mantener la arquitectura por módulos.
5. Mantener la separación por roles.
6. No duplicar funcionalidades entre roles.
7. Reutilizar componentes compartidos.
8. Utilizar componentes pequeños.
9. Separar formularios complejos.
10. Utilizar formularios reactivos.
11. Tipar modelos y respuestas.
12. Evitar el uso de `any`.
13. Centralizar peticiones HTTP en servicios.
14. Utilizar guards para las rutas.
15. Utilizar directivas para permisos visuales.
16. Mantener los dashboards separados por rol.
17. Mantener los módulos funcionales compartidos.
18. Implementar carga, error y estado vacío.
19. Aplicar confirmación en acciones destructivas.
20. Aplicar diseño responsivo.
21. Mantener el branding Cupertino / Apple-like.
22. Utilizar Inter.
23. Utilizar Font Awesome.
24. No inventar nuevos colores.
25. No modificar endpoints sin autorización.
26. No cambiar contratos de API.
27. No agregar dependencias sin revisar las existentes.
28. No colocar lógica de negocio crítica en componentes.
29. No realizar peticiones HTTP directamente desde componentes.
30. No crear archivos genéricos sin responsabilidad clara.
31. No dejar código comentado innecesario.
32. No dejar `console.log` en producción.
33. No incluir datos simulados en producción.
34. No crear componentes gigantes.
35. No mezclar idiomas en nombres de código.
36. Mantener textos visibles en español.
37. Mantener nombres técnicos en inglés.
38. Respetar las reglas del backend.
39. Mantener accesibilidad básica.
40. Crear código legible y mantenible.

---

# 39. Criterios de aceptación de un módulo

Un módulo se considerará correctamente implementado cuando:

* Se encuentre dentro de `features`.
* Tenga rutas propias.
* Tenga páginas separadas.
* Tenga componentes pequeños.
* Tenga formularios separados cuando sean complejos.
* Tenga modelos tipados.
* Tenga servicio de API.
* Maneje carga.
* Maneje errores.
* Maneje estados vacíos.
* Respete los permisos.
* Sea responsivo.
* Respete `BRANDING.md`.
* No duplique componentes existentes.
* No contenga peticiones HTTP dentro de componentes visuales.
* No utilice `any` innecesariamente.
* No muestre acciones no autorizadas.
* Tenga nombres claros.
* Mantenga una responsabilidad definida.

---

# 40. Regla final de estructura

Cuando exista duda sobre dónde colocar un archivo, se deberá evaluar:

1. ¿Es global para toda la aplicación?

```text
core/
```

2. ¿Es visual y reutilizable en distintos módulos?

```text
shared/
```

3. ¿Define la estructura principal de una pantalla?

```text
layouts/
```

4. ¿Es exclusivo de un rol?

```text
roles/
```

5. ¿Pertenece a una funcionalidad del sistema?

```text
features/
```

6. ¿Es una página asociada con una ruta?

```text
feature/pages/
```

7. ¿Es un componente interno de un módulo?

```text
feature/components/
```

8. ¿Es un formulario?

```text
feature/forms/
```

9. ¿Consume la API o administra datos?

```text
feature/data-access/
```

10. ¿Define la forma de la información?

```text
feature/models/
```

La estructura deberá favorecer siempre:

* Claridad.
* Reutilización.
* Escalabilidad.
* Separación de responsabilidades.
* Seguridad.
* Mantenimiento.
* Consistencia.
* Facilidad para localizar archivos.

La aplicación debe poder crecer sin convertirse en un conjunto de componentes desorganizados o duplicados.
