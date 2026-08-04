import { Routes } from '@angular/router';
import { environment } from '../../../environments/environment';

export const UI_SHOWCASE_ROUTES: Routes = environment.production
  ? []
  : [
      {
        path: '',
        loadComponent: () =>
          import('./pages/ui-showcase/ui-showcase.component').then((component) => component.UiShowcaseComponent),
      },
    ];
