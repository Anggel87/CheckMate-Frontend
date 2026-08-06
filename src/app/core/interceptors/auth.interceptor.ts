import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SessionService } from '../authentication/session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const sessionService = inject(SessionService);
  const token = sessionService.authToken();

  if (!token || !environment.checkmateApiUrl || !request.url.startsWith(environment.checkmateApiUrl)) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `${sessionService.tokenType() ?? 'Bearer'} ${token}`,
      },
    }),
  );
};
