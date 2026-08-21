import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CheckmateApiService } from '../../../core/api/checkmate-api.service';
import { readId, readNumber, readString, toRecord, unwrapData } from '../../../core/api/api-adapter';

export type NewUserRole = 'alumno' | 'profesor' | 'tutor_academico' | 'director_carrera' | 'administrador';

export interface NewUserTutorPayload {
  firstName: string;
  secondName?: string;
  firstSurname: string;
  secondSurname: string;
  phone: string;
  relationship: string;
  isPrimary?: boolean;
}

export interface NewUserPayload {
  role: NewUserRole;
  firstName: string;
  secondName?: string;
  firstSurname: string;
  secondSurname: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  photo?: File | null;
  groupId?: string;
  nfcUid?: string;
  tutors?: NewUserTutorPayload[];
}

export interface CreatedUserView {
  id: string;
  fullName: string;
  email: string;
  role: string;
  temporaryPassword: string | null;
}

export interface GroupOptionView {
  id: string;
  label: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsersApiService {
  private readonly api = inject(CheckmateApiService);

  getGroups(): Observable<GroupOptionView[]> {
    return this.api.getCollection('/administrador/groups', (item) => this.toGroupOption(item));
  }

  createUser(payload: NewUserPayload): Observable<CreatedUserView> {
    const formData = new FormData();

    formData.set('role', payload.role);
    formData.set('first_name', payload.firstName);
    formData.set('first_surname', payload.firstSurname);
    formData.set('second_surname', payload.secondSurname);
    formData.set('email', payload.email);
    formData.set('phone', payload.phone);
    formData.set('birth_date', payload.birthDate);
    formData.set('gender', payload.gender);

    if (payload.secondName) {
      formData.set('second_name', payload.secondName);
    }

    if (payload.photo) {
      formData.set('photo', payload.photo);
    }

    if (payload.groupId) {
      formData.set('group_id', payload.groupId);
    }

    if (payload.nfcUid) {
      formData.set('nfc_uid', payload.nfcUid);
    }

    (payload.tutors ?? []).forEach((tutor, index) => {
      formData.set(`tutors[${index}][first_name]`, tutor.firstName);

      if (tutor.secondName) {
        formData.set(`tutors[${index}][second_name]`, tutor.secondName);
      }

      formData.set(`tutors[${index}][first_surname]`, tutor.firstSurname);
      formData.set(`tutors[${index}][second_surname]`, tutor.secondSurname);
      formData.set(`tutors[${index}][phone]`, tutor.phone);
      formData.set(`tutors[${index}][relationship]`, tutor.relationship);
      formData.set(`tutors[${index}][is_primary]`, tutor.isPrimary ? '1' : '0');
    });

    return this.api
      .post<unknown>('/administrador/users', formData)
      .pipe(map((response) => this.toCreatedUser(unwrapData(response))));
  }

  private toCreatedUser(value: unknown): CreatedUserView {
    const record = toRecord(value);

    return {
      id: readId(record),
      fullName: readString(record, 'full_name'),
      email: readString(record, 'email'),
      role: readString(record, 'role'),
      temporaryPassword: readString(record, 'temporary_password') || null,
    };
  }

  private toGroupOption(value: unknown): GroupOptionView {
    const record = toRecord(value);
    const grade = readString(record, 'grade');
    const section = readString(record, 'section');

    return {
      id: readId(record),
      label: [grade, section].filter(Boolean).join('-') || `Grupo ${readNumber(record, 'id', 0)}`,
    };
  }
}
