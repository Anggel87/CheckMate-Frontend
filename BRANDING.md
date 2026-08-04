# Checkmate — Guía de identidad visual y desarrollo de interfaces

Este documento define las reglas visuales, de experiencia de usuario y de implementación frontend para el sistema **Checkmate**.

Todo código generado para este proyecto debe respetar esta guía. Antes de crear o modificar una vista, componente, formulario, tabla, modal, dashboard o reporte, se deben revisar estas especificaciones.

---

## 1. Descripción de la marca

**Checkmate** es una plataforma académica para el control y seguimiento de asistencias.

La interfaz debe transmitir:

* Orden
* Seguridad
* Control
* Puntualidad
* Tecnología
* Confianza académica

El estilo general debe ser **Cupertino / Apple-like**, con una apariencia limpia, moderna, minimalista y profesional.

No se deben utilizar diseños excesivamente coloridos, bordes agresivos, sombras oscuras, degradados llamativos ni componentes visualmente saturados.

---

## 2. Principios generales de diseño

Todas las interfaces deben seguir estos principios:

1. Utilizar espacios en blanco de manera generosa.
2. Mantener una jerarquía visual clara.
3. Evitar mostrar demasiada información al mismo tiempo.
4. Utilizar bordes redondeados y sombras suaves.
5. Priorizar fondos blancos, negros y grises claros.
6. Utilizar colores intensos únicamente para acciones, estados y alertas.
7. Mantener consistencia entre dashboards, formularios, tablas y reportes.
8. Diseñar primero para una lectura clara y después para la decoración.
9. Evitar elementos visuales innecesarios.
10. Mantener todas las vistas responsivas.

---

## 3. Tecnologías visuales

El frontend del proyecto debe utilizar:

* **Inter** como tipografía principal.
* **Font Awesome** para los iconos.
* CSS propio, Bootstrap o el framework definido en el proyecto.
* SweetAlert2 para confirmaciones y errores importantes, cuando esté disponible.
* Toasts para notificaciones de éxito, información y advertencia.

No se deben mezclar diferentes librerías de iconos dentro de una misma interfaz.

---

## 4. Tipografía

La tipografía oficial de Checkmate es **Inter**.

```css
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Importación recomendada:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
```

### Escala tipográfica web

| Elemento             | Tamaño | Peso |
| -------------------- | -----: | ---: |
| Título principal     |   32px |  700 |
| Título de sección    |   24px |  700 |
| Subtítulo            |   20px |  600 |
| Título de tarjeta    |   18px |  600 |
| Texto normal         |   16px |  400 |
| Texto secundario     |   14px |  400 |
| Texto pequeño        |   12px |  400 |
| Botones              |   15px |  600 |
| Inputs y formularios |   15px |  400 |
| Labels               |   14px |  500 |
| Encabezado de tabla  |   14px |  600 |
| Contenido de tabla   |   14px |  400 |
| Badges y estados     |   12px |  600 |
| Navbar y menú web    |   15px |  500 |

### Escala tipográfica para aplicación iOS

| Elemento             |    Tamaño | Peso |
| -------------------- | --------: | ---: |
| Título principal     |      28px |  700 |
| Título de sección    |      22px |  700 |
| Subtítulo            |      20px |  600 |
| Título de tarjeta    |      17px |  600 |
| Texto normal         |      16px |  400 |
| Texto secundario     |      14px |  400 |
| Texto pequeño        |      12px |  400 |
| Botones              |      16px |  600 |
| Inputs y formularios |      16px |  400 |
| Labels               |      14px |  500 |
| Encabezado de lista  |      14px |  600 |
| Contenido de lista   |      14px |  400 |
| Badges y estados     |      12px |  600 |
| Tab bar iOS          | 11px–12px |  500 |

---

## 5. Paleta de colores

### Colores principales

