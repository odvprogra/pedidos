import { Routes } from '@angular/router';
import { guestGuard } from '@core/auth/auth-guards';
import { LogInPage } from './pages/log-in-page/log-in-page';

export const AUTH_ROUTES: Routes = [
  {
    path: 'ingresar',
    component: LogInPage,
    canActivate: [guestGuard],
    title: 'Ingresar | Pedidos',
  },
];
