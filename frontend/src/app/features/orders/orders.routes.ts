import { Routes } from '@angular/router';
import { OrderDetailPage } from './pages/order-detail-page/order-detail-page';
import { OrderListPage } from './pages/order-list-page/order-list-page';

export const ORDERS_ROUTES: Routes = [
  { path: '', component: OrderListPage, title: 'Mis pedidos | Pedidos' },
  { path: ':id', component: OrderDetailPage, title: 'Pedido | Pedidos' },
];