| Variable         | Color     | Uso                                              |
| ---------------- | --------- | ------------------------------------------------ |
| Fondo general    | `#F5F5F7` | Fondo de páginas, login, dashboards y módulos    |
| Blanco           | `#FFFFFF` | Tarjetas, formularios, tablas, modales y paneles |
| Negro principal  | `#000000` | Botones principales y acciones prioritarias      |
| Negro suave      | `#1D1D1F` | Títulos, encabezados y texto principal           |
| Gris medio       | `#6E6E73` | Texto secundario, fechas y descripciones         |
| Gris borde       | `#D2D2D7` | Bordes, divisores y separación visual            |
| Gris claro       | `#F2F2F2` | Botones secundarios y fondos suaves              |
| Gris hover       | `#E8E8ED` | Estados hover y elementos seleccionables         |
| Verde asistencia | `#34C759` | Presente, éxito y confirmaciones positivas       |
| Naranja retardo  | `#FF9500` | Retardos, advertencias y pendientes              |
| Rojo falta       | `#FF3B30` | Faltas, errores y acciones peligrosas            |
| Azul información | `#007AFF` | Información, enlaces, reportes y justificaciones |

### Variables CSS recomendadas

Estas variables deben definirse preferentemente en:

```text
resources/css/app.css
```

```css
:root {
    --checkmate-background: #F5F5F7;
    --checkmate-surface: #FFFFFF;

    --checkmate-black: #000000;
    --checkmate-text-primary: #1D1D1F;
    --checkmate-text-secondary: #6E6E73;

    --checkmate-border: #D2D2D7;
    --checkmate-secondary: #F2F2F2;
    --checkmate-hover: #E8E8ED;

    --checkmate-success: #34C759;
    --checkmate-warning: #FF9500;
    --checkmate-danger: #FF3B30;
    --checkmate-info: #007AFF;

    --checkmate-success-soft: rgba(52, 199, 89, 0.12);
    --checkmate-warning-soft: rgba(255, 149, 0, 0.14);
    --checkmate-danger-soft: rgba(255, 59, 48, 0.12);
    --checkmate-info-soft: rgba(0, 122, 255, 0.12);
    --checkmate-neutral-soft: rgba(110, 110, 115, 0.12);

    --checkmate-radius-sm: 8px;
    --checkmate-radius-md: 12px;
    --checkmate-radius-lg: 18px;
    --checkmate-radius-xl: 24px;

    --checkmate-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
    --checkmate-shadow-md: 0 8px 24px rgba(0, 0, 0, 0.07);
    --checkmate-shadow-modal: 0 20px 50px rgba(0, 0, 0, 0.12);

    --checkmate-transition: 180ms ease;
}
```

---

## 6. Fondo y estructura general

El fondo base del sistema debe utilizar:

```css
body {
    margin: 0;
    background-color: var(--checkmate-background);
    color: var(--checkmate-text-primary);
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
}
```

Las vistas principales deben dividirse en:

* Sidebar o navbar.
* Encabezado de página.
* Área de contenido.
* Tarjetas de estadísticas.
* Tablas, listas o formularios.
* Acciones principales claramente identificadas.

El contenido principal debe tener un ancho legible y espacios internos uniformes.

```css
.page-content {
    padding: 32px;
}

@media (max-width: 768px) {
    .page-content {
        padding: 20px 16px;
    }
}
```

---

## 7. Tarjetas y contenedores

Las tarjetas deben utilizar fondo blanco, borde ligero, esquinas redondeadas y sombra suave.

```css
.checkmate-card {
    background-color: var(--checkmate-surface);
    border: 1px solid rgba(210, 210, 215, 0.7);
    border-radius: var(--checkmate-radius-lg);
    box-shadow: var(--checkmate-shadow-sm);
    padding: 24px;
}
```

Reglas:

* No utilizar bordes negros gruesos.
* No utilizar sombras excesivas.
* No saturar las tarjetas con demasiados elementos.
* Mantener una separación mínima de `16px` entre componentes internos.
* Las tarjetas interactivas pueden cambiar suavemente de fondo o sombra al pasar el cursor.

