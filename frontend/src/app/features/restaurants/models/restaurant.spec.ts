import { restaurantStatusOf } from '@shared/utils/restaurant-status';
import { Restaurant, countRestaurants, publicStatus } from './restaurant';

const LA_CASONA: Restaurant = {
  id: 4,
  name: 'La Casona',
  description: null,
  address: 'Calle Sucre 245',
  open: true,
};

describe('the restaurant copy', () => {
  it('shows a listed restaurant as open or closed, never as suspended', () => {
    expect(publicStatus(LA_CASONA)).toEqual({ open: true, suspended: false });
    expect(restaurantStatusOf(publicStatus(LA_CASONA))).toBe('open');
    expect(restaurantStatusOf(publicStatus({ ...LA_CASONA, open: false }))).toBe('closed');
  });

  it.each([
    [0, '0 restaurantes'],
    [1, '1 restaurante'],
    [12, '12 restaurantes'],
  ])('counts %i restaurants', (total, label) => {
    expect(countRestaurants(total)).toBe(label);
  });
});
