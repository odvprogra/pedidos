import { FormControl } from '@angular/forms';
import { parsePrice, priceText, priceValidator } from './price';

describe('parsePrice', () => {
  it.each([
    ['45', 45],
    ['45,5', 45.5],
    ['45.50', 45.5],
    [' 12,30 ', 12.3],
    ['0,01', 0.01],
    ['9999999999,99', 9999999999.99],
  ])('reads %s as %s', (text, price) => {
    expect(parsePrice(text)).toBe(price);
  });

  it.each(['', 'abc', '45,555', '1.234,50', '-5', '45,', '12345678901'])(
    'does not read "%s"',
    (text) => {
      expect(parsePrice(text)).toBeNull();
    },
  );
});

describe('priceText', () => {
  it('writes the price with a decimal comma for the form', () => {
    expect(priceText(45)).toBe('45,00');
    expect(priceText(45.5)).toBe('45,50');
  });
});

describe('priceValidator', () => {
  function errorsOf(value: string): object | null {
    return priceValidator(new FormControl(value));
  }

  it('accepts a positive price with up to two decimals', () => {
    expect(errorsOf('45,50')).toBeNull();
  });

  it('leaves an empty price to the required rule', () => {
    expect(errorsOf('  ')).toBeNull();
  });

  it('asks for numbers when the price cannot be read', () => {
    expect(errorsOf('cuarenta')).toEqual({ priceFormat: true });
  });

  it.each(['0', '0,00'])('rejects a price of %s', (value) => {
    expect(errorsOf(value)).toEqual({ pricePositive: true });
  });
});