```css
.checkmate-card--interactive {
    transition:
        transform var(--checkmate-transition),
        box-shadow var(--checkmate-transition);
}

.checkmate-card--interactive:hover {
    transform: translateY(-2px);
    box-shadow: var(--checkmate-shadow-md);
}
```

---

## 8. Botones

Todos los botones deben incluir:

* Texto claro.
* Estado hover.
* Estado focus.
* Estado disabled.
* Icono únicamente cuando ayude a comprender la acción.
* Área de interacción suficientemente grande.

### Botón principal

Uso:

* Iniciar sesión
* Guardar cambios
* Registrar asistencia
* Crear alumno
* Confirmar

```css
.btn-checkmate-primary {
    background-color: #000000;
    color: #FFFFFF;
    border: 1px solid #000000;
}
```

### Botón secundario

Uso:

* Cancelar
* Regresar
* Limpiar filtros
* Cambiar vista
* Ver detalles secundarios

```css
.btn-checkmate-secondary {
    background-color: #F2F2F2;
    color: #1D1D1F;
    border: 1px solid #F2F2F2;
}
```

### Botón de éxito

```css
.btn-checkmate-success {
    background-color: #34C759;
    color: #FFFFFF;
    border-color: #34C759;
}
```

Uso:

* Marcar presente
* Confirmar asistencia
* Aprobar una solicitud

### Botón de advertencia

```css
.btn-checkmate-warning {
    background-color: #FF9500;
    color: #FFFFFF;
    border-color: #FF9500;
}
```

Uso:

* Marcar retardo
* Mostrar advertencias
* Revisar estados pendientes

### Botón de peligro

```css
.btn-checkmate-danger {
    background-color: #FF3B30;
    color: #FFFFFF;
    border-color: #FF3B30;
}
```

Uso:

* Marcar falta
* Eliminar
* Cancelar asistencia
* Rechazar una solicitud

### Botón informativo

```css
.btn-checkmate-info {
    background-color: #007AFF;
    color: #FFFFFF;
    border-color: #007AFF;
}
```

Uso:

* Ver reporte
* Consultar justificación
* Mostrar información adicional

### Estilo base recomendado

```css
.btn-checkmate {
    min-height: 42px;
    padding: 10px 18px;
    border-radius: 10px;
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition:
        background-color var(--checkmate-transition),
        border-color var(--checkmate-transition),
        opacity var(--checkmate-transition),
        transform var(--checkmate-transition);
}

.btn-checkmate:hover {
    transform: translateY(-1px);
}

.btn-checkmate:active {
    transform: translateY(0);
}

.btn-checkmate:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}
```

No se deben crear botones de colores diferentes sin una justificación funcional.

---

## 9. Formularios e inputs

Los formularios deben ser claros, ordenados y mostrar las validaciones cerca del campo correspondiente.

```css
.checkmate-label {
    display: block;
    margin-bottom: 8px;
    color: var(--checkmate-text-primary);
    font-size: 14px;
    font-weight: 500;
}

.checkmate-input,
.checkmate-select,
.checkmate-textarea {
    width: 100%;
    min-height: 44px;
    padding: 10px 14px;
    background-color: #FFFFFF;
    color: #1D1D1F;
    border: 1px solid #D2D2D7;
    border-radius: 10px;
    font-family: inherit;
    font-size: 15px;
    outline: none;
    transition:
        border-color var(--checkmate-transition),
        box-shadow var(--checkmate-transition);
}

.checkmate-input:focus,
.checkmate-select:focus,
.checkmate-textarea:focus {
    border-color: #007AFF;
    box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.12);
}
```

### Validaciones

```css
.checkmate-input.is-invalid {
    border-color: #FF3B30;
    box-shadow: 0 0 0 4px rgba(255, 59, 48, 0.08);
}

.checkmate-field-error {
    margin-top: 6px;
    color: #FF3B30;
    font-size: 12px;
    font-weight: 400;
}
```

