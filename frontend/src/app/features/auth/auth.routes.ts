import { Routes } from '@angular/router';
import { guestGuard } from '@core/auth/auth-guards';
import { LogInPage } from './pages/log-in-page/log-in-page';
import { RegisterPage } from './pages/register-page/register-page';

export const AUTH_ROUTES: Routes = [
  {
    path: 'ingresar',
    component: LogInPage,
    canActivate: [guestGuard],
    title: 'Ingresar | Pedidos',
  },
  {
    path: 'registro',
    component: RegisterPage,
    canActivate: [guestGuard],
    title: 'Crear cuenta | Pedidos',
  },
];
