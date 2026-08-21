import { Routes } from '@angular/router';

export const NFC_CARDS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/nfc-cards-list/nfc-cards-list.component').then(
        (component) => component.NfcCardsListComponent,
      ),
    data: { topbarTitle: 'Tarjetas NFC' },
  },
];
