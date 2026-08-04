import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

@Component({
  selector: 'app-forbidden-page',
  standalone: true,
  imports: [EmptyStateComponent, RouterLink],
  template: `
    <main class="standalone-state">
      <app-empty-state
        icon="fa-solid fa-lock"
        title="Acceso denegado"
        description="No tienes permiso para consultar esta sección."
      />
      <a class="btn-checkmate btn-checkmate-primary" routerLink="/">Volver al inicio</a>
    </main>
  `,
})
export class ForbiddenPageComponent {}

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [EmptyStateComponent, RouterLink],
  template: `
    <main class="standalone-state">
      <app-empty-state
        icon="fa-solid fa-map"
        title="Página no encontrada"
        description="La ruta solicitada no existe o fue movida."
      />
      <a class="btn-checkmate btn-checkmate-primary" routerLink="/">Volver al inicio</a>
    </main>
  `,
})
export class NotFoundPageComponent {}

@Component({
  selector: 'app-server-error-page',
  standalone: true,
  imports: [EmptyStateComponent, RouterLink],
  template: `
    <main class="standalone-state">
      <app-empty-state
        icon="fa-solid fa-server"
        title="Error del sistema"
        description="No fue posible completar la operación. Intenta nuevamente más tarde."
      />
      <a class="btn-checkmate btn-checkmate-primary" routerLink="/">Volver al inicio</a>
    </main>
  `,
})
export class ServerErrorPageComponent {}
