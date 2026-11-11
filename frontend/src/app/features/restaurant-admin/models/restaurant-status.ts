import { Restaurant } from './restaurant';

export type RestaurantStatus = 'open' | 'closed' | 'suspended';

export const STATUS_LABELS: Record<RestaurantStatus, string> = {
  open: 'Abierto',
  closed: 'Cerrado',
  suspended: 'Suspendido',
};

export function statusOf(restaurant: Restaurant): RestaurantStatus {
  if (restaurant.suspended) {
    return 'suspended';
  }
  return restaurant.open ? 'open' : 'closed';
}

export function openingHint(open: boolean): string {
  return open
    ? 'Abierto: los clientes ya pueden hacer pedidos.'
    : 'Cerrado: los clientes lo ven, pero no pueden pedir.';
}

export function openingProgress(open: boolean): string {
  return open ? 'Abriendo tu restaurante…' : 'Cerrando tu restaurante…';
}

export function openingDone(open: boolean, name: string): string {
  return open
    ? `Abriste ${name}. Ya recibe pedidos.`
    : `Cerraste ${name}. Ya no recibe pedidos nuevos.`;
}
