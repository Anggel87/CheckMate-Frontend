export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}
