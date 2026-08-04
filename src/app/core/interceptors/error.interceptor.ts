import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/feedback/services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const toastService = inject(ToastService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        toastService.error('Sesión expirada', 'Inicia sesión nuevamente.');
      } else if (error.status === 403) {
        toastService.error('Acceso denegado', 'No tienes permiso para realizar esta acción.');
      } else if (error.status >= 500 || error.status === 0) {
        toastService.error('Error de conexión', 'No fue posible conectar con el servidor.');
      }

      return throwError(() => error);
    }),
  );
};
