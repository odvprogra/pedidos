import { Routes } from '@angular/router';
import { CatalogPage } from './pages/catalog-page/catalog-page';
import { MyRestaurantPage } from './pages/my-restaurant-page/my-restaurant-page';
import { OrdersPage } from './pages/orders-page/orders-page';

export const RESTAURANT_ADMIN_ROUTES: Routes = [
  { path: '', component: MyRestaurantPage, title: 'Mi restaurante | Pedidos' },
  { path: 'menu', component: CatalogPage, title: 'Tu menú | Pedidos' },
  { path: 'pedidos', component: OrdersPage, title: 'Pedidos del restaurante | Pedidos' },
];
