export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastOptions {
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

export interface ToastNotification extends Required<ToastOptions> {
  id: string;
  createdAt: number;
}
