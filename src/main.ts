import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

// Diagnostico rapido en consola: confirma con que archivo de environment se
// compilo este build (development/production/base) sin tener que revisar el
// bundle. Util para verificar en el sitio desplegado, por ejemplo, que
// governanceLoginUrl apunte al dominio real y no a localhost.
console.info('[CheckMate] environment cargado', environment);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
