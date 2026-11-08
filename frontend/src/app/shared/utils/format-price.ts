const BOLIVIANOS = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' });

export function formatPrice(price: number): string {
  return BOLIVIANOS.format(price);
}
