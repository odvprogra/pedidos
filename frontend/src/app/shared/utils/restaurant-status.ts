export type RestaurantStatus = 'open' | 'closed' | 'suspended';

export interface RestaurantState {
  open: boolean;
  suspended: boolean;
}

export const RESTAURANT_STATUS_LABELS: Record<RestaurantStatus, string> = {
  open: 'Abierto',
  closed: 'Cerrado',
  suspended: 'Suspendido',
};

export function restaurantStatusOf(restaurant: RestaurantState): RestaurantStatus {
  if (restaurant.suspended) {
    return 'suspended';
  }
  return restaurant.open ? 'open' : 'closed';
}
