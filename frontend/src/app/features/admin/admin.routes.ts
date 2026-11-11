import { Routes } from '@angular/router';
import { AccountListPage } from './pages/account-list-page/account-list-page';

export const ADMIN_ROUTES: Routes = [
  { path: '', component: AccountListPage, title: 'Cuentas | Pedidos' },
];
