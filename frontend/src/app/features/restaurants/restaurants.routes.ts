import { Routes } from '@angular/router';
import { RestaurantListPage } from './pages/restaurant-list-page/restaurant-list-page';
import { RestaurantMenuPage } from './pages/restaurant-menu-page/restaurant-menu-page';

export const RESTAURANTS_ROUTES: Routes = [
  { path: '', component: RestaurantListPage, title: 'Restaurantes | Pedidos' },
  { path: ':id', component: RestaurantMenuPage, title: 'Menú | Pedidos' },
];
