import { RestaurantCategory } from '@shared/utils/restaurant-category';
import { RestaurantState } from '@shared/utils/restaurant-status';

export interface Restaurant {
  id: number;
  name: string;
  description: string | null;
  address: string;
  category: RestaurantCategory;
  imageUrl: string | null;
  open: boolean;
}

export function publicStatus(restaurant: Restaurant): RestaurantState {
  return { open: restaurant.open, suspended: false };
}

export function countRestaurants(total: number): string {
  return total === 1 ? '1 restaurante' : `${total} restaurantes`;
}
