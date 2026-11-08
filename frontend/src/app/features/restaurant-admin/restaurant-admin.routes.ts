import { Routes } from '@angular/router';
import { MyRestaurantPage } from './pages/my-restaurant-page/my-restaurant-page';

export const RESTAURANT_ADMIN_ROUTES: Routes = [
  { path: '', component: MyRestaurantPage, title: 'Mi restaurante | Pedidos' },
];