Ejemplo:

```html
<label class="checkmate-label" for="student_name">
    Nombre del alumno
</label>

<input
    id="student_name"
    name="student_name"
    type="text"
    class="checkmate-input"
    autocomplete="name"
>

<p class="checkmate-field-error">
    El nombre del alumno es obligatorio.
</p>
```

No se deben mostrar errores únicamente por color. El mensaje debe incluir texto descriptivo.

---

## 10. Estados de asistencia

Los estados de asistencia deben mantener siempre los mismos colores e iconos.

| Estado      | Color   | Código    | Icono                  |
| ----------- | ------- | --------- | ---------------------- |
| Presente    | Verde   | `#34C759` | `fa-check`             |
| Retardo     | Naranja | `#FF9500` | `fa-clock`             |
| Falta       | Rojo    | `#FF3B30` | `fa-xmark`             |
| Justificado | Azul    | `#007AFF` | `fa-file-circle-check` |
| Pendiente   | Gris    | `#6E6E73` | `fa-clock`             |

### Badges recomendados

```css
.attendance-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
}

.attendance-badge--present {
    color: #1F8F45;
    background-color: rgba(52, 199, 89, 0.12);
}

.attendance-badge--late {
    color: #B86600;
    background-color: rgba(255, 149, 0, 0.14);
}

.attendance-badge--absent {
    color: #C92A22;
    background-color: rgba(255, 59, 48, 0.12);
}

.attendance-badge--justified {
    color: #0066CC;
    background-color: rgba(0, 122, 255, 0.12);
}

.attendance-badge--pending {
    color: #1D1D1F;
    background-color: rgba(110, 110, 115, 0.12);
}
```

No se debe utilizar verde para faltas, rojo para presente ni intercambiar los colores establecidos.

---

## 11. Tablas y listas

Las tablas deben ser limpias, fáciles de leer y responsivas.

Reglas:

* Encabezados con peso `600`.
* Contenido con peso `400`.
* Separadores suaves.
* Acciones alineadas a la derecha.
* Estados mostrados mediante badges.
* Hover discreto sobre las filas.
* En dispositivos pequeños, permitir scroll horizontal o transformar la tabla en tarjetas.

```css
.checkmate-table-wrapper {
    overflow-x: auto;
    background-color: #FFFFFF;
    border: 1px solid #D2D2D7;
    border-radius: 16px;
}

.checkmate-table {
    width: 100%;
    border-collapse: collapse;
}

.checkmate-table th {
    padding: 14px 16px;
    color: #6E6E73;
    font-size: 14px;
    font-weight: 600;
    text-align: left;
    background-color: rgba(245, 245, 247, 0.8);
}

.checkmate-table td {
    padding: 14px 16px;
    color: #1D1D1F;
    font-size: 14px;
    font-weight: 400;
    border-top: 1px solid rgba(210, 210, 215, 0.65);
}

.checkmate-table tbody tr:hover {
    background-color: #F5F5F7;
}
```

Cuando una tabla no tenga registros, se debe mostrar un estado vacío claro.

Ejemplo:

```text
No se encontraron alumnos con los filtros seleccionados.
```

---

## 12. Iconografía

La librería oficial es **Font Awesome**.

### Navegación

| Sección       | Icono                         |
| ------------- | ----------------------------- |
| Dashboard     | `fa-solid fa-house`           |
| Alumnos       | `fa-solid fa-user-graduate`   |
| Docentes      | `fa-solid fa-chalkboard-user` |
| Grupos        | `fa-solid fa-users`           |
| Asistencias   | `fa-solid fa-calendar-check`  |
| Reportes      | `fa-solid fa-chart-simple`    |
| Configuración | `fa-solid fa-gear`            |
| Menú          | `fa-solid fa-bars`            |
| Seguridad     | `fa-solid fa-lock`            |

