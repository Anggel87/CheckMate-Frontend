export interface ApiError {
  status: number;
  message: string;
  code?: string;
  errors?: ApiFieldErrors;
}

export type ApiFieldErrors = Record<string, string[]>;
