import { openingDone, openingHint, openingProgress } from './restaurant-status';

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
