import { ValidatorFn } from '@angular/forms';

const PRICE_PATTERN = /^\d{1,10}([.,]\d{1,2})?$/;

export function parsePrice(text: string): number | null {
  const trimmed = text.trim();
  return PRICE_PATTERN.test(trimmed) ? Number(trimmed.replace(',', '.')) : null;
}

export function priceText(price: number): string {
  return price.toFixed(2).replace('.', ',');
}

export const priceValidator: ValidatorFn = (control) => {
  const text = String(control.value ?? '');
  if (text.trim() === '') {
    return null;
  }
  const price = parsePrice(text);
  if (price === null) {
    return { priceFormat: true };
  }
  return price > 0 ? null : { pricePositive: true };
};
