import { Routes } from '@angular/router';
import { OrderListPage } from './pages/order-list-page/order-list-page';

export const ORDERS_ROUTES: Routes = [
  { path: '', component: OrderListPage, title: 'Mis pedidos | Pedidos' },
];
