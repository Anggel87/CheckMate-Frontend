import { Injectable, inject } from '@angular/core';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Observable, from, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../authentication/auth.service';
import { extractCollection } from './api-adapter';

@Injectable({
  providedIn: 'root',
})
export class CheckmateApiService {
  private readonly authService = inject(AuthService);
  private readonly api: AxiosInstance = axios.create({
    baseURL: environment.checkmateApiUrl,
    timeout: 12000,
  });

  request<T>(config: AxiosRequestConfig): Observable<T> {
    return from(
      this.api.request<T>({
        ...config,
        headers: {
          ...config.headers,
          ...this.authHeaders(),
        },
      }),
    ).pipe(map((response) => response.data));
  }

  get<T>(url: string, params?: Record<string, unknown>): Observable<T> {
    return this.request<T>({ method: 'GET', url, params });
  }

  post<T>(url: string, data?: unknown): Observable<T> {
    return this.request<T>({ method: 'POST', url, data });
  }

  put<T>(url: string, data?: unknown): Observable<T> {
    return this.request<T>({ method: 'PUT', url, data });
  }

  patch<T>(url: string, data?: unknown): Observable<T> {
    return this.request<T>({ method: 'PATCH', url, data });
  }

  delete<T>(url: string, params?: Record<string, unknown>): Observable<T> {
    return this.request<T>({ method: 'DELETE', url, params });
  }

  getCollection<T>(
    url: string,
    adapter: (item: unknown, index: number) => T,
    params?: Record<string, unknown>,
  ): Observable<T[]> {
    return this.get<unknown>(url, params).pipe(
      map((response) => extractCollection(response).map(adapter)),
    );
  }

  private authHeaders(): Record<string, string> {
    const user = this.authService.currentUser();

    if (!user?.token) {
      return {};
    }

    return {
      Authorization: `${user.tokenType ?? 'Bearer'} ${user.token}`,
    };
  }
}
