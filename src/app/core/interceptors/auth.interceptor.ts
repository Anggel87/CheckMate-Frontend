import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { SessionService } from '../authentication/session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(SessionService).authToken();

  if (!token) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
