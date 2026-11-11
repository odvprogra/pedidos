import { RestaurantCategory } from '@shared/utils/restaurant-category';

export interface Restaurant {
  id: number;
  name: string;
  description: string | null;
  address: string;
  category: RestaurantCategory;
  imageUrl: string | null;
  open: boolean;
  suspended: boolean;
}

export interface RestaurantDetails {
  name: string;
  description: string;
  address: string;
  category: RestaurantCategory;
  imageUrl: string;
}
