import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'notes',
    loadChildren: () => import('./features/notes/notes.routes').then((m) => m.NOTES_ROUTES),
  },
];
