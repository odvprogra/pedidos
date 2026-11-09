import { BadgeTone } from '@shared/ui/badge/badge';

export interface Restaurant {
  id: number;
  name: string;
  description: string | null;
  address: string;
  open: boolean;
}

export function openingLabel(open: boolean): string {
  return open ? 'Abierto' : 'Cerrado';
}

export function openingTone(open: boolean): BadgeTone {
  return open ? 'success' : 'neutral';
}

export function countRestaurants(total: number): string {
  return total === 1 ? '1 restaurante' : `${total} restaurantes`;
}
