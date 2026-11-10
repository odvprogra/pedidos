import { Routes } from '@angular/router';
import { AccountListPage } from './pages/account-list-page/account-list-page';
import { AdminPanelPage } from './pages/admin-panel-page/admin-panel-page';
import { RestaurantListPage } from './pages/restaurant-list-page/restaurant-list-page';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminPanelPage,
    children: [
      { path: '', component: AccountListPage, title: 'Cuentas | Pedidos' },
      {
        path: 'restaurantes',
        component: RestaurantListPage,
        title: 'Restaurantes del panel | Pedidos',
      },
    ],
  },
];
