import { restaurantStatusLabel, restaurantStatusOf } from './restaurant-status';

describe('restaurantStatusOf', () => {
  it.each([
    ['a closed restaurant', { open: false, suspended: false }, 'closed', 'Cerrado'],
    ['an open restaurant', { open: true, suspended: false }, 'open', 'Abierto'],
    ['a suspended restaurant', { open: false, suspended: true }, 'suspended', 'Suspendido'],
    [
      'a suspended restaurant still marked open',
      { open: true, suspended: true },
      'suspended',
      'Suspendido',
    ],
  ])('names the status of %s', (_case, state, status, label) => {
    expect(restaurantStatusOf(state)).toBe(status);
    expect(restaurantStatusLabel(state)).toBe(label);
  });
});