### Asistencia

| Acción              | Icono                           |
| ------------------- | ------------------------------- |
| Presente            | `fa-solid fa-check`             |
| Falta               | `fa-solid fa-xmark`             |
| Retardo             | `fa-solid fa-clock`             |
| Justificado         | `fa-solid fa-file-circle-check` |
| Lista tomada        | `fa-solid fa-clipboard-check`   |
| Fecha de asistencia | `fa-solid fa-calendar-days`     |

### Acciones generales

| Acción       | Icono                          |
| ------------ | ------------------------------ |
| Agregar      | `fa-solid fa-plus`             |
| Editar       | `fa-solid fa-pen`              |
| Eliminar     | `fa-solid fa-trash`            |
| Ver detalles | `fa-solid fa-eye`              |
| Buscar       | `fa-solid fa-magnifying-glass` |
| Filtrar      | `fa-solid fa-filter`           |
| Descargar    | `fa-solid fa-download`         |
| Exportar     | `fa-solid fa-file-export`      |
| Guardar      | `fa-solid fa-floppy-disk`      |

Ejemplo:

```html
<button type="button" class="btn-checkmate btn-checkmate-primary">
    <i class="fa-solid fa-plus" aria-hidden="true"></i>
    Crear alumno
</button>
```

Los botones que solo tengan icono deben incluir una etiqueta accesible:

```html
<button
    type="button"
    class="icon-button"
    aria-label="Editar alumno"
    title="Editar alumno"
>
    <i class="fa-solid fa-pen" aria-hidden="true"></i>
</button>
```

---

## 13. Alertas y notificaciones

### Confirmaciones importantes

Se deben utilizar cuando el usuario realizará una acción delicada o irreversible.

Ejemplo:

```text
¿Estás seguro de eliminar este alumno?
```

El modal debe tener:

* Fondo blanco.
* Título claro.
* Texto explicativo.
* Botón de cancelar.
* Botón de confirmación.
* Icono relacionado con la acción.
* Sombra suave.
* Esquinas redondeadas.

### Doble confirmación

Utilizar para:

* Eliminar registros importantes.
* Cerrar periodos.
* Finalizar una lista de asistencia.
* Eliminar información académica.
* Ejecutar acciones que no pueden deshacerse.

Ejemplo:

```text
Esta acción no se puede deshacer. Escribe ELIMINAR para continuar.
```

### Notificación de éxito

Mostrar como toast en la esquina superior derecha.

Ejemplos:

```text
Alumno creado correctamente.
```

```text
Asistencia registrada correctamente.
```

```text
Los cambios fueron guardados.
```

### Notificación informativa

Ejemplo:

```text
La lista de asistencia fue actualizada.
```

### Notificación de advertencia

Ejemplo:

```text
Hay alumnos pendientes de asistencia.
```

### Error general

Ejemplo:

```text
No se pudo guardar la información. Intenta nuevamente.
```

### Validación de formulario

Ejemplo:

```text
El nombre del alumno es obligatorio.
```

---

## 14. Colores de alertas

| Tipo             | Color principal | Fondo suave                 | Texto     |
| ---------------- | --------------- | --------------------------- | --------- |
| Éxito            | `#34C759`       | `rgba(52, 199, 89, 0.12)`   | `#1F8F45` |
| Información      | `#007AFF`       | `rgba(0, 122, 255, 0.12)`   | `#0066CC` |
| Advertencia      | `#FF9500`       | `rgba(255, 149, 0, 0.14)`   | `#B86600` |
| Error            | `#FF3B30`       | `rgba(255, 59, 48, 0.12)`   | `#C92A22` |
| Confirmación     | `#1D1D1F`       | `rgba(29, 29, 31, 0.08)`    | `#1D1D1F` |
| Acción peligrosa | `#FF3B30`       | `rgba(255, 59, 48, 0.12)`   | `#C92A22` |
| Validación       | `#FF3B30`       | `rgba(255, 59, 48, 0.08)`   | `#FF3B30` |
| Carga o proceso  | `#1D1D1F`       | `rgba(29, 29, 31, 0.06)`    | `#6E6E73` |
| Alerta neutra    | `#6E6E73`       | `rgba(110, 110, 115, 0.12)` | `#1D1D1F` |

