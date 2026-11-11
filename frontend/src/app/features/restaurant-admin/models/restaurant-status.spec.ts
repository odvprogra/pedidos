import { Restaurant } from './restaurant';
import {
  STATUS_LABELS,
  openingDone,
  openingHint,
  openingProgress,
  statusOf,
} from './restaurant-status';

function restaurant(overrides: Partial<Restaurant>): Restaurant {
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

describe('statusOf', () => {
  it.each([
    ['a closed restaurant', restaurant({}), 'closed', 'Cerrado'],
    ['an open restaurant', restaurant({ open: true }), 'open', 'Abierto'],
    ['a suspended restaurant', restaurant({ suspended: true }), 'suspended', 'Suspendido'],
    [
      'a suspended restaurant still marked open',
      restaurant({ open: true, suspended: true }),
      'suspended',
      'Suspendido',
    ],
  ])('names the status of %s', (_case, current, status, label) => {
    expect(statusOf(current)).toBe(status);
    expect(STATUS_LABELS[statusOf(current)]).toBe(label);
  });
});

describe('the opening copy', () => {
  it('explains what each state means for the customers', () => {
    expect(openingHint(true)).toContain('ya pueden hacer pedidos');
    expect(openingHint(false)).toContain('no pueden pedir');
  });

  it('says what is happening while the change is on its way', () => {
    expect(openingProgress(true)).toBe('Abriendo tu restaurante…');
    expect(openingProgress(false)).toBe('Cerrando tu restaurante…');
  });

  it('confirms the change with the name of the restaurant', () => {
    expect(openingDone(true, 'La Casona')).toBe('Abriste La Casona. Ya recibe pedidos.');
    expect(openingDone(false, 'La Casona')).toBe(
      'Cerraste La Casona. Ya no recibe pedidos nuevos.',
    );
  });
});
