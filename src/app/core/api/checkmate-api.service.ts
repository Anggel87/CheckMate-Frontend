import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { extractCollection } from './api-adapter';

@Injectable({
  providedIn: 'root',
})
export class CheckmateApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.checkmateApiUrl;

  get<T>(url: string, params?: Record<string, unknown>): Observable<T> {
    return this.http.get<T>(this.baseUrl + url, { params: this.buildParams(params) });
  }

  post<T>(url: string, data?: unknown): Observable<T> {
    return this.http.post<T>(this.baseUrl + url, data ?? {});
  }

  put<T>(url: string, data?: unknown): Observable<T> {
    return this.http.put<T>(this.baseUrl + url, data ?? {});
  }

  patch<T>(url: string, data?: unknown): Observable<T> {
    return this.http.patch<T>(this.baseUrl + url, data ?? {});
  }

  delete<T>(url: string, params?: Record<string, unknown>): Observable<T> {
    return this.http.delete<T>(this.baseUrl + url, { params: this.buildParams(params) });
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

  private buildParams(params?: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();

    if (!params) {
      return httpParams;
    }

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          httpParams = httpParams.append(`${key}[]`, String(item));
        });
        continue;
      }

      httpParams = httpParams.set(key, String(value));
    }

    return httpParams;
  }
}
