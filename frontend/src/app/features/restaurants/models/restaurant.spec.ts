import { countRestaurants, openingLabel, openingTone } from './restaurant';

describe('the restaurant copy', () => {
  it('names whether a restaurant is open', () => {
    expect(openingLabel(true)).toBe('Abierto');
    expect(openingLabel(false)).toBe('Cerrado');
  });

  it('paints an open restaurant in green and a closed one in gray', () => {
    expect(openingTone(true)).toBe('success');
    expect(openingTone(false)).toBe('neutral');
  });

  it.each([
    [0, '0 restaurantes'],
    [1, '1 restaurante'],
    [12, '12 restaurantes'],
  ])('counts %i restaurants', (total, label) => {
    expect(countRestaurants(total)).toBe(label);
  });
});
