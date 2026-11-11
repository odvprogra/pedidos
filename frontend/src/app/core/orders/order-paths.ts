export const ORDERS_SEGMENT = 'pedidos';
export const ORDERS_PATH = `/${ORDERS_SEGMENT}`;

export function orderPath(id: number): string {
  return `${ORDERS_PATH}/${id}`;
}
