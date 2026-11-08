import { countRestaurants, openingLabel, parseRestaurantId } from './restaurant';

describe('parseRestaurantId', () => {
  it.each([
    ['4', 4],
    ['120', 120],
    ['999999999999999', 999999999999999],
  ])('reads the id %s', (text, id) => {
    expect(parseRestaurantId(text)).toBe(id);
  });

  it.each([
    ['a word', 'abc'],
    ['zero', '0'],
    ['a leading zero', '04'],
    ['a negative number', '-4'],
    ['a decimal', '4.5'],
    ['spaces', ' 4 '],
    ['an empty text', ''],
    ['a number too long to be exact', '9999999999999999'],
  ])('rejects %s', (_case, text) => {
    expect(parseRestaurantId(text)).toBeNull();
  });
});

describe('the restaurant copy', () => {
  it('names whether a restaurant is open', () => {
    expect(openingLabel(true)).toBe('Abierto');
    expect(openingLabel(false)).toBe('Cerrado');
  });

  it.each([
    [0, '0 restaurantes'],
    [1, '1 restaurante'],
    [12, '12 restaurantes'],
  ])('counts %i restaurants', (total, label) => {
    expect(countRestaurants(total)).toBe(label);
  });
});
