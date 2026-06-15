import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core'; // <-- Nombre oficial y estable en v22
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), // <-- Modo puro nativo sin Zone.js habilitado con éxito
    provideRouter(routes),
    provideHttpClient(),
  ],
};
