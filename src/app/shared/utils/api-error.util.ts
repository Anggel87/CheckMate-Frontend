import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]> | null;
}

function errorBody(error: unknown): ApiErrorBody | undefined {
  return (error as HttpErrorResponse)?.error as ApiErrorBody | undefined;
}

/** Extracts the message the API sent for this error, falling back to a caller-provided default. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const message = errorBody(error)?.message;
  return typeof message === 'string' && message.trim().length > 0 ? message : fallback;
}

/** Extracts the field -> messages validation dictionary the API sent (422 responses), if any. */
export function apiFieldErrors(error: unknown): Record<string, string[]> | null {
  const errors = errorBody(error)?.errors;
  return errors && typeof errors === 'object' ? errors : null;
}
