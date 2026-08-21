import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CheckmateApiService } from '../../../core/api/checkmate-api.service';
import { readBoolean, readFullName, readId, readString, toRecord, unwrapData } from '../../../core/api/api-adapter';

export const NFC_ROLE_LABELS: Record<string, string> = {
  alumno: 'Alumno',
  profesor: 'Profesor',
  tutor_academico: 'Tutor académico',
  administrador: 'Administrador',
  director_carrera: 'Director de carrera',
};

export interface NfcCardUserView {
  id: string;
  fullName: string;
  email: string;
  role: string;
  roleLabel: string;
  active: boolean;
  nfcUid: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class NfcCardsApiService {
  private readonly api = inject(CheckmateApiService);

  getUsers(): Observable<NfcCardUserView[]> {
    return this.api.getCollection('/administrador/nfc-cards', (item) => this.toUser(item));
  }

  assignCard(userId: string, nfcUid: string): Observable<NfcCardUserView> {
    return this.api
      .patch<unknown>(`/administrador/nfc-cards/${userId}`, { nfc_uid: nfcUid })
      .pipe(map((response) => this.toUser(unwrapData(response))));
  }

  clearCard(userId: string): Observable<NfcCardUserView> {
    return this.api
      .delete<unknown>(`/administrador/nfc-cards/${userId}`)
      .pipe(map((response) => this.toUser(unwrapData(response))));
  }

  private toUser(value: unknown): NfcCardUserView {
    const record = toRecord(value);
    const role = readString(record, 'role');
    const nfcUid = record?.['nfc_uid'];

    return {
      id: readId(record),
      fullName: readFullName(record),
      email: readString(record, 'email'),
      role,
      roleLabel: NFC_ROLE_LABELS[role] ?? role,
      active: readBoolean(record, 'active', true),
      nfcUid: typeof nfcUid === 'string' ? nfcUid : null,
    };
  }
}
