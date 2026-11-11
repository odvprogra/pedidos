import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartSummary } from './cart-summary';

describe('CartSummary', () => {
  let fixture: ComponentFixture<CartSummary>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(CartSummary);
    fixture.componentRef.setInput('units', 3);
    fixture.componentRef.setInput('subtotal', 100.5);
    await fixture.whenStable();
  });

  function link(): HTMLAnchorElement {
    return fixture.nativeElement.querySelector('a');
  }

  function textOf(selector: string): string {
    return (link().querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  it('takes the customer to the cart', () => {
    expect(link().getAttribute('href')).toBe('/carrito');
  });

  it('shows the units and the estimated subtotal', () => {
    expect(textOf('[data-units]')).toBe('3');
    expect(textOf('[data-subtotal]')).toBe('Bs 100,50');
  });

  it('tells screen readers what the numbers mean', () => {
    expect(textOf('.sr-only')).toBe('Ver carrito: 3 productos, total Bs 100,50');
    expect(link().querySelector('[data-units]')?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(link().querySelector('[data-subtotal]')?.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
