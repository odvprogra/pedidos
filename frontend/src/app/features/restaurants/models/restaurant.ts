import { RestaurantState } from '@shared/utils/restaurant-status';

export interface Restaurant {
  id: number;
  name: string;
  description: string | null;
  address: string;
  open: boolean;
}

export function publicStatus(restaurant: Restaurant): RestaurantState {
  return { open: restaurant.open, suspended: false };
}

export function countRestaurants(total: number): string {
  return total === 1 ? '1 restaurante' : `${total} restaurantes`;
}
