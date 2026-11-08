import { formatPrice } from './format-price';

describe('formatPrice', () => {
  it.each([
    [45, 'Bs 45,00'],
    [45.5, 'Bs 45,50'],
    [0.01, 'Bs 0,01'],
    [1234.5, 'Bs 1.234,50'],
  ])('writes %s in bolivianos as %s', (price, written) => {
    expect(formatPrice(price).replace(/\s/g, ' ')).toBe(written);
  });

  it('keeps the currency next to the amount with a non-breaking space', () => {
    expect(formatPrice(45)).toBe('Bs 45,00');
  });
});
