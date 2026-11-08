export interface Restaurant {
  id: number;
  name: string;
  description: string | null;
  address: string;
  open: boolean;
}

const RESTAURANT_ID = /^[1-9]\d{0,14}$/;

export function parseRestaurantId(text: string): number | null {
  return RESTAURANT_ID.test(text) ? Number(text) : null;
}

export function openingLabel(open: boolean): string {
  return open ? 'Abierto' : 'Cerrado';
}

export function countRestaurants(total: number): string {
  return total === 1 ? '1 restaurante' : `${total} restaurantes`;
}
