import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  get<T>(key: string): T | null {
    if (!this.isAvailable()) {
      return null;
    }

    const rawValue = localStorage.getItem(key);

    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    if (!this.isAvailable()) {
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    if (!this.isAvailable()) {
      return;
    }

    localStorage.removeItem(key);
  }

  private isAvailable(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
