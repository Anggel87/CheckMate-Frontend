import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { CheckmateApiService } from '../../../core/api/checkmate-api.service';
import {
  formatApiDate,
  formatApiTime,
  readBoolean,
  readFullName,
  readId,
  readNumber,
  readString,
  toRecord,
  unwrapData,
} from '../../../core/api/api-adapter';
import { AuthService } from '../../../core/authentication/auth.service';
import { UserRole } from '../../../core/enums/user-role.enum';
import { ManagementDataService } from '../../management/data-access/management-data.service';

export type NotificationTargetType = 'ALL' | 'CAREER' | 'GROUP' | 'STUDENT' | 'TEACHER';
export type NotificationRecipientChannel = 'TUTOR' | 'STUDENT';

export interface NotificationOption {
  id: string;
  label: string;
}

export interface NotificationTargetOptions {
  careers: NotificationOption[];
  groups: NotificationOption[];
  students: NotificationOption[];
  teachers: NotificationOption[];
}

export interface CreateNotificationPayload {
  title: string;
  message: string;
  type: string;
  target: NotificationTargetType;
  recipientType?: NotificationRecipientChannel;
  careerIds?: string[];
  groupIds?: string[];
  studentIds?: string[];
  teacherIds?: string[];
}

export interface NotificationInboxView {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  sentAtLabel: string;
  senderName: string;
}

export const EMPTY_NOTIFICATION_INBOX_DETAIL: NotificationInboxView = {
  id: '',
  title: '',
  message: '',
  type: '',
  isRead: false,
  sentAtLabel: '',
  senderName: '',
};

const RECIPIENT_TYPE_LABELS: Record<string, string> = {
  TUTOR: 'Tutores (WhatsApp)',
  STUDENT: 'Alumno',
  TEACHER: 'Profesor',
};

const TYPE_LABELS: Record<string, string> = {
  INASISTENCIA: 'Inasistencia',
  RETARDO: 'Retardo',
  INCIDENTE: 'Incidente',
  JUSTIFICANTE: 'Justificante',
  RECLAMO: 'Reclamo',
  RECLAMO_PROFESOR: 'Reclamo a profesor',
  AVISO: 'Aviso',
};

export function notificationTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

export interface SentNotificationView {
  id: string;
  title: string;
  type: string;
  recipientType: string;
  recipientLabel: string;
  recipientsCount: number;
  isRead: boolean;
  sentAtLabel: string;
}

export interface SentNotificationDetailView {
  id: string;
  title: string;
  message: string;
  type: string;
  recipientType: string;
  recipientLabel: string;
  recipientsCount: number;
  recipientNames: string[];
  sentByName: string;
  sentAtLabel: string;
}

export const EMPTY_SENT_NOTIFICATION_DETAIL: SentNotificationDetailView = {
  id: '',
  title: '',
  message: '',
  type: '',
  recipientType: '',
  recipientLabel: '',
  recipientsCount: 0,
  recipientNames: [],
  sentByName: '',
  sentAtLabel: '',
};

@Injectable({
  providedIn: 'root',
})
export class NotificationsApiService {
  private readonly api = inject(CheckmateApiService);
  private readonly authService = inject(AuthService);
  private readonly managementData = inject(ManagementDataService);

  // ---- Recipient inbox (alumno / profesor / tutor_academico) ----

  getInbox(): Observable<NotificationInboxView[]> {
    return this.api.getCollection(`${this.inboxBase()}/notifications`, (item) => this.toInboxItem(item));
  }

  getInboxDetail(notificationId: string | null): Observable<NotificationInboxView> {
    if (!notificationId) {
      return of(EMPTY_NOTIFICATION_INBOX_DETAIL);
    }

    return this.api
      .get<unknown>(`${this.inboxBase()}/notifications/${notificationId}`)
      .pipe(map((response) => this.toInboxItem(unwrapData(response))));
  }

  markAsRead(notificationId: string): Observable<boolean> {
    return this.api
      .patch<unknown>(`${this.inboxBase()}/notifications/${notificationId}/read`, {})
      .pipe(map(() => true));
  }

  // ---- Sent log + compose (administrador / director de carrera) ----

  getSentNotifications(): Observable<SentNotificationView[]> {
    return this.api.getCollection(`${this.sentBase()}/notifications`, (item) => this.toSentItem(item));
  }

  getSentDetail(notificationId: string | null): Observable<SentNotificationDetailView> {
    if (!notificationId) {
      return of(EMPTY_SENT_NOTIFICATION_DETAIL);
    }

    return this.api
      .get<unknown>(`${this.sentBase()}/notifications/${notificationId}`)
      .pipe(map((response) => this.toSentDetail(unwrapData(response))));
  }

