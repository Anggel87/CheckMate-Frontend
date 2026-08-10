import { StatusBadgeTone } from '../../shared/components/status-badge/status-badge.component';

export type UnknownRecord = Record<string, unknown>;

export function toRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null ? (value as UnknownRecord) : null;
}

export function unwrapData(response: unknown): unknown {
  const record = toRecord(response);
  return record && 'data' in record ? record['data'] : response;
}

export function extractCollection(response: unknown): unknown[] {
  const data = unwrapData(response);

  if (Array.isArray(data)) {
    return data;
  }

  const record = toRecord(data);
  const nestedData = record?.['data'];

  if (Array.isArray(nestedData)) {
    return nestedData;
  }

  const items = record?.['items'];
  return Array.isArray(items) ? items : [];
}

export function readString(
  record: UnknownRecord | null | undefined,
  key: string,
  fallback = '',
): string {
  const value = record?.[key];

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

export function readNumber(
  record: UnknownRecord | null | undefined,
  key: string,
  fallback = 0,
): number {
  const value = record?.[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function readBoolean(
  record: UnknownRecord | null | undefined,
  key: string,
  fallback = false,
): boolean {
  const value = record?.[key];
  return typeof value === 'boolean' ? value : fallback;
}

export function readId(record: UnknownRecord | null | undefined, fallback = ''): string {
  const value = record?.['id'];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

export function readFirstString(
  record: UnknownRecord | null | undefined,
  keys: readonly string[],
  fallback = '',
): string {
  for (const key of keys) {
    const value = readString(record, key);

    if (value) {
      return value;
    }
  }

  return fallback;
}

export function readFullName(record: UnknownRecord | null | undefined, fallback = ''): string {
  const direct = readFirstString(record, ['full_name', 'name']);

  if (direct) {
    return direct;
  }

  const parts = [
    readString(record, 'first_name'),
    readString(record, 'second_name'),
    readString(record, 'first_surname'),
    readString(record, 'second_surname'),
  ].filter(Boolean);

  return parts.length ? parts.join(' ') : fallback;
}

export function initialsFromName(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function toneFromAttendanceStatus(status: string): StatusBadgeTone {
  const normalized = status.toUpperCase();

  if (normalized.includes('PRESENTE') || normalized.includes('A TIEMPO')) {
    return 'present';
  }

  if (normalized.includes('RETARDO')) {
    return 'late';
  }

  if (normalized.includes('JUSTIFIC')) {
    return 'justified';
  }

  if (normalized.includes('FALTA') || normalized.includes('INASIST')) {
    return 'absent';
  }

  return 'neutral';
}

export function toneFromRequestStatus(status: string): StatusBadgeTone {
  const normalized = status.toUpperCase();

  if (normalized.includes('ACEPT') || normalized.includes('APROB') || normalized.includes('CONCL')) {
    return 'success';
  }

  if (normalized.includes('RECHAZ')) {
    return 'danger';
  }

  if (normalized.includes('PROCES') || normalized.includes('CONTACT')) {
    return 'info';
  }

  if (normalized.includes('PEND')) {
    return 'pending';
  }

  return 'neutral';
}

export function formatApiDate(value: string): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatApiTime(value: string): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  return value;
}
