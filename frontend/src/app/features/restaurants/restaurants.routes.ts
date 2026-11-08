import { Routes } from '@angular/router';
import { RestaurantListPage } from './pages/restaurant-list-page/restaurant-list-page';

export const RESTAURANTS_ROUTES: Routes = [
  { path: '', component: RestaurantListPage, title: 'Restaurantes | Pedidos' },
];