  /**
   * Solo administrador tiene /resend (el director no). Reenvia al mismo destinatario
   * original del aviso.
   */
  resendNotification(notificationId: string): Observable<boolean> {
    return this.api.post<unknown>(`/administrador/notifications/${notificationId}/resend`, {}).pipe(map(() => true));
  }

  createNotification(payload: CreateNotificationPayload): Observable<boolean> {
    const body: Record<string, unknown> = {
      title: payload.title,
      message: payload.message,
      type: payload.type,
      target: payload.target,
    };

    if (payload.recipientType) {
      body['recipient_type'] = payload.recipientType;
    }

    if (payload.careerIds?.length) {
      body['career_ids'] = payload.careerIds;
    }

    if (payload.groupIds?.length) {
      body['group_ids'] = payload.groupIds;
    }

    if (payload.studentIds?.length) {
      body['student_ids'] = payload.studentIds;
    }

    if (payload.teacherIds?.length) {
      body['teacher_ids'] = payload.teacherIds;
    }

    return this.api.post<unknown>(`${this.sentBase()}/notifications`, body).pipe(map(() => true));
  }

  getTargetOptions(): Observable<NotificationTargetOptions> {
    const isDirector = this.authService.currentUser()?.role === UserRole.CAREER_DIRECTOR;

    return forkJoin({
      careers: isDirector ? of([]) : this.managementData.getCareers(),
      groups: this.managementData.getGroups(),
      students: this.managementData.getStudents(),
      teachers: this.managementData.getTeachers(),
    }).pipe(
      map(({ careers, groups, students, teachers }) => ({
        careers: careers.map((career) => ({ id: career.id, label: career.name })),
        groups: groups.map((group) => ({ id: group.id, label: `${group.label} (${group.career})` })),
        students: students.map((student) => ({ id: student.id, label: `${student.name} - ${student.group}` })),
        teachers: teachers.map((teacher) => ({ id: teacher.id, label: teacher.name })),
      })),
    );
  }

  private inboxBase(): string {
    const role = this.authService.currentUser()?.role;
    return role === UserRole.TEACHER || role === UserRole.TUTOR_TEACHER ? '/profesor' : '/alumno';
  }

  private sentBase(): string {
    return this.authService.currentUser()?.role === UserRole.CAREER_DIRECTOR ? '/director-carrera' : '/administrador';
  }

  private toInboxItem(value: unknown): NotificationInboxView {
    const record = toRecord(value);
    const sender = toRecord(record?.['sender']);

    return {
      id: readId(record),
      title: readString(record, 'title'),
      message: readString(record, 'message'),
      type: readString(record, 'type'),
      isRead: readBoolean(record, 'is_read', false),
      sentAtLabel: this.toDateTimeLabel(readString(record, 'sent_at')),
      senderName: sender ? readFullName(sender) : '',
    };
  }

  private toSentItem(value: unknown): SentNotificationView {
    const record = toRecord(value);
    const recipientType = readString(record, 'recipient_type');

    return {
      id: readId(record),
      title: readString(record, 'title'),
      type: readString(record, 'type'),
      recipientType,
      recipientLabel: RECIPIENT_TYPE_LABELS[recipientType] ?? recipientType,
      recipientsCount: readNumber(record, 'recipients_count', 1),
      isRead: readBoolean(record, 'is_read', false),
      sentAtLabel: this.toDateTimeLabel(readString(record, 'sent_at')),
    };
  }

  private toSentDetail(value: unknown): SentNotificationDetailView {
    const record = toRecord(value);
    const recipientType = readString(record, 'recipient_type');
    const sentBy = toRecord(record?.['sent_by']);
    const recipientNames = Array.isArray(record?.['recipients'])
      ? (record['recipients'] as unknown[]).filter((name): name is string => typeof name === 'string')
      : [];

    return {
      id: readId(record),
      title: readString(record, 'title'),
      message: readString(record, 'message'),
      type: readString(record, 'type'),
      recipientType,
      recipientLabel: RECIPIENT_TYPE_LABELS[recipientType] ?? recipientType,
      recipientsCount: readNumber(record, 'recipients_count', recipientNames.length || 1),
      recipientNames,
      sentByName: sentBy ? readFullName(sentBy) : 'Sistema (automático)',
      sentAtLabel: this.toDateTimeLabel(readString(record, 'sent_at')),
    };
  }

  private toDateTimeLabel(value: string): string {
    if (!value) {
      return '';
    }

    return `${formatApiDate(value)} ${formatApiTime(value)}`.trim();
  }
}
