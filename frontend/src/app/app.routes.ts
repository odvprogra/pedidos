import { Routes } from '@angular/router';
import { roleGuard } from '@core/auth/auth-guards';
import { ADMIN_SEGMENT, MY_RESTAURANT_SEGMENT } from '@core/auth/auth-paths';
import { CART_SEGMENT } from '@core/cart/cart-paths';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'restaurantes' },
  {
    path: 'restaurantes',
    loadChildren: () =>
      import('@features/restaurants/restaurants.routes').then((m) => m.RESTAURANTS_ROUTES),
  },
  {
    path: CART_SEGMENT,
    loadChildren: () => import('@features/cart/cart.routes').then((m) => m.CART_ROUTES),
  },
  {
    path: 'estado',
    loadChildren: () => import('@features/status/status.routes').then((m) => m.STATUS_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: MY_RESTAURANT_SEGMENT,
    canActivate: [roleGuard('OWNER')],
    loadChildren: () =>
      import('@features/restaurant-admin/restaurant-admin.routes').then(
        (m) => m.RESTAURANT_ADMIN_ROUTES,
      ),
  },
  {
    path: ADMIN_SEGMENT,
    canActivate: [roleGuard('ADMIN')],
    loadChildren: () => import('@features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
