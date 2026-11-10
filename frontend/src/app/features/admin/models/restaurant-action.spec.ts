import { actionFor, copyFor } from './restaurant-action';
import { RestaurantSummary } from './restaurant-summary';

function restaurant(overrides: Partial<RestaurantSummary>): RestaurantSummary {
  return {
    id: 4,
    name: 'La Casona',
    description: null,
    address: 'Calle Sucre 245',
    open: false,
    suspended: false,
    ...overrides,
  };
}

describe('actionFor', () => {
  it.each([
    ['an open restaurant', restaurant({ open: true }), 'suspend'],
    ['a closed restaurant', restaurant({}), 'suspend'],
    ['a suspended restaurant', restaurant({ suspended: true }), 'reactivate'],
  ])('offers the right action for %s', (_case, summary, action) => {
    expect(actionFor(summary)).toBe(action);
  });
});

describe('copyFor', () => {
  it('warns that a suspension hides the restaurant but lets its owner finish the orders', () => {
    const copy = copyFor('suspend', 'La Casona');

    expect(copy.question).toBe('¿Suspender La Casona?');
    expect(copy.consequence).toContain('Los clientes dejan de verlo');
    expect(copy.consequence).toContain('Su dueño puede terminar los pedidos en curso');
    expect(copy.done).toBe('Suspendiste La Casona. Los clientes ya no lo ven.');
  });

  it('warns that a reactivated restaurant comes back closed', () => {
    const copy = copyFor('reactivate', 'La Casona');

    expect(copy.question).toBe('¿Reactivar La Casona?');
    expect(copy.consequence).toContain('cerrado hasta que su dueño lo abra');
    expect(copy.confirm).toBe('Sí, reactivar');
  });
});
