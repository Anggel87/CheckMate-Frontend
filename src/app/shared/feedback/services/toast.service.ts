import { Injectable, signal } from '@angular/core';
import { DEFAULT_TOAST_DURATION } from '../constants/feedback-config.constants';
import { ToastNotification, ToastOptions } from '../models/toast.model';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private counter = 0;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly toasts = signal<ToastNotification[]>([]);

  success(title: string, message: string, duration?: number): string {
    return this.show({ type: 'success', title, message, duration });
  }

  info(title: string, message: string, duration?: number): string {
    return this.show({ type: 'info', title, message, duration });
  }

  warning(title: string, message: string, duration?: number): string {
    return this.show({ type: 'warning', title, message, duration });
  }

  error(title: string, message: string, duration?: number): string {
    return this.show({ type: 'error', title, message, duration });
  }

  show(options: ToastOptions): string {
    const toast: ToastNotification = {
      id: `toast-${Date.now()}-${this.counter++}`,
      title: options.title,
      message: options.message,
      type: options.type,
      duration: options.duration ?? DEFAULT_TOAST_DURATION,
      dismissible: options.dismissible ?? true,
      createdAt: Date.now(),
    };

    this.toasts.update((toasts) => [toast, ...toasts]);

    if (toast.duration > 0) {
      const timer = setTimeout(() => this.dismiss(toast.id), toast.duration);
      this.timers.set(toast.id, timer);
    }

    return toast.id;
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id);

    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.toasts.set([]);
  }
}
