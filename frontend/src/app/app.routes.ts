import { Routes } from '@angular/router';
import { roleGuard } from '@core/auth/auth-guards';
import { ADMIN_SEGMENT } from '@core/auth/auth-paths';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('@features/home/home.routes').then((m) => m.HOME_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: ADMIN_SEGMENT,
    canActivate: [roleGuard('ADMIN')],
    loadChildren: () => import('@features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
