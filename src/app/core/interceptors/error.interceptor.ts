import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/feedback/services/toast.service';
import { SessionService } from '../authentication/session.service';
import { buildGovernanceLoginUrl } from '../authentication/auth-redirect-url.util';
import { apiErrorMessage } from '../../shared/utils/api-error.util';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const toastService = inject(ToastService);
  const sessionService = inject(SessionService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && error.error?.error_code === 'AUTH05') {
        sessionService.clear();
        toastService.error('Sesion expirada', 'Inicia sesion nuevamente.');

        const loginUrl = buildGovernanceLoginUrl();
        console.info('[CheckMate] Sesion expirada (AUTH05), redirigiendo a gobernanza:', loginUrl);
        window.location.assign(loginUrl);
      } else if (error.status === 401) {
        toastService.error('Sesion expirada', 'Inicia sesion nuevamente.');
      } else if (error.status === 403) {
        toastService.error(
          'Acceso denegado',
          apiErrorMessage(error, 'No tienes permiso para realizar esta accion.'),
        );
      } else if (error.status >= 500 || error.status === 0) {
        toastService.error('Error de conexion', 'No fue posible conectar con el servidor.');
      }

      return throwError(() => error);
    }),
  );
};