---

## 15. Sidebar y navegación

El sidebar web debe conservar una apariencia sobria y profesional.

Diseño recomendado:

* Fondo negro o negro suave.
* Texto blanco o gris claro.
* Iconos Font Awesome.
* Elemento activo con fondo ligeramente más claro.
* Bordes redondeados en los elementos activos.
* Espaciado consistente.
* Opción para contraer el menú cuando sea necesario.

```css
.checkmate-sidebar {
    background-color: #000000;
    color: #FFFFFF;
}

.checkmate-sidebar-link {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 10px 14px;
    color: rgba(255, 255, 255, 0.72);
    border-radius: 10px;
    text-decoration: none;
    transition:
        color var(--checkmate-transition),
        background-color var(--checkmate-transition);
}

.checkmate-sidebar-link:hover {
    color: #FFFFFF;
    background-color: rgba(255, 255, 255, 0.08);
}

.checkmate-sidebar-link.is-active {
    color: #FFFFFF;
    background-color: rgba(255, 255, 255, 0.14);
}
```

La sección activa debe identificarse visualmente, pero sin utilizar colores saturados innecesarios.

---

## 16. Modales

Los modales deben:

* Estar centrados.
* Utilizar fondo blanco.
* Tener esquinas entre `16px` y `20px`.
* Utilizar sombra suave.
* Mostrar título, descripción y acciones claras.
* Cerrar con botón visible.
* Permitir cerrar con la tecla Escape cuando no sea una operación crítica.
* Bloquear cierres accidentales durante procesos importantes.

```css
.checkmate-modal {
    width: min(520px, calc(100vw - 32px));
    background-color: #FFFFFF;
    border: 1px solid rgba(210, 210, 215, 0.6);
    border-radius: 20px;
    box-shadow: var(--checkmate-shadow-modal);
    padding: 24px;
}
```

Las acciones deben mostrarse al final del modal. La acción principal debe ubicarse preferentemente a la derecha.

---

## 17. Estados de carga

Durante una petición, guardado o consulta:

* Deshabilitar el botón que inició la acción.
* Mostrar un spinner.
* Cambiar temporalmente el texto.
* Evitar solicitudes duplicadas.
* Mantener informado al usuario.

Ejemplo:

```html
<button class="btn-checkmate btn-checkmate-primary" disabled>
    <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
    Guardando...
</button>
```

No mostrar una pantalla vacía mientras se cargan datos.

Para tablas o tarjetas se pueden utilizar skeleton loaders en tonos grises suaves.

---

## 18. Estados vacíos

Cuando no existan registros, se debe mostrar:

* Icono relacionado.
* Título corto.
* Descripción clara.
* Acción opcional.

Ejemplo:

```text
Todavía no hay alumnos registrados.

Agrega el primer alumno para comenzar a gestionar las asistencias del grupo.
```

El estado vacío no debe parecer un error.

---

## 19. Diseño responsivo

Todas las vistas deben funcionar correctamente en:

* Escritorio.
* Laptop.
* Tablet.
* Dispositivo móvil.

Reglas:

1. Evitar anchos fijos innecesarios.
2. Utilizar `grid`, `flexbox` y medidas adaptables.
3. Permitir scroll horizontal en tablas extensas.
4. Convertir filas de estadísticas en columnas en pantallas pequeñas.
5. Ocultar o contraer el sidebar en dispositivos móviles.
6. Mantener botones táctiles con una altura mínima aproximada de `44px`.
7. No colocar más de dos acciones principales juntas en pantallas pequeñas.
8. Evitar textos demasiado pequeños.
9. Mantener los inputs con al menos `16px` en iOS para evitar zoom automático.

