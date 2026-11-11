import { Api } from './api';

export type Role = 'CUSTOMER' | 'OWNER';

export interface Account {
  name: string;
  email: string;
  password: string;
  api: Api;
}

export interface ProductSeed {
  name: string;
  price: number;
  available?: boolean;
}

export interface Restaurant {
  id: number;
  name: string;
  owner: Account;
  products: Record<string, number>;
}

interface Identified {
  id: number;
}

let accounts = 0;

export async function registerAccount(name: string, role: Role): Promise<Account> {
  accounts += 1;
  const email = `${name.split(' ')[0].toLowerCase()}.${Date.now()}.${accounts}@e2e.test`;
  const password = 'clave-e2e-2026';
  const api = await Api.start();
  await api.post('/api/v1/auth/register', { name, email, password, role });
  return { name, email, password, api };
}

export async function openRestaurant(
  name: string,
  products: ProductSeed[],
  options: { open?: boolean } = {},
): Promise<Restaurant> {
  const owner = await registerAccount(`Dueño de ${name}`, 'OWNER');
  await owner.api.post('/api/v1/restaurants', {
    name,
    description: `La cocina de ${name}`,
    address: 'Calle Sucre 245',
  });
  const { id } = await owner.api.get<Identified>('/api/v1/restaurants/mine');
  const category = await owner.api.post<Identified>('/api/v1/restaurants/mine/categories', {
    name: 'Platos',
  });
  const ids: Record<string, number> = {};
  for (const product of products) {
    const created = await owner.api.post<Identified>('/api/v1/restaurants/mine/products', {
      categoryId: category.id,
      name: product.name,
      price: product.price,
    });
    ids[product.name] = created.id;
    if (product.available === false) {
      await owner.api.post(`/api/v1/restaurants/mine/products/${created.id}/mark-sold-out`);
    }
  }
  if (options.open !== false) {
    await owner.api.post('/api/v1/restaurants/mine/open');
  }
  return { id, name, owner, products: ids };
}

export async function placeOrder(
  customer: Account,
  restaurant: Restaurant,
  quantities: Record<string, number>,
): Promise<number> {
  const items = Object.entries(quantities).map(([product, quantity]) => ({
    productId: restaurant.products[product],
    quantity,
  }));
  const order = await customer.api.post<Identified>('/api/v1/orders', {
    restaurantId: restaurant.id,
    items,
  });
  return order.id;
}

export async function moveOrder(
  restaurant: Restaurant,
  orderId: number,
  ...actions: string[]
): Promise<void> {
  for (const action of actions) {
    await restaurant.owner.api.post(`/api/v1/restaurants/mine/orders/${orderId}/${action}`);
  }
}
