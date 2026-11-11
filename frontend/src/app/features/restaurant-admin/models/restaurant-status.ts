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