---

## 20. Accesibilidad

Todo código generado debe considerar:

* Contraste suficiente entre texto y fondo.
* Labels asociados correctamente con inputs.
* Atributos `aria-label` en botones de solo icono.
* Navegación mediante teclado.
* Estados focus visibles.
* Textos alternativos en imágenes.
* Mensajes de error descriptivos.
* No depender únicamente del color para indicar un estado.
* Uso semántico de encabezados `h1`, `h2` y `h3`.
* Uso correcto de botones y enlaces.

Un enlace debe utilizarse para navegar y un botón para ejecutar acciones.

---

## 21. Convenciones para vistas Blade

Las vistas deben mantenerse organizadas y reutilizables.

Estructura recomendada:

```text
resources/views/
├── layouts/
│   ├── app.blade.php
│   └── guest.blade.php
├── components/
│   ├── button.blade.php
│   ├── card.blade.php
│   ├── input.blade.php
│   ├── badge.blade.php
│   ├── alert.blade.php
│   ├── modal.blade.php
│   ├── empty-state.blade.php
│   └── sidebar-link.blade.php
├── dashboard/
├── students/
├── teachers/
├── groups/
├── attendance/
├── reports/
└── settings/
```

Cuando un elemento aparezca en más de una vista, debe convertirse en componente Blade.

Evitar repetir bloques completos de HTML para:

* Botones.
* Inputs.
* Tarjetas.
* Badges.
* Modales.
* Alertas.
* Paginación.
* Estados vacíos.
* Encabezados de sección.

---

## 22. Ejemplo de componente Blade para botones

```blade
@props([
    'type' => 'button',
    'variant' => 'primary',
    'icon' => null,
])

@php
    $variants = [
        'primary' => 'btn-checkmate-primary',
        'secondary' => 'btn-checkmate-secondary',
        'success' => 'btn-checkmate-success',
        'warning' => 'btn-checkmate-warning',
        'danger' => 'btn-checkmate-danger',
        'info' => 'btn-checkmate-info',
    ];

    $variantClass = $variants[$variant] ?? $variants['primary'];
@endphp

<button
    type="{{ $type }}"
    {{ $attributes->merge([
        'class' => "btn-checkmate {$variantClass}",
    ]) }}
>
    @if ($icon)
        <i class="{{ $icon }}" aria-hidden="true"></i>
    @endif

    <span>{{ $slot }}</span>
</button>
```

Uso:

```blade
<x-button
    type="submit"
    variant="primary"
    icon="fa-solid fa-floppy-disk"
>
    Guardar cambios
</x-button>
```

---

## 23. Ejemplo de componente para estado de asistencia

```blade
@props([
    'status',
])

@php
    $statuses = [
        'present' => [
            'label' => 'Presente',
            'class' => 'attendance-badge--present',
            'icon' => 'fa-solid fa-check',
        ],
        'late' => [
            'label' => 'Retardo',
            'class' => 'attendance-badge--late',
            'icon' => 'fa-solid fa-clock',
        ],
        'absent' => [
            'label' => 'Falta',
            'class' => 'attendance-badge--absent',
            'icon' => 'fa-solid fa-xmark',
        ],
        'justified' => [
            'label' => 'Justificado',
            'class' => 'attendance-badge--justified',
            'icon' => 'fa-solid fa-file-circle-check',
        ],
        'pending' => [
            'label' => 'Pendiente',
            'class' => 'attendance-badge--pending',
            'icon' => 'fa-solid fa-clock',
        ],
    ];

    $currentStatus = $statuses[$status] ?? $statuses['pending'];
@endphp

<span class="attendance-badge {{ $currentStatus['class'] }}">
    <i class="{{ $currentStatus['icon'] }}" aria-hidden="true"></i>
    {{ $currentStatus['label'] }}
</span>
```

