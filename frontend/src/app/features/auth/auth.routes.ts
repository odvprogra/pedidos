import { Routes } from '@angular/router';
import { guestGuard } from '@core/auth/auth-guards';
import { LOG_IN_SEGMENT, REGISTER_SEGMENT } from '@core/auth/auth-paths';
import { LogInPage } from './pages/log-in-page/log-in-page';
import { RegisterPage } from './pages/register-page/register-page';

export const AUTH_ROUTES: Routes = [
  {
    path: LOG_IN_SEGMENT,
    component: LogInPage,
    canActivate: [guestGuard],
    title: 'Ingresar | Pedidos',
  },
  {
    path: REGISTER_SEGMENT,
    component: RegisterPage,
    canActivate: [guestGuard],
    title: 'Crear cuenta | Pedidos',
  },
];
