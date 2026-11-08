import { Routes } from '@angular/router';
import { StatusPage } from './pages/status-page/status-page';

export const STATUS_ROUTES: Routes = [
  { path: '', component: StatusPage, title: 'Estado del sistema | Pedidos' },
];