---

## 24. Jerarquía recomendada para páginas

Cada módulo debe utilizar una estructura similar:

```text
Título de la página
Descripción o contexto
Acciones principales
Filtros o buscador
Resumen o tarjetas de estadísticas
Tabla, lista o formulario principal
Paginación
```

Ejemplo:

```blade
<section class="page-header">
    <div>
        <h1>Alumnos</h1>
        <p>Administra los alumnos registrados en el sistema.</p>
    </div>

    <x-button
        variant="primary"
        icon="fa-solid fa-plus"
    >
        Crear alumno
    </x-button>
</section>
```

No se debe colocar el botón principal lejos del título o en una zona difícil de encontrar.

---

## 25. Microcopy y mensajes

Los textos deben ser:

* Claros.
* Directos.
* Profesionales.
* Comprensibles para usuarios no técnicos.
* Consistentes.

Usar:

```text
Guardar cambios
```

En lugar de:

```text
Procesar actualización de información
```

Usar:

```text
No se pudo guardar la información.
```

En lugar de:

```text
Error interno durante la ejecución del proceso.
```

Cuando sea posible, indicar al usuario cómo resolver el problema.

Ejemplo:

```text
No se pudo registrar la asistencia. Verifica tu conexión e intenta nuevamente.
```

---

## 26. Reglas para Codex y asistentes de programación

Al generar código para Checkmate, se deben respetar las siguientes instrucciones:

1. Leer este documento antes de crear una interfaz.
2. Mantener el estilo Cupertino / Apple-like.
3. Utilizar exclusivamente la paleta definida.
4. Utilizar Inter como fuente principal.
5. Utilizar Font Awesome para iconos.
6. No inventar colores sin una necesidad funcional.
7. No utilizar degradados llamativos.
8. No utilizar sombras fuertes.
9. No utilizar bordes gruesos.
10. No sobrecargar las pantallas.
11. Mantener bordes redondeados consistentes.
12. Crear componentes reutilizables.
13. Evitar duplicación de HTML y CSS.
14. Utilizar variables CSS.
15. Crear interfaces responsivas.
16. Incluir estados hover, focus, disabled y loading.
17. Incluir validaciones visibles.
18. Incluir estados vacíos y mensajes de error.
19. Utilizar confirmación para acciones destructivas.
20. Mantener consistencia visual entre todos los roles.
21. No cambiar nombres de rutas, controladores, variables o endpoints sin una instrucción explícita.
22. No modificar la lógica de negocio únicamente para ajustar el diseño.
23. Mantener compatibilidad con Laravel y la estructura existente.
24. Priorizar componentes Blade reutilizables.
25. No agregar dependencias nuevas sin comprobar primero si el proyecto ya cuenta con una solución equivalente.

---

## 27. Criterios de aceptación visual

Una vista se considera terminada únicamente si cumple con lo siguiente:

* Utiliza Inter.
* Respeta la paleta de colores.
* Es responsiva.
* Tiene jerarquía visual.
* Incluye estados hover y focus.
* Los formularios muestran validaciones.
* Las acciones peligrosas solicitan confirmación.
* Las acciones de guardado muestran estado de carga.
* Los iconos pertenecen a Font Awesome.
* Los estados de asistencia usan los colores oficiales.
* Los componentes mantienen bordes redondeados.
* Las sombras son suaves.
* El contenido es legible.
* Los botones tienen textos claros.
* No existen elementos visualmente saturados.
* La vista mantiene consistencia con el resto del sistema.

---

## 28. Regla final

Cuando exista una duda de diseño, se debe elegir la alternativa:

* Más limpia.
* Más simple.
* Más ordenada.
* Más legible.
* Más consistente con Apple y Cupertino.
* Más fácil de utilizar para alumnos, docentes y personal académico.

La interfaz debe sentirse moderna y tecnológica, pero nunca complicada.
