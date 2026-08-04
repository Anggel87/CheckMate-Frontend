import { ApiFieldErrors } from '../models/api-error.model';

export class ValidationError extends Error {
  override name = 'ValidationError';

  constructor(
    message: string,
    readonly errors: ApiFieldErrors,
  ) {
    super(message);
  }
}
